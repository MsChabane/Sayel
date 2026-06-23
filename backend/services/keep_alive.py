import asyncio
import logging
import os
import httpx
from database import settings

logger    = logging.getLogger(__name__)
_ENABLED  = settings.KEEP_ALIVE_ENABLED
_URL      = settings.KEEP_ALIVE_URL
_INTERVAL = settings.KEEP_ALIVE_INTERVAL
_task: asyncio.Task | None = None


async def _ping_loop() -> None:
    logger.info("Keep-alive started — pinging %s every %ds", _URL, _INTERVAL)
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            await asyncio.sleep(_INTERVAL)
            try:
                response = await client.get(_URL)
                logger.debug("Keep-alive ping %d", response.status_code)
            except httpx.RequestError as exc:
                logger.warning("Keep-alive ping failed: %s", exc)
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.error("Keep-alive error: %s", exc)


def start() -> None:
    global _task
    if not _ENABLED:
        logger.info("Keep-alive disabled")
        return
    if _task and not _task.done():
        return
    _task = asyncio.create_task(_ping_loop(), name="keep_alive_ping")


def stop() -> None:
    global _task
    if _task and not _task.done():
        _task.cancel()
        logger.info("Keep-alive stopped")
    _task = None
