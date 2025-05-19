#!/usr/bin/env python
# -*- coding: utf-8 -*-
from motor.motor_asyncio import AsyncIOMotorClient


class DataBase:
    client: AsyncIOMotorClient = None


db = DataBase()


async def get_database():
    return db
