"""Events: scheduling, capacity-aware registrations, attendance and summary stats."""
from datetime import datetime, timezone

from flask import Blueprint, Response, g, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.common import clean_datetime, clean_money, clean_text, json_body, paging, parse_uuid
from app.db import Session, execute, fetch_all, fetch_one, record_audit
from app.errors import ApiError
from app.security import READ_ROLES, login_required, require_role

bp = Blueprint("events", __name__, url_prefix="/api")

TYPES = ["Community", "Fundraiser", "Training", "Outreach", "Meeting"]
STATUSES = ["Scheduled", "Completed", "Cancelled"]
WRITE_ROLES = {"Admin", "Project Manager", "Staff"}
ATTENDANCE = ["Registered", "Attended", "Absent", "Cancelled"]
# Role-based visibility:
#   Admin / Project Manager / Staff -> manage events, registrations, budgets and see every photo action.
#   Volunteer                       -> view events (no budget, no registrations) and upload photos of events held.
VIEW_ROLES = READ_ROLES | {"Volunteer"}
PHOTO_ROLES = READ_ROLES | {"Volunteer"}
PHOTO_MANAGERS = {"Admin", "Project Manager"}
MAX_PHOTO_BYTES = 5 * 1024 * 1024
MAX_PHOTOS_PER_EVENT = 60

SELECT = """
SELECT e.id, e.project_id, pr.name AS project_name, e.title, e.description, e.starts_at, e.ends_at, e.location,
       e.capacity, e.event_type, e.organizer, e.budget, e.status, e.created_at, e.updated_at,
       (SELECT count(*) FROM event_registrations r WHERE r.event_id = e.id AND r.attendance_status <> 'Cancelled') AS registered,
       (SELECT count(*) FROM event_registrations r WHERE r.event_id = e.id AND r.attendance_status = 'Attended') AS attended
FROM events e LEFT JOIN projects pr ON pr.id = e.project_id
"""


def _mask(row: dict) -> dict:
    """Volunteers may see what/where/when, but not finances or sign-up counts."""
    if g.user.role not in READ_ROLES:
        row["budget"] = None
        row["registered"] = None
        row["attended"] = None
    return row


def _get(event_id: str, *, lock=False) -> dict:
    eid = parse_uuid(event_id, "Event")
    if lock:
        if not fetch_one("SELECT 1 AS x FROM events WHERE id = CAST(:id AS uuid) FOR UPDATE", id=eid):
            raise ApiError(404, "Event not found.")
    row = fetch_one(SELECT + " WHERE e.id = CAST(:id AS uuid)", id=eid)
    if row is None:
        raise ApiError(404, "Event not found.")
    return row


def _validate(data: dict, *, partial: bool, current: dict | None = None) -> dict:
    v, req = {}, not partial
    title = clean_text(data, "title", "Event name", required=req, max_len=140)
    if title is not None:
        if not title:
            raise ApiError(422, "Event name is required.")
        v["title"] = title
    for key, col, label, size in (("description", "description", "Description", 5000), ("location", "location", "Location", 300),
                                  ("organizer", "organizer", "Organizer", 120)):
        val = clean_text(data, key, label, required=(req and key in {"location", "organizer"}), max_len=size)
        if val is not None:
            v[col] = val
    starts = clean_datetime(data, "startsAt", "Start date and time", required=req)
    if starts is not None:
        v["starts_at"] = starts
    if "endsAt" in data:
        v["ends_at"] = clean_datetime(data, "endsAt", "End date and time")
    typ = data.get("eventType")
    if typ is not None:
        if typ not in TYPES:
            raise ApiError(422, "Event type must be one of: " + ", ".join(TYPES) + ".")
        v["event_type"] = typ
    budget = clean_money(data, "budget", "Budget")
    if budget is not None:
        v["budget"] = budget
    if "capacity" in data:
        cap = data["capacity"]
        if cap in (None, ""):
            v["capacity"] = None
        else:
            if isinstance(cap, bool) or not isinstance(cap, (int, str)) or not str(cap).lstrip("-").isdigit() or int(cap) < 1:
                raise ApiError(422, "Capacity must be a whole number of at least 1.")
            v["capacity"] = int(cap)
    elif req:
        raise ApiError(422, "Capacity is required.")
    status = data.get("status")
    if status is not None:
        if status not in STATUSES:
            raise ApiError(422, "Status must be Scheduled, Completed or Cancelled.")
        v["status"] = status
    if "projectId" in data:
        pid = data["projectId"]
        if pid in (None, ""):
            v["project_id"] = None
        else:
            pid = parse_uuid(pid, "Project")
            if not fetch_one("SELECT 1 AS x FROM projects WHERE id = CAST(:id AS uuid)", id=pid):
                raise ApiError(422, "Selected project does not exist.")
            v["project_id"] = pid
    start = v.get("starts_at", current["startsAt"] if current else None)
    end = v.get("ends_at", current["endsAt"] if current else None)
    if start and end and end < start:
        raise ApiError(422, "End time must be after the start time.")
    return v


def _sql_cast(col: str) -> str:
    return f"CAST(:{col} AS uuid)" if col == "project_id" else f":{col}"


@bp.get("/events")
@login_required
def list_events():
    require_role(g.user, VIEW_ROLES)
    limit, offset = paging()
    where, params = [], {}
    for arg, col, allowed in (("status", "e.status", STATUSES), ("eventType", "e.event_type", TYPES)):
        val = request.args.get(arg)
        if val:
            if val not in allowed:
                raise ApiError(422, f"Unknown {arg} filter.")
            where.append(f"{col} = :{arg}")
            params[arg] = val
    if request.args.get("projectId"):
        where.append("e.project_id = CAST(:pid AS uuid)")
        params["pid"] = parse_uuid(request.args["projectId"], "Project")
    for arg, op in (("from", ">="), ("to", "<")):
        if request.args.get(arg):
            dt = clean_datetime(request.args, arg, arg)
            where.append(f"e.starts_at {op} :{arg}")
            params[arg] = dt
    search = (request.args.get("search") or "").strip()
    if search:
        where.append("(e.title ILIKE :q OR e.location ILIKE :q OR e.organizer ILIKE :q OR e.event_type ILIKE :q)")
        params["q"] = f"%{search[:200]}%"
    clause = (" WHERE " + " AND ".join(where)) if where else ""
    order = "DESC" if request.args.get("order") == "desc" else "ASC"
    total = fetch_one("SELECT count(*) AS n FROM events e" + clause, **params)["n"]
    rows = fetch_all(SELECT + clause + f" ORDER BY e.starts_at {order}, e.id LIMIT :limit OFFSET :offset",
                     limit=limit, offset=offset, **params)
    return jsonify({"items": [_mask(r) for r in rows], "total": total, "limit": limit, "offset": offset})


@bp.get("/events/stats")
@login_required
def event_stats():
    require_role(g.user, VIEW_ROLES)
    row = fetch_one("""
        SELECT count(*) AS total,
               count(*) FILTER (WHERE status = 'Scheduled' AND starts_at >= now()) AS upcoming,
               count(*) FILTER (WHERE status = 'Scheduled' AND starts_at < now()) AS overdue,
               count(*) FILTER (WHERE status = 'Completed') AS completed,
               count(*) FILTER (WHERE status = 'Cancelled') AS cancelled,
               COALESCE(sum(budget) FILTER (WHERE status <> 'Cancelled'), 0) AS total_budget,
               COALESCE(sum(capacity) FILTER (WHERE status = 'Scheduled'), 0) AS upcoming_capacity
        FROM events""")
    reg = fetch_one("SELECT count(*) AS n FROM event_registrations WHERE attendance_status <> 'Cancelled'")
    row["registered"] = reg["n"]
    if g.user.role not in READ_ROLES:
        row["totalBudget"] = None
        row["registered"] = None
        row["upcomingCapacity"] = None
    return jsonify(row)


@bp.get("/events/people")
@login_required
def people_lookup():
    """Search registrable people (users, beneficiaries, donors) by name."""
    require_role(g.user, WRITE_ROLES)
    kind = request.args.get("type", "user")
    q = f"%{(request.args.get('search') or '').strip()[:100]}%"
    sql = {
        "user": "SELECT id, full_name AS name, email FROM users WHERE is_active AND (full_name ILIKE :q OR email ILIKE :q) ORDER BY full_name LIMIT 20",
        "beneficiary": "SELECT id, full_name AS name, email FROM beneficiaries WHERE status = 'Active' AND (full_name ILIKE :q OR COALESCE(email,'') ILIKE :q) ORDER BY full_name LIMIT 20",
        "donor": "SELECT id, display_name AS name, email FROM donors WHERE display_name ILIKE :q OR COALESCE(email,'') ILIKE :q ORDER BY display_name LIMIT 20",
    }.get(kind)
    if sql is None:
        raise ApiError(422, "type must be user, beneficiary or donor.")
    return jsonify({"items": fetch_all(sql, q=q)})


@bp.get("/events/<event_id>")
@login_required
def get_event(event_id):
    require_role(g.user, VIEW_ROLES)
    return jsonify(_mask(_get(event_id)))


@bp.post("/events")
@login_required
def create_event():
    require_role(g.user, WRITE_ROLES)
    v = _validate(json_body(), partial=False)
    v.setdefault("status", "Scheduled")
    cols = ", ".join(v) + ", created_by"
    vals = ", ".join(_sql_cast(c) for c in v) + ", CAST(:created_by AS uuid)"
    try:
        row = fetch_one(f"INSERT INTO events ({cols}) VALUES ({vals}) RETURNING id", created_by=str(g.user.id), **v)
        record_audit(g.user, "create", "events", str(row["id"]), {"fields": sorted(v)})
        Session.commit()
    except IntegrityError:
        Session.rollback()
        raise ApiError(409, "The event conflicts with existing data.")
    return jsonify(_get(row["id"])), 201


TRANSITIONS = {"Scheduled": {"Completed", "Cancelled"}, "Completed": set(), "Cancelled": {"Scheduled"}}


@bp.patch("/events/<event_id>")
@login_required
def update_event(event_id):
    require_role(g.user, WRITE_ROLES)
    current = _get(event_id, lock=True)
    v = _validate(json_body(), partial=True, current=current)
    if not v:
        raise ApiError(422, "No valid fields supplied.")
    if "status" in v and v["status"] != current["status"] and v["status"] not in TRANSITIONS[current["status"]]:
        raise ApiError(409, f"An event cannot move from '{current['status']}' to '{v['status']}'.")
    if current["status"] == "Completed" and set(v) - {"description"}:
        raise ApiError(409, "A completed event can no longer be changed.")
    if v.get("capacity") is not None and v["capacity"] < current["registered"]:
        raise ApiError(409, f"Capacity cannot be lower than the {current['registered']} people already registered.")
    if v.get("status") == "Cancelled":
        execute("UPDATE event_registrations SET attendance_status = 'Cancelled' WHERE event_id = CAST(:id AS uuid) AND attendance_status = 'Registered'",
                id=str(current["id"]))
    sets = ", ".join(f"{c} = {_sql_cast(c)}" for c in v)
    try:
        execute(f"UPDATE events SET {sets} WHERE id = CAST(:id AS uuid)", id=str(current["id"]), **v)
        record_audit(g.user, "update", "events", str(current["id"]), {"fields": sorted(v)})
        Session.commit()
    except IntegrityError:
        Session.rollback()
        raise ApiError(409, "The update conflicts with existing data.")
    return jsonify(_get(event_id))


@bp.delete("/events/<event_id>")
@login_required
def delete_event(event_id):
    require_role(g.user, WRITE_ROLES)
    current = _get(event_id, lock=True)
    if current["registered"] and current["status"] == "Scheduled":
        raise ApiError(409, "This event has registrations. Cancel the event instead of deleting it.")
    execute("DELETE FROM events WHERE id = CAST(:id AS uuid)", id=str(current["id"]))
    record_audit(g.user, "delete", "events", str(current["id"]), {"title": current["title"]})
    Session.commit()
    return "", 204


REG_SELECT = """
SELECT r.id, r.event_id, r.attendance_status, r.registered_at,
       CASE WHEN r.user_id IS NOT NULL THEN 'user' WHEN r.beneficiary_id IS NOT NULL THEN 'beneficiary' ELSE 'donor' END AS person_type,
       COALESCE(r.user_id, r.beneficiary_id, r.donor_id) AS person_id,
       COALESCE(u.full_name, b.full_name, d.display_name) AS name,
       COALESCE(u.email, b.email, d.email) AS email
FROM event_registrations r
LEFT JOIN users u ON u.id = r.user_id
LEFT JOIN beneficiaries b ON b.id = r.beneficiary_id
LEFT JOIN donors d ON d.id = r.donor_id
"""


@bp.get("/events/<event_id>/registrations")
@login_required
def list_registrations(event_id):
    require_role(g.user, READ_ROLES)
    event = _get(event_id)
    rows = fetch_all(REG_SELECT + " WHERE r.event_id = CAST(:id AS uuid) ORDER BY r.registered_at DESC", id=str(event["id"]))
    return jsonify({"items": rows, "total": len(rows), "capacity": event["capacity"]})


@bp.post("/events/<event_id>/registrations")
@login_required
def add_registration(event_id):
    require_role(g.user, WRITE_ROLES)
    event = _get(event_id, lock=True)
    data = json_body()
    kind = data.get("personType")
    column = {"user": "user_id", "beneficiary": "beneficiary_id", "donor": "donor_id"}.get(kind)
    if column is None:
        raise ApiError(422, "personType must be user, beneficiary or donor.")
    person_id = parse_uuid(data.get("personId"), "Person")
    if event["status"] != "Scheduled":
        raise ApiError(409, "Registrations are only open for scheduled events.")
    if event["capacity"] is not None and event["registered"] >= event["capacity"]:
        raise ApiError(409, "This event is full.")
    table = {"user": "users", "beneficiary": "beneficiaries", "donor": "donors"}[kind]
    if not fetch_one(f"SELECT 1 AS x FROM {table} WHERE id = CAST(:id AS uuid)", id=person_id):
        raise ApiError(422, "Selected person does not exist.")
    try:
        row = fetch_one(f"INSERT INTO event_registrations (event_id, {column}) VALUES (CAST(:eid AS uuid), CAST(:pid AS uuid)) RETURNING id",
                        eid=str(event["id"]), pid=person_id)
        record_audit(g.user, "create", "event_registrations", str(row["id"]), {"event": str(event["id"]), "type": kind})
        Session.commit()
    except IntegrityError:
        Session.rollback()
        # Re-register a previously cancelled person instead of failing.
        again = fetch_one(f"SELECT id, attendance_status FROM event_registrations WHERE event_id = CAST(:eid AS uuid) AND {column} = CAST(:pid AS uuid)",
                          eid=str(event["id"]), pid=person_id)
        if again and again["attendanceStatus"] == "Cancelled":
            execute("UPDATE event_registrations SET attendance_status = 'Registered', registered_at = now() WHERE id = :id", id=again["id"])
            Session.commit()
            row = again
        else:
            raise ApiError(409, "This person is already registered for the event.")
    return jsonify(fetch_one(REG_SELECT + " WHERE r.id = :id", id=row["id"])), 201


def _registration(reg_id: str) -> dict:
    row = fetch_one(REG_SELECT + " WHERE r.id = CAST(:id AS uuid)", id=parse_uuid(reg_id, "Registration"))
    if row is None:
        raise ApiError(404, "Registration not found.")
    return row


@bp.patch("/event-registrations/<reg_id>")
@login_required
def update_registration(reg_id):
    require_role(g.user, WRITE_ROLES)
    reg = _registration(reg_id)
    status = json_body().get("attendanceStatus")
    if status not in ATTENDANCE:
        raise ApiError(422, "attendanceStatus must be one of: " + ", ".join(ATTENDANCE) + ".")
    event = _get(str(reg["eventId"]), lock=True)
    if status == "Cancelled" and reg["attendanceStatus"] != "Cancelled":
        pass
    elif reg["attendanceStatus"] == "Cancelled" and status != "Cancelled":
        if event["capacity"] is not None and event["registered"] >= event["capacity"]:
            raise ApiError(409, "This event is full.")
    execute("UPDATE event_registrations SET attendance_status = :s WHERE id = CAST(:id AS uuid)", s=status, id=str(reg["id"]))
    record_audit(g.user, "update", "event_registrations", str(reg["id"]), {"attendanceStatus": status})
    Session.commit()
    return jsonify(_registration(reg_id))


@bp.delete("/event-registrations/<reg_id>")
@login_required
def delete_registration(reg_id):
    require_role(g.user, WRITE_ROLES)
    reg = _registration(reg_id)
    execute("DELETE FROM event_registrations WHERE id = CAST(:id AS uuid)", id=str(reg["id"]))
    record_audit(g.user, "delete", "event_registrations", str(reg["id"]), {})
    Session.commit()
    return "", 204


# ───────────────────────────── Event photos ─────────────────────────────

PHOTO_SELECT = """
SELECT ph.id, ph.event_id, ph.caption, ph.content_type, ph.size_bytes, ph.created_at, ph.uploaded_by,
       u.full_name AS uploaded_by_name, u.role AS uploaded_by_role
FROM event_photos ph LEFT JOIN users u ON u.id = ph.uploaded_by
"""


def _image_type(data: bytes) -> str | None:
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    return None


def _photo_present(row: dict) -> dict:
    row["url"] = f"/api/event-photos/{row['id']}/file"
    row["canDelete"] = g.user.role in PHOTO_MANAGERS or str(row["uploadedBy"]) == str(g.user.id)
    return row


@bp.get("/events/<event_id>/photos")
@login_required
def list_photos(event_id):
    require_role(g.user, PHOTO_ROLES)
    event = _get(event_id)
    rows = fetch_all(PHOTO_SELECT + " WHERE ph.event_id = CAST(:id AS uuid) ORDER BY ph.created_at DESC", id=str(event["id"]))
    return jsonify({"items": [_photo_present(r) for r in rows], "total": len(rows)})


@bp.post("/events/<event_id>/photos")
@login_required
def upload_photo(event_id):
    require_role(g.user, PHOTO_ROLES)
    event = _get(event_id, lock=True)
    held = event["status"] == "Completed" or (event["status"] == "Scheduled" and event["startsAt"] <= datetime.now(timezone.utc))
    if not held:
        raise ApiError(409, "Photos can only be added after the event has taken place.")
    upload = request.files.get("photo")
    if upload is None:
        raise ApiError(422, "Choose a photo to upload.")
    data = upload.read(MAX_PHOTO_BYTES + 1)
    if not data:
        raise ApiError(422, "The selected file is empty.")
    if len(data) > MAX_PHOTO_BYTES:
        raise ApiError(413, "Photos must be 5 MB or smaller.")
    content_type = _image_type(data)
    if content_type is None:
        raise ApiError(422, "Only JPEG, PNG, WebP or GIF images are allowed.")
    caption = (request.form.get("caption") or "").strip()[:300]
    if fetch_one("SELECT count(*) AS n FROM event_photos WHERE event_id = CAST(:id AS uuid)", id=str(event["id"]))["n"] >= MAX_PHOTOS_PER_EVENT:
        raise ApiError(409, "This event already has the maximum number of photos.")
    row = fetch_one(
        "INSERT INTO event_photos (event_id, uploaded_by, caption, content_type, size_bytes, data) VALUES "
        "(CAST(:eid AS uuid), CAST(:uid AS uuid), :caption, :ct, :size, :data) RETURNING id",
        eid=str(event["id"]), uid=str(g.user.id), caption=caption, ct=content_type, size=len(data), data=data)
    record_audit(g.user, "create", "event_photos", str(row["id"]), {"event": str(event["id"])})
    Session.commit()
    return jsonify(_photo_present(fetch_one(PHOTO_SELECT + " WHERE ph.id = CAST(:id AS uuid)", id=str(row["id"])))), 201


@bp.get("/event-photos/<photo_id>/file")
@login_required
def photo_file(photo_id):
    require_role(g.user, PHOTO_ROLES)
    row = fetch_one("SELECT content_type, data FROM event_photos WHERE id = CAST(:id AS uuid)", id=parse_uuid(photo_id, "Photo"))
    if row is None:
        raise ApiError(404, "Photo not found.")
    return Response(bytes(row["data"]), mimetype=row["contentType"],
                    headers={"Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff"})


@bp.delete("/event-photos/<photo_id>")
@login_required
def delete_photo(photo_id):
    require_role(g.user, PHOTO_ROLES)
    pid = parse_uuid(photo_id, "Photo")
    row = fetch_one("SELECT id, uploaded_by FROM event_photos WHERE id = CAST(:id AS uuid)", id=pid)
    if row is None:
        raise ApiError(404, "Photo not found.")
    if g.user.role not in PHOTO_MANAGERS and str(row["uploadedBy"]) != str(g.user.id):
        raise ApiError(403, "You can only remove photos you uploaded.")
    execute("DELETE FROM event_photos WHERE id = CAST(:id AS uuid)", id=pid)
    record_audit(g.user, "delete", "event_photos", pid, {})
    Session.commit()
    return "", 204
