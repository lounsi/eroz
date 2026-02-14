from fastapi import APIRouter

from app.api.routes import auth, chat, progress, upload, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(progress.router)
api_router.include_router(upload.router)
api_router.include_router(chat.router)
