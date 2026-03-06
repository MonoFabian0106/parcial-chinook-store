from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.schemas import PurchaseRequest
from app.services.store_service import StoreService


class ScalarResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value

    def scalar_one(self):
        return self.value


class MappingResult:
    def __init__(self, rows):
        self.rows = rows

    def mappings(self):
        return self

    def all(self):
        return self.rows

    def one_or_none(self):
        return self.rows[0] if self.rows else None


def test_search_tracks_returns_rows():
    db = MagicMock()
    db.execute.return_value = MappingResult([
        {"track_id": 1, "track_name": "Song", "artist_name": "Artist", "genre_name": "Rock", "unit_price": Decimal("0.99")}
    ])

    service = StoreService(db)
    result = service.search_tracks("song", None, None, 5)

    assert len(result) == 1
    assert result[0]["track_name"] == "Song"


def test_purchase_song_raises_when_customer_does_not_exist():
    db = MagicMock()
    db.execute.return_value = ScalarResult(None)
    service = StoreService(db)

    with pytest.raises(HTTPException):
        service.purchase_song(
            PurchaseRequest(
                customer_id=999,
                track_id=1,
                billing_address="Calle 1",
                billing_city="Lima",
                billing_country="PE",
                billing_postal_code="15001",
            )
        )


def test_purchase_song_success_commits_transaction():
    db = MagicMock()
    db.execute.side_effect = [
        ScalarResult(1),
        MappingResult([{"track_id": 1, "unit_price": Decimal("0.99")}]),
        ScalarResult(5),
        ScalarResult(7),
        None,
        None,
    ]

    service = StoreService(db)
    response = service.purchase_song(
        PurchaseRequest(
            customer_id=1,
            track_id=1,
            quantity=2,
            billing_address="Street",
            billing_city="Quito",
            billing_country="EC",
            billing_postal_code="17010",
        )
    )

    assert response["invoice_id"] == 5
    assert response["total"] == Decimal("1.98")
    db.commit.assert_called_once()
