#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import Optional, List, Dict
import time
import asyncio
from datetime import datetime, timedelta

from fastapi import HTTPException
from motor.core import AgnosticDatabase, AgnosticCollection
from pymongo.results import InsertOneResult
from starlette.status import HTTP_409_CONFLICT, HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND, HTTP_403_FORBIDDEN

from app.api.models.document import DocumentInfo, DocumentDB, Document, DocumentWithAuthor, DocumentUpdate
from app.api.models.folder import Folder, FolderInfo
from app.api.models.folder_group import FolderGroupInfo
from app.api.models.org import OrgInfo
from app.api.models.types import OID
from app.api.models.user import UserInfo, UserUpdate
from app.api.services.base import BaseManager
from app.api.services.users import UserManager

# Глобальный кэш для документов и проектов
# Структура: {'folder_id': {'documents': [...], 'timestamp': time.time(), 'projects': [...]}}
DOCUMENTS_CACHE: Dict[str, Dict] = {}
# Время жизни кэша в секундах
CACHE_TTL = 60  # 1 минута


class DocumentManager(BaseManager):
    entity_name: str = 'Document'
    collection_name: str = 'docs'

    info_model = DocumentInfo
    db_info_model = DocumentDB

    folder_collection: AgnosticCollection
    fg_collection: AgnosticCollection
    org_collection: AgnosticCollection
    user_collection: AgnosticCollection

    def __init__(self, *, config: dict, db: AgnosticDatabase, who: Optional[UserInfo] = None):
        super().__init__(config=config, db=db, who=who)
        self.folder_collection = db.client[self.config['MONGO_DB']]['folders']
        self.org_collection = db.client[self.config['MONGO_DB']]['orgs']
        self.fg_collection = db.client[self.config['MONGO_DB']]['folder_groups']
        self.user_collection = db.client[self.config['MONGO_DB']]['users']

    async def get_org(self, *, folder_id: OID) -> OrgInfo:
        db_folder = await self.folder_collection.find_one({'_id': folder_id})
        folder = FolderInfo(**db_folder)
        db_fg = await self.fg_collection.find_one({'_id': folder.folderGroupId})
        fg = FolderGroupInfo(**db_fg)
        db_org = await self.org_collection.find_one({'_id': fg.orgId})
        return OrgInfo(**db_org)

    async def create_new(self, *, new_data: Document) -> DocumentWithAuthor:
        if not await self.is_entity_available(fields_filter={'folderId': new_data.folderId, 
                                                             'version': new_data.version, 
                                                             'number': new_data.number}):
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail='Схожий документ уже существует')
        db_folder = await self.folder_collection.find_one({'_id': new_data.folderId})
        if not db_folder:
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail='Такой папки не существует...')
        folder = Folder(**db_folder)
        org = await self.get_org(folder_id=new_data.folderId)
        if not self.who.isSuper and self.who.id not in org.canWrite:
            raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав создавать документы')
        for reserve in folder.reserves:
            if reserve.from_ <= new_data.number <= reserve.to_:
                raise HTTPException(status_code=HTTP_409_CONFLICT, detail='Указанный номер зарезервирован...')
        new_db_document: InsertOneResult = await self.collection.insert_one(DocumentDB(**new_data.mongo()).mongo())
        if not new_db_document:
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail='Не удалось создать документ =(')
            
        # Инвалидируем кэш для папки
        self.invalidate_cache_for_folder(new_data.folderId)
        
        return DocumentWithAuthor(**new_data.dict(),
                                  id=new_db_document.inserted_id,
                                  authorFullName=UserUpdate(**self.who.dict()))

    async def update(self, *, doc_id: OID, new_data: DocumentUpdate) -> DocumentWithAuthor:
        db_doc = await self.get_data_by_id(doc_id)
        doc = DocumentInfo(**db_doc)
        if not await self.is_entity_available(fields_filter={'_id': {'$ne': doc_id},
                                                             'folderId': doc.folderId,
                                                             'version': new_data.version,
                                                             'number': new_data.number}):
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail='Схожий документ уже существует')
        db_folder = await self.folder_collection.find_one({'_id': doc.folderId})
        if not db_folder:
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail='Такой папки не существует...')
        folder = Folder(**db_folder)
        org = await self.get_org(folder_id=doc.folderId)
        if not self.who.isSuper and self.who.id not in org.canWrite:
            raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав обновлять документы')
        if not self.who.isSuper and self.who.id != doc.authorId:
            raise HTTPException(status_code=HTTP_403_FORBIDDEN,
                                detail='Только администраторы и авторы могут обновлять документы')
        for reserve in folder.reserves:
            if reserve.from_ <= new_data.number <= reserve.to_:
                raise HTTPException(status_code=HTTP_409_CONFLICT, detail='Указанный номер зарезервирован...')
        await self.collection.update_one({'_id': doc_id}, {'$set': new_data.mongo()})
        
        # Инвалидируем кэш для папки
        self.invalidate_cache_for_folder(doc.folderId)
        
        db_author = await self.user_collection.find_one({'_id': doc.authorId})
        author = UserUpdate(**db_author)
        return DocumentWithAuthor(**{**doc.mongo(), **new_data.mongo(), 'authorFullName': author})

    async def is_entity_available(self, *, fields_filter: dict) -> bool:
        copy = await self.collection.find_one(fields_filter)
        return False if copy else True

    async def get_documents(self, *, folder_id: OID, um: UserManager, limit: int = 100, skip: int = 0) -> List[DocumentWithAuthor]:
        """Оптимизированный метод получения документов с пагинацией и предзагруженными данными пользователей"""
        folder_id_str = str(folder_id)
        
        # Проверяем наличие данных в кэше
        if folder_id_str in DOCUMENTS_CACHE and 'documents' in DOCUMENTS_CACHE[folder_id_str]:
            cache_entry = DOCUMENTS_CACHE[folder_id_str]
            cache_time = cache_entry.get('timestamp', 0)
            
            # Проверяем, не устарел ли кэш
            if time.time() - cache_time < CACHE_TTL:
                print(f"Используем кэшированные документы для папки {folder_id_str}")
                # Применяем пагинацию к кэшированным данным
                cached_docs = cache_entry['documents']
                return cached_docs[skip:skip+limit]
        
        # Если кэша нет или он устарел, выполняем запрос к базе данных
        # Используем агрегацию для объединения документов и пользователей
        pipeline = [
            # Этап 1: Фильтрация по folderId
            {"$match": {"folderId": folder_id}},
            
            # Этап 2: Сортировка по number для оптимизации производительности
            {"$sort": {"number": 1}},
            
            # Этап 3: Опционально применяем пагинацию для оптимизации
            # Если limit большой, загружаем все для кэширования
            {"$skip": 0 if limit > 100 else skip},
            {"$limit": 1000 if limit > 100 else limit},  # Ограничиваем макс. 1000 документов для кэша
            
            # Этап 4: Объединяем с коллекцией пользователей для получения данных автора
            {"$lookup": {
                "from": "users",
                "localField": "authorId",
                "foreignField": "_id",
                "as": "author"
            }},
            
            # Этап 5: Разворачиваем массив author
            {"$unwind": "$author"},
            
            # Этап 6: Проекция полей для оптимизации данных
            {"$project": {
                "_id": 1,
                "authorId": 1,
                "folderId": 1,
                "project": 1,
                "comment": 1,
                "number": 1,
                "version": 1,
                "created": 1,
                "authorFullName": {
                    "firstName": "$author.firstName",
                    "secondName": "$author.secondName",
                    "lastName": "$author.lastName"
                }
            }}
        ]
        
        # Выполняем агрегацию
        result = []
        async for doc in self.collection.aggregate(pipeline):
            # Конвертируем результат в модель DocumentWithAuthor
            result.append(DocumentWithAuthor(**doc))
        
        # Сохраняем результат в кэш
        if limit > 100:  # Кэшируем только при запросе большого количества документов
            DOCUMENTS_CACHE[folder_id_str] = {
                'documents': result,
                'timestamp': time.time()
            }
            
            # Если нужно пагинировать кэшированные данные
            return result[skip:skip+limit]
        
        return result
        
    # Метод для очистки кэша документов при изменениях
    def invalidate_cache_for_folder(self, folder_id: OID):
        """Инвалидирует кэш документов для указанной папки"""
        folder_id_str = str(folder_id)
        if folder_id_str in DOCUMENTS_CACHE:
            # Если нужно сохранить часть кэша, можно удалить только ключи документов или проектов
            # Здесь мы полностью удаляем все данные из кэша для папки
            del DOCUMENTS_CACHE[folder_id_str]
            print(f"Кэш для папки {folder_id_str} очищен")
            
    # Периодическая очистка устаревшего кэша (вызывается при запуске сервера)
    @staticmethod
    async def start_cache_cleanup_task():
        """Запускает задачу для периодической очистки устаревшего кэша"""
        async def cleanup_cache():
            while True:
                # Ждем некоторое время перед очисткой
                await asyncio.sleep(CACHE_TTL * 2)
                
                # Текущее время
                current_time = time.time()
                
                # Проверяем все записи в кэше
                folders_to_remove = []
                for folder_id, cache_data in DOCUMENTS_CACHE.items():
                    cache_time = cache_data.get('timestamp', 0)
                    
                    # Если кэш устарел, добавляем его в список на удаление
                    if current_time - cache_time > CACHE_TTL:
                        folders_to_remove.append(folder_id)
                
                # Удаляем устаревшие записи
                for folder_id in folders_to_remove:
                    del DOCUMENTS_CACHE[folder_id]
                    
                print(f"Очистка кэша: удалено {len(folders_to_remove)} устаревших записей")
        
        # Запускаем задачу очистки в фоновом режиме
        asyncio.create_task(cleanup_cache())

    async def remove_document(self, *, doc_id: OID) -> bool:
        db_doc = await self.get_data_by_id(doc_id)
        if not db_doc:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail='Документ не существует')
        doc = DocumentInfo(**db_doc)
        org = await self.get_org(folder_id=doc.folderId)
        if not self.who.isSuper and self.who.id not in org.canWrite:
            raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав удалять документы')
        await self.collection.delete_one({'_id': doc_id})
        
        # Инвалидируем кэш для папки
        self.invalidate_cache_for_folder(doc.folderId)
        
        return True

    async def get_projects_for_folders(self, *, folder_ids: List[OID]) -> dict:
        """
        Получение списка уникальных проектов для нескольких папок за один запрос
        
        Args:
            folder_ids: Список идентификаторов папок
            
        Returns:
            Словарь, где ключи - это строковые идентификаторы папок, а значения - списки проектов
        """
        result = {}
        uncached_folder_ids = []
        
        # Проверяем кэш для каждой папки
        for folder_id in folder_ids:
            folder_id_str = str(folder_id)
            if folder_id_str in DOCUMENTS_CACHE and 'projects' in DOCUMENTS_CACHE[folder_id_str]:
                cache_entry = DOCUMENTS_CACHE[folder_id_str]
                cache_time = cache_entry.get('timestamp', 0)
                
                # Проверяем, не устарел ли кэш
                if time.time() - cache_time < CACHE_TTL:
                    print(f"Используем кэшированные проекты для папки {folder_id_str}")
                    result[folder_id_str] = cache_entry['projects']
                else:
                    uncached_folder_ids.append(folder_id)
            else:
                uncached_folder_ids.append(folder_id)
        
        # Если есть папки без кэша, запрашиваем их из базы данных
        if uncached_folder_ids:
            # Используем агрегацию MongoDB для эффективного получения уникальных проектов
            pipeline = [
                # Фильтрация по списку папок
                {"$match": {"folderId": {"$in": uncached_folder_ids}}},
                
                # Группировка по папке и проекту для получения уникальных значений
                {"$group": {
                    "_id": {
                        "folderId": "$folderId", 
                        "project": "$project"
                    }
                }},
                
                # Фильтрация пустых проектов
                {"$match": {"_id.project": {"$ne": "", "$exists": True}}},
                
                # Группировка результатов по папке
                {"$group": {
                    "_id": "$_id.folderId",
                    "projects": {"$push": "$_id.project"}
                }},
                
                # Форматирование результата
                {"$project": {
                    "_id": 0,
                    "folderId": {"$toString": "$_id"},
                    "projects": 1
                }}
            ]
            
            # Выполняем агрегацию и собираем результаты
            async for doc in self.collection.aggregate(pipeline):
                folder_id_str = doc["folderId"]
                projects = doc["projects"]
                result[folder_id_str] = projects
                
                # Сохраняем в кэш
                if folder_id_str not in DOCUMENTS_CACHE:
                    DOCUMENTS_CACHE[folder_id_str] = {}
                
                DOCUMENTS_CACHE[folder_id_str]['projects'] = projects
                DOCUMENTS_CACHE[folder_id_str]['timestamp'] = time.time()
        
        # Добавляем пустые списки для папок, у которых нет проектов
        for folder_id in folder_ids:
            folder_id_str = str(folder_id)
            if folder_id_str not in result:
                result[folder_id_str] = []
                
        return result
