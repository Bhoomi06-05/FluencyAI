from typing import Literal

from pydantic import BaseModel, Field

LEVELS = [
    "beginner",
    "elementary",
    "pre_intermediate",
    "intermediate",
    "upper_intermediate",
    "advanced",
    "professional",
]

GOALS = [
    "general_conversation",
    "travel",
    "job_interview",
    "workplace",
    "academic",
    "business",
    "exam_preparation",
    "speaking_confidence",
    "vocabulary",
    "grammar",
]

LEARNING_STYLES = ["mixed", "conversation", "games", "reading", "visual"]

CORRECTION_PREFS = ["immediate", "after", "important"]

LevelType = Literal[
    "beginner",
    "elementary",
    "pre_intermediate",
    "intermediate",
    "upper_intermediate",
    "advanced",
    "professional",
]
GoalType = Literal[
    "general_conversation",
    "travel",
    "job_interview",
    "workplace",
    "academic",
    "business",
    "exam_preparation",
    "speaking_confidence",
    "vocabulary",
    "grammar",
]
StyleType = Literal["mixed", "conversation", "games", "reading", "visual"]
CorrectionType = Literal["immediate", "after", "important"]


class OnboardingRequest(BaseModel):
    native_lang: str = Field(min_length=2, max_length=10)  # e.g. "hi"
    target_language_id: int  # languages table ki id
    level: LevelType = "beginner"
    goal: GoalType = "general_conversation"
    daily_target_minutes: int = Field(default=10, ge=5, le=180)
    learning_style: StyleType = "mixed"
    correction_pref: CorrectionType = "after"
    age_range: str = Field(default="", max_length=20)  # optional


class OnboardingOut(BaseModel):
    native_lang: str
    target_language_id: int
    target_language_name: str
    level: str
    goal: str
    daily_target_minutes: int
    learning_style: str
    correction_pref: str