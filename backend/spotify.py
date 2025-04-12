
import base64
from requests import post, get
from models import Artist
from database import SessionLocal
import time
import logging
from dotenv import load_dotenv
import os
import random
import string

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

client_id = os.getenv("SPOTIFY_CLIENT_ID")
client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

def get_token():
    auth = f"{client_id}:{client_secret}"
    auth_base64 = base64.b64encode(auth.encode()).decode()
    response = post(
        "https://accounts.spotify.com/api/token",
        headers={"Authorization": f"Basic {auth_base64}"},
        data={"grant_type": "client_credentials"},
    )
    response.raise_for_status()
    return response.json()["access_token"]

def get_auth_header(token):
    return {"Authorization": f"Bearer {token}"}

def fetch_and_store_artists(target_count=100000):
    start_time = time.time()
    logger.info("Starting artist fetch to store 100,000 unique artists...")
    token = get_token()
    session = SessionLocal()
    stored = 0
    existing_ids = set()

    # Load existing artist IDs
    try:
        existing_ids = set(session.query(Artist.id).all())
        existing_ids = {id_tuple[0] for id_tuple in existing_ids}
        logger.info(f"Found {len(existing_ids)} existing artists in database.")
    except Exception as e:
        logger.error(f"Error loading existing IDs: {e}")

    # Base search terms: A-Z
    base_terms = list(string.ascii_lowercase)

    # Generate random two-letter terms (e.g., "aa", "ab") for broader coverage
    two_letter_terms = [a + b for a in string.ascii_lowercase for b in string.ascii_lowercase]
    random.shuffle(two_letter_terms)  # Shuffle to avoid sequential rate limiting

    # Combine terms, prioritizing A-Z
    search_terms = base_terms + two_letter_terms

    try:
        for term in search_terms:
            if stored >= target_count:
                break

            offset = 0
            limit = 50  # Max allowed by Spotify API
            max_offset = 950  # offset + limit <= 1000

            while offset <= max_offset:
                if stored >= target_count:
                    break

                logger.info(f"Fetching artists for term '{term}', offset: {offset}, stored: {stored}/{target_count}")
                url = "https://api.spotify.com/v1/search"
                params = {"q": term, "type": "artist", "limit": limit, "offset": offset}
                headers = get_auth_header(token)

                try:
                    response = get(url, headers=headers, params=params)
                    if response.status_code == 429:
                        retry_after = int(response.headers.get("Retry-After", 10))
                        logger.warning(f"Rate limit hit. Waiting {retry_after} seconds...")
                        time.sleep(retry_after)
                        token = get_token()  # Refresh token
                        continue
                    response.raise_for_status()

                    data = response.json()["artists"]["items"]
                    if not data:
                        logger.info(f"No more artists for term '{term}' at offset {offset}.")
                        break

                    for artist in data:
                        # Skip incomplete or duplicate artists
                        if (
                            not artist.get("name") or
                            not artist.get("genres") or
                            not artist.get("images") or
                            artist["id"] in existing_ids
                        ):
                            continue

                        new_artist = Artist(
                            id=artist["id"],
                            name=artist["name"],
                            genres=artist["genres"],
                            image_url=artist["images"][0]["url"],
                            country=None
                        )
                        session.add(new_artist)
                        existing_ids.add(artist["id"])
                        stored += 1

                        # Commit every 100 artists
                        if stored % 100 == 0:
                            session.commit()
                            logger.info(f"Committed {stored} unique artists.")

                    offset += limit
                    time.sleep(0.1)

                except Exception as e:
                    logger.error(f"Error fetching for term '{term}': {e}")
                    time.sleep(5)  # Wait before retrying
                    token = get_token()
                    continue

        # Final commit
        session.commit()
        logger.info(f"Stored {stored} unique artists in {time.time() - start_time:.2f} seconds.")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        session.rollback()
    finally:
        session.close()

    return stored

if __name__ == "__main__":
    fetch_and_store_artists()