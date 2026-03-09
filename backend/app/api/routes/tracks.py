from fastapi import APIRouter
import psycopg2

router = APIRouter()

def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="chinook",
        user="postgres",
        password="tu_password"
    )

@router.get("/")
def search_tracks(q: str = "", artist: str = "", genre: str = ""):

    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT 
            t."TrackId",
            t."Name",
            ar."Name",
            t."UnitPrice"
        FROM "Track" t
        JOIN "Album" al ON t."AlbumId" = al."AlbumId"
        JOIN "Artist" ar ON al."ArtistId" = ar."ArtistId"
        JOIN "Genre" g ON t."GenreId" = g."GenreId"
        WHERE
            (%s = '' OR LOWER(t."Name") LIKE LOWER(%s))
            AND (%s = '' OR LOWER(ar."Name") LIKE LOWER(%s))
            AND (%s = '' OR LOWER(g."Name") LIKE LOWER(%s))
        LIMIT 50
    """

    cur.execute(query, (
        q, f"%{q}%",
        artist, f"%{artist}%",
        genre, f"%{genre}%"
    ))

    rows = cur.fetchall()

    tracks = []

    for row in rows:
        tracks.append({
            "track_id": row[0],
            "track_name": row[1],
            "artist_name": row[2],
            "unit_price": row[3]
        })

    cur.close()
    conn.close()

    return tracks