#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import Optional, List

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
        db_author = await self.user_collection.find_one({'_id': doc.authorId})
        author = UserUpdate(**db_author)
        return DocumentWithAuthor(**{**doc.mongo(), **new_data.mongo(), 'authorFullName': author})

    async def is_entity_available(self, *, fields_filter: dict) -> bool:
        copy = await self.collection.find_one(fields_filter)
        return False if copy else True

    async def get_documents(self, *, folder_id: OID, um: UserManager) -> List[DocumentWithAuthor]:
        db_documents = self.collection.find({'folderId': folder_id}).sort('number')
        documents = [DocumentInfo(**db_doc) async for db_doc in db_documents]
        return [DocumentWithAuthor(**doc.dict(), authorFullName=UserUpdate(**await um.get_data_by_id(_id=doc.authorId)))
                for doc in documents]

    async def remove_document(self, *, doc_id: OID) -> bool:
        db_doc = await self.get_data_by_id(doc_id)
        if not db_doc:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail='Документ не существует')
        doc = DocumentInfo(**db_doc)
        org = await self.get_org(folder_id=doc.folderId)
        if not self.who.isSuper and self.who.id not in org.canWrite:
            raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав удалять документы')
        await self.collection.delete_one({'_id': doc_id})
        return True
