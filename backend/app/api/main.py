from fastapi import APIRouter

from app.api.routes.store import router as store_router

api_router = APIRouter()
api_router.include_router(store_router)
