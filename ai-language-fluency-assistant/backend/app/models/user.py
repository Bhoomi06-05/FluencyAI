from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(100))
    interface_lang: Mapped[str] = mapped_column(String(10), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile: Mapped["Profile"] = relationship(back_populates="user", uselist=False)


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    native_lang: Mapped[str] = mapped_column(String(10), default="hi")
    goal: Mapped[str] = mapped_column(String(50), default="general_conversation")
    daily_target_minutes: Mapped[int] = mapped_column(Integer, default=10)
    learning_style: Mapped[str] = mapped_column(String(50), default="mixed")
    age_range: Mapped[str] = mapped_column(String(20), default="")
    # immediate / after / important
    correction_pref: Mapped[str] = mapped_column(String(20), default="after")

    user: Mapped["User"] = relationship(back_populates="profile")