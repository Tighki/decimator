#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import List

from pydantic import BaseModel, StrictStr


class UserPermissions(BaseModel):
    CanRead: List[StrictStr] = []
    CanUpdate: List[StrictStr] = []


class RolePermission(BaseModel):
    create: bool = False
    read: bool = False
    read_all: bool = False
    update: bool = False
    delete: bool = False

    def __getitem__(self, item):
        return getattr(self, item)
