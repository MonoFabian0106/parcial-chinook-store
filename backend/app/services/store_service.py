from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas import PurchaseRequest


class StoreService:
    def __init__(self, db: Session):
        self.db = db

    def list_customers(self, limit: int = 25) -> list[dict]:
        query = text(
            """
            SELECT customer_id, first_name, last_name, email
            FROM customer
            ORDER BY customer_id
            LIMIT :limit;
            """
        )
        rows = self.db.execute(query, {"limit": limit}).mappings().all()
        return [dict(row) for row in rows]

    def search_tracks(
        self,
        query_value: str | None = None,
        artist: str | None = None,
        genre: str | None = None,
        limit: int = 25,
    ) -> list[dict]:
        query = text(
            """
            SELECT
              t.track_id,
              t.name AS track_name,
              ar.name AS artist_name,
              g.name AS genre_name,
              t.unit_price
            FROM track t
            LEFT JOIN album al ON al.album_id = t.album_id
            LEFT JOIN artist ar ON ar.artist_id = al.artist_id
            LEFT JOIN genre g ON g.genre_id = t.genre_id
            WHERE (:query_value IS NULL OR t.name ILIKE '%' || :query_value || '%')
              AND (:artist IS NULL OR ar.name ILIKE '%' || :artist || '%')
              AND (:genre IS NULL OR g.name ILIKE '%' || :genre || '%')
            ORDER BY t.track_id
            LIMIT :limit;
            """
        )
        rows = self.db.execute(
            query,
            {
                "query_value": query_value,
                "artist": artist,
                "genre": genre,
                "limit": limit,
            },
        ).mappings().all()
        return [dict(row) for row in rows]

    def purchase_song(self, payload: PurchaseRequest) -> dict:
        customer = self.db.execute(
            text("SELECT customer_id FROM customer WHERE customer_id = :customer_id"),
            {"customer_id": payload.customer_id},
        ).scalar_one_or_none()
        if not customer:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        track = self.db.execute(
            text("SELECT track_id, unit_price FROM track WHERE track_id = :track_id"),
            {"track_id": payload.track_id},
        ).mappings().one_or_none()
        if not track:
            raise HTTPException(status_code=404, detail="Canción no encontrada")

        unit_price = Decimal(str(track["unit_price"]))
        total = (unit_price * payload.quantity).quantize(Decimal("0.01"))

        invoice_id = (
            self.db.execute(text("SELECT COALESCE(MAX(invoice_id), 0) + 1 FROM invoice")).scalar_one()
        )
        invoice_line_id = (
            self.db.execute(text("SELECT COALESCE(MAX(invoice_line_id), 0) + 1 FROM invoice_line")).scalar_one()
        )

        self.db.execute(
            text(
                """
                INSERT INTO invoice (
                    invoice_id, customer_id, invoice_date, billing_address,
                    billing_city, billing_country, billing_postal_code, total
                ) VALUES (
                    :invoice_id, :customer_id, :invoice_date, :billing_address,
                    :billing_city, :billing_country, :billing_postal_code, :total
                );
                """
            ),
            {
                "invoice_id": invoice_id,
                "customer_id": payload.customer_id,
                "invoice_date": datetime.now(timezone.utc),
                "billing_address": payload.billing_address,
                "billing_city": payload.billing_city,
                "billing_country": payload.billing_country,
                "billing_postal_code": payload.billing_postal_code,
                "total": total,
            },
        )

        self.db.execute(
            text(
                """
                INSERT INTO invoice_line (invoice_line_id, invoice_id, track_id, unit_price, quantity)
                VALUES (:invoice_line_id, :invoice_id, :track_id, :unit_price, :quantity);
                """
            ),
            {
                "invoice_line_id": invoice_line_id,
                "invoice_id": invoice_id,
                "track_id": payload.track_id,
                "unit_price": unit_price,
                "quantity": payload.quantity,
            },
        )

        self.db.commit()
        return {
            "invoice_id": invoice_id,
            "invoice_line_id": invoice_line_id,
            "total": total,
            "message": "Compra registrada con éxito",
        }
