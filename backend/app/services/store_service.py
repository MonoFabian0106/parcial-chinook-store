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
        # Ajustado a la tabla "customer" (si la borraste también, cámbiala por la nueva)
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
        # 1. Verificar que los tracks existen y obtener su precio total
        tracks_query = text("SELECT track_id, unit_price FROM track WHERE track_id IN :track_ids")
        tracks_rows = self.db.execute(
            tracks_query, 
            {"track_ids": tuple(payload.track_ids)}
        ).mappings().all()

        if not tracks_rows:
            raise HTTPException(status_code=404, detail="No se encontraron las canciones")

        # Calculamos el total para devolverlo al frontend (aunque no esté en tu tabla purchase)
        total_acumulado = sum(Decimal(str(row["unit_price"])) for row in tracks_rows)
        total_acumulado = (total_acumulado * payload.quantity).quantize(Decimal("0.01"))

        # 2. Obtener el siguiente purchase_id
        # Como no hay autoincremento automático en este script, buscamos el máximo
        next_id = self.db.execute(text("SELECT COALESCE(MAX(purchase_id), 0) FROM purchase")).scalar_one()

        # 3. Insertar cada canción en la nueva tabla "purchase"
        # Según tu diseño: purchase_id, customer_id, track_id, purchase_date
        for row in tracks_rows:
            next_id += 1
            self.db.execute(
                text(
                    """
                    INSERT INTO purchase (purchase_id, customer_id, track_id, purchase_date)
                    VALUES (:p_id, :c_id, :t_id, :p_date);
                    """
                ),
                {
                    "p_id": next_id,
                    "c_id": payload.customer_id,
                    "t_id": row["track_id"],
                    "p_date": datetime.now(timezone.utc)
                },
            )

        self.db.commit()
        
        return {
            "invoice_id": next_id, # Usamos el último purchase_id para no romper el esquema PurchaseResponse
            "invoice_line_id": None,
            "total": total_acumulado,
            "message": f"Se registraron {len(tracks_rows)} canciones en la tabla purchase.",
        }