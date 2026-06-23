from datetime import datetime
from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer,
    String, Text, Enum as SAEnum, func, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from database import Base


class SessionStatus(str, enum.Enum):
    active    = "active"
    completed = "completed"
    abandoned = "abandoned"


class QuestionType(str, enum.Enum):
    text          = "text"
    textarea      = "textarea"
    single_choice = "single_choice"
    multi_choice  = "multi_choice"
    number        = "number"
    email         = "email"
    phone         = "phone"
    date          = "date"
    file          = "file"


class Admin(Base):
    __tablename__ = "admins"

    id:            Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    name:          Mapped[str]      = mapped_column(String(100), nullable=False)
    email:         Mapped[str]      = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str]      = mapped_column(String(255), nullable=False)
    is_super_admin: Mapped[bool]    = mapped_column(Boolean, default=False)
    is_active:     Mapped[bool]     = mapped_column(Boolean, default=True)
    created_at:    Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at:    Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class Question(Base):
    __tablename__ = "questions"

    id:          Mapped[int]           = mapped_column(Integer, primary_key=True, index=True)
    title:       Mapped[str]           = mapped_column(String(500), nullable=False)
    slug:        Mapped[str]           = mapped_column(String(120), nullable=False, unique=True, index=True)
    description: Mapped[str | None]    = mapped_column(Text, nullable=True)
    type:        Mapped[QuestionType]  = mapped_column(SAEnum(QuestionType), nullable=False, default=QuestionType.text)
    required:    Mapped[bool]          = mapped_column(Boolean, default=True)
    placeholder: Mapped[str | None]    = mapped_column(String(255), nullable=True)
    order_index: Mapped[int]           = mapped_column(Integer, default=0)
    is_active:   Mapped[bool]          = mapped_column(Boolean, default=True)
    created_at:  Mapped[datetime]      = mapped_column(DateTime, server_default=func.now())
    updated_at:  Mapped[datetime]      = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    options: Mapped[list["QuestionOption"]] = relationship(
        "QuestionOption", back_populates="question",
        cascade="all, delete-orphan", order_by="QuestionOption.order_index",
    )
    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="question")

    __table_args__ = (UniqueConstraint("slug", name="uq_question_slug"),)


class QuestionOption(Base):
    __tablename__ = "question_options"

    id:          Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    label:       Mapped[str] = mapped_column(String(255), nullable=False)
    value:       Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    question: Mapped["Question"] = relationship("Question", back_populates="options")


class Session(Base):
    __tablename__ = "sessions"

    id:           Mapped[int]            = mapped_column(Integer, primary_key=True, index=True)
    session_uuid: Mapped[str]            = mapped_column(String(36), unique=True, index=True, nullable=False)
    started_at:   Mapped[datetime]       = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None]= mapped_column(DateTime, nullable=True)
    status:       Mapped[SessionStatus]  = mapped_column(SAEnum(SessionStatus), default=SessionStatus.active)
    ip_address:   Mapped[str | None]     = mapped_column(String(45), nullable=True)
    user_agent:   Mapped[str | None]     = mapped_column(String(500), nullable=True)
    sheets_synced: Mapped[bool]          = mapped_column(Boolean, default=False)

    answers: Mapped[list["Answer"]] = relationship(
        "Answer", back_populates="session", cascade="all, delete-orphan"
    )


class Answer(Base):
    __tablename__ = "answers"

    id:           Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    session_id:   Mapped[int]      = mapped_column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    question_id:  Mapped[int | None] = mapped_column(Integer, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)
    answer_value: Mapped[str]      = mapped_column(Text, nullable=False)
    created_at:   Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    session:  Mapped["Session"]       = relationship("Session", back_populates="answers")
    question: Mapped["Question | None"] = relationship("Question", back_populates="answers")
