#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import Optional, List

from motor.core import AgnosticDatabase, AgnosticCollection
from motor.motor_asyncio import AsyncIOMotorClient

from app.api.models.dbmodel import DBModel
from app.api.models.types import OID
from app.api.models.user import UserInfo


class BaseManager:
    entity_name: str
    config: dict
    db: AgnosticDatabase
    db_client: AsyncIOMotorClient
    collection_name: str
    collection: AgnosticCollection
    who: Optional[UserInfo]

    info_model: DBModel
    db_info_model: DBModel

    def __init__(self, *, config: dict, db: AgnosticDatabase, who: Optional[UserInfo] = None):
        self.config = config
        self.db = db
        self.who = who
        self.db_client = db.client
        self.collection = db.client[self.config['MONGO_DB']][self.collection_name]

    async def create_new(self, new_data: DBModel) -> DBModel:
        raise NotImplemented

    async def get_data_by_id(self, _id: OID) -> dict:
        return await self.collection.find_one({'_id': _id})

    async def get_active_data_by_id(self, _id: OID) -> dict:
        return await self.collection.find_one({'_id': _id, 'isActive': True})

    async def is_entity_available(self, *, fields_filter: dict) -> bool:
        return False if await self.collection.find_one({**fields_filter, 'isActive': True}) else True

    async def ensure_existance(self, *, _ids: List[OID]) -> bool:
        result = True
        for _id in _ids:
            data = await self.get_data_by_id(_id)
            if not data:
                result = False
                break
        return result
