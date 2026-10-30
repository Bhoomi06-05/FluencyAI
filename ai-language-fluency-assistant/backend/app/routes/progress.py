from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.auth.deps import get_current_user
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.services.progress_service import get_summary
from backend.app.services.streak_service import get_streak_info

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/streak")
def streak(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_streak_info(db, user)


@router.get("/summary")
def summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_summary(db, user)