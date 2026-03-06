from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class TrackSearchResponse(BaseModel):
    track_id: int
    track_name: str
    artist_name: str | None = None
    genre_name: str | None = None
    unit_price: Decimal


class PurchaseRequest(BaseModel):
    customer_id: int = Field(gt=0)
    track_id: int = Field(gt=0)
    quantity: int = Field(default=1, gt=0, le=10)
    billing_address: str = Field(min_length=3, max_length=70)
    billing_city: str = Field(min_length=2, max_length=40)
    billing_country: str = Field(min_length=2, max_length=40)
    billing_postal_code: str = Field(min_length=3, max_length=10)


class PurchaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    invoice_id: int
    invoice_line_id: int
    total: Decimal
    message: str


class CustomerResponse(BaseModel):
    customer_id: int
    first_name: str
    last_name: str
    email: str
