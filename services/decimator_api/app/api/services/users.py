#!/usr/bin/env python
# -*- coding: utf-8 -*-
from typing import Optional, List

import bcrypt
from fastapi import HTTPException
from starlette.status import HTTP_409_CONFLICT, HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND, HTTP_403_FORBIDDEN

from app.api.models.user import UserInfo, UserDB, UserCreate, UserLogin, UserUpdate, UserPassword
from app.api.services.base import BaseManager


class UserManager(BaseManager):
    entity_name: str = 'User'
    collection_name: str = 'users'
    who: UserInfo
    info_model = UserInfo
    db_info_model = UserDB

    async def get_user_by_login(self, *, login: str) -> Optional[UserInfo]:
        db_user = await self.collection.find_one({'login': login})
        if db_user:
            return UserInfo(**db_user)
        return None
    
    async def get_user_by_id(self, *, user_id: str) -> Optional[UserInfo]:
        from bson import ObjectId
        db_user = await self.collection.find_one({'_id': ObjectId(user_id)})
        if db_user:
            return UserInfo(**db_user)
        return None

    async def get_users(self) -> List[UserInfo]:
        db_users = self.collection.find({})
        return [UserInfo(**db_user) async for db_user in db_users]

    async def create_new(self, *, new_data: UserCreate):
        user_with_same_login = await self.get_user_by_login(login=new_data.login)
        if user_with_same_login:
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail='Логин занят')
        pwd_salt = bcrypt.gensalt()
        pwd_hash = bcrypt.hashpw(new_data.password.encode(), pwd_salt)
        user_db = UserDB(**{**new_data.mongo(), 'pwdHash': pwd_hash, 'pwdSalt': pwd_salt})
        db_inserted_user = await self.collection.insert_one(user_db.mongo())
        if db_inserted_user:
            return self.info_model(id=db_inserted_user.inserted_id, **user_db.mongo())
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail='Не удалось создать нового пользователя')

    async def check_credentials(self, *, cred: UserLogin) -> bool:
        db_user = await self.collection.find_one({'login': cred.login, 'isActive': True})
        if not db_user:
            return False
        user_with_hash = UserDB(**db_user)
        return bcrypt.checkpw(cred.password.encode(), user_with_hash.pwdHash)
        
    async def update_user_password(self, *, user_id: str, new_password: UserPassword, current_user: UserInfo):
        from bson import ObjectId
        
        if not current_user.isSuper and str(current_user.id) != user_id:
            raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Недостаточно прав для изменения пароля')
            
        pwd_salt = bcrypt.gensalt()
        pwd_hash = bcrypt.hashpw(new_password.password.encode(), pwd_salt)
        
        result = await self.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'pwdHash': pwd_hash, 'pwdSalt': pwd_salt}}
        )
        
        if result.modified_count:
            return await self.get_user_by_id(user_id=user_id)
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail='Не удалось обновить пароль пользователя')
    
    async def update_user_login(self, *, user_id: str, new_login: str, current_user: UserInfo):
        from bson import ObjectId
        
        if not current_user.isSuper:
            raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Недостаточно прав для изменения логина')
            
        # Проверяем, не занят ли логин
        user_with_same_login = await self.get_user_by_login(login=new_login)
        if user_with_same_login:
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail='Логин занят')
            
        result = await self.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'login': new_login}}
        )
        
        if result.modified_count:
            return await self.get_user_by_id(user_id=user_id)
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail='Не удалось обновить логин пользователя')
    
    async def delete_user(self, *, user_id: str, current_user: UserInfo):
        from bson import ObjectId
        
        if not current_user.isSuper:
            raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Недостаточно прав для удаления пользователя')
            
        user = await self.get_user_by_id(user_id=user_id)
        if not user:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail='Пользователь не найден')
            
        # Используем soft delete, устанавливая isActive в False
        result = await self.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'isActive': False}}
        )
        
        if result.modified_count:
            return {'success': True, 'message': 'Пользователь деактивирован'}
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail='Не удалось деактивировать пользователя')
    
    async def restore_user(self, *, user_id: str, current_user: UserInfo):
        from bson import ObjectId
        
        if not current_user.isSuper:
            raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail='Недостаточно прав для восстановления пользователя')
            
        result = await self.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'isActive': True}}
        )
        
        if result.modified_count:
            return await self.get_user_by_id(user_id=user_id)
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail='Не удалось восстановить пользователя')
