import time
from collections import defaultdict, deque

from fastapi import Request


class VisitorLimiter:
    """Allows each visitor (IP + browser) at most `max_events` per `window_seconds`.

    A brake on accidental double-sends and casual spam, not a defence against a determined
    attacker. Behind a proxy the first X-Forwarded-For address is used as the IP.
    """

    def __init__(self, window_seconds: int, max_events: int):
        self.window = window_seconds
        self.max_events = max_events
        self._events: dict[tuple[str, str], deque[float]] = defaultdict(deque)

    @staticmethod
    def key(request: Request) -> tuple[str, str]:
        forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        ip = forwarded or (request.client.host if request.client else "unknown")
        return (ip, request.headers.get("user-agent", "")[:200])

    def _recent(self, key: tuple[str, str]) -> deque[float]:
        now = time.monotonic()
        events = self._events[key]
        while events and now - events[0] > self.window:
            events.popleft()
        return events

    def exceeded(self, key: tuple[str, str]) -> bool:
        return len(self._recent(key)) >= self.max_events

    def record(self, key: tuple[str, str]) -> None:
        if len(self._events) > 5000:  # keep memory bounded
            for k in [k for k in self._events if not self._recent(k)]:
                del self._events[k]
        self._events[key].append(time.monotonic())