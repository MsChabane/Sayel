"""Smoke test — verifies the server starts and /health responds."""
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sayel.db")
os.environ.setdefault("SECRET_KEY",   "test-secret-key-minimum-32-characters-long")
os.environ.setdefault("KEEP_ALIVE_ENABLED", "false")



from main import app
from main import run_migrations

run_migrations()

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_questions_public():

    r = client.get("/api/questions")

    assert r.status_code == 200
    assert isinstance(r.json(), list)
