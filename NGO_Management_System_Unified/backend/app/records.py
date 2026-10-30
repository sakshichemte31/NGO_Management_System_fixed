"""Generic, role-checked CRUD for the persisted NGO tables (shared by every module)."""
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any
from uuid import UUID

from flask import Blueprint, g, jsonify, request
from sqlalchemy import and_, delete, func, insert, or_, select, update
from sqlalchemy.exc import DataError, IntegrityError, StatementError
from sqlalchemy.sql.sqltypes import JSON, Date, DateTime, Numeric, String

from app.db import Session, camel_case, reflect_table, snake_case
from app.errors import ApiError
from app.security import READ_ROLES, login_required, require_role

RESOURCES = {
    "proposals": "proposals", "projects": "projects", "team-members": "project_team_members",
    "partners": "project_partners", "milestones": "project_milestones", "tasks": "project_tasks",
    "department-checklists": "project_department_checklists", "documents": "project_documents",
    "budget-items": "project_budget_items", "expenses": "project_expenses",
    "funding-sources": "project_funding_sources", "impact-indicators": "impact_indicators",
    "impact-measurements": "impact_measurements", "beneficiaries": "beneficiaries",
    "beneficiary-enrollments": "beneficiary_enrollments", "beneficiary-services": "beneficiary_services",
    "donors": "donors", "donor-occasions": "donor_occasions", "campaigns": "campaigns",
    "contributions": "contributions", "donor-interactions": "donor_interactions", "events": "events",
    "event-registrations": "event_registrations", "staff": "staff_profiles", "staff-attendance": "staff_attendance",
    "volunteers": "volunteer_profiles", "volunteer-assignments": "volunteer_assignments",
    "intern-applications": "intern_applications", "communications": "communications",
    "resources": "project_resources", "risks": "project_risks", "activity": "activity_logs",
}
PMS = {"Admin", "Project Manager", "Staff"}
AP = {"Admin", "Project Manager"}
WRITE_ROLES = {
    "proposals": PMS, "projects": AP, "team-members": AP, "partners": AP, "milestones": PMS, "tasks": PMS,
    "department-checklists": PMS, "documents": PMS, "budget-items": AP, "expenses": PMS, "funding-sources": AP,
    "impact-indicators": PMS, "impact-measurements": PMS, "beneficiaries": PMS, "beneficiary-enrollments": PMS,
    "beneficiary-services": PMS, "donors": {"Admin", "Staff"}, "donor-occasions": {"Admin", "Staff"},
    "campaigns": {"Admin", "Staff"}, "contributions": {"Admin", "Staff"}, "donor-interactions": {"Admin", "Staff"},
    "events": PMS, "event-registrations": PMS, "staff": {"Admin"}, "staff-attendance": {"Admin", "Staff"},
    "volunteers": PMS, "volunteer-assignments": PMS, "intern-applications": PMS, "communications": {"Admin", "Staff"},
    "resources": PMS, "risks": PMS, "activity": set(),
}


def _table(_db, resource: str):
    name = RESOURCES.get(resource)
    if name is None:
        raise ApiError(404, "Resource not found.")
    return reflect_table(name)


def convert_value(column, value: Any) -> Any:
    if value is None:
        return None
    try:
        python_type = column.type.python_type
        if python_type is UUID:
            return UUID(str(value))
        if isinstance(column.type, DateTime):
            return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if isinstance(column.type, Date):
            return date.fromisoformat(str(value))
        if isinstance(column.type, Numeric):
            return Decimal(str(value))
        if isinstance(column.type, JSON):
            return value
        if python_type is bool:
            if not isinstance(value, bool):
                raise ValueError
            return value
        if python_type is int:
            if isinstance(value, bool):
                raise ValueError
            return int(value)
        if python_type is float:
            return float(value)
        if python_type is str:
            if not isinstance(value, str):
                raise ValueError
            return value
        if python_type is list and not isinstance(value, list):
            raise ValueError
    except (ValueError, TypeError, InvalidOperation, OverflowError):
        raise ApiError(422, f"Invalid value for '{column.name}'.")
    except NotImplementedError:
        pass
    return value


def _values(table, payload, *, inserting: bool) -> dict[str, Any]:
    if not isinstance(payload, dict) or not payload:
        raise ApiError(422, "A non-empty JSON object is required.")
    pks = {c.name for c in table.primary_key.columns}
    values, unknown = {}, []
    for api_name, value in payload.items():
        col = snake_case(api_name)
        if col not in table.c:
            unknown.append(api_name)
        elif col in pks or col in {"created_at", "updated_at"}:
            raise ApiError(422, f"'{api_name}' cannot be changed.")
        else:
            values[col] = convert_value(table.c[col], value)
    if unknown:
        raise ApiError(422, f"Unknown field(s): {', '.join(unknown)}.")
    if inserting:
        for c in table.columns:
            if c.name in pks or c.name in values:
                continue
            if c.nullable or c.default is not None or c.server_default is not None or c.autoincrement:
                continue
            raise ApiError(422, f"'{camel_case(c.name)}' is required.")
    return values


def _serialize(row) -> dict:
    return {camel_case(k): v for k, v in dict(row).items()}


def _audit(user, action, resource, entity_id, changes):
    audit = reflect_table("audit_logs")
    Session.execute(insert(audit).values(actor_id=str(user.id), action=action, entity_type=resource,
                                         entity_id=entity_id, changes=changes))


def _pk(table):
    if len(table.primary_key.columns) != 1:
        raise ApiError(501, "This resource does not support record lookup.")
    return next(iter(table.primary_key.columns))


def list_records(resource: str):
    require_role(g.user, READ_ROLES)
    table = _table(None, resource)
    try:
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))
    except ValueError:
        raise ApiError(422, "limit and offset must be integers.")
    if not 1 <= limit <= 200 or offset < 0:
        raise ApiError(422, "limit must be 1-200 and offset >= 0.")
    order = request.args.get("order", "asc")
    if order not in {"asc", "desc"}:
        raise ApiError(422, "order must be asc or desc.")
    search = request.args.get("search")
    if search and len(search) > 200:
        raise ApiError(422, "search is too long.")
    conds = []
    for key, value in request.args.items(multi=True):
        if key in {"limit", "offset", "search", "sort", "order"}:
            continue
        col = snake_case(key)
        if col not in table.c:
            raise ApiError(422, f"Unknown filter '{key}'.")
        conds.append(table.c[col] == convert_value(table.c[col], value))
    if search:
        cols = [c for c in table.columns if isinstance(c.type, String)]
        if not cols:
            raise ApiError(422, "Search is not supported for this resource.")
        conds.append(or_(*[c.ilike(f"%{search}%") for c in cols]))
    query, count = select(table), select(func.count()).select_from(table)
    if conds:
        query, count = query.where(and_(*conds)), count.where(and_(*conds))
    sort = request.args.get("sort")
    if sort:
        name = snake_case(sort)
        if name not in table.c:
            raise ApiError(422, f"Unknown sort field '{sort}'.")
        query = query.order_by(table.c[name].desc() if order == "desc" else table.c[name].asc())
    elif table.primary_key.columns:
        query = query.order_by(*table.primary_key.columns)
    total = Session.scalar(count) or 0
    rows = Session.execute(query.limit(limit).offset(offset)).mappings().all()
    return jsonify({"items": [_serialize(r) for r in rows], "total": total, "limit": limit, "offset": offset})


def get_record(resource: str, record_id: str):
    require_role(g.user, READ_ROLES)
    table = _table(None, resource)
    key = _pk(table)
    row = Session.execute(select(table).where(key == convert_value(key, record_id))).mappings().first()
    if row is None:
        raise ApiError(404, "Record not found.")
    return jsonify(_serialize(row))


def create_record(resource: str):
    require_role(g.user, WRITE_ROLES.get(resource, set()))
    table = _table(None, resource)
    values = _values(table, request.get_json(silent=True), inserting=True)
    try:
        result = Session.execute(insert(table).values(**values).returning(*table.columns)).mappings().one()
        row = _serialize(result)
        _audit(g.user, "create", resource, str(row.get(camel_case(_pk(table).name), "")), {"fields": sorted(values)})
        Session.commit()
        return jsonify(row), 201
    except IntegrityError:
        Session.rollback()
        raise ApiError(409, "The record conflicts with existing data or a database constraint.")
    except (DataError, StatementError):
        Session.rollback()
        raise ApiError(422, "One or more fields have an invalid value.")


def update_record(resource: str, record_id: str):
    require_role(g.user, WRITE_ROLES.get(resource, set()))
    table = _table(None, resource)
    key = _pk(table)
    values = _values(table, request.get_json(silent=True), inserting=False)
    try:
        result = Session.execute(update(table).where(key == convert_value(key, record_id)).values(**values)
                                 .returning(*table.columns)).mappings().first()
        if result is None:
            Session.rollback()
            raise ApiError(404, "Record not found.")
        _audit(g.user, "update", resource, record_id, {"fields": sorted(values)})
        Session.commit()
        return jsonify(_serialize(result))
    except IntegrityError:
        Session.rollback()
        raise ApiError(409, "The update conflicts with existing data or a database constraint.")
    except (DataError, StatementError):
        Session.rollback()
        raise ApiError(422, "One or more fields have an invalid value.")


def delete_record(resource: str, record_id: str):
    require_role(g.user, WRITE_ROLES.get(resource, set()))
    table = _table(None, resource)
    key = _pk(table)
    try:
        row = Session.execute(delete(table).where(key == convert_value(key, record_id)).returning(*table.columns)).mappings().first()
        if row is None:
            Session.rollback()
            raise ApiError(404, "Record not found.")
        _audit(g.user, "delete", resource, record_id, {"fields": sorted(row.keys())})
        Session.commit()
    except IntegrityError:
        Session.rollback()
        raise ApiError(409, "This record is still referenced and cannot be deleted.")
    except (DataError, StatementError):
        Session.rollback()
        raise ApiError(422, "The requested deletion could not be completed.")
    return "", 204


def build_resource_blueprint(name: str, resources: tuple[str, ...]) -> Blueprint:
    bp = Blueprint(name, __name__, url_prefix="/api")
    for res in resources:
        tag = res.replace("-", "_")
        bp.add_url_rule(f"/{res}", f"list_{tag}", login_required(lambda r=res: list_records(r)), methods=["GET"])
        bp.add_url_rule(f"/{res}", f"create_{tag}", login_required(lambda r=res: create_record(r)), methods=["POST"])
        bp.add_url_rule(f"/{res}/<record_id>", f"get_{tag}", login_required(lambda record_id, r=res: get_record(r, record_id)), methods=["GET"])
        bp.add_url_rule(f"/{res}/<record_id>", f"update_{tag}", login_required(lambda record_id, r=res: update_record(r, record_id)), methods=["PATCH"])
        bp.add_url_rule(f"/{res}/<record_id>", f"delete_{tag}", login_required(lambda record_id, r=res: delete_record(r, record_id)), methods=["DELETE"])
    return bp
