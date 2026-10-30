import re
from datetime import datetime, timezone

from flask import Blueprint, current_app, g, jsonify, make_response, request
from pwdlib import PasswordHash
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError

from app.db import Session
from app.errors import ApiError
from app.limiter import limiter
from app.models import User, UserSession
from app.security import COOKIE_NAME, create_session, hash_password, login_required, verify_password

bp = Blueprint("auth", __name__, url_prefix="/api/auth")
dummy_hash = PasswordHash.recommended().hash("not-a-real-user-password")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _set_cookie(response, token, expires_at):
    response.set_cookie(
        COOKIE_NAME, token, httponly=True, secure=current_app.config["SESSION_COOKIE_SECURE"],
        samesite="Strict", path="/", expires=expires_at,
    )


def _body() -> dict:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError(422, "A JSON object is required.")
    return data


def _email(value) -> str:
    email = str(value or "").strip().lower()
    if not EMAIL_RE.match(email) or len(email) > 254:
        raise ApiError(422, "Enter a valid email address.")
    return email


@bp.post("/register")
@limiter.limit("5/minute")
def register():
    data = _body()
    name = str(data.get("fullName") or data.get("full_name") or "").strip()
    password = str(data.get("password") or "")
    if not 2 <= len(name) <= 120:
        raise ApiError(422, "Enter a name between 2 and 120 characters.")
    if not 12 <= len(password) or len(password.encode()) > 128:
        raise ApiError(422, "Password must be 12 to 128 characters.")
    email = _email(data.get("email"))
    if Session.scalar(select(User.id).where(func.lower(User.email) == email)):
        raise ApiError(409, "An account with that email already exists.")
    user = User(full_name=name, email=email, password_hash=hash_password(password), role="Volunteer")
    Session.add(user)
    try:
        Session.flush()
        token, expires_at = create_session(user)
    except IntegrityError:
        Session.rollback()
        raise ApiError(409, "An account with that email already exists.")
    response = make_response(jsonify({"user": user.to_dict()}), 201)
    _set_cookie(response, token, expires_at)
    return response


@bp.post("/login")
@limiter.limit("5/minute")
def login():
    data = _body()
    email = _email(data.get("email"))
    password = str(data.get("password") or "")
    if not password or len(password.encode()) > 128:
        raise ApiError(401, "Email or password is incorrect.")
    user = Session.scalar(select(User).where(func.lower(User.email) == email, User.is_active.is_(True)))
    valid = verify_password(password, user.password_hash if user else dummy_hash)
    if not user or not valid:
        raise ApiError(401, "Email or password is incorrect.")
    user.last_login_at = datetime.now(timezone.utc)
    Session.execute(delete(UserSession).where(UserSession.expires_at <= datetime.now(timezone.utc)))
    token, expires_at = create_session(user)
    response = make_response(jsonify({"user": user.to_dict()}))
    _set_cookie(response, token, expires_at)
    return response


@bp.get("/me")
@login_required
def me():
    return jsonify({"user": g.user.to_dict()})


@bp.post("/logout")
def logout():
    from app.security import get_session_user

    found = get_session_user(request.cookies.get(COOKIE_NAME))
    if found:
        row = Session.get(UserSession, found[1])
        if row:
            Session.delete(row)
            Session.commit()
    response = make_response("", 204)
    response.delete_cookie(COOKIE_NAME, httponly=True, secure=current_app.config["SESSION_COOKIE_SECURE"], samesite="Strict", path="/")
    return response
