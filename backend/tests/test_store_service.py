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


# ==================== TESTS PARA search_tracks ====================

def test_search_tracks_returns_rows():
    """Verifica que search_tracks retorna las filas correctamente"""
    db = MagicMock()
    db.execute.return_value = MappingResult([
        {"track_id": 1, "track_name": "Song", "artist_name": "Artist", "genre_name": "Rock", "unit_price": Decimal("0.99")}
    ])

    service = StoreService(db)
    result = service.search_tracks("song", None, None, 5)

    assert len(result) == 1
    assert result[0]["track_name"] == "Song"


def test_search_tracks_empty_results():
    """Verifica que search_tracks retorna lista vacía cuando no hay resultados"""
    db = MagicMock()
    db.execute.return_value = MappingResult([])

    service = StoreService(db)
    result = service.search_tracks("nonexistent", None, None, 5)

    assert len(result) == 0
    assert result == []


def test_search_tracks_with_all_filters():
    """Verifica que search_tracks funciona con todos los filtros"""
    db = MagicMock()
    db.execute.return_value = MappingResult([
        {"track_id": 1, "track_name": "Rock Song", "artist_name": "Led Zeppelin", "genre_name": "Rock", "unit_price": Decimal("1.29")}
    ])

    service = StoreService(db)
    result = service.search_tracks("Rock", "Led", "Rock", 10)

    assert len(result) == 1
    assert result[0]["artist_name"] == "Led Zeppelin"
    assert result[0]["genre_name"] == "Rock"


# ==================== TESTS PARA list_customers ====================

def test_list_customers_returns_rows():
    """Verifica que list_customers retorna los clientes correctamente"""
    db = MagicMock()
    db.execute.return_value = MappingResult([
        {"customer_id": 1, "first_name": "Ana", "last_name": "Lopez", "email": "ana@mail.com"},
        {"customer_id": 2, "first_name": "Carlos", "last_name": "Perez", "email": "carlos@mail.com"}
    ])

    service = StoreService(db)
    result = service.list_customers(limit=25)

    assert len(result) == 2
    assert result[0]["first_name"] == "Ana"
    assert result[1]["email"] == "carlos@mail.com"


def test_list_customers_respects_limit():
    """Verifica que list_customers usa el límite especificado"""
    db = MagicMock()
    db.execute.return_value = MappingResult([
        {"customer_id": 1, "first_name": "Ana", "last_name": "Lopez", "email": "ana@mail.com"}
    ])

    service = StoreService(db)
    result = service.list_customers(limit=1)

    assert len(result) == 1
    db.execute.assert_called_once()


# ==================== TESTS PARA purchase_song ====================

def test_purchase_song_raises_when_tracks_not_found():
    """Verifica que purchase_song lanza excepción cuando no se encuentran los tracks"""
    db = MagicMock()
    # Retorna lista vacía para simular tracks no encontrados
    db.execute.return_value = MappingResult([])

    service = StoreService(db)

    with pytest.raises(HTTPException) as exc_info:
        service.purchase_song(
            PurchaseRequest(
                customer_id=1,
                track_ids=[999, 1000],  # IDs que no existen
            )
        )
    
    assert exc_info.value.status_code == 404
    assert "No se encontraron las canciones" in exc_info.value.detail


def test_purchase_song_success_commits_transaction():
    """Verifica que purchase_song hace commit y retorna respuesta correcta"""
    db = MagicMock()
    
    # Secuencia de llamadas:
    # 1. Buscar tracks -> retorna 2 tracks con precios
    # 2. Obtener max purchase_id -> retorna 5
    # 3-4. Inserts (no retornan nada relevante)
    db.execute.side_effect = [
        MappingResult([
            {"track_id": 1, "unit_price": Decimal("0.99")},
            {"track_id": 2, "unit_price": Decimal("1.29")}
        ]),
        ScalarResult(5),  # MAX(purchase_id)
        None,  # INSERT 1
        None,  # INSERT 2
    ]

    service = StoreService(db)
    response = service.purchase_song(
        PurchaseRequest(
            customer_id=1,
            track_ids=[1, 2],
            quantity=1,
        )
    )

    # Total = 0.99 + 1.29 = 2.28
    assert response["total"] == Decimal("2.28")
    assert "invoice_id" in response
    assert response["message"] == "Se registraron 2 canciones en la tabla purchase."
    db.commit.assert_called_once()


def test_purchase_song_with_quantity():
    """Verifica que purchase_song multiplica correctamente por cantidad"""
    db = MagicMock()
    
    db.execute.side_effect = [
        MappingResult([{"track_id": 1, "unit_price": Decimal("1.00")}]),
        ScalarResult(0),  # MAX(purchase_id)
        None,  # INSERT
    ]

    service = StoreService(db)
    response = service.purchase_song(
        PurchaseRequest(
            customer_id=1,
            track_ids=[1],
            quantity=3,
        )
    )

    # Total = 1.00 * 3 = 3.00
    assert response["total"] == Decimal("3.00")
    db.commit.assert_called_once()
