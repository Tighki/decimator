#!/usr/bin/env python
# -*- coding: utf-8 -*-
from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from pydantic import Field

from app.api.models.dbmodel import DBModel
from app.api.models.types import OID
from app.api.models.user import UserUpdate


class Reserve(DBModel):
    id: OID = Field(default_factory=lambda: OID(ObjectId()))
    from_: int = Field(..., ge=0, le=9999)
    to_: int = Field(..., ge=0, le=9999)
    authorId: Optional[OID]
    description: str
    authorFullName: Optional[UserUpdate]
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Folder(DBModel):
    name: str
    folderGroupId: OID
    reserves: List[Reserve] = []


class FolderDB(Folder):
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FolderInfo(FolderDB):
    id: OID = Field(..., alias='_id')
