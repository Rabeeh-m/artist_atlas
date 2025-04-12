
from fastapi import FastAPI, Query, HTTPException
from spotify import fetch_and_store_artists
from database import Base, engine, SessionLocal
from models import Artist
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import logging
import time
from sqlalchemy.sql import text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.post("/load-artists")
async def load_artists():
    logger.info("Starting artist loading...")
    start_time = time.time()
    stored = fetch_and_store_artists()
    logger.info(f"Artist loading completed in {time.time() - start_time:.2f} seconds.")
    return {"message": f"Stored {stored} artists"}

@app.get("/artists")
async def get_artists(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    logger.info(f"Fetching artists, page: {page}, per_page: {per_page}")
    start_time = time.time()
    db: Session = SessionLocal()
    try:
        offset = (page - 1) * per_page
        artists = db.query(Artist).offset(offset).limit(per_page).all()
        total = db.query(Artist).count()
        logger.info(f"Fetched {len(artists)} artists in {time.time() - start_time:.2f} seconds.")
        return {
            "artists": artists,
            "total": total,
            "page": page,
            "per_page": per_page
        }
    except Exception as e:
        logger.error(f"Error fetching artists: {e}")
        return {"error": "Failed to fetch artists"}
    finally:
        db.close()

@app.get("/search")
async def search_artists(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=10)
):
    logger.info(f"Searching artists with query: '{q}'")
    start_time = time.time()
    db: Session = SessionLocal()
    try:
        query = q.strip().lower()
        if not query:
            return {"suggestions": [], "results": []}

        fts_query = f"""
            SELECT id, name, genres, image_url, country,
                   ts_rank(to_tsvector('english', name), to_tsquery('english', :query)) AS rank
            FROM artists
            WHERE to_tsvector('english', name) @@ to_tsquery('english', :query)
            ORDER BY rank DESC
            LIMIT :limit
        """

        fuzzy_query = f"""
            SELECT id, name, genres, image_url, country,
                   LEAST(
                       levenshtein(lower(name), :query),
                       similarity(name, :query) * 100
                   ) AS distance
            FROM artists
            WHERE name ILIKE :pattern
               OR similarity(name, :query) > 0.3
            ORDER BY distance
            LIMIT :limit
        """

        fts_params = {"query": query.replace(" ", " & "), "limit": limit}
        fuzzy_params = {
            "query": query,
            "pattern": f"%{query}%",
            "limit": limit
        }

        fts_results = db.execute(text(fts_query), fts_params).fetchall()
        fuzzy_results = db.execute(text(fuzzy_query), fuzzy_params).fetchall()

        seen_ids = set()
        suggestions = []
        results = []

        for row in fts_results:
            if row.id not in seen_ids:
                artist = {
                    "id": row.id,
                    "name": row.name,
                    "genres": row.genres,
                    "image_url": row.image_url,
                    "country": row.country
                }
                results.append(artist)
                seen_ids.add(row.id)

        for row in fuzzy_results:
            if row.id not in seen_ids:
                artist = {
                    "id": row.id,
                    "name": row.name,
                    "genres": row.genres,
                    "image_url": row.image_url,
                    "country": row.country
                }
                suggestions.append(artist)
                seen_ids.add(row.id)

        logger.info(f"Search returned {len(results)} results and {len(suggestions)} suggestions in {time.time() - start_time:.2f} seconds.")
        return {
            "results": results[:limit],
            "suggestions": suggestions[:limit]
        }
    except Exception as e:
        logger.error(f"Search error: {e}")
        return {"error": "Failed to search artists"}
    finally:
        db.close()

@app.get("/artists/{id}")
async def get_artist(id: str):
    logger.info(f"Fetching artist with id: {id}")
    start_time = time.time()
    db: Session = SessionLocal()
    try:
        artist = db.query(Artist).filter(Artist.id == id).first()
        if not artist:
            raise HTTPException(status_code=404, detail="Artist not found")
        logger.info(f"Fetched artist {artist.name} in {time.time() - start_time:.2f} seconds.")
        return {
            "id": artist.id,
            "name": artist.name,
            "genres": artist.genres,
            "image_url": artist.image_url,
            "country": artist.country
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching artist: {e}")
        return {"error": "Failed to fetch artist"}
    finally:
        db.close()