#!/usr/bin/env python
# -*- coding: utf-8 -*-
import logging
import os

from dotenv import load_dotenv
from pydantic import BaseModel
from starlette.datastructures import Secret
from databases import DatabaseURL


if os.path.exists('.env.dev') and os.path.exists('.env.common'):
    load_dotenv('.env.common')
    load_dotenv('.env.dev')


class BaseConfig(BaseModel):
    """Base configuration"""

    # Common
    # Variables that used for determining environment
    DEBUG: bool = False
    TESTING: bool = False
    PRODUCTION: bool = False
    IS_DOCKER: bool = os.getenv('IS_DOCKER', False)

    # Api
    API_NAME: str = os.getenv('API_NAME', 'DecimatorWeb API')
    VERSION: str = os.getenv('API_VERSION', 'UNDEFINED')
    ROOT_PATH: str = os.getenv('ROOT_PATH', '')
    API_PREFIX_PATH: str = os.getenv('API_PREFIX_PATH', '/api')
    API_PREFIX_VERSION: str = os.getenv('API_PREFIX_VERSION', 'v0')
    API_PREFIX: str = f'{API_PREFIX_PATH}/{API_PREFIX_VERSION}'
    OPENAPI_URL: str = os.getenv('OPENAPI_URL', 'openapi.json')
    DOCS_URL: str = os.getenv('DOCS_URL', 'docs')
    REDOC_URL: str = os.getenv('REDOC_URL', 'redoc')
    CONVERSION_PATH: str = os.getenv('CONVERSION_PATH')

    # CORS
    ALLOWED_HOSTS: list = os.getenv('ALLOWED_HOSTS', [
        'http://decimator.filter-ktv-server.keenetic.pro', 
        'http://192.168.1.5:3000', 
        '192.168.1.5', 
        'localhost', 
        '127.0.0.1', 
        'http://localhost:3000',
    ])

    # Security
    SECRET_KEY: str = Secret(os.getenv('SECRET_KEY', 'Temporary key that should be replaced'))

    # Logging
    LOG_DIR: str = os.getenv('LOG_DIR', 'logs')
    LOG_LEVEL: int = os.getenv('LOG_LEVEL', logging.INFO)
    LOG_TO_STDOUT: bool = os.getenv('LOG_TO_STDOUT')

    # MongoDB
    MAX_CONNECTIONS_COUNT: int = os.getenv('MAX_CONNECTIONS_COUNT', 10)
    MIN_CONNECTIONS_COUNT: int = os.getenv('MIN_CONNECTIONS_COUNT', 10)
    MONGO_URI: str = os.getenv('MONGO_URI', '')
    MONGO_HOST: str = os.getenv('MONGO_HOST', 'localhost')
    MONGO_PORT: int = int(os.getenv('MONGO_PORT', 27017))
    MONGO_USER: str = os.getenv('MONGO_USER', 'admin')
    MONGO_PASS: str = os.getenv('MONGO_PASSWORD', 'root')
    MONGO_DB: str = os.getenv('MONGO_DB', 'dec')
    if not MONGO_URI:
        MONGO_URI = DatabaseURL(
            f"mongodb://{MONGO_USER}:{MONGO_PASS}@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}"
        )
    else:
        MONGO_URI = DatabaseURL(MONGO_URI)


class TestingConfig(BaseConfig):
    """Test configuration"""

    DEBUG: bool = True
    TESTING: bool = True
    PRODUCTION: bool = False


class DevelopmentConfig(BaseConfig):
    """Development configuration"""

    DEBUG: bool = True
    TESTING: bool = False
    PRODUCTION: bool = False


class ProductionConfig(BaseConfig):
    """Production configuration"""

    DEBUG: bool = False
    TESTING: bool = False
    PRODUCTION: bool = True


def from_envvar() -> dict:
    """Get configuration class from environment variable"""
    options = {
        'development': DevelopmentConfig,
        'test': TestingConfig,
        'production': ProductionConfig,
    }
    try:
        choice = os.environ['ENV']  # Analogue of switch/case construction. Choosing the correct configuration class.
    except KeyError:
        raise KeyError('"ENV" is not set')
    if choice not in options:
        msg = f'ENV={choice} is not valid, must be one of the {set(options)}'
        raise ValueError(msg)
    loaded_config = options[choice](**os.environ)
    return dict(loaded_config)
