from datetime import date, timedelta

from sqlalchemy.orm import Session

from backend.app.models.progress import Streak
from backend.app.models.user import User


def _get_or_create(db: Session, user: User) -> Streak:
    streak = db.query(Streak).filter(Streak.user_id == user.id).first()
    if streak is None:
        streak = Streak(user_id=user.id, current=0, longest=0)
        db.add(streak)
        db.flush()
    return streak


def record_activity(db: Session, user: User) -> Streak:
    """Aaj ki practice ginti mein jodo. Ek din mein ek hi baar count hota hai."""
    today = date.today()
    streak = _get_or_create(db, user)

    if streak.last_active_date == today:
        return streak

    if streak.last_active_date == today - timedelta(days=1):
        streak.current += 1
    else:
        streak.current = 1

    streak.longest = max(streak.longest, streak.current)
    streak.last_active_date = today
    db.commit()
    return streak


def get_streak_info(db: Session, user: User) -> dict:
    """Screen par dikhane ke liye. Kal bhi practice nahi ki to current 0 dikhta hai."""
    today = date.today()
    streak = db.query(Streak).filter(Streak.user_id == user.id).first()

    if streak is None or streak.last_active_date is None:
        return {"current": 0, "longest": 0, "active_today": False}

    alive = streak.last_active_date >= today - timedelta(days=1)
    return {
        "current": streak.current if alive else 0,
        "longest": streak.longest,
        "active_today": streak.last_active_date == today,
    }