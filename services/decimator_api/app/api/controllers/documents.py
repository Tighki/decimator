#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import List

from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi_jwt_auth import AuthJWT
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.status import HTTP_201_CREATED, HTTP_200_OK, HTTP_403_FORBIDDEN

from app.api.db.mongodb import get_database
from app.api.models.document import DocumentWithAuthor, Document, DocumentUpdate
from app.api.models.types import OID
from app.api.services.documents import DocumentManager
from app.api.services.users import UserManager

router = APIRouter()


@router.get(
    '/',
    tags=['Documents'],
    response_model=List[DocumentWithAuthor],
    status_code=HTTP_200_OK
)
async def get_documents(folder_id: OID,
                        request: Request,
                        auth: AuthJWT = Depends(),
                        db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isActive:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Пользователь заблокирован')
    dm = DocumentManager(config=config, db=db, who=current_user)
    return await dm.get_documents(folder_id=folder_id, um=um)


@router.post(
    '/',
    tags=['Documents'],
    response_model=DocumentWithAuthor,
    status_code=HTTP_201_CREATED
)
async def create_document(doc: Document,
                          request: Request,
                          auth: AuthJWT = Depends(),
                          db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    dm = DocumentManager(config=config, db=db, who=current_user)
    return await dm.create_new(new_data=doc)


@router.patch(
    '/{doc_id}',
    tags=['Documents'],
    response_model=DocumentWithAuthor,
    status_code=HTTP_200_OK
)
async def update_document(doc_id: OID,
                          doc: DocumentUpdate,
                          request: Request,
                          auth: AuthJWT = Depends(),
                          db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    dm = DocumentManager(config=config, db=db, who=current_user)
    return await dm.update(doc_id=doc_id, new_data=doc)


@router.delete(
    '/{doc_id}',
    tags=['Documents'],
    status_code=HTTP_200_OK
)
async def remove_document(doc_id: OID,
                          request: Request,
                          auth: AuthJWT = Depends(),
                          db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    dm = DocumentManager(config=config, db=db, who=current_user)
    return await dm.remove_document(doc_id=doc_id)
