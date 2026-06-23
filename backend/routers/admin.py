from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session as DBSession
from database import get_db
from models import Admin, Answer, Session as SessionModel
from schemas import AdminCreate, AdminResponse, DashboardStats, LoginRequest, SubmissionListItem
from auth import (
    create_access_token, create_refresh_token,
    decode_token, get_current_admin, hash_password,
    require_super_admin, verify_password,
)
from services.analytics import get_dashboard_stats

router = APIRouter(prefix="/admin")


@router.post("/login")
def login(payload: LoginRequest, db: DBSession = Depends(get_db)):
    admin = db.scalar(select(Admin).where(Admin.email == payload.email))
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="الحساب معطّل")
    access_token  = create_access_token(admin.id)
    refresh_token = create_refresh_token(admin.id)
    return {
        "access_token": access_token, "refresh_token": refresh_token,
        "token_type": "bearer",
        "admin": {"id": admin.id, "name": admin.name, "email": admin.email, "is_super_admin": admin.is_super_admin},
    }


@router.post("/logout")
def logout():
    return {"message": "تم تسجيل الخروج"}


@router.get("/auth/verify")
def verify_token(request: Request, db: DBSession = Depends(get_db)):
    token = request.headers.get("authorization", "").replace("Bearer ", "").strip()
    if not token:
        token = request.cookies.get("admin_token", "")
    if not token:
        raise HTTPException(status_code=401, detail="غير مصادق")
    try:
        payload = decode_token(token)
    except HTTPException:
        raise HTTPException(status_code=401, detail="رمز غير صالح أو منتهي الصلاحية")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="نوع الرمز غير صحيح")
    admin = db.get(Admin, int(payload["sub"]))
    if not admin or not admin.is_active:
        raise HTTPException(status_code=401, detail="المستخدم غير موجود")
    return {"valid": True, "admin": {"id": admin.id, "name": admin.name, "email": admin.email, "is_super_admin": admin.is_super_admin}}


@router.post("/auth/refresh-by-token")
def refresh_by_token(request: Request, db: DBSession = Depends(get_db)):
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Refresh token missing")
    token = auth[7:]
    try:
        payload = decode_token(token)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Wrong token type")
    admin = db.get(Admin, int(payload["sub"]))
    if not admin or not admin.is_active:
        raise HTTPException(status_code=401, detail="Admin not found")
    return {
        "access_token":  create_access_token(admin.id),
        "refresh_token": create_refresh_token(admin.id),
        "token_type":    "bearer",
        "admin": {"id": admin.id, "name": admin.name, "email": admin.email, "is_super_admin": admin.is_super_admin},
    }


@router.get("/me", response_model=AdminResponse)
def get_me(admin: Admin = Depends(get_current_admin)):
    return admin


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: DBSession = Depends(get_db), _: Admin = Depends(get_current_admin)):
    return get_dashboard_stats(db)


@router.get("/submissions", response_model=list[SubmissionListItem])
def list_submissions(skip: int = 0, limit: int = 50, db: DBSession = Depends(get_db), _: Admin = Depends(get_current_admin)):
    sessions = db.scalars(select(SessionModel).order_by(SessionModel.started_at.desc()).offset(skip).limit(limit)).all()
    result = []
    for s in sessions:
        count = db.scalar(select(func.count(Answer.id)).where(Answer.session_id == s.id))
        result.append(SubmissionListItem(
            session_id=s.id, session_uuid=s.session_uuid,
            started_at=s.started_at, completed_at=s.completed_at,
            status=s.status, answer_count=count or 0, sheets_synced=s.sheets_synced,
        ))
    return result


@router.get("/submissions/{session_uuid}")
def get_submission(session_uuid: str, db: DBSession = Depends(get_db), _: Admin = Depends(get_current_admin)):
    session = db.scalar(select(SessionModel).where(SessionModel.session_uuid == session_uuid))
    if not session:
        raise HTTPException(status_code=404, detail="Submission not found")
    answers = db.scalars(select(Answer).where(Answer.session_id == session.id)).all()
    return {
        "session": {"id": session.id, "session_uuid": session.session_uuid, "status": session.status,
                    "started_at": session.started_at.isoformat(),
                    "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                    "sheets_synced": session.sheets_synced},
        "answers": [{"question_id": a.question_id,
                     "question_title": a.question.title if a.question else "Deleted",
                     "question_type":  str(a.question.type) if a.question else "text",
                     "answer": a.answer_value, "answered_at": a.created_at.isoformat()} for a in answers],
    }


@router.get("/users", response_model=list[AdminResponse])
def list_users(db: DBSession = Depends(get_db), _: Admin = Depends(require_super_admin)):
    return db.scalars(select(Admin)).all()


@router.post("/users", response_model=AdminResponse)
def create_user(payload: AdminCreate, db: DBSession = Depends(get_db), _: Admin = Depends(require_super_admin)):
    if db.scalar(select(Admin).where(Admin.email == payload.email)):
        raise HTTPException(status_code=400, detail="Email already registered")
    admin = Admin(name=payload.name, email=payload.email,
                  password_hash=hash_password(payload.password), is_super_admin=payload.is_super_admin)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: DBSession = Depends(get_db), current: Admin = Depends(require_super_admin)):
    if user_id == current.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    admin = db.get(Admin, user_id)
    if not admin:
        raise HTTPException(status_code=404, detail="User not found")
    admin.is_active = False
    db.commit()
    return {"message": "User deactivated"}
