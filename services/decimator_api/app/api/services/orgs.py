#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import List, Optional

from fastapi import HTTPException
from motor.core import AgnosticDatabase, AgnosticCollection
from starlette.status import HTTP_409_CONFLICT, HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND, HTTP_403_FORBIDDEN

from app.api.models.folder_group import FolderGroup, FolderGroupInfo
from app.api.models.org import OrgInfo, OrgDB, Org
from app.api.models.types import OID
from app.api.models.user import UserInfo
from app.api.services.base import BaseManager


class OrgManager(BaseManager):
    entity_name: str = 'Org'
    collection_name: str = 'orgs'

    info_model = OrgInfo
    db_info_model = OrgDB

    fg_collection: AgnosticCollection

    def __init__(self, *, config: dict, db: AgnosticDatabase, who: Optional[UserInfo] = None):
        super().__init__(config=config, db=db, who=who)
        self.fg_collection = db.client[self.config['MONGO_DB']]['folder_groups']

    async def create_new(self, new_data: Org) -> OrgInfo:
        if not await self.is_entity_available(fields_filter={'name': new_data.name}):
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail=f'Название {new_data.name} уже занято')
        if not await self.is_entity_available(fields_filter={'code': new_data.code}):
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail=f'Код {new_data.name} уже используется')

        new_db_org = await self.collection.insert_one(OrgDB(**new_data.mongo(), canWrite=[self.who.id]).mongo())
        if not new_db_org:
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail='Не удалось создать организацию')
        return OrgInfo(**await self.get_data_by_id(new_db_org.inserted_id))

    async def get_orgs(self) -> List[OrgInfo]:
        if self.who.isSuper:
            access_filter = {}
        else:
            access_filter = {'isActive': True, '$or': [{'canRead': self.who.id}, {'canWrite': self.who.id}]}
        db_orgs = self.collection.find(access_filter)
        return [OrgInfo(**db_org) async for db_org in db_orgs]

    async def set_inactive(self, *, org_id: OID) -> OID:
        db_org = await self.get_active_data_by_id(org_id)
        if not db_org:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail='Организация не существует')
        updated = await self.collection.update_one({'_id': org_id}, {'$set': {'isActive': False}})
        if updated.modified_count == 0:
            HTTPException(status_code=HTTP_400_BAD_REQUEST, detail='Не удалось удалить организацию')
        return org_id

    async def set_active(self, *, org_id: OID) -> OID:
        db_org = await self.get_data_by_id(org_id)
        if not db_org:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail='Организация не существует')
        updated = await self.collection.update_one({'_id': org_id}, {'$set': {'isActive': True}})
        if updated.modified_count == 0:
            HTTPException(status_code=HTTP_400_BAD_REQUEST, detail='Не удалось удалить организацию')
        return org_id

    async def update(self, *, _id: OID, new_data: Org) -> OID:
        db_org = await self.get_data_by_id(_id)
        if not db_org:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail='Организация не существует')
        updated = await self.collection.update_one({'_id': _id}, {'$set': new_data.mongo()})
        if updated.modified_count == 0:
            HTTPException(status_code=HTTP_400_BAD_REQUEST, detail='Не удалось удалить организацию')
        return _id

    async def create_folder_group(self, *, fg: FolderGroup, org_id: OID) -> FolderGroupInfo:
        await self.ensure_existance(_ids=[org_id])
        copy = await self.fg_collection.find_one({'orgId': org_id, 'name': fg.name})
        if copy:
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail='Такая группа папок уже существует')
        result = await self.fg_collection.insert_one(fg.mongo())
        return FolderGroupInfo(**fg.dict(), _id=result.inserted_id)

    async def get_folder_groups(self, *, org_id: OID) -> List[FolderGroupInfo]:
        org_info: OrgInfo = OrgInfo(**await self.get_data_by_id(_id=org_id))
        if self.who.isSuper or self.who.id in org_info.canRead or self.who.id in org_info.canWrite:
            db_fgs = self.fg_collection.find({'orgId': org_id})
            return [FolderGroupInfo(**fg) async for fg in db_fgs]
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав')

    async def remove_users(self, *, user_ids: List[OID], org_id: OID) -> OID:
        org_info: OrgInfo = OrgInfo(**await self.get_data_by_id(_id=org_id))
        for user_id in user_ids:
            if user_id in org_info.canRead:
                org_info.canRead.remove(user_id)
            if user_id in org_info.canWrite:
                org_info.canWrite.remove(user_id)
        updated_organization = await self.collection.update_one({'_id': org_id}, {'$set': {**org_info.mongo()}})
        if updated_organization.modified_count == 0:
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST,
                                detail='Не удалось удалить пользователя из организации')
        return org_id

    async def add_users(self, *, user_ids: List[OID], org_id: OID, is_writer: bool) -> OID:
        org_info: OrgInfo = OrgInfo(**await self.get_data_by_id(_id=org_id))
        for user_id in user_ids:
            if user_id in org_info.canRead and not is_writer:
                continue
            elif user_id in org_info.canRead and is_writer:
                org_info.canRead.remove(user_id)
                org_info.canWrite.append(user_id)
            elif user_id in org_info.canWrite and not is_writer:
                org_info.canWrite.remove(user_id)
                org_info.canRead.append(user_id)
            elif user_id in org_info.canWrite and is_writer:
                continue
            elif is_writer:
                org_info.canWrite.append(user_id)
            else:
                org_info.canRead.append(user_id)
        updated_organization = await self.collection.update_one({'_id': org_id}, {'$set': {**org_info.mongo()}})
        if updated_organization.modified_count == 0:
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST,
                                detail='Не удалось добавить пользователя в организацию')
        return org_id
