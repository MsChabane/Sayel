from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession
from database import get_db
from models import Admin, Question, QuestionOption
from schemas import QuestionCreate, QuestionResponse, QuestionUpdate, QuestionsReorderRequest
from auth import get_current_admin

router = APIRouter()


@router.get("/questions", response_model=list[QuestionResponse])
def list_active_questions(db: DBSession = Depends(get_db)):
    return db.scalars(
        select(Question).where(Question.is_active == True).order_by(Question.order_index)
    ).all()


@router.get("/admin/questions", response_model=list[QuestionResponse])
def admin_list_questions(db: DBSession = Depends(get_db), _: Admin = Depends(get_current_admin)):
    return db.scalars(select(Question).order_by(Question.order_index)).all()


@router.get("/admin/questions/{question_id}", response_model=QuestionResponse)
def admin_get_question(question_id: int, db: DBSession = Depends(get_db), _: Admin = Depends(get_current_admin)):
    q = db.get(Question, question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


@router.post("/admin/questions", response_model=QuestionResponse, status_code=201)
def create_question(payload: QuestionCreate, db: DBSession = Depends(get_db), _: Admin = Depends(get_current_admin)):
    if db.scalar(select(Question).where(Question.slug == payload.slug)):
        raise HTTPException(status_code=409, detail=f"Slug '{payload.slug}' already exists")
    question = Question(
        title=payload.title, slug=payload.slug, description=payload.description,
        type=payload.type, required=payload.required,
        placeholder=payload.placeholder, order_index=payload.order_index,
    )
    db.add(question)
    db.flush()
    for opt in payload.options:
        db.add(QuestionOption(question_id=question.id, label=opt.label, value=opt.value, order_index=opt.order_index))
    db.commit()
    db.refresh(question)
    return question


@router.put("/admin/questions/{question_id}", response_model=QuestionResponse)
def update_question(question_id: int, payload: QuestionUpdate, db: DBSession = Depends(get_db), _: Admin = Depends(get_current_admin)):
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if payload.slug and payload.slug != question.slug:
        if db.scalar(select(Question).where(Question.slug == payload.slug, Question.id != question_id)):
            raise HTTPException(status_code=409, detail=f"Slug '{payload.slug}' already exists")
    for field, value in payload.model_dump(exclude_none=True, exclude={"options"}).items():
        setattr(question, field, value)
    if payload.options is not None:
        for opt in list(question.options):
            db.delete(opt)
        db.flush()
        for opt in payload.options:
            db.add(QuestionOption(question_id=question.id, label=opt.label, value=opt.value, order_index=opt.order_index))
    db.commit()
    db.refresh(question)
    return question


@router.delete("/admin/questions/{question_id}")
def delete_question(question_id: int, db: DBSession = Depends(get_db), _: Admin = Depends(get_current_admin)):
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question.is_active = False
    db.commit()
    return {"message": "Question deactivated"}


@router.post("/admin/questions/reorder")
def reorder_questions(payload: QuestionsReorderRequest, db: DBSession = Depends(get_db), _: Admin = Depends(get_current_admin)):
    for index, qid in enumerate(payload.question_ids):
        q = db.get(Question, qid)
        if q:
            q.order_index = index
    db.commit()
    return {"message": "Reordered successfully"}
