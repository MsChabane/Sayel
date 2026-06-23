import logging
import warnings
warnings.filterwarnings("ignore", message=".*error reading bcrypt version.*", category=UserWarning)

import os
from contextlib import asynccontextmanager
from alembic.config import Config
from alembic import command
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, settings, get_db
from models import Admin, Question, QuestionOption  # noqa: F401
from auth import hash_password
from routers import questions, sessions, admin
from services import keep_alive
from sqlalchemy.orm import Session

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


SAMPLE_QUESTIONS = [
    {"title": "ما اسمك الكريم؟",                        "slug": "client_name",            "type": "text",          "placeholder": "أدخل اسمك هنا"},
    {"title": "ما هو بريدك الإلكتروني؟",                "slug": "client_email",           "type": "email",         "placeholder": "example@email.com"},
    {"title": "ما هو رقم هاتفك؟",                       "slug": "client_phone",           "type": "phone",         "placeholder": "+966 5XX XXX XXXX"},
    {"title": "ما نوع المشروع الذي تريده؟",             "slug": "project_type",           "type": "single_choice", "options": ["موقع إلكتروني", "تطبيق جوال", "متجر إلكتروني", "نظام إدارة", "أخرى"]},
    {"title": "ما هو نشاطك التجاري؟",                   "slug": "business_sector",        "type": "text",          "placeholder": "مثال: مطعم، متجر ملابس..."},
    {"title": "ما الخدمات التي تحتاجها؟",               "slug": "required_services",      "type": "multi_choice",  "options": ["تصميم UI/UX", "تطوير Frontend", "تطوير Backend", "قاعدة بيانات", "استضافة وتشغيل", "SEO وتسويق"]},
    {"title": "ما هي ميزانيتك المتوقعة؟",               "slug": "budget_range",           "type": "single_choice", "options": ["أقل من 5,000 ريال", "5,000 - 15,000 ريال", "15,000 - 50,000 ريال", "أكثر من 50,000 ريال"]},
    {"title": "متى تريد إطلاق المشروع؟",                "slug": "launch_timeline",        "type": "single_choice", "options": ["خلال شهر", "خلال 3 أشهر", "خلال 6 أشهر", "لا يوجد وقت محدد"]},
    {"title": "هل لديك تصميم أو هوية بصرية؟",          "slug": "has_design",             "type": "single_choice", "options": ["نعم، لدي تصميم جاهز", "لدي أفكار فقط", "أحتاج تصميم من الصفر"]},
    {"title": "هل سبق وعملت مع مطور من قبل؟",          "slug": "has_previous_developer", "type": "single_choice", "options": ["نعم", "لا"]},
    {"title": "ما المشاكل التي تريد حلها؟",             "slug": "problem_to_solve",       "type": "textarea",      "placeholder": "اشرح المشكلة أو الفرصة التي يعالجها مشروعك..."},
    {"title": "من هو جمهورك المستهدف؟",                 "slug": "target_audience",        "type": "textarea",      "placeholder": "صف عملاءك المثاليين..."},
    {"title": "هل لديك أمثلة على مواقع تعجبك؟",        "slug": "inspirational_examples", "type": "textarea",      "placeholder": "ضع روابط أو أسماء للمشاريع المشابهة..."},
    {"title": "ما اللغات التي يجب أن يدعمها المشروع؟", "slug": "supported_languages",    "type": "multi_choice",  "options": ["العربية", "الإنجليزية", "كلاهما", "لغات أخرى"]},
    {"title": "أي معلومات إضافية تريد مشاركتها؟",      "slug": "additional_notes",       "type": "textarea",      "placeholder": "أي تفاصيل أخرى مهمة..."},
]


def run_migrations() -> None:
    logger.info("Running database migrations...")
    cfg = Config()
    cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "migrations"))
    cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    
    try:
        from sqlalchemy import inspect, text
        with engine.connect() as conn:
            inspector = inspect(conn)
            existing_tables = inspector.get_table_names()
            
            # Check if alembic_version table exists
            has_alembic_version = "alembic_version" in existing_tables
            # Check if our app tables already exist (created outside alembic)
            has_app_tables = "admins" in existing_tables
            
            if has_app_tables and not has_alembic_version:
                # Tables exist but Alembic doesn't know about them
                # Stamp DB as being at head so Alembic won't try to recreate tables
                logger.warning(
                    "Tables exist but no alembic_version found. "
                    "Stamping database as 'head' to sync Alembic state..."
                )
                command.stamp(cfg, "head")
                logger.info("Database stamped at head")
        
        # Now safe to run upgrade (will be a no-op if already at head)
        command.upgrade(cfg, "head")
        logger.info("Migrations complete")
        
    except Exception as exc:
        logger.error("Migration failed: %s", exc)
        raise


def seed_database() -> None:
    db: Session = next(get_db())
    try:
        from sqlalchemy import select
        if not db.scalar(select(Admin).where(Admin.email == settings.SUPER_ADMIN_EMAIL)):
            db.add(Admin(name="Super Admin", email=settings.SUPER_ADMIN_EMAIL,
                         password_hash=hash_password(settings.SUPER_ADMIN_PASSWORD), is_super_admin=True))
            logger.info("Created super admin: %s", settings.SUPER_ADMIN_EMAIL)
        if not db.scalar(select(Question)):
            for idx, q in enumerate(SAMPLE_QUESTIONS):
                question = Question(title=q["title"], slug=q["slug"], type=q["type"],
                                    placeholder=q.get("placeholder"), order_index=idx, required=True)
                db.add(question)
                db.flush()
                for oi, label in enumerate(q.get("options", [])):
                    db.add(QuestionOption(question_id=question.id, label=label, value=label, order_index=oi))
            logger.info("Seeded %d questions", len(SAMPLE_QUESTIONS))
        db.commit()
    except Exception as exc:
        logger.error("Seed failed: %s", exc)
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("🚀 Sayel backend starting...")
    run_migrations()
    seed_database()
    keep_alive.start()
    logger.info("✅ Ready")
    yield
    keep_alive.stop()
    logger.info("👋 Shutdown complete")


app = FastAPI(title="Sayel API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router, prefix="/api", tags=["Questions"])
app.include_router(sessions.router,  prefix="/api", tags=["Sessions"])
app.include_router(admin.router,     prefix="/api", tags=["Admin"])


@app.get("/health", tags=["System"])
def health():
    return {
        "status":  "ok",
        "app":     "Sayel",
        "version": "1.0.0",
        "keep_alive": {"enabled": keep_alive._ENABLED, "url": keep_alive._URL},
    }
