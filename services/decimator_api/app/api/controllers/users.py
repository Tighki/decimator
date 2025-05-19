#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import List, Dict, Any

from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi_jwt_auth import AuthJWT
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.status import HTTP_201_CREATED, HTTP_200_OK, HTTP_401_UNAUTHORIZED

from app.api.db.mongodb import get_database
from app.api.models.user import UserCreate, UserInfo, UserLogin, UserPassword
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


@router.get(
    '/{user_id}',
    tags=['Users'],
    response_model=UserInfo,
    status_code=HTTP_200_OK
)
async def get_user(
    user_id: str, 
    request: Request, 
    auth: AuthJWT = Depends(), 
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth.jwt_required()
    um = UserManager(config=request.app.config, db=db)
    current_user = await get_current_user(request, auth, db)
    
    # Проверка, что текущий пользователь супер или запрашивает информацию о себе
    if not current_user.isSuper and str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра информации о пользователе")
        
    return await um.get_user_by_id(user_id=user_id)


@router.put(
    '/{user_id}/password',
    tags=['Users'],
    response_model=UserInfo,
    status_code=HTTP_200_OK
)
async def update_password(
    user_id: str, 
    new_password: UserPassword,
    request: Request, 
    auth: AuthJWT = Depends(), 
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth.jwt_required()
    um = UserManager(config=request.app.config, db=db)
    current_user = await get_current_user(request, auth, db)
    
    return await um.update_user_password(user_id=user_id, new_password=new_password, current_user=current_user)


@router.put(
    '/{user_id}/login/{new_login}',
    tags=['Users'],
    response_model=UserInfo,
    status_code=HTTP_200_OK
)
async def update_login(
    user_id: str, 
    new_login: str,
    request: Request, 
    auth: AuthJWT = Depends(), 
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth.jwt_required()
    um = UserManager(config=request.app.config, db=db)
    current_user = await get_current_user(request, auth, db)
    
    return await um.update_user_login(user_id=user_id, new_login=new_login, current_user=current_user)


@router.delete(
    '/{user_id}',
    tags=['Users'],
    status_code=HTTP_200_OK
)
async def delete_user(
    user_id: str, 
    request: Request, 
    auth: AuthJWT = Depends(), 
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth.jwt_required()
    um = UserManager(config=request.app.config, db=db)
    current_user = await get_current_user(request, auth, db)
    
    return await um.delete_user(user_id=user_id, current_user=current_user)


@router.post(
    '/{user_id}/restore',
    tags=['Users'],
    response_model=UserInfo,
    status_code=HTTP_200_OK
)
async def restore_user(
    user_id: str, 
    request: Request, 
    auth: AuthJWT = Depends(), 
    db: AsyncIOMotorClient = Depends(get_database)
):
    auth.jwt_required()
    um = UserManager(config=request.app.config, db=db)
    current_user = await get_current_user(request, auth, db)
    
    return await um.restore_user(user_id=user_id, current_user=current_user)
