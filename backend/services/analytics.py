from datetime import datetime, timedelta
from sqlalchemy import func, select
from sqlalchemy.orm import Session as DBSession
from models import Answer, Question, Session, SessionStatus


def get_dashboard_stats(db: DBSession) -> dict:
    total_questions = db.scalar(select(func.count(Question.id)).where(Question.is_active == True)) or 0
    total_sessions  = db.scalar(select(func.count(Session.id))) or 0
    completed       = db.scalar(select(func.count(Session.id)).where(Session.status == SessionStatus.completed)) or 0
    abandoned       = db.scalar(select(func.count(Session.id)).where(Session.status == SessionStatus.abandoned)) or 0
    completion_rate = round((completed / total_sessions * 100) if total_sessions else 0, 1)

    daily = []
    for i in range(13, -1, -1):
        day   = datetime.utcnow().date() - timedelta(days=i)
        count = db.scalar(select(func.count(Session.id)).where(
            func.date(Session.started_at) == day, Session.status == SessionStatus.completed
        )) or 0
        daily.append({"date": str(day), "count": count})

    weekly = []
    for i in range(7, -1, -1):
        week_start = datetime.utcnow().date() - timedelta(weeks=i)
        week_end   = week_start + timedelta(days=6)
        count = db.scalar(select(func.count(Session.id)).where(
            func.date(Session.started_at) >= week_start,
            func.date(Session.started_at) <= week_end,
            Session.status == SessionStatus.completed,
        )) or 0
        weekly.append({"week": str(week_start), "count": count})

    questions = db.scalars(select(Question).where(Question.is_active == True).order_by(Question.order_index)).all()
    base = completed or 1
    question_completion = []
    for q in questions:
        answer_count = db.scalar(select(func.count(Answer.id)).where(Answer.question_id == q.id)) or 0
        question_completion.append({"question": q.title[:40], "rate": min(round(answer_count / base * 100, 1), 100)})

    return {
        "total_questions": total_questions, "total_sessions": total_sessions,
        "completed_sessions": completed, "abandoned_sessions": abandoned,
        "completion_rate": completion_rate, "daily_submissions": daily,
        "weekly_submissions": weekly, "question_completion": question_completion,
    }
