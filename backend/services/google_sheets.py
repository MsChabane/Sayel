import json
import logging
from datetime import datetime
from typing import Any
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from database import settings

logger = logging.getLogger(__name__)
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


def _get_service():
    try:
        sa_info     = json.loads(settings.GOOGLE_SERVICE_ACCOUNT_JSON)
        credentials = service_account.Credentials.from_service_account_info(sa_info, scopes=SCOPES)
        return build("sheets", "v4", credentials=credentials, cache_discovery=False)
    except Exception as exc:
        logger.error("Failed to build Sheets service: %s", exc)
        return None


def _current_headers(service) -> list[str]:
    try:
        result = service.spreadsheets().values().get(
            spreadsheetId=settings.GOOGLE_SHEET_ID, range="Sheet1!1:1"
        ).execute()
        rows = result.get("values", [])
        return rows[0] if rows else []
    except HttpError:
        return []


def ensure_header_row(questions: list[dict[str, Any]]) -> list[str]:
    service = _get_service()
    if not service or not settings.GOOGLE_SHEET_ID:
        return []
    try:
        existing = _current_headers(service)
        fixed    = ["Timestamp", "session_id"]
        if not existing:
            new_headers = fixed + [q["slug"] for q in questions]
            service.spreadsheets().values().update(
                spreadsheetId=settings.GOOGLE_SHEET_ID, range="Sheet1!A1",
                valueInputOption="RAW", body={"values": [new_headers]},
            ).execute()
            return new_headers
        existing_set  = set(existing)
        missing_slugs = [q["slug"] for q in questions if q["slug"] not in existing_set]
        if missing_slugs:
            def col_letter(n: int) -> str:
                result = ""
                n += 1
                while n:
                    n, r = divmod(n - 1, 26)
                    result = chr(65 + r) + result
                return result
            service.spreadsheets().values().update(
                spreadsheetId=settings.GOOGLE_SHEET_ID,
                range=f"Sheet1!{col_letter(len(existing))}1",
                valueInputOption="RAW", body={"values": [missing_slugs]},
            ).execute()
            existing = existing + missing_slugs
        return existing
    except HttpError as exc:
        logger.error("ensure_header_row failed: %s", exc)
        return []


def append_submission(session_uuid: str, questions: list[dict[str, Any]], answers: dict[int, str]) -> bool:
    service = _get_service()
    if not service or not settings.GOOGLE_SHEET_ID:
        logger.warning("Google Sheets not configured — skipping export")
        return False
    try:
        headers       = ensure_header_row(questions)
        slug_to_answer = {q["slug"]: answers.get(q["id"], "") for q in questions}
        row = []
        for header in headers:
            if header == "Timestamp":
                row.append(datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
            elif header == "session_id":
                row.append(session_uuid)
            else:
                row.append(slug_to_answer.get(header, ""))
        service.spreadsheets().values().append(
            spreadsheetId=settings.GOOGLE_SHEET_ID, range="Sheet1!A1",
            valueInputOption="RAW", insertDataOption="INSERT_ROWS",
            body={"values": [row]},
        ).execute()
        logger.info("Appended session %s to Google Sheets", session_uuid)
        return True
    except HttpError as exc:
        logger.error("append_submission failed: %s", exc)
        return False
