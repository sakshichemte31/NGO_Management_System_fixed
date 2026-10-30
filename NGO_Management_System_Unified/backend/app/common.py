"""Small validation helpers shared by the proposal / planning / event modules."""
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from uuid import UUID

from flask import request

from app.errors import ApiError


def json_body() -> dict:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError(422, "A JSON object is required.")
    return data


def parse_uuid(value, label="id") -> str:
    try:
        return str(UUID(str(value)))
    except (ValueError, TypeError):
        raise ApiError(404, f"{label} not found.")


def clean_text(data: dict, key: str, label: str, *, required=False, max_len=500) -> str | None:
    if key not in data:
        if required:
            raise ApiError(422, f"{label} is required.")
        return None
    value = data[key]
    if value is None:
        value = ""
    if not isinstance(value, str):
        raise ApiError(422, f"{label} must be text.")
    value = value.strip()
    if required and not value:
        raise ApiError(422, f"{label} is required.")
    if len(value) > max_len:
        raise ApiError(422, f"{label} must be at most {max_len} characters.")
    return value


def clean_money(data: dict, key: str, label: str, *, required=False) -> Decimal | None:
    if key not in data or data[key] in (None, ""):
        if required:
            raise ApiError(422, f"{label} is required.")
        return None
    try:
        value = Decimal(str(data[key]))
    except (InvalidOperation, ValueError):
        raise ApiError(422, f"{label} must be a number.")
    if not value.is_finite() or value < 0 or value >= Decimal("1e12"):
        raise ApiError(422, f"{label} must be a non-negative amount.")
    return value


def clean_date(data: dict, key: str, label: str, *, required=False) -> date | None:
    if key not in data or data[key] in (None, ""):
        if required:
            raise ApiError(422, f"{label} is required.")
        return None
    try:
        return date.fromisoformat(str(data[key])[:10])
    except ValueError:
        raise ApiError(422, f"{label} must be a valid date (YYYY-MM-DD).")


def clean_datetime(data: dict, key: str, label: str, *, required=False) -> datetime | None:
    if key not in data or data[key] in (None, ""):
        if required:
            raise ApiError(422, f"{label} is required.")
        return None
    try:
        value = datetime.fromisoformat(str(data[key]).replace("Z", "+00:00"))
    except ValueError:
        raise ApiError(422, f"{label} must be a valid date and time.")
    if value.tzinfo is None:
        from datetime import timezone

        value = value.replace(tzinfo=timezone.utc)
    return value


def paging() -> tuple[int, int]:
    try:
        limit, offset = int(request.args.get("limit", 50)), int(request.args.get("offset", 0))
    except ValueError:
        raise ApiError(422, "limit and offset must be integers.")
    if not 1 <= limit <= 200 or offset < 0:
        raise ApiError(422, "limit must be 1-200 and offset >= 0.")
    return limit, offset
