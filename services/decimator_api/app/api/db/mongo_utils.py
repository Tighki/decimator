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
    
    # Обертка для безопасного создания индексов 
    async def safe_create_index(collection, index_spec, **kwargs):
        try:
            await collection.create_index(index_spec, **kwargs)
            print(f"Индекс {index_spec} успешно создан")
        except Exception as e:
            print(f"Предупреждение при создании индекса {index_spec}: {e}")
    
    # Индексы для коллекции папок для ускорения поиска и сортировки
    folders_collection = mongo_db['folders']
    await safe_create_index(folders_collection, [("folderGroupId", 1), ("name", 1)])
    await safe_create_index(folders_collection, "name")
    
    # Индексы для коллекции документов
    docs_collection = mongo_db['docs']
    await safe_create_index(docs_collection, "folderId")
    await safe_create_index(docs_collection, [("folderId", 1), ("project", 1)])
    
    # Дополнительные индексы для улучшения производительности
    # Составной индекс для документов по папке и номеру для быстрой сортировки и поиска
    await safe_create_index(docs_collection, [("folderId", 1), ("number", 1)])
    
    # Индекс для быстрого поиска по проектам
    await safe_create_index(docs_collection, "project")
    
    # Индекс для быстрой фильтрации по автору и папке
    await safe_create_index(docs_collection, [("authorId", 1), ("folderId", 1)])
    
    # Индексы для коллекции групп папок
    folder_groups_collection = mongo_db['folder_groups']
    await safe_create_index(folder_groups_collection, "orgId")
    
    # Индексы для пользователей
    users_collection = mongo_db['users']
    await safe_create_index(users_collection, "login", unique=True)
    
    # Индексы для организаций
    orgs_collection = mongo_db['orgs']
    await safe_create_index(orgs_collection, "code", unique=True)
    await safe_create_index(orgs_collection, [("name", "text")])  # Текстовый индекс для поиска по названию
    
    print("Индексы MongoDB успешно проверены или созданы для оптимизации запросов.")
