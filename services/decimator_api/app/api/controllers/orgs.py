#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import List

from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi_jwt_auth import AuthJWT
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.status import HTTP_201_CREATED, HTTP_403_FORBIDDEN, HTTP_200_OK

from app.api.db.mongodb import get_database
from app.api.models.folder_group import FolderGroup, FolderGroupInfo
from app.api.models.org import OrgInfo, Org
from app.api.models.types import OID
from app.api.services.orgs import OrgManager
from app.api.services.users import UserManager

router = APIRouter()


@router.get(
    '/',
    tags=['Orgs'],
    response_model=List[OrgInfo],
    status_code=HTTP_200_OK
)
async def get_orgs(request: Request, auth: AuthJWT = Depends(), db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isActive:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Пользователь заблокирован')
    om = OrgManager(config=config, db=db, who=current_user)
    return await om.get_orgs()


@router.post(
    '/',
    tags=['Orgs'],
    response_model=OrgInfo,
    status_code=HTTP_201_CREATED
)
async def create_org(org: Org,
                     request: Request,
                     auth: AuthJWT = Depends(),
                     db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isSuper:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав создавать организации')
    om = OrgManager(config=config, db=db, who=current_user)
    return await om.create_new(new_data=org)


@router.delete(
    '/{org_id}',
    tags=['Orgs'],
    response_model=List[OrgInfo],
    status_code=HTTP_200_OK
)
async def remove_org(org_id: OID,
                     request: Request,
                     auth: AuthJWT = Depends(),
                     db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isSuper:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав удалять организации')
    om = OrgManager(config=config, db=db, who=current_user)
    await om.set_inactive(org_id=org_id)
    return await om.get_orgs()


@router.patch(
    '/{org_id}',
    tags=['Orgs'],
    response_model=List[OrgInfo],
    status_code=HTTP_200_OK
)
async def update_org(org_id: OID,
                     new_org: Org,
                     request: Request,
                     auth: AuthJWT = Depends(),
                     db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isSuper:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав изменять организации')
    om = OrgManager(config=config, db=db, who=current_user)
    await om.update(_id=org_id, new_data=new_org)
    return await om.get_orgs()


@router.patch(
    '/{org_id}/restore',
    tags=['Orgs'],
    response_model=List[OrgInfo],
    status_code=HTTP_200_OK
)
async def restore_org(org_id: OID,
                      request: Request,
                      auth: AuthJWT = Depends(),
                      db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isSuper:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав восстанавливать организации')
    om = OrgManager(config=config, db=db, who=current_user)
    await om.set_active(org_id=org_id)
    return await om.get_orgs()


@router.post(
    '/{org_id}/folder_groups',
    tags=['Orgs'],
    response_model=FolderGroupInfo,
    status_code=HTTP_200_OK
)
async def add_folder_group_to_organization(fg: FolderGroup,
                                           org_id: OID,
                                           request: Request,
                                           auth: AuthJWT = Depends(),
                                           db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isSuper:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав создавать группы папок')
    om = OrgManager(config=config, db=db, who=current_user)
    return await om.create_folder_group(fg=fg, org_id=org_id)


@router.get(
    '/{org_id}/folder_groups',
    tags=['Orgs'],
    response_model=List[FolderGroupInfo],
    status_code=HTTP_200_OK
)
async def add_folder_group_to_organization(org_id: OID,
                                           request: Request,
                                           auth: AuthJWT = Depends(),
                                           db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    om = OrgManager(config=config, db=db, who=current_user)
    return await om.get_folder_groups(org_id=org_id)


@router.put(
    '/{org_id}/users',
    tags=['Orgs'],
    response_model=List[OrgInfo],
    status_code=HTTP_200_OK
)
async def add_users_to_organization(org_id: OID,
                                    user_ids: List[OID],
                                    is_writer: bool,
                                    request: Request,
                                    auth: AuthJWT = Depends(),
                                    db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isSuper:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав добавлять пользователей в организации')
    is_users_exists = await um.ensure_existance(_ids=user_ids)
    if not is_users_exists:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Не верные идентификаторы пользователей')
    om = OrgManager(config=config, db=db, who=current_user)
    await om.add_users(org_id=org_id, user_ids=user_ids, is_writer=is_writer)
    return await om.get_orgs()


@router.delete(
    '/{org_id}/users',
    tags=['Orgs'],
    response_model=List[OrgInfo],
    status_code=HTTP_200_OK
)
async def remove_users_from_organization(org_id: OID,
                                         user_ids: List[OID],
                                         request: Request,
                                         auth: AuthJWT = Depends(),
                                         db: AsyncIOMotorClient = Depends(get_database)):
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isSuper:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Нет прав удалить пользователей из организации')
    om = OrgManager(config=config, db=db, who=current_user)
    await om.remove_users(org_id=org_id, user_ids=user_ids)
    return await om.get_orgs()
