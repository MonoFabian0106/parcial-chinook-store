from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import CustomerResponse, PurchaseRequest, PurchaseResponse, TrackSearchResponse
from app.services.store_service import StoreService

router = APIRouter(prefix="/store", tags=["store"])


def get_store_service(db: Annotated[Session, Depends(get_db)]) -> StoreService:
    return StoreService(db)


@router.get("/customers", response_model=list[CustomerResponse])
def list_customers(
    limit: int = Query(default=25, ge=1, le=100),
    service: StoreService = Depends(get_store_service),
):
    return service.list_customers(limit)


@router.get("/tracks/search", response_model=list[TrackSearchResponse])
def search_tracks(
    q: str | None = Query(default=None),
    artist: str | None = Query(default=None),
    genre: str | None = Query(default=None),
    limit: int = Query(default=25, ge=1, le=100),
    service: StoreService = Depends(get_store_service),
):
    return service.search_tracks(query_value=q, artist=artist, genre=genre, limit=limit)


@router.post("/purchases", response_model=PurchaseResponse)
def purchase_song(
    payload: PurchaseRequest,
    service: StoreService = Depends(get_store_service),
):
    return service.purchase_song(payload)
