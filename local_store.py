from copy import deepcopy
from types import SimpleNamespace

from bson import ObjectId


def _matches(document, query):
    for key, expected in query.items():
        actual = document.get(key)
        if isinstance(expected, dict):
            if "$gte" in expected and not (actual is not None and actual >= expected["$gte"]):
                return False
        elif actual != expected:
            return False
    return True


class LocalCursor:
    def __init__(self, documents):
        self.documents = documents

    def sort(self, key, direction=1):
        if isinstance(key, list):
            for field, order in reversed(key):
                self.sort(field, order)
            return self
        self.documents.sort(key=lambda document: document.get(key), reverse=direction < 0)
        return self

    def limit(self, count):
        self.documents = self.documents[:count]
        return self

    def __iter__(self):
        return iter(self.documents)


class LocalCollection:
    def __init__(self):
        self.documents = []

    def insert_one(self, document):
        entry = deepcopy(document)
        entry.setdefault("_id", ObjectId())
        self.documents.append(entry)
        return SimpleNamespace(inserted_id=entry["_id"])

    def find_one(self, query, projection=None, sort=None):
        matches = list(self.find(query, projection))
        if sort:
            for field, direction in reversed(sort):
                matches.sort(key=lambda document: document.get(field), reverse=direction < 0)
        return matches[0] if matches else None

    def find(self, query=None, projection=None):
        results = []
        for document in self.documents:
            if not _matches(document, query or {}):
                continue
            entry = deepcopy(document)
            if projection:
                for field, include in projection.items():
                    if include == 0:
                        entry.pop(field, None)
            results.append(entry)
        return LocalCursor(results)

    def update_one(self, query, update, upsert=False):
        target = next((document for document in self.documents if _matches(document, query)), None)
        if target is None and upsert:
            target = dict(query)
            target.setdefault("_id", ObjectId())
            self.documents.append(target)
        if target is None:
            return SimpleNamespace(matched_count=0)
        for key, value in update.get("$set", {}).items():
            target[key] = deepcopy(value)
        for key, value in update.get("$push", {}).items():
            target.setdefault(key, []).append(deepcopy(value))
        return SimpleNamespace(matched_count=1)

    def delete_one(self, query):
        for index, document in enumerate(self.documents):
            if _matches(document, query):
                self.documents.pop(index)
                break

    def delete_many(self, query):
        self.documents = [document for document in self.documents if not _matches(document, query)]

    def count_documents(self, query):
        return sum(1 for document in self.documents if _matches(document, query))


class LocalDatabase:
    def __init__(self):
        self.collections = {}

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        return self.collections.setdefault(name, LocalCollection())
