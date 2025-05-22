#!/usr/bin/env python
# -*- coding: utf-8 -*-
from motor.motor_asyncio import AsyncIOMotorClient

from .mongodb import db


async def connect_to_mongo(config: dict):
    db.client = AsyncIOMotorClient(config['MONGO_URI'],
                                   maxPoolSize=config['MAX_CONNECTIONS_COUNT'],
                                   minPoolSize=config['MIN_CONNECTIONS_COUNT'])
    
    # Создаем индексы для оптимизации запросов после подключения
    await create_indexes(config)


async def close_mongo_connection():
    db.client.close()


async def drop_database(database_name: str):
    db.client.drop_database(database_name)


async def create_indexes(config: dict):
    """Создает необходимые индексы в MongoDB для оптимизации запросов."""
    mongo_db = db.client[config['MONGO_DB']]
    
    # Индексы для коллекции папок для ускорения поиска и сортировки
    folders_collection = mongo_db['folders']
    await folders_collection.create_index([("folderGroupId", 1), ("name", 1)])
    await folders_collection.create_index("name")
    
    # Индексы для коллекции документов
    docs_collection = mongo_db['docs']
    await docs_collection.create_index("folderId")
    await docs_collection.create_index([("folderId", 1), ("project", 1)])
    
    # Индексы для коллекции групп папок
    folder_groups_collection = mongo_db['folder_groups']
    await folder_groups_collection.create_index("orgId")
    
    print("Индексы MongoDB успешно созданы для оптимизации запросов.")
