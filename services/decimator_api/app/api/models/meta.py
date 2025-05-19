#!/usr/bin/env python
# -*- coding: utf-8 -*-

from typing import List, Union

from app.api.controllers.dependencies import Meta
from app.api.models.document import DocumentFullInfo
from app.api.models.organization import OrganizationInfo
from app.api.models.dbmodel import RWModel
from app.api.models.user import UserInfo


class DataWithMeta(RWModel):
    data: List[Union[UserInfo, OrganizationInfo, DocumentFullInfo]]
    meta: Meta
