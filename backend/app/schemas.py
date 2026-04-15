from decimal import Decimal
from pydantic import BaseModel, Field, conlist
from typing import Optional

class TrackSearchResponse(BaseModel):
    track_id: int
    track_name: str
    artist_name: Optional[str] = None
    genre_name: Optional[str] = None
    unit_price: Decimal

class PurchaseRequest(BaseModel):
    customer_id: int = Field(gt=0)
    track_ids: conlist(int, min_items=1)
    quantity: int = Field(default=1, gt=0)
    billing_address: str = Field(default="Calle Falsa 123", min_length=3, max_length=70)
    billing_city: str = Field(default="Ciudad", min_length=2, max_length=40)
    billing_country: str = Field(default="Pais", min_length=2, max_length=40)
    billing_postal_code: str = Field(default="12345", min_length=3, max_length=10)

class PurchaseResponse(BaseModel):
    class Config:
        orm_mode = True
    invoice_id: int
    invoice_line_id: Optional[int] = None
    total: Decimal
    message: str

class CustomerResponse(BaseModel):
    customer_id: int
    first_name: str
    last_name: str
    email: str
