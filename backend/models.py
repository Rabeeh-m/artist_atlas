
from sqlalchemy import Column, Integer, String, ARRAY
from database import Base

class Artist(Base):
    __tablename__ = "artists"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    genres = Column(ARRAY(String))
    image_url = Column(String)
    country = Column(String, nullable=True)
