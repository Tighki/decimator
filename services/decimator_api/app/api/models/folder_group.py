#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import Optional

from pydantic import Field

from app.api.models.dbmodel import DBModel
from app.api.models.types import OID


class FolderGroup(DBModel):
    orgId: OID
    name: str
    description: Optional[str] = None


class FolderGroupInfo(FolderGroup):
    id: OID = Field(..., alias='_id')
