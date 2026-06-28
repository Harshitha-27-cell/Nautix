from fastapi import APIRouter
from app.api.v1 import auth, users, conversations, query_logs, float_metadata

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    conversations.router, prefix="/conversations", tags=["conversations"]
)
api_router.include_router(query_logs.router, prefix="/query_logs", tags=["query_logs"])
api_router.include_router(
    float_metadata.router, prefix="/float_metadata", tags=["float_metadata"]
)
