from datetime import datetime
from typing import Any
from pydantic import BaseModel, EmailStr, field_validator
import re
from models import QuestionType, SessionStatus

BCRYPT_MAX_BYTES = 72


def _validate_password_bytes(v: str) -> str:
    if len(v.encode("utf-8")) > BCRYPT_MAX_BYTES:
        raise ValueError(f"Password must be at most {BCRYPT_MAX_BYTES} bytes")
    return v


def validate_slug(v: str) -> str:
    v = v.strip().lower()
    if not re.match(r"^[a-z0-9_]{2,120}$", v):
        raise ValueError("Slug: lowercase letters, digits, underscores only (2-120 chars)")
    return v


# ── Auth ───────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        return _validate_password_bytes(v)


class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"


class AdminCreate(BaseModel):
    name:           str
    email:          EmailStr
    password:       str
    is_super_admin: bool = False

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        return _validate_password_bytes(v)


class AdminResponse(BaseModel):
    id:             int
    name:           str
    email:          str
    is_super_admin: bool
    is_active:      bool
    created_at:     datetime

    model_config = {"from_attributes": True}


# ── Questions ──────────────────────────────────────────────────────────────────

class QuestionOptionCreate(BaseModel):
    label:       str
    value:       str
    order_index: int = 0


class QuestionOptionResponse(BaseModel):
    id:          int
    label:       str
    value:       str
    order_index: int

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    title:       str
    slug:        str
    description: str | None = None
    type:        QuestionType
    required:    bool = True
    placeholder: str | None = None
    order_index: int = 0
    options:     list[QuestionOptionCreate] = []

    @field_validator("slug")
    @classmethod
    def check_slug(cls, v: str) -> str:
        return validate_slug(v)


class QuestionUpdate(BaseModel):
    title:       str | None = None
    slug:        str | None = None
    description: str | None = None
    type:        QuestionType | None = None
    required:    bool | None = None
    placeholder: str | None = None
    order_index: int | None = None
    is_active:   bool | None = None
    options:     list[QuestionOptionCreate] | None = None

    @field_validator("slug")
    @classmethod
    def check_slug(cls, v: str | None) -> str | None:
        return validate_slug(v) if v is not None else v


class QuestionResponse(BaseModel):
    id:          int
    title:       str
    slug:        str
    description: str | None
    type:        QuestionType
    required:    bool
    placeholder: str | None
    order_index: int
    is_active:   bool
    options:     list[QuestionOptionResponse]
    created_at:  datetime

    model_config = {"from_attributes": True}


class QuestionsReorderRequest(BaseModel):
    question_ids: list[int]


# ── Sessions ───────────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    session_uuid: str


class SessionResponse(BaseModel):
    id:           int
    session_uuid: str
    status:       SessionStatus
    started_at:   datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


# ── Answers ────────────────────────────────────────────────────────────────────

class AnswerCreate(BaseModel):
    session_uuid: str
    question_id:  int
    answer_value: str

    @field_validator("answer_value")
    @classmethod
    def strip_answer(cls, v: str) -> str:
        return v.strip()


class AnswerBulkUpsert(BaseModel):
    session_uuid: str
    answers:      list[dict[str, Any]]


class AnswerResponse(BaseModel):
    id:           int
    question_id:  int
    answer_value: str
    created_at:   datetime

    model_config = {"from_attributes": True}


class CompleteSessionRequest(BaseModel):
    session_uuid: str


# ── Submissions ────────────────────────────────────────────────────────────────

class SubmissionListItem(BaseModel):
    session_id:   int
    session_uuid: str
    started_at:   datetime
    completed_at: datetime | None
    status:       SessionStatus
    answer_count: int
    sheets_synced: bool

    model_config = {"from_attributes": True}


# ── Analytics ──────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_questions:     int
    total_sessions:      int
    completed_sessions:  int
    abandoned_sessions:  int
    completion_rate:     float
    daily_submissions:   list[dict[str, Any]]
    weekly_submissions:  list[dict[str, Any]]
    question_completion: list[dict[str, Any]]
