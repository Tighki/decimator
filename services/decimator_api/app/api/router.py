#!/usr/bin/env python
# -*- coding: utf-8 -*-
from fastapi import APIRouter

from .controllers.documents import router as doc_router
from .controllers.folders import router as folder_router
# from .controllers.folder_group import router as folder_group_router
from .controllers.users import router as user_router
from .controllers.orgs import router as org_router

router = APIRouter()
router.include_router(doc_router, prefix='/documents')
router.include_router(folder_router, prefix='/folders')
# router.include_router(folder_group_router, prefix='/folder_groups')
router.include_router(user_router, prefix='/users')
router.include_router(org_router, prefix='/orgs')
