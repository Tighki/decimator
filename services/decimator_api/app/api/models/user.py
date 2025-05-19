#!/usr/bin/env python
# -*- coding: utf-8 -*-
from datetime import datetime, timezone
from typing import Optional

from pydantic import Field

from .dbmodel import DBModel
from .types import OID


class User(DBModel):
    firstName: str = Field(min_length=2, max_length=32)
    secondName: str = Field(min_length=2, max_length=32)
    lastName: str = Field(min_length=2, max_length=32)
    login: str = Field(min_length=4, max_length=32)


class UserInfo(User):
    id: OID = Field(..., alias='_id')
    isSuper: bool
    isActive: bool
    created: datetime


class UserLogin(DBModel):
    login: str
    password: str = Field(max_length=32)


class UserCreate(User):
    password: str = Field(max_length=32)


class UserPassword(DBModel):
    password: str = Field(max_length=32)


class UserUpdate(DBModel):
    firstName: Optional[str] = None
    secondName: Optional[str] = None
    lastName: Optional[str] = None


class UserDB(User):
    pwdHash: Optional[bytes]
    pwdSalt: Optional[bytes]
    isSuper: bool = False
    isActive: bool = True
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
