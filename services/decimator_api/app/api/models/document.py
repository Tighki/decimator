#!/usr/bin/env python
# -*- coding: utf-8 -*-
from datetime import datetime, timezone
from typing import Optional

from pydantic import Field

from app.api.models.dbmodel import DBModel
from app.api.models.types import OID
from app.api.models.user import UserUpdate


class Document(DBModel):
    authorId: OID
    folderId: OID
    project: str = Field('')
    comment: str
    number: int = Field(..., ge=0)
    version: str = Field('')


class DocumentUpdate(DBModel):
    project: Optional[str]
    comment: str
    number: int = Field(..., ge=0)
    version: Optional[str]


class DocumentDB(Document):
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DocumentInfo(DocumentDB):
    id: OID = Field(..., alias='_id')


class DocumentWithAuthor(DocumentInfo):
    authorFullName: UserUpdate
