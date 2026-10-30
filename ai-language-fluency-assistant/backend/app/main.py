from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db, init_db
from backend.app.models.learning import Language
from backend.app.routes import auth as auth_routes
from backend.app.routes import chat as chat_routes
from backend.app.routes import onboarding as onboarding_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(auth_routes.router)
app.include_router(onboarding_routes.router)
app.include_router(chat_routes.router)

BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount("/static", StaticFiles(directory=FRONTEND_DIR / "static"), name="static")


@app.get("/", include_in_schema=False)
def index_page():
    return FileResponse(FRONTEND_DIR / "templates" / "index.html")


@app.get("/onboarding", include_in_schema=False)
def onboarding_page():
    return FileResponse(FRONTEND_DIR / "templates" / "onboarding.html")


@app.get("/chat", include_in_schema=False)
def chat_page():
    return FileResponse(FRONTEND_DIR / "templates" / "chat.html")

@app.get("/dashboard", include_in_schema=False)
def dashboard_page():
    return FileResponse(
        FRONTEND_DIR / "templates" / "dashboard.html",
        headers={"Cache-Control": "no-store"},
    )

@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name}


@app.get("/api/languages")
def list_languages(db: Session = Depends(get_db)):
    langs = db.query(Language).filter(Language.is_active.is_(True)).all()
    return [{"id": l.id, "code": l.code, "name": l.name} for l in langs]