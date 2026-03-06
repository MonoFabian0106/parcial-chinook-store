from decimal import Decimal

from fastapi.testclient import TestClient

from app.api.routes.store import get_store_service
from main import app


class FakeStoreService:
    def list_customers(self, limit: int):
        return [{"customer_id": 1, "first_name": "Ana", "last_name": "Lopez", "email": "ana@mail.com"}]

    def search_tracks(self, q, artist, genre, limit):
        return [
            {
                "track_id": 1,
                "track_name": "Track 1",
                "artist_name": "Artist",
                "genre_name": "Rock",
                "unit_price": Decimal("0.99"),
            }
        ]

    def purchase_song(self, payload):
        return {
            "invoice_id": 1,
            "invoice_line_id": 1,
            "total": Decimal("0.99"),
            "message": "Compra registrada con éxito",
        }


def override_service():
    return FakeStoreService()


def test_store_endpoints():
    app.dependency_overrides[get_store_service] = override_service
    client = TestClient(app)

    customers = client.get("/api/store/customers")
    tracks = client.get("/api/store/tracks/search?q=track")
    purchase = client.post(
        "/api/store/purchases",
        json={
            "customer_id": 1,
            "track_id": 1,
            "quantity": 1,
            "billing_address": "Av Test 123",
            "billing_city": "Bogota",
            "billing_country": "CO",
            "billing_postal_code": "110111",
        },
    )

    assert customers.status_code == 200
    assert tracks.status_code == 200
    assert purchase.status_code == 200

    app.dependency_overrides.clear()
