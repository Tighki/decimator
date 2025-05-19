#!/usr/bin/env python
# -*- coding: utf-8 -*-
from datetime import datetime, timezone
from typing import Optional, List

from pydantic import Field

from app.api.models.dbmodel import DBModel
from app.api.models.types import OID


class Org(DBModel):
    name: str
    code: str = Field(..., max_length=4, min_length=4)
    address: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None


class OrgDB(Org):
    canRead: List[OID] = []
    canWrite: List[OID] = []
    isActive: bool = True
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrgInfo(OrgDB):
    id: OID = Field(..., alias='_id')
