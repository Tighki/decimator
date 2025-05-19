#!/usr/bin/env python
# -*- coding: utf-8 -*-
import logging
import os
from logging.handlers import RotatingFileHandler
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.logger import logger
from fastapi.middleware.cors import CORSMiddleware
from fastapi_jwt_auth import AuthJWT
from fastapi_jwt_auth.exceptions import AuthJWTException
from requests import Request
from starlette.responses import JSONResponse

from .router import router
from pydantic import BaseModel


def create_app(config: Dict[str, Any]) -> FastAPI:
    """
    App factory

    - config: Is a dict with environment variables names as keys
    """
    app = FastAPI(
        title=config['API_NAME'],
        version=config['VERSION'],
        # openapi_url=f'{config["API_PREFIX"]}/{config["OPENAPI_URL"]}',
        openapi_url=None,
        # docs_url=f'{config["API_PREFIX"]}/{config["DOCS_URL"]}',
        docs_url=None,
        # redoc_url=f'{config["API_PREFIX"]}/{config["REDOC_URL"]}',
        redoc_url=None,
    )
    app.config = config  # There is no FastAPI.config field, so we just create it
    app.add_middleware(  # TODO: We should define more concrete CORS policies in the future for a security purposes
        CORSMiddleware,
        allow_origins=config['ALLOWED_HOSTS'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    class Settings(BaseModel):
        authjwt_secret_key: str = str(config['SECRET_KEY'])

    @AuthJWT.load_config
    def get_config():
        return Settings()

    @app.exception_handler(AuthJWTException)
    def authjwt_exception_handler(request: Request, exc: AuthJWTException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    if not app.debug:
        init_logger(config)
    app.include_router(router, prefix=app.config["API_PREFIX"])
    return app


def init_logger(config: dict):
    """Set up the logger"""
    if not os.path.exists(config['LOG_DIR']):
        os.mkdir(config['LOG_DIR'])
    file_handler = RotatingFileHandler(
        f'{config["LOG_DIR"]}/service.log', maxBytes=10485760, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(config['LOG_LEVEL'])
    logger.addHandler(file_handler)
    logger.info('************* SCOPE service startup ************* ')
