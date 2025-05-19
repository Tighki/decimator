#!/usr/bin/env python
# -*- coding: utf-8 -*-
from functools import wraps
from typing import Any

from fastapi import HTTPException
from starlette.status import HTTP_403_FORBIDDEN

from app.api.models.auth import RolePermission

roles = {
    'super': RolePermission(create=False, read=True, read_all=True, update=True, delete=True),
    'admin': RolePermission(create=True, read=True, read_all=True, update=True, delete=True),
    'pro': RolePermission(create=True, read=True, read_all=False, update=True, delete=True),
    'lite': RolePermission(create=False, read=True, read_all=False, update=True, delete=False)
}


def permission_required(action_type):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            auth: Any = kwargs['auth']
            role: RolePermission = roles[auth.user_type]
            permission: bool = role[action_type]
            if not permission:
                raise HTTPException(status_code=HTTP_403_FORBIDDEN,
                                    detail=f'Тип аккаунта: {auth.user_type}. {"Нет прав"}')
            return await func(*args, **kwargs)
        return wrapper
    return decorator
