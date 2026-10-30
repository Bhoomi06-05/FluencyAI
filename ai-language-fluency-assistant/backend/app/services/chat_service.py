import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.app.ai.client import generate_reply
from backend.app.ai.prompts import build_system_prompt
from backend.app.models.learning import (
    Conversation,
    Language,
    Message,
    UserLanguage,
)
from backend.app.models.user import User
from backend.app.schemas.chat import ChatRequest, ChatResponse
from backend.app.services.streak_service import record_activity

logger = logging.getLogger(__name__)

HISTORY_LIMIT = 10  # AI ko pichhle kitne messages dikhane hain


def get_current_user_language(db: Session, user: User) -> UserLanguage:
    ul = (
        db.query(UserLanguage)
        .filter(UserLanguage.user_id == user.id, UserLanguage.is_current.is_(True))
        .first()
    )
    if ul is None or user.profile is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete onboarding first",
        )
    return ul


def send_message(db: Session, user: User, data: ChatRequest) -> ChatResponse:
    ul = get_current_user_language(db, user)
    profile = user.profile

    # 1. Conversation dhundo ya nayi banao
    if data.conversation_id is not None:
        conv = db.get(Conversation, data.conversation_id)
        if conv is None or conv.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
    else:
        conv = Conversation(
            user_id=user.id, language_id=ul.language_id, mode=data.mode
        )
        db.add(conv)
        db.flush()

    # 2. User ka message save karo (AI fail ho tab bhi message bacha rahe)
    db.add(Message(conversation_id=conv.id, role="user", content=data.message))
    db.commit()

    # 3. Pichhli history uthao
    rows = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.id.desc())
        .limit(HISTORY_LIMIT)
        .all()
    )
    rows.reverse()
    history = [{"role": m.role, "content": m.content} for m in rows]
    while history and history[0]["role"] != "user":
        history.pop(0)  # history hamesha user message se shuru honi chahiye

    # 4. System prompt banao
    native = db.query(Language).filter(Language.code == profile.native_lang).first()
    native_name = native.name if native else profile.native_lang

    system_prompt = build_system_prompt(
        target_language=ul.language.name,
        native_language=native_name,
        level=ul.level,
        goal=profile.goal,
        mode=conv.mode,
        correction_pref=profile.correction_pref,
    )

    # 5. AI se reply lo
    try:
        reply = generate_reply(system_prompt, history)
    except Exception:
        logger.exception("LLM call failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service error. Check your API key and internet connection.",
        )
    if not reply.strip():
        reply = "Sorry, I could not think of a reply. Can you say that again?"

    # 6. Reply save karo
    db.add(Message(conversation_id=conv.id, role="assistant", content=reply))
    db.commit()

    # 7. Aaj ki practice streak mein jodo
    record_activity(db, user)

    return ChatResponse(conversation_id=conv.id, reply=reply)