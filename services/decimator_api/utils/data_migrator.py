#!/usr/bin/env python
# -*- coding: utf-8 -*-
import json
import sqlite3
from datetime import datetime, timezone
from pprint import pprint
from typing import Dict, List

import requests
from bson import ObjectId
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from requests import Response

from typing import Dict, List
import sys
sys.path.append('f:\\decimatorweb\\services\\decimator_api')
print(sys.path)

from app.api.models.document import DocumentDB
from app.api.models.folder import Folder, FolderInfo
from app.api.models.folder_group import FolderGroup
from app.api.models.org import OrgDB
from app.api.models.user import UserCreate, UserInfo


def create_users(cur: sqlite3.Cursor, user_collection: Collection):
    user_collection.drop()
    cur.execute('SELECT * FROM users')
    users = cur.fetchall()
    for user in users:
        print(user)
        db_user = UserCreate(firstName="None",
                             secondName="None",
                             lastName=user[2],
                             login=user[1],
                             password=user[3],
                             )
        response: Response = requests.post('http://localhost:8042/api/v1/users/', json=db_user.dict())
        data = json.loads(response.content)
        pprint(data)


def get_combined_users(cur: sqlite3.Cursor, users_coll: Collection):
    """
    Для того, что бы соотнести старые айдишники с новыми пользователями
    :param cur:
    :param users_coll:
    :return: словарь, в котором ключ - старый id, а значение - объект нового пользователя
    """
    cur.execute('SELECT * FROM users')
    users = cur.fetchall()
    data = {}
    for user in users:
        db_user = users_coll.find_one({'lastName': user[2]})
        data[user[0]] = UserInfo(**db_user)
    return data


# noinspection SqlResolve
def get_old_docs(folder_name: str, table_name: str, cur: sqlite3.Cursor):
    query = f"SELECT * FROM {table_name} WHERE delflag = 0 AND decimal = '{folder_name}'"
    cur.execute(query)
    return cur.fetchall()


# noinspection SqlResolve
def get_old_decimals(cur: sqlite3.Cursor, table_name: str, isRkd: bool):
    type_filter = f"AND litera = '{'rkd' if isRkd else 'ekd'}'"
    cur.execute(f'SELECT DISTINCT decimal FROM {table_name} WHERE delflag = 0 {type_filter}')
    return cur.fetchall()


def create_organization(org: OrgDB, org_coll: Collection, users: Dict[int, UserInfo]) -> ObjectId:
    print(f'Creating new Org: {org.name}')
    for old_id, user in users.items():
        org.canWrite.append(user.id)
    return org_coll.insert_one(org.dict()).inserted_id


def create_new_org_documents(old_folders: List[str], dec_coll: Collection, fg_id: ObjectId):
    print('    Creating new decimals:')
    decimals = [Folder(name=folder_name, folderGroupId=fg_id).dict() for folder_name in old_folders]
    dec_coll.insert_many(decimals)


def get_new_org_documents(fgs_id: ObjectId, folders_coll: Collection) -> Dict[str, FolderInfo]:
    print('        Creating new documents...')
    db_folders = folders_coll.find({'folderGroupId': fgs_id})
    return {f'f{folder["name"]}': FolderInfo(**folder) for folder in db_folders}


def create_new_documents(docs: List[DocumentDB], doc_coll: Collection):
    docs_dicts = [doc.dict() for doc in docs]
    doc_coll.insert_many(docs_dicts)


def migrate_fltr(cur: sqlite3.Cursor,
                 user_coll: Collection,
                 folders_coll: Collection,
                 org_coll: Collection,
                 doc_coll: Collection,
                 fg_coll: Collection):
    users = get_combined_users(cur, user_coll)
    org = OrgDB(name='ООО "Фильтр КТВ"',
                code='ФЛТР',
                address='347923, Ростовская область, город Таганрог, Карантинная улица, 59',
                phone='8 (863) 438-34-05',
                description='Научные исследования и разработки в области естественных и технических наук')
    org_id: ObjectId = create_organization(org, org_coll, users)

    rkd_id = fg_coll.insert_one(FolderGroup(orgId=org_id,
                                            name='Рабочая конструкторская документация').mongo()).inserted_id
    ekd_id = fg_coll.insert_one(FolderGroup(orgId=org_id,
                                            name='Эскизная конструкторская документация').mongo()).inserted_id

    org_old_decimals_rkd: List[str] = [dec_tuple[0][1:] for dec_tuple in get_old_decimals(cur, 'FLTR', isRkd=True)]
    org_old_decimals_ekd: List[str] = [dec_tuple[0][1:] for dec_tuple in get_old_decimals(cur, 'FLTR', isRkd=False)]

    create_new_org_documents(org_old_decimals_rkd, folders_coll, rkd_id)
    create_new_org_documents(org_old_decimals_ekd, folders_coll, ekd_id)

    new_folders_rkd: Dict[str, FolderInfo] = get_new_org_documents(rkd_id, folders_coll)
    new_folders_ekd: Dict[str, FolderInfo] = get_new_org_documents(ekd_id, folders_coll)
    for new_rkd_folder_name, new_rkd_folder in new_folders_rkd.items():
        old_fltr_documents = get_old_docs(new_rkd_folder_name, 'FLTR', cur)
        new_docs = []
        for old_doc in old_fltr_documents:
            new_author_id = users[old_doc[2]].id
            number = int(old_doc[1]) if old_doc[1] else 0
            date = datetime.strptime(old_doc[3], '%d.%m.%y') if old_doc[3] != '00.00.00' else datetime.now(timezone.utc)
            new_doc = DocumentDB(authorId=new_author_id,
                                 created=date,
                                 folderId=new_rkd_folder.id,
                                 comment=old_doc[4],
                                 number=number)
            new_docs.append(new_doc)
        create_new_documents(new_docs, doc_coll)
    for new_ekd_folder_name, new_ekd_folder in new_folders_ekd.items():
        old_fltr_documents = get_old_docs(new_ekd_folder_name, 'FLTR', cur)
        new_docs = []
        for old_doc in old_fltr_documents:
            new_author_id = users[old_doc[2]].id
            number = int(old_doc[1]) if old_doc[1] else 0
            date = datetime.strptime(old_doc[3], '%d.%m.%y') if old_doc[3] != '00.00.00' else datetime.now(timezone.utc)
            new_doc = DocumentDB(authorId=new_author_id,
                                 created=date,
                                 folderId=new_ekd_folder.id,
                                 comment=old_doc[4],
                                 number=number)
            new_docs.append(new_doc)
        create_new_documents(new_docs, doc_coll)


def migrate_shpkd(cur: sqlite3.Cursor,
                 user_coll: Collection,
                 folders_coll: Collection,
                 org_coll: Collection,
                 doc_coll: Collection,
                 fg_coll: Collection):
    users = get_combined_users(cur, user_coll)
    org = OrgDB(name='ОАО "НПП КП "Квант"',
                code='ШПКД',
                address='ул. Мильчакова, 7, Ростов-на-Дону, Ростовская обл., 344000',
                phone='8 (863) 222-55-55',
                description='Входит в состав интегрированной структуры на базе ОАО '
                            '«Информационные спутниковые системы» имени академика М.Ф. Решетнева»')
    org_id: ObjectId = create_organization(org, org_coll, users)

    rkd_id = fg_coll.insert_one(FolderGroup(orgId=org_id,
                                            name='Рабочая конструкторская документация').mongo()).inserted_id
    ekd_id = fg_coll.insert_one(FolderGroup(orgId=org_id,
                                            name='Эскизная конструкторская документация').mongo()).inserted_id

    org_old_decimals_rkd: List[str] = [dec_tuple[0][1:] for dec_tuple in get_old_decimals(cur, 'SHPKD', isRkd=True)]
    org_old_decimals_ekd: List[str] = [dec_tuple[0][1:] for dec_tuple in get_old_decimals(cur, 'SHPKD', isRkd=False)]

    create_new_org_documents(org_old_decimals_rkd, folders_coll, rkd_id)
    create_new_org_documents(org_old_decimals_ekd, folders_coll, ekd_id)

    new_folders_rkd: Dict[str, FolderInfo] = get_new_org_documents(rkd_id, folders_coll)
    new_folders_ekd: Dict[str, FolderInfo] = get_new_org_documents(ekd_id, folders_coll)
    for new_rkd_folder_name, new_rkd_folder in new_folders_rkd.items():
        old_fltr_documents = get_old_docs(new_rkd_folder_name, 'SHPKD', cur)
        new_docs = []
        for old_doc in old_fltr_documents:
            new_author_id = users[old_doc[2]].id
            number = int(old_doc[1]) if old_doc[1] else 0
            if old_doc[3] == '00.00.00':
                date = datetime.now(timezone.utc)
            elif old_doc[3] == '02.08.\xa0':
                date = datetime.strptime('02.08.13', '%d.%m.%y')
            elif old_doc[3] == '30.16.15':
                date = datetime.strptime('30.10.15', '%d.%m.%y')
            else:
                date = datetime.strptime(old_doc[3], '%d.%m.%y')
            new_doc = DocumentDB(authorId=new_author_id,
                                 created=date,
                                 folderId=new_rkd_folder.id,
                                 comment=old_doc[4],
                                 number=number)
            new_docs.append(new_doc)
        create_new_documents(new_docs, doc_coll)
    for new_ekd_folder_name, new_ekd_folder in new_folders_ekd.items():
        old_fltr_documents = get_old_docs(new_ekd_folder_name, 'SHPKD', cur)
        new_docs = []
        for old_doc in old_fltr_documents:
            new_author_id = users[old_doc[2]].id
            number = int(old_doc[1]) if old_doc[1] else 0
            if old_doc[3] == '00.00.00':
                date = datetime.now(timezone.utc)
            elif old_doc[3] == '02.08.\xa0':
                date = datetime.strptime('02.08.13', '%d.%m.%y')
            elif old_doc[3] == '30.16.15':
                date = datetime.strptime('30.10.15', '%d.%m.%y')
            else:
                date = datetime.strptime(old_doc[3], '%d.%m.%y')
            new_doc = DocumentDB(authorId=new_author_id,
                                 created=date,
                                 folderId=new_ekd_folder.id,
                                 comment=old_doc[4],
                                 number=number)
            new_docs.append(new_doc)
        create_new_documents(new_docs, doc_coll)


def migrate_tkgu(cur: sqlite3.Cursor,
                 user_coll: Collection,
                 folders_coll: Collection,
                 org_coll: Collection,
                 doc_coll: Collection,
                 fg_coll: Collection):
    users = get_combined_users(cur, user_coll)
    org = OrgDB(name='ТТИ ЮФУ',
                code='ТКГУ',
                address='Некрасовский пер., 44, Таганрог, Ростовская обл., 347922',
                phone='8 (800) 700-33-98',
                description='Инженерно-технологическая академия ЮФУ — высшее учебное заведение в Таганроге, '
                            'структурное подразделение Южного федерального университета,')
    org_id: ObjectId = create_organization(org, org_coll, users)

    rkd_id = fg_coll.insert_one(FolderGroup(orgId=org_id,
                                            name='Рабочая конструкторская документация').mongo()).inserted_id

    org_old_decimals_rkd: List[str] = [dec_tuple[0][1:] for dec_tuple in get_old_decimals(cur, 'TKGU', isRkd=True)]

    create_new_org_documents(org_old_decimals_rkd, folders_coll, rkd_id)

    new_folders_rkd: Dict[str, FolderInfo] = get_new_org_documents(rkd_id, folders_coll)
    for new_rkd_folder_name, new_rkd_folder in new_folders_rkd.items():
        old_fltr_documents = get_old_docs(new_rkd_folder_name, 'TKGU', cur)
        new_docs = []
        for old_doc in old_fltr_documents:
            new_author_id = users[old_doc[2]].id
            number = int(old_doc[1]) if old_doc[1] else 0
            date = datetime.strptime(old_doc[3], '%d.%m.%y') if old_doc[3] != '00.00.00' else datetime.now(timezone.utc)
            new_doc = DocumentDB(authorId=new_author_id,
                                 created=date,
                                 folderId=new_rkd_folder.id,
                                 comment=old_doc[4],
                                 number=number)
            new_docs.append(new_doc)
        create_new_documents(new_docs, doc_coll)


def main():
    conn: sqlite3.Connection = sqlite3.connect('d2.db')
    cursor: sqlite3.Cursor = conn.cursor()
    client: MongoClient = MongoClient()
    db: Database = client['dec']
    user_collection: Collection = db['users']
    fg_collection: Collection = db['folder_groups']
    fg_collection.drop()
    folders_collection: Collection = db['folders']
    folders_collection.drop()
    org_collection: Collection = db['orgs']
    org_collection.drop()
    doc_collection: Collection = db['docs']
    doc_collection.drop()
    # create_users(cursor, user_collection)
    migrate_fltr(cursor, user_collection, folders_collection, org_collection, doc_collection, fg_collection)
    migrate_shpkd(cursor, user_collection, folders_collection, org_collection, doc_collection, fg_collection)
    migrate_tkgu(cursor, user_collection, folders_collection, org_collection, doc_collection, fg_collection)


if __name__ == '__main__':
    # main()
    pass
