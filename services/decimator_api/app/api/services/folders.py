#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import List, Optional

from fastapi import HTTPException
from motor.core import AgnosticDatabase, AgnosticCollection
from starlette.status import HTTP_409_CONFLICT, HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND, HTTP_403_FORBIDDEN

from app.api.models.folder import FolderInfo, FolderDB, Folder, Reserve
from app.api.models.folder_group import FolderGroupInfo
from app.api.models.org import OrgInfo
from app.api.models.types import OID
from app.api.models.user import UserInfo, UserUpdate
from app.api.services.base import BaseManager


class FolderManager(BaseManager):
    entity_name: str = 'Folder'
    collection_name: str = 'folders'

    info_model = FolderInfo
    db_info_model = FolderDB

    org_collection: AgnosticCollection
    fg_collection: AgnosticCollection
    doc_collection: AgnosticCollection

    def __init__(self, *, config: dict, db: AgnosticDatabase, who: Optional[UserInfo] = None):
        super().__init__(config=config, db=db, who=who)
        self.org_collection = db.client[self.config['MONGO_DB']]['orgs']
        self.fg_collection = db.client[self.config['MONGO_DB']]['folder_groups']
        self.doc_collection = db.client[self.config['MONGO_DB']]['docs']

    async def get_org(self, *, fgs_id: OID) -> OrgInfo:
        db_fg = await self.fg_collection.find_one({'_id': fgs_id})
        fg = FolderGroupInfo(**db_fg)
        db_org = await self.org_collection.find_one({'_id': fg.orgId})
        return OrgInfo(**db_org)

    async def create_new(self, *, new_data: Folder) -> FolderInfo:
        if not await self.is_entity_available(fields_filter={'name': new_data.name,
                                                             'folderGroupId': new_data.folderGroupId}):
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail=f'Название {new_data.name} уже занято')
        org = await self.get_org(fgs_id=new_data.folderGroupId)
        if not self.who.isSuper and self.who.id not in org.canWrite:
            raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав создавать папки')
        new_db_folder = await self.collection.insert_one(FolderDB(**new_data.mongo()).mongo())
        if not new_db_folder:
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail='Не удалось создать папку')
        return FolderInfo(**await self.get_data_by_id(new_db_folder.inserted_id))

    async def update(self, *, folder_id: OID, new_name: str) -> FolderInfo:
        db_folder = await self.collection.find_one({'_id': folder_id})
        if not db_folder:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail='Указанной папки не существует')
        folder = FolderInfo(**db_folder)
        folder.name = new_name
        if not await self.is_entity_available(fields_filter={'name': new_name,
                                                             'folderGroupId': folder.folderGroupId}):
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail=f'Название {new_name} уже занято')

        await self.collection.update_one({'_id': folder_id}, {'$set': folder.mongo()})
        return folder

    async def is_entity_available(self, *, fields_filter: dict) -> bool:
        return False if await self.collection.find_one(fields_filter) else True

    async def get_folders(self, *, fgs_id: OID) -> List[FolderInfo]:
        # Используем проекцию для получения только необходимых полей для ускорения запроса
        # Исключаем reserves, т.к. они не используются в основном интерфейсе
        projection = {
            "name": 1, 
            "_id": 1, 
            "folderGroupId": 1,
            "createdAt": 1
        }
        # Используем индексированную сортировку для ускорения запроса
        db_folders = self.collection.find(
            {'folderGroupId': fgs_id}, 
            projection=projection
        ).sort('name', 1)  # 1 означает по возрастанию
        
        return [FolderInfo(**db_folder) async for db_folder in db_folders]

    async def remove_folder(self, *, folder_id: OID) -> bool:
        db_folder = await self.get_data_by_id(folder_id)
        if not db_folder:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail='Папка не существует')
        folder = FolderInfo(**db_folder)
        await self.doc_collection.delete_many({'folderId': folder.id})
        await self.collection.delete_one({'_id': folder.id})
        return True

    async def create_reserve(self, *, folder_id: OID, reserve: Reserve) -> FolderInfo:
        db_folder = await self.get_data_by_id(folder_id)
        if not db_folder:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail='Папка не существует')
        folder_info = FolderInfo(**db_folder)
        org = await self.get_org(fgs_id=folder_info.folderGroupId)
        if not self.who.isSuper and self.who.id not in org.canWrite:
            raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав создавать резервы')
        for existed_reserve in folder_info.reserves:
            if (existed_reserve.from_ <= reserve.from_ <= existed_reserve.to_) or (
                    existed_reserve.from_ <= reserve.to_ <= existed_reserve.to_):
                raise HTTPException(status_code=HTTP_409_CONFLICT,
                                    detail=f'Папка уже содержит резервы в указанном диапазоне')
        docs_conflict = await self.doc_collection.find_one({'folderId': folder_id,
                                                            'number': {'$gt': reserve.from_, '$lt': reserve.to_}})
        if docs_conflict:
            raise HTTPException(status_code=HTTP_409_CONFLICT,
                                detail=f'Папка уже содержит документы в указанном диапазоне')
        reserve.authorFullName = UserUpdate(**self.who.mongo())
        folder_info.reserves.append(reserve)
        await self.collection.update_one({'_id': folder_id}, {'$set': folder_info.mongo()})
        return folder_info

    async def remove_reserve(self, *, folder_id: OID, reserve_id: OID) -> FolderInfo:
        db_folder = await self.get_data_by_id(folder_id)
        if not db_folder:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail='Папка не существует')
        folder_info = FolderInfo(**db_folder)
        org = await self.get_org(fgs_id=folder_info.folderGroupId)
        if not self.who.isSuper and self.who.id not in org.canWrite:
            raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав удалять резервы')
        for reserve in folder_info.reserves:
            if reserve.id != reserve_id:
                continue
            if reserve.authorId != self.who.id and not self.who.isSuper:
                raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав удалять резервы')
        folder_info.reserves = [reserve for reserve in folder_info.reserves if reserve.id != reserve_id]
        await self.collection.update_one({'_id': folder_id}, {'$set': folder_info.mongo()})
        return folder_info
