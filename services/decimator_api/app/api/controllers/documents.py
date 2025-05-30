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
async def get_documents(
                        request: Request,
                        folder_id: OID,
                        skip: int = 0,
                        limit: int = 100,
                        auth: AuthJWT = Depends(),
                        db: AsyncIOMotorClient = Depends(get_database)):
    """
    Получение документов из папки с поддержкой пагинации.
    
    - **folder_id**: ID папки
    - **skip**: Количество документов, которые нужно пропустить (для пагинации)
    - **limit**: Максимальное количество документов для возврата
    """
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isActive:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Пользователь заблокирован')
    dm = DocumentManager(config=config, db=db, who=current_user)
    return await dm.get_documents(folder_id=folder_id, um=um, skip=skip, limit=limit)


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


@router.get(
    '/by_folders',
    tags=['Documents'],
    status_code=HTTP_200_OK
)
async def get_projects_by_folders(
                        request: Request,
                        folder_ids: str,
                        auth: AuthJWT = Depends(),
                        db: AsyncIOMotorClient = Depends(get_database)):
    """
    Получение проектов для нескольких папок одним запросом.
    
    - **folder_ids**: Список ID папок через запятую (например, "id1,id2,id3")
    
    Возвращает словарь, где ключи - это ID папок, а значения - списки проектов.
    """
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isActive:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Пользователь заблокирован')
    
    dm = DocumentManager(config=config, db=db, who=current_user)
    
    # Разбиваем строку с ID папок на список и преобразуем в OID
    folder_id_list = [OID(fid.strip()) for fid in folder_ids.split(',') if fid.strip()]
    
    # Используем новый оптимизированный метод для получения проектов
    return await dm.get_projects_for_folders(folder_ids=folder_id_list)


@router.get(
    '/by_folder_group/{fg_id}',
    tags=['Documents'],
    status_code=HTTP_200_OK
)
async def get_projects_by_folder_group(
                        fg_id: OID,
                        request: Request,
                        auth: AuthJWT = Depends(),
                        db: AsyncIOMotorClient = Depends(get_database)):
    """
    Получение проектов для всех папок группы одним запросом.
    
    - **fg_id**: ID группы папок
    
    Возвращает словарь, где ключи - это ID папок, а значения - списки проектов.
    """
    config = request.app.config
    auth.jwt_required()
    user_login = auth.get_jwt_subject()
    um = UserManager(config=config, db=db)
    current_user = await um.get_user_by_login(login=user_login)
    if not current_user.isActive:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Пользователь заблокирован')
    
    # Получаем все папки для указанной группы
    folder_collection = db.client[config['MONGO_DB']]['folders']
    folders = []
    async for folder in folder_collection.find({"folderGroupId": fg_id}):
        folders.append(folder["_id"])
    
    if not folders:
        return {}
    
    # Используем оптимизированный метод для получения проектов всех папок
    dm = DocumentManager(config=config, db=db, who=current_user)
    return await dm.get_projects_for_folders(folder_ids=folders)
