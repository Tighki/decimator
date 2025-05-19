#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import List

from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi_jwt_auth import AuthJWT
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.status import HTTP_201_CREATED, HTTP_200_OK, HTTP_401_UNAUTHORIZED

from app.api.db.mongodb import get_database
from app.api.models.user import UserCreate, UserInfo, UserLogin
from app.api.services.users import UserManager

router = APIRouter()


@router.post(
    '/',
    tags=['Users'],
    response_model=UserInfo,
    status_code=HTTP_201_CREATED
)
async def create_user(user: UserCreate, request: Request, db: AsyncIOMotorClient = Depends(get_database)):
    um = UserManager(config=request.app.config, db=db)
    return await um.create_new(new_data=user)


@router.post(
    '/auth/login',
    tags=['Users'],
    status_code=HTTP_200_OK
)
async def login(user: UserLogin,
                request: Request,
                auth: AuthJWT = Depends(),
                db: AsyncIOMotorClient = Depends(get_database)):
    um = UserManager(config=request.app.config, db=db)
    is_correct_credentials = await um.check_credentials(cred=user)
    if is_correct_credentials:
        return {'access_token': auth.create_access_token(subject=user.login, expires_time=False),
                'refresh_token': auth.create_refresh_token(subject=user.login, expires_time=False),
                'login': user.login}
    else:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail='Неверный логин или пароль')


@router.get(
    '/me',
    tags=['Users'],
    response_model=UserInfo,
    status_code=HTTP_200_OK
)
async def get_current_user(request: Request, auth: AuthJWT = Depends(), db: AsyncIOMotorClient = Depends(get_database)):
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=request.app.config, db=db)
    return await um.get_user_by_login(login=user_login)


@router.get(
    '/',
    tags=['Users'],
    response_model=List[UserInfo],
    status_code=HTTP_200_OK
)
async def get_users(request: Request, auth: AuthJWT = Depends(), db: AsyncIOMotorClient = Depends(get_database)):
    auth.jwt_required()
    um = UserManager(config=request.app.config, db=db)
    return await um.get_users()
