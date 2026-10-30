from collections import Counter
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from backend.app.models.learning import Conversation, Message
from backend.app.models.user import User
from backend.app.services.streak_service import get_streak_info

DAILY_GOAL_MESSAGES = 5  # aaj ka task: itne messages bhejo


def _local_offset() -> timedelta:
    # Database mein time UTC mein save hota hai. Computer ke local time mein badalne ke liye.
    diff = datetime.now() - datetime.utcnow()
    return timedelta(minutes=round(diff.total_seconds() / 60))


def get_summary(db: Session, user: User) -> dict:
    offset = _local_offset()
    today = date.today()

    rows = (
        db.query(Message.created_at)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.user_id == user.id, Message.role == "user")
        .all()
    )
    per_day = Counter((r[0] + offset).date() for r in rows)

    week = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        week.append(
            {
                "label": d.strftime("%a"),
                "date": d.isoformat(),
                "count": per_day.get(d, 0),
                "today": d == today,
            }
        )

    total_conversations = (
        db.query(Conversation).filter(Conversation.user_id == user.id).count()
    )

    return {
        "streak": get_streak_info(db, user),
        "daily_goal": DAILY_GOAL_MESSAGES,
        "today_messages": per_day.get(today, 0),
        "total_messages": len(rows),
        "total_conversations": total_conversations,
        "week": week,
    }