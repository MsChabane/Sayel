import logging
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger("sayel.access")


class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()

        # ─── Request Info ───────────────────────────────────────────
        method      = request.method
        path        = request.url.path
        query       = f"?{request.url.query}" if request.url.query else ""
        client_ip   = self._get_client_ip(request)
        user_agent  = request.headers.get("user-agent", "-")

        # ─── Process Request ─────────────────────────────────────────
        try:
            response = await call_next(request)
        except Exception as exc:
            duration = (time.perf_counter() - start_time) * 1000
            logger.error(
                "%-6s %s%s | 500 | %.1fms | %s | %s | UNHANDLED: %s",
                method, path, query, duration, client_ip, user_agent, exc,
            )
            raise

        # ─── Response Info ───────────────────────────────────────────
        duration    = (time.perf_counter() - start_time) * 1000
        status_code = response.status_code
        log_level   = self._status_to_log_level(status_code)

        logger.log(
            log_level,
            "%-6s %-40s | %s | %6.1fms | %s",
            method,
            f"{path}{query}",
            self._colored_status(status_code),
            duration,
            client_ip,
        )

        # add timing header for free
        response.headers["X-Response-Time"] = f"{duration:.1f}ms"
        return response

    # ─── Helpers ─────────────────────────────────────────────────────

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        """Respect reverse-proxy headers."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client:
            return request.client.host
        return "-"

    @staticmethod
    def _status_to_log_level(status: int) -> int:
        if status >= 500:
            return logging.ERROR
        if status >= 400:
            return logging.WARNING
        return logging.INFO

    @staticmethod
    def _colored_status(status: int) -> str:
        """ANSI colors for terminal readability."""
        colors = {
            2: "\033[92m",   # green   2xx
            3: "\033[96m",   # cyan    3xx
            4: "\033[93m",   # yellow  4xx
            5: "\033[91m",   # red     5xx
        }
        reset = "\033[0m"
        color = colors.get(status // 100, "")
        return f"{color}{status}{reset}"