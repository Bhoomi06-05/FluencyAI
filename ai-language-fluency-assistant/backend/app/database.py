from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from backend.app.config import settings

connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # models import yahin karte hain taaki tables register ho jaayein
    from backend.app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    from backend.app.models.learning import Language

    db = SessionLocal()
    try:
        if db.query(Language).count() == 0:
            seed = [
                ("en", "English"), ("hi", "Hindi"), ("mr", "Marathi"),
                ("es", "Spanish"), ("fr", "French"), ("de", "German"),
                ("ja", "Japanese"),
            ]
            db.add_all([Language(code=c, name=n) for c, n in seed])
            db.commit()
    finally:
        db.close()