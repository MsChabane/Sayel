from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession
from database import get_db
from models import Answer, Question, Session, SessionStatus
from schemas import AnswerBulkUpsert, AnswerCreate, CompleteSessionRequest, SessionCreate, SessionResponse
from services.google_sheets import append_submission

router = APIRouter()


def _get_session_or_404(session_uuid: str, db: DBSession) -> Session:
    s = db.scalar(select(Session).where(Session.session_uuid == session_uuid))
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s


def _upsert_answer(session_id: int, question_id: int, value: str, db: DBSession) -> None:
    existing = db.scalar(select(Answer).where(Answer.session_id == session_id, Answer.question_id == question_id))
    if existing:
        existing.answer_value = value
    else:
        db.add(Answer(session_id=session_id, question_id=question_id, answer_value=value))


@router.post("/sessions", response_model=SessionResponse)
def create_session(payload: SessionCreate, request: Request, db: DBSession = Depends(get_db)):
    existing = db.scalar(select(Session).where(Session.session_uuid == payload.session_uuid))
    if existing:
        return existing
    session = Session(
        session_uuid=payload.session_uuid,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:500],
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/answers")
def save_answer(payload: AnswerCreate, db: DBSession = Depends(get_db)):
    session = _get_session_or_404(payload.session_uuid, db)
    if session.status == SessionStatus.completed:
        raise HTTPException(status_code=400, detail="Session already completed")
    _upsert_answer(session.id, payload.question_id, payload.answer_value, db)
    db.commit()
    return {"message": "Answer saved"}


@router.put("/answers")
def update_answers_bulk(payload: AnswerBulkUpsert, db: DBSession = Depends(get_db)):
    session = _get_session_or_404(payload.session_uuid, db)
    if session.status == SessionStatus.completed:
        raise HTTPException(status_code=400, detail="Session already completed")
    for item in payload.answers:
        val = str(item["answer_value"]).strip()
        if val:
            _upsert_answer(session.id, int(item["question_id"]), val, db)
    db.commit()
    return {"message": f"Updated {len(payload.answers)} answer(s)"}


@router.get("/sessions/{session_uuid}/answers")
def get_session_answers(session_uuid: str, db: DBSession = Depends(get_db)):
    session = _get_session_or_404(session_uuid, db)
    answers = db.scalars(select(Answer).where(Answer.session_id == session.id)).all()
    result: list[dict[str, Any]] = []
    for a in answers:
        q = a.question
        result.append({
            "question_id":    a.question_id,
            "question_title": q.title if q else "Deleted Question",
            "question_slug":  q.slug  if q else "",
            "question_type":  str(q.type) if q else "text",
            "answer_value":   a.answer_value,
        })
    return {"session_uuid": session_uuid, "status": session.status, "answers": result}


@router.post("/complete")
def complete_session(payload: CompleteSessionRequest, db: DBSession = Depends(get_db)):
    session = _get_session_or_404(payload.session_uuid, db)
    if session.status == SessionStatus.completed:
        return {"message": "Already completed", "sheets_synced": session.sheets_synced}
    session.status       = SessionStatus.completed
    session.completed_at = datetime.utcnow()
    db.commit()
    questions = db.scalars(
        select(Question).where(Question.is_active == True).order_by(Question.order_index)
    ).all()
    answers_map = {
        a.question_id: a.answer_value
        for a in db.scalars(select(Answer).where(Answer.session_id == session.id)).all()
    }
    synced = append_submission(
        session.session_uuid,
        [{"id": q.id, "slug": q.slug, "title": q.title} for q in questions],
        answers_map,
    )
    session.sheets_synced = synced
    db.commit()
    return {"message": "Session completed", "sheets_synced": synced}
