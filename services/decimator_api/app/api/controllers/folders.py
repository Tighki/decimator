#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import List

from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi_jwt_auth import AuthJWT
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.status import HTTP_201_CREATED, HTTP_200_OK, HTTP_403_FORBIDDEN, HTTP_422_UNPROCESSABLE_ENTITY

from app.api.db.mongodb import get_database
from app.api.models.folder import FolderInfo, Folder, Reserve
from app.api.models.types import OID
from app.api.services.folders import FolderManager
from app.api.services.users import UserManager

router = APIRouter()


@router.post(
    '/',
    tags=['Folders'],
    response_model=FolderInfo,
    status_code=HTTP_201_CREATED
)
async def create_folder(folder: Folder,
                        request: Request,
                        auth: AuthJWT = Depends(),
                        db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    fm = FolderManager(config=config, db=db, who=current_user)
    return await fm.create_new(new_data=folder)


@router.patch(
    '/{folder_id}',
    tags=['Folders'],
    response_model=FolderInfo,
    status_code=HTTP_200_OK
)
async def update_folder(folder_id: OID,
                        new_name: str,
                        request: Request,
                        auth: AuthJWT = Depends(),
                        db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isSuper:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав изменять папки')
    fm = FolderManager(config=config, db=db, who=current_user)
    return await fm.update(folder_id=folder_id, new_name=new_name)


@router.post(
    '/{folder_id}/reserves',
    tags=['Folders'],
    response_model=FolderInfo,
    status_code=HTTP_201_CREATED
)
async def create_reserve(reserve: Reserve,
                         folder_id: OID,
                         request: Request,
                         auth: AuthJWT = Depends(),
                         db: AsyncIOMotorClient = Depends(get_database)):
    if reserve.from_ > reserve.to_:
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail='Неверные границы резерва')
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    fm = FolderManager(config=config, db=db, who=current_user)
    return await fm.create_reserve(folder_id=folder_id, reserve=reserve)


@router.get(
    '/{fgs_id}',
    tags=['Folders'],
    response_model=List[FolderInfo],
    status_code=HTTP_200_OK
)
async def get_folders_by_fgs_id(fgs_id: OID,
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
    fm = FolderManager(config=config, db=db, who=current_user)
    return await fm.get_folders(fgs_id=fgs_id)


@router.delete(
    '/{folder_id}',
    tags=['Folders'],
    status_code=HTTP_200_OK
)
async def remove_folder(folder_id: OID,
                        request: Request,
                        auth: AuthJWT = Depends(),
                        db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isSuper:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав удалять папки')
    fm = FolderManager(config=config, db=db, who=current_user)
    return await fm.remove_folder(folder_id=folder_id)


@router.delete(
    '/{folder_id}/reserves/{reserve_id}',
    tags=['Folders'],
    response_model=FolderInfo,
    status_code=HTTP_200_OK
)
async def remove_reserve(folder_id: OID,
                         reserve_id: OID,
                         request: Request,
                         auth: AuthJWT = Depends(),
                         db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    fm = FolderManager(config=config, db=db, who=current_user)
    return await fm.remove_reserve(folder_id=folder_id, reserve_id=reserve_id)
