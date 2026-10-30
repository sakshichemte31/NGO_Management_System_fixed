from uuid import UUID

from flask import Blueprint, g, jsonify, request
from sqlalchemy import func, select

from app.db import Session
from app.errors import ApiError
from app.models import User
from app.security import roles_required

bp = Blueprint("admin", __name__, url_prefix="/api/admin")
ROLES = {"Admin", "Project Manager", "Staff", "Volunteer", "Board"}


@bp.get("/users")
@roles_required("Admin")
def list_users():
    users = Session.scalars(select(User).order_by(User.created_at.desc())).all()
    return jsonify([u.to_dict() for u in users])


@bp.patch("/users/<user_id>/role")
@roles_required("Admin")
def update_user_role(user_id):
    try:
        uid = UUID(user_id)
    except ValueError:
        raise ApiError(422, "Invalid user id.")
    role = (request.get_json(silent=True) or {}).get("role")
    if role not in ROLES:
        raise ApiError(422, "Role must be one of: " + ", ".join(sorted(ROLES)) + ".")
    user = Session.get(User, uid)
    if user is None:
        raise ApiError(404, "User not found.")
    if user.id == g.user.id:
        raise ApiError(409, "You cannot change your own role. Ask another administrator to do this.")
    if user.role == "Admin" and role != "Admin" and user.is_active:
        active = Session.scalar(select(func.count()).select_from(User).where(User.role == "Admin", User.is_active.is_(True)))
        if active <= 1:
            raise ApiError(409, "The last active administrator cannot be demoted.")
    user.role = role
    Session.commit()
    return jsonify(user.to_dict())
