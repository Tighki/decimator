#!/usr/bin/env python
# -*- coding: utf-8 -*-
from app.api.db.mongo_utils import connect_to_mongo, close_mongo_connection, drop_database
from app.api.factory import create_app
from app.config import from_envvar

config = from_envvar()
app = create_app(config)


@app.on_event('startup')
async def init_db_connection():
    # `app.config` field added in app factory, it's not native FastAPI field
    await connect_to_mongo(config)
    if config['TESTING']:
        # Clear test database on start testing
        await drop_database(config['MONGO_DB'])


@app.on_event('shutdown')
async def close_db_connection():
    if config['TESTING']:
        # Clear test database on testing finishing
        await drop_database(config['MONGO_DB'])
    await close_mongo_connection()
