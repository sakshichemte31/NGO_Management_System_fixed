from datetime import datetime, timedelta, timezone
from functools import wraps
from uuid import UUID, uuid4

import jwt
from flask import current_app, g, request
from pwdlib import PasswordHash
from sqlalchemy import select

from app.db import Session
from app.errors import ApiError
from app.models import User, UserSession

password_hasher = PasswordHash.recommended()
JWT_ALGORITHM = "HS256"
COOKIE_NAME = "ngo_session"
READ_ROLES = {"Admin", "Project Manager", "Staff"}


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password, password_hash)
    except (ValueError, TypeError):
        return False


def create_session(user: User) -> tuple[str, datetime]:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=current_app.config["JWT_EXPIRE_MINUTES"])
    jti = uuid4()
    token = jwt.encode(
        {"sub": str(user.id), "jti": str(jti), "iat": now, "exp": expires_at},
        current_app.config["JWT_SECRET"], algorithm=JWT_ALGORITHM,
    )
    Session.add(UserSession(jti=jti, user_id=user.id, expires_at=expires_at))
    Session.commit()
    return token, expires_at


def get_session_user(token: str | None):
    if not token:
        return None
    try:
        claims = jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        user_id, session_id = UUID(claims["sub"]), UUID(claims["jti"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        return None
    session = Session.scalar(select(UserSession).where(
        UserSession.jti == session_id, UserSession.user_id == user_id,
        UserSession.expires_at > datetime.now(timezone.utc)))
    if session is None:
        return None
    user = Session.scalar(select(User).where(User.id == user_id, User.is_active.is_(True)))
    return (user, session_id) if user else None


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        found = get_session_user(request.cookies.get(COOKIE_NAME))
        if found is None:
            raise ApiError(401, "Sign in to continue.")
        g.user, g.session_id = found
        return fn(*args, **kwargs)

    return wrapper


def roles_required(*roles: str):
    allowed = set(roles)

    def decorator(fn):
        @wraps(fn)
        @login_required
        def wrapper(*args, **kwargs):
            if g.user.role not in allowed:
                raise ApiError(403, "You do not have permission to perform this action.")
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def require_role(user, allowed: set[str]) -> None:
    if user.role not in allowed:
        raise ApiError(403, "You do not have permission to perform this action.")
