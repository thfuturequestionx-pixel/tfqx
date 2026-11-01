import hmac
import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from ..auth import create_token, require_host
from ..config import Settings, get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

_WINDOW_SECONDS = 15 * 60
_MAX_FAILURES = 5
_failures: dict[str, deque[float]] = defaultdict(deque)

class LoginRequest(BaseModel):
    username: str = Field(max_length=100)
    password: str = Field(max_length=200)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"

def _enforce_rate_limit(ip: str) -> None:
    now = time.monotonic()
    attempts = _failures[ip]
    while attempts and now - attempts[0] > _WINDOW_SECONDS:
        attempts.popleft()
    if len(attempts) >= _MAX_FAILURES:
        retry_after = int(_WINDOW_SECONDS - (now - attempts[0])) + 1
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many failed attempts. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request, settings: Settings = Depends(get_settings)):
    ip = _client_ip(request)
    _enforce_rate_limit(ip)

    # `&` (not `and`) so both comparisons always run: constant-time behaviour
    user_ok = hmac.compare_digest(body.username.encode(), settings.host_username.encode())
    pass_ok = hmac.compare_digest(body.password.encode(), settings.host_password.encode())
    if not (user_ok & pass_ok):
        _failures[ip].append(time.monotonic())
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect username or password")

    _failures.pop(ip, None)
    return TokenResponse(
        access_token=create_token(settings, settings.host_username),
        expires_in=settings.jwt_expire_minutes * 60,
    )

@router.get("/me")
async def me(username: str = Depends(require_host)):
    """Lets the frontend check that a stored token is still valid."""
    return {"username": username}