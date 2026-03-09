from fastapi import APIRouter
from app.api.routes import store

api_router = APIRouter()

api_router.include_router(store.router)