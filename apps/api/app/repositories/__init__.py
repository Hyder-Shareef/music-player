from app.repositories.base import BaseRepository
from app.repositories.sqlite_repo import SQLiteRepository
from app.repositories.mongo_repo import MongoRepository
from app.core.config import settings

_repo_instance = None

def get_repository() -> BaseRepository:
    global _repo_instance
    if _repo_instance is None:
        if settings.DATABASE_TYPE == "mongodb" and settings.MONGODB_URI:
            _repo_instance = MongoRepository()
        else:
            _repo_instance = SQLiteRepository()
    return _repo_instance
