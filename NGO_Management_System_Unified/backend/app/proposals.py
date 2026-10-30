"""Project proposals (lifecycle + review) and detailed project planning."""
import json
from datetime import datetime, timezone

from flask import Blueprint, g, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.common import clean_date, clean_money, clean_text, json_body, paging, parse_uuid
from app.db import execute, fetch_all, fetch_one, record_audit, Session
from app.errors import ApiError
from app.security import READ_ROLES, login_required, require_role

bp = Blueprint("proposals", __name__, url_prefix="/api")

STATUSES = ["Draft", "Submitted", "Under Review", "Financial Review", "Approved", "Rejected", "Withdrawn"]
PRIORITIES = {"High", "Medium", "Low"}
# Role-based access:
#   Project Manager -> creates/edits/submits proposals and builds the detailed project plan.
#   Admin           -> reviews, approves or rejects proposals (and may change priority).
#   Staff           -> read-only.
WRITE_ROLES = {"Project Manager"}
REVIEW_ROLES = {"Admin"}
EDITABLE = {"Draft", "Submitted"}
TRANSITIONS = {
    "Draft": {"Submitted", "Withdrawn"},
    "Submitted": {"Under Review", "Rejected", "Withdrawn"},
    "Under Review": {"Financial Review", "Approved", "Rejected", "Withdrawn"},
    "Financial Review": {"Under Review", "Approved", "Rejected"},
    "Rejected": {"Draft"},
    "Withdrawn": {"Draft"},
    "Approved": set(),
}
# Transitions made by the submitter themselves (no reviewer role required).
SELF_SERVICE = {("Draft", "Submitted"), ("Draft", "Withdrawn"), ("Submitted", "Withdrawn"),
                ("Under Review", "Withdrawn"), ("Rejected", "Draft"), ("Withdrawn", "Draft")}

SELECT = """
SELECT p.id, p.proposal_code, p.title, p.sector AS category, p.summary, p.status, p.priority,
       p.estimated_budget, p.expected_beneficiaries, p.start_date, p.end_date, p.geography,
       p.review_notes, p.planning_status, p.planning_data, p.submitted_by, p.reviewed_at,
       p.created_at, p.updated_at, u.full_name AS submitted_by_name, r.full_name AS reviewed_by_name
FROM proposals p
LEFT JOIN users u ON u.id = p.submitted_by
LEFT JOIN users r ON r.id = p.reviewed_by
"""


def _present(row: dict) -> dict:
    data = row.pop("planningData", None) or {}
    row["planningCompletion"] = _overall_completion(data)
    hr = (data.get("sections") or {}).get("hr") or {}
    vol = str(hr.get("volunteersRequired", "")).strip()
    row["volunteersRequired"] = int(vol) if vol.isdigit() else None
    return row


def _get(proposal_id: str, *, lock=False) -> dict:
    pid = parse_uuid(proposal_id, "Proposal")
    row = fetch_one(SELECT + " WHERE p.id = CAST(:id AS uuid)" + (" FOR UPDATE OF p" if lock else ""), id=pid)
    if row is None:
        raise ApiError(404, "Proposal not found.")
    return row


def _next_code() -> str:
    year = datetime.now(timezone.utc).year
    execute("SELECT pg_advisory_xact_lock(724001)")
    row = fetch_one(
        "SELECT COALESCE(MAX(CAST(split_part(proposal_code, '-', 3) AS integer)), 0) + 1 AS n "
        "FROM proposals WHERE proposal_code ~ :pattern", pattern=f"^PP-{year}-[0-9]+$")
    return f"PP-{year}-{row['n']:03d}"


def _validate_core(data: dict, *, partial: bool) -> dict:
    values = {}
    req = not partial
    title = clean_text(data, "title", "Project title", required=req, max_len=200)
    if title is not None:
        if len(title) < 3:
            raise ApiError(422, "Project title must be at least 3 characters.")
        values["title"] = title
    category = clean_text(data, "category", "Category", required=req, max_len=80)
    if category is not None:
        if not category:
            raise ApiError(422, "Category is required.")
        values["sector"] = category
    budget = clean_money(data, "estimatedBudget", "Estimated budget", required=req)
    if budget is not None:
        values["estimated_budget"] = budget
    for key, col, label, size in (("expectedBeneficiaries", "expected_beneficiaries", "Expected beneficiaries", 200),
                                  ("summary", "summary", "Overview", 5000), ("geography", "geography", "Geographic focus", 500)):
        v = clean_text(data, key, label, required=(req and key == "expectedBeneficiaries"), max_len=size)
        if v is not None:
            values[col] = v
    for key, col, label in (("startDate", "start_date", "Start date"), ("endDate", "end_date", "End date")):
        v = clean_date(data, key, label, required=req)
        if key in data:
            values[col] = v
    priority = data.get("priority")
    if priority is not None:
        if priority not in PRIORITIES:
            raise ApiError(422, "Priority must be High, Medium or Low.")
        values["priority"] = priority
    return values


def _check_dates(start, end):
    if start and end and end < start:
        raise ApiError(422, "End date must be on or after the start date.")


@bp.get("/proposals")
@login_required
def list_proposals():
    require_role(g.user, READ_ROLES)
    limit, offset = paging()
    where, params = [], {}
    status = request.args.get("status")
    if status:
        if status not in STATUSES:
            raise ApiError(422, "Unknown status filter.")
        where.append("p.status = :status")
        params["status"] = status
    planning = request.args.get("planningStatus")
    if planning:
        where.append("p.planning_status = :planning")
        params["planning"] = planning
    search = (request.args.get("search") or "").strip()
    if search:
        where.append("(p.title ILIKE :q OR p.proposal_code ILIKE :q OR p.sector ILIKE :q OR u.full_name ILIKE :q)")
        params["q"] = f"%{search[:200]}%"
    clause = (" WHERE " + " AND ".join(where)) if where else ""
    total = fetch_one("SELECT count(*) AS n FROM proposals p LEFT JOIN users u ON u.id = p.submitted_by" + clause, **params)["n"]
    rows = fetch_all(SELECT + clause + " ORDER BY p.created_at DESC, p.proposal_code DESC LIMIT :limit OFFSET :offset",
                     limit=limit, offset=offset, **params)
    counts = {r["status"]: r["n"] for r in fetch_all("SELECT status, count(*) AS n FROM proposals GROUP BY status")}
    return jsonify({"items": [_present(r) for r in rows], "total": total, "limit": limit, "offset": offset,
                    "counts": {s: counts.get(s, 0) for s in STATUSES}})


@bp.get("/proposals/<proposal_id>")
@login_required
def get_proposal(proposal_id):
    require_role(g.user, READ_ROLES)
    return jsonify(_present(_get(proposal_id)))


@bp.post("/proposals")
@login_required
def create_proposal():
    require_role(g.user, WRITE_ROLES)
    data = json_body()
    values = _validate_core(data, partial=False)
    _check_dates(values.get("start_date"), values.get("end_date"))
    status = "Submitted" if data.get("submit", True) else "Draft"
    values.setdefault("priority", "Medium")
    try:
        code = _next_code()
        row = fetch_one(
            "INSERT INTO proposals (proposal_code, title, sector, summary, status, priority, estimated_budget, "
            "expected_beneficiaries, start_date, end_date, geography, submitted_by) VALUES "
            "(:code, :title, :sector, :summary, :status, :priority, :estimated_budget, :expected_beneficiaries, "
            ":start_date, :end_date, :geography, CAST(:uid AS uuid)) RETURNING id",
            code=code, status=status, uid=str(g.user.id), summary=values.pop("summary", ""),
            geography=values.pop("geography", ""), **values)
        record_audit(g.user, "create", "proposals", str(row["id"]), {"code": code, "status": status})
        Session.commit()
    except IntegrityError:
        Session.rollback()
        raise ApiError(409, "The proposal conflicts with existing data.")
    return jsonify(_present(_get(row["id"]))), 201


@bp.patch("/proposals/<proposal_id>")
@login_required
def update_proposal(proposal_id):
    require_role(g.user, WRITE_ROLES | REVIEW_ROLES)
    current = _get(proposal_id, lock=True)
    data = json_body()
    values = _validate_core(data, partial=True)
    if not values:
        raise ApiError(422, "No valid fields supplied.")
    if g.user.role in REVIEW_ROLES:
        if set(values) - {"priority"}:
            raise ApiError(403, "Admins review proposals; only the Project Manager can edit their content.")
    elif str(current["submittedBy"]) != str(g.user.id):
        raise ApiError(403, "Only the Project Manager who created this proposal can edit it.")
    content_change = set(values) - {"priority"}
    if content_change and current["status"] not in EDITABLE:
        raise ApiError(409, f"A proposal in '{current['status']}' status can no longer be edited.")
    if "priority" in values and current["status"] not in EDITABLE and g.user.role not in REVIEW_ROLES \
            and values["priority"] != current["priority"]:
        raise ApiError(403, "Only an Admin can change the priority after submission.")
    _check_dates(values.get("start_date", current["startDate"]), values.get("end_date", current["endDate"]))
    sets = ", ".join(f"{k} = :{k}" for k in values)
    execute(f"UPDATE proposals SET {sets} WHERE id = CAST(:id AS uuid)", id=str(current["id"]), **values)
    record_audit(g.user, "update", "proposals", str(current["id"]), {"fields": sorted(values)})
    Session.commit()
    return jsonify(_present(_get(proposal_id)))


@bp.delete("/proposals/<proposal_id>")
@login_required
def delete_proposal(proposal_id):
    require_role(g.user, WRITE_ROLES)
    current = _get(proposal_id, lock=True)
    if current["status"] != "Draft":
        raise ApiError(409, "Only draft proposals can be deleted. Withdraw the proposal instead.")
    if str(current["submittedBy"]) != str(g.user.id):
        raise ApiError(403, "Only the Project Manager who created this draft can delete it.")
    execute("DELETE FROM proposals WHERE id = CAST(:id AS uuid)", id=str(current["id"]))
    record_audit(g.user, "delete", "proposals", str(current["id"]), {"code": current["proposalCode"]})
    Session.commit()
    return "", 204


@bp.post("/proposals/<proposal_id>/transition")
@login_required
def transition_proposal(proposal_id):
    require_role(g.user, WRITE_ROLES | REVIEW_ROLES)
    data = json_body()
    target = data.get("status")
    if target not in STATUSES:
        raise ApiError(422, "Unknown target status.")
    notes = clean_text(data, "notes", "Review notes", max_len=2000) or ""
    current = _get(proposal_id, lock=True)
    source = current["status"]
    if target not in TRANSITIONS[source]:
        raise ApiError(409, f"A proposal cannot move from '{source}' to '{target}'.")
    if (source, target) in SELF_SERVICE:
        if g.user.role not in WRITE_ROLES or str(current["submittedBy"]) != str(g.user.id):
            raise ApiError(403, "Only the Project Manager who created this proposal can make this change.")
    elif g.user.role not in REVIEW_ROLES:
        raise ApiError(403, "Only an Admin can review, approve or reject proposals.")
    if target == "Rejected" and not notes:
        raise ApiError(422, "Provide a reason when rejecting a proposal.")
    if target == "Submitted":
        missing = [l for l, v in (("estimated budget", current["estimatedBudget"]), ("start date", current["startDate"]),
                                  ("end date", current["endDate"])) if not v]
        if missing:
            raise ApiError(422, "Complete the proposal before submitting: " + ", ".join(missing) + ".")
    reviewed = target in {"Financial Review", "Approved", "Rejected", "Under Review"} and (source, target) not in SELF_SERVICE
    execute(
        "UPDATE proposals SET status = :status, review_notes = CASE WHEN :notes <> '' THEN :notes ELSE review_notes END, "
        "reviewed_by = CASE WHEN :reviewed THEN CAST(:uid AS uuid) ELSE reviewed_by END, "
        "reviewed_at = CASE WHEN :reviewed THEN now() ELSE reviewed_at END WHERE id = CAST(:id AS uuid)",
        status=target, notes=notes, reviewed=reviewed, uid=str(g.user.id), id=str(current["id"]))
    if target == "Draft":
        execute("UPDATE proposals SET reviewed_by = NULL, reviewed_at = NULL, review_notes = '' WHERE id = CAST(:id AS uuid)",
                id=str(current["id"]))
    record_audit(g.user, "transition", "proposals", str(current["id"]), {"from": source, "to": target})
    Session.commit()
    return jsonify(_present(_get(proposal_id)))


# ───────────────────────── Detailed project planning ─────────────────────────

PLAN_SECTIONS = {
    "overview": {"title": "Project Overview", "fields": ["projectName", "visionMission", "sdgGoals", "duration", "location", "implementingTeam"],
                 "required": ["projectName", "visionMission", "duration"]},
    "beneficiary": {"title": "Beneficiary", "fields": ["primaryBeneficiaries", "secondaryBeneficiaries", "estimatedCount", "selectionCriteria", "beneficiaryNeeds"],
                    "required": ["primaryBeneficiaries", "estimatedCount", "selectionCriteria"]},
    "impact": {"title": "Expected Impact", "fields": ["directImpact", "indirectImpact", "societalImpact", "longTermOutcomes"],
               "required": ["directImpact", "longTermOutcomes"]},
    "stages": {"title": "Stages / Phases", "fields": ["phase1", "phase2", "phase3", "milestones", "timeline"],
               "required": ["phase1", "milestones", "timeline"]},
    "hr": {"title": "Human Resources", "fields": ["teamLead", "staffAssigned", "volunteersRequired", "volunteerRoles", "externalConsultants", "trainingNeeds"],
           "required": ["teamLead", "staffAssigned", "volunteersRequired"]},
    "operations": {"title": "Operations", "fields": ["venueSite", "equipmentNeeded", "logisticsPlan", "transportation", "totalEstimatedHours"],
                   "required": ["venueSite", "logisticsPlan"]},
    "budget": {"title": "Budget", "fields": ["personnelCosts", "materialCosts", "operationalCosts", "fundingSources", "contingencyReserve"],
               "required": ["personnelCosts", "operationalCosts", "fundingSources"]},
}


def _months_between(start, end):
    if not start or not end:
        return ""
    months = (end.year - start.year) * 12 + end.month - start.month + (1 if end.day >= start.day else 0)
    return f"{max(months, 1)} months"


def _defaults(p: dict) -> dict:
    return {
        "overview": {"projectName": p["title"], "duration": _months_between(p["startDate"], p["endDate"]),
                     "location": p["geography"], "visionMission": p["summary"]},
        "beneficiary": {"estimatedCount": p["expectedBeneficiaries"]},
        "budget": {"personnelCosts": ""},
    }


def _merged_sections(p: dict, saved: dict) -> dict:
    defaults = _defaults(p)
    out = {}
    for key, spec in PLAN_SECTIONS.items():
        stored = (saved.get("sections") or {}).get(key) or {}
        out[key] = {f: stored.get(f, defaults.get(key, {}).get(f, "")) for f in spec["fields"]}
    return out


def _section_completion(sections: dict, saved: dict) -> dict:
    result = {}
    stored = saved.get("sections") or {}
    for key, spec in PLAN_SECTIONS.items():
        filled = [f for f in spec["required"] if str(sections[key].get(f, "")).strip()]
        result[key] = round(len(filled) / len(spec["required"]) * 100)
    return result


def _overall_completion(saved: dict) -> int:
    if not saved:
        return 0
    filled = total = 0
    for key, spec in PLAN_SECTIONS.items():
        stored = (saved.get("sections") or {}).get(key) or {}
        for f in spec["required"]:
            total += 1
            filled += bool(str(stored.get(f, "")).strip())
    return round(filled / total * 100) if total else 0


def _departments() -> list[dict]:
    return fetch_all("SELECT id, name FROM departments ORDER BY name")


def _planning_payload(p: dict, saved: dict) -> dict:
    sections = _merged_sections(p, saved)
    stored_depts = saved.get("departments") or {}
    depts = [{"id": d["id"], "name": d["name"], "responsible": (stored_depts.get(d["id"]) or {}).get("responsible", ""),
              "notes": (stored_depts.get(d["id"]) or {}).get("notes", "")} for d in _departments()]
    missing = {k: [f for f in spec["required"] if not str(sections[k].get(f, "")).strip()] for k, spec in PLAN_SECTIONS.items()}
    return {
        "proposalId": str(p["id"]), "proposalCode": p["proposalCode"], "title": p["title"], "status": p["status"],
        "planningStatus": p["planningStatus"], "sections": sections, "departments": depts,
        "completion": _section_completion(sections, saved), "missing": {k: v for k, v in missing.items() if v},
        "sectionMeta": {k: {"title": s["title"], "fields": s["fields"], "required": s["required"]} for k, s in PLAN_SECTIONS.items()},
        "updatedAt": p["updatedAt"],
    }


def _planning_row(proposal_id: str, *, lock=False) -> tuple[dict, dict]:
    p = _get(proposal_id, lock=lock)
    raw = fetch_one("SELECT planning_data FROM proposals WHERE id = CAST(:id AS uuid)", id=str(p["id"]))["planningData"] or {}
    return p, raw


@bp.get("/planning/proposals")
@login_required
def planning_proposals():
    """Approved proposals that are eligible for detailed planning."""
    require_role(g.user, READ_ROLES)
    rows = fetch_all(SELECT + " WHERE p.status = 'Approved' ORDER BY p.reviewed_at DESC NULLS LAST, p.created_at DESC")
    return jsonify({"items": [_present(r) for r in rows], "total": len(rows)})


@bp.get("/departments")
@login_required
def list_departments():
    return jsonify({"items": _departments()})


@bp.get("/proposals/<proposal_id>/planning")
@login_required
def get_planning(proposal_id):
    require_role(g.user, READ_ROLES)
    p, saved = _planning_row(proposal_id)
    if p["status"] != "Approved":
        raise ApiError(409, "Detailed planning is available only after the proposal is approved.")
    return jsonify(_planning_payload(p, saved))


@bp.put("/proposals/<proposal_id>/planning")
@login_required
def save_planning(proposal_id):
    require_role(g.user, WRITE_ROLES)
    p, saved = _planning_row(proposal_id, lock=True)
    if p["status"] != "Approved":
        raise ApiError(409, "Detailed planning is available only after the proposal is approved.")
    data = json_body()
    sections_in, depts_in = data.get("sections") or {}, data.get("departments") or {}
    if not isinstance(sections_in, dict) or not isinstance(depts_in, dict):
        raise ApiError(422, "sections and departments must be objects.")
    sections = saved.get("sections") or {}
    for key, fields in sections_in.items():
        if key not in PLAN_SECTIONS:
            raise ApiError(422, f"Unknown planning section '{key}'.")
        if not isinstance(fields, dict):
            raise ApiError(422, f"Section '{key}' must be an object.")
        merged = dict(sections.get(key) or {})
        for f, v in fields.items():
            if f not in PLAN_SECTIONS[key]["fields"]:
                raise ApiError(422, f"Unknown field '{f}' in section '{key}'.")
            if not isinstance(v, str) or len(v) > 5000:
                raise ApiError(422, f"'{f}' must be text up to 5000 characters.")
            v = v.strip()
            if f == "volunteersRequired" and v and (not v.isdigit() or int(v) > 100000):
                raise ApiError(422, "Volunteers required must be a whole number (0 or more).")
            merged[f] = v
        sections[key] = merged
    depts = saved.get("departments") or {}
    valid_depts = {d["id"] for d in _departments()}
    for dept_id, fields in depts_in.items():
        if dept_id not in valid_depts or not isinstance(fields, dict):
            raise ApiError(422, f"Unknown department '{dept_id}'.")
        depts[dept_id] = {k: str(fields.get(k, ""))[:1000].strip() for k in ("responsible", "notes")}
    saved = {"sections": sections, "departments": depts}
    has_content = any(str(v).strip() for s in sections.values() for v in s.values()) or any(d.get("responsible") or d.get("notes") for d in depts.values())
    status = "In Progress" if has_content else "Not Started"
    execute("UPDATE proposals SET planning_data = CAST(:d AS jsonb), planning_status = :s WHERE id = CAST(:id AS uuid)",
            d=json.dumps(saved), s=status, id=str(p["id"]))
    record_audit(g.user, "update", "proposal_planning", str(p["id"]), {"sections": sorted(sections_in), "departments": sorted(depts_in)})
    Session.commit()
    p, saved = _planning_row(proposal_id)
    return jsonify(_planning_payload(p, saved))


@bp.post("/proposals/<proposal_id>/planning/complete")
@login_required
def complete_planning(proposal_id):
    require_role(g.user, WRITE_ROLES)
    p, saved = _planning_row(proposal_id, lock=True)
    if p["status"] != "Approved":
        raise ApiError(409, "Detailed planning is available only after the proposal is approved.")
    payload = _planning_payload(p, saved)
    if payload["missing"]:
        labels = "; ".join(f"{PLAN_SECTIONS[k]['title']}: {', '.join(v)}" for k, v in payload["missing"].items())
        raise ApiError(422, "Complete the required fields before finalising the plan. " + labels)
    # Persist the effective values (including pre-filled defaults) with the final plan.
    final = {"sections": payload["sections"], "departments": saved.get("departments") or {}}
    execute("UPDATE proposals SET planning_data = CAST(:d AS jsonb), planning_status = 'Complete' WHERE id = CAST(:id AS uuid)",
            d=json.dumps(final), id=str(p["id"]))
    record_audit(g.user, "complete", "proposal_planning", str(p["id"]), {})
    Session.commit()
    p, saved = _planning_row(proposal_id)
    return jsonify(_planning_payload(p, saved))
