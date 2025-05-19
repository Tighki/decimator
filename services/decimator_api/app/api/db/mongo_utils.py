#!/usr/bin/env python
# -*- coding: utf-8 -*-
from motor.motor_asyncio import AsyncIOMotorClient

from .mongodb import db


async def connect_to_mongo(config: dict):
    db.client = AsyncIOMotorClient(config['MONGO_URI'],
                                   maxPoolSize=config['MAX_CONNECTIONS_COUNT'],
                                   minPoolSize=config['MIN_CONNECTIONS_COUNT'])


async def close_mongo_connection():
    db.client.close()


async def drop_database(database_name: str):
    db.client.drop_database(database_name)
