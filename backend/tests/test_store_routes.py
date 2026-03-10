from decimal import Decimal

from fastapi.testclient import TestClient

from app.api.routes.store import get_store_service
from main import app


class FakeStoreService:
    """Servicio falso para simular las operaciones de la tienda en tests"""
    
    def list_customers(self, limit: int):
        return [{"customer_id": 1, "first_name": "Ana", "last_name": "Lopez", "email": "ana@mail.com"}]

    def search_tracks(self, query_value, artist, genre, limit):
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
            "invoice_line_id": None,
            "total": Decimal("0.99"),
            "message": "Se registraron 1 canciones en la tabla purchase.",
        }


def override_service():
    return FakeStoreService()


# ==================== TESTS PARA ENDPOINTS ====================

def test_get_customers_endpoint():
    """Verifica que GET /customers retorna lista de clientes"""
    app.dependency_overrides[get_store_service] = override_service
    client = TestClient(app)

    response = client.get("/api/store/customers")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["first_name"] == "Ana"
    assert data[0]["email"] == "ana@mail.com"

    app.dependency_overrides.clear()


def test_get_customers_with_limit():
    """Verifica que GET /customers acepta parámetro limit"""
    app.dependency_overrides[get_store_service] = override_service
    client = TestClient(app)

    response = client.get("/api/store/customers?limit=10")

    assert response.status_code == 200
    app.dependency_overrides.clear()


def test_search_tracks_endpoint():
    """Verifica que GET /tracks/search retorna canciones"""
    app.dependency_overrides[get_store_service] = override_service
    client = TestClient(app)

    response = client.get("/api/store/tracks/search?q=track")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["track_name"] == "Track 1"
    assert data[0]["artist_name"] == "Artist"

    app.dependency_overrides.clear()


def test_search_tracks_with_filters():
    """Verifica que GET /tracks/search acepta múltiples filtros"""
    app.dependency_overrides[get_store_service] = override_service
    client = TestClient(app)

    response = client.get("/api/store/tracks/search?q=rock&artist=Artist&genre=Rock&limit=50")

    assert response.status_code == 200
    app.dependency_overrides.clear()


def test_purchase_endpoint():
    """Verifica que POST /purchases registra una compra"""
    app.dependency_overrides[get_store_service] = override_service
    client = TestClient(app)

    response = client.post(
        "/api/store/purchases",
        json={
            "customer_id": 1,
            "track_ids": [1, 2],
            "quantity": 1,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "invoice_id" in data
    assert "total" in data
    assert "message" in data

    app.dependency_overrides.clear()


def test_purchase_endpoint_with_single_track():
    """Verifica que POST /purchases funciona con un solo track"""
    app.dependency_overrides[get_store_service] = override_service
    client = TestClient(app)

    response = client.post(
        "/api/store/purchases",
        json={
            "customer_id": 1,
            "track_ids": [1],
            "quantity": 1,
        },
    )

    assert response.status_code == 200
    app.dependency_overrides.clear()


def test_purchase_endpoint_validation_error():
    """Verifica que POST /purchases rechaza datos inválidos"""
    app.dependency_overrides[get_store_service] = override_service
    client = TestClient(app)

    # customer_id debe ser > 0
    response = client.post(
        "/api/store/purchases",
        json={
            "customer_id": 0,
            "track_ids": [1],
            "quantity": 1,
        },
    )

    assert response.status_code == 422  # Validation error
    app.dependency_overrides.clear()


def test_purchase_endpoint_empty_tracks():
    """Verifica que POST /purchases rechaza lista vacía de tracks"""
    app.dependency_overrides[get_store_service] = override_service
    client = TestClient(app)

    response = client.post(
        "/api/store/purchases",
        json={
            "customer_id": 1,
            "track_ids": [],
            "quantity": 1,
        },
    )

    assert response.status_code == 422  # Validation error
    app.dependency_overrides.clear()
