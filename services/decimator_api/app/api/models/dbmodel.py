#!/usr/bin/env python
# -*- coding: utf-8 -*-
from datetime import datetime, timezone
from hashlib import sha256

from bson import ObjectId
from pydantic import BaseConfig, BaseModel


class DBModel(BaseModel):
    def get_hash(self) -> str:
        doc_sha = sha256()
        for key, value in self:
            value_type = type(value)
            if value_type in [int, str, float, bool]:
                doc_sha.update(str(value).encode('utf-8'))
                continue
            elif issubclass(value_type, DBModel):
                doc_sha.update(value.get_hash().encode('utf-8'))
            elif issubclass(value_type, dict) and len(value) and issubclass(type(value[next(iter(value))]), DBModel):
                _hashes = [value[key].get_hash() for key in sorted(value.keys())]
                for _hash in _hashes:
                    doc_sha.update(_hash.encode('utf-8'))
            elif issubclass(value_type, list) and len(value):
                if issubclass(type(value[0]), DBModel):
                    for _hash in sorted([element.get_hash() for element in value]):
                        doc_sha.update(_hash.encode('utf-8'))
                elif issubclass(type(value[0]), list) and len(value[0]):
                    if issubclass(type(value[0][0]), DBModel):
                        for sublist in value:
                            for _hash in sorted([element.get_hash() for element in sublist]):
                                doc_sha.update(_hash.encode('utf-8'))
                    elif type(value[0][0]) in [int, str, float, bool]:
                        for i in value:
                            for j in i:
                                doc_sha.update(str(j).encode('utf-8'))
                elif type(value[0]) in [int, str, float, bool]:
                    for i in value:
                        doc_sha.update(str(i).encode('utf-8'))
        return doc_sha.hexdigest()

    @classmethod
    def from_mongo(cls, data: dict):
        """We must convert _id into "id". """
        if not data:
            return data
        id = data.pop('_id', None)
        return cls(**dict(data, id=id))

    def mongo(self, **kwargs):
        exclude_unset = kwargs.pop('exclude_unset', False)
        by_alias = kwargs.pop('by_alias', True)
        parsed = self.dict(
            exclude_unset=exclude_unset,
            by_alias=by_alias,
            **kwargs,
        )
        # Mongo uses `_id` as default key. We should stick to that as well.
        if '_id' not in parsed and 'id' in parsed:
            parsed['_id'] = parsed.pop('id')
        return parsed

    class Config(BaseConfig):
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda dt: dt.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
            ObjectId: lambda oid: str(oid),
        }
