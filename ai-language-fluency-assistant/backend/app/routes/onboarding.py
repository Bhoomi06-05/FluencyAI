from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.auth.deps import get_current_user
from backend.app.database import get_db
from backend.app.models.learning import Language, UserLanguage
from backend.app.models.user import Profile, User
from backend.app.schemas.onboarding import (
    CORRECTION_PREFS,
    GOALS,
    LEARNING_STYLES,
    LEVELS,
    OnboardingOut,
    OnboardingRequest,
)

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


@router.get("/options")
def get_options(db: Session = Depends(get_db)):
    langs = db.query(Language).filter(Language.is_active.is_(True)).all()
    return {
        "languages": [{"id": l.id, "code": l.code, "name": l.name} for l in langs],
        "levels": LEVELS,
        "goals": GOALS,
        "learning_styles": LEARNING_STYLES,
        "correction_prefs": CORRECTION_PREFS,
    }


def _build_out(profile: Profile, ul: UserLanguage) -> OnboardingOut:
    return OnboardingOut(
        native_lang=profile.native_lang,
        target_language_id=ul.language_id,
        target_language_name=ul.language.name,
        level=ul.level,
        goal=profile.goal,
        daily_target_minutes=profile.daily_target_minutes,
        learning_style=profile.learning_style,
        correction_pref=profile.correction_pref,
    )


@router.post("", response_model=OnboardingOut)
def save_onboarding(
    data: OnboardingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    language = db.get(Language, data.target_language_id)
    if language is None or not language.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected language not found",
        )

    profile = user.profile
    if profile is None:
        profile = Profile()
        user.profile = profile

    profile.native_lang = data.native_lang.lower()
    profile.goal = data.goal
    profile.daily_target_minutes = data.daily_target_minutes
    profile.learning_style = data.learning_style
    profile.correction_pref = data.correction_pref
    profile.age_range = data.age_range

    # pehle saari languages ko "current" se hatao
    db.query(UserLanguage).filter(UserLanguage.user_id == user.id).update(
        {"is_current": False}
    )

    ul = (
        db.query(UserLanguage)
        .filter(
            UserLanguage.user_id == user.id,
            UserLanguage.language_id == language.id,
        )
        .first()
    )
    if ul is None:
        ul = UserLanguage(user_id=user.id, language_id=language.id)
        db.add(ul)
    ul.level = data.level
    ul.is_current = True

    db.commit()
    db.refresh(ul)
    db.refresh(profile)
    return _build_out(profile, ul)


@router.get("/me", response_model=OnboardingOut)
def get_my_onboarding(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ul = (
        db.query(UserLanguage)
        .filter(UserLanguage.user_id == user.id, UserLanguage.is_current.is_(True))
        .first()
    )
    if ul is None or user.profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not completed yet",
        )
    return _build_out(user.profile, ul)