from calendar import month_name
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Any

from flask import Blueprint, g, jsonify
from sqlalchemy import case, func, select

from app.db import Session
from app.errors import ApiError
from app.records import _table
from app.security import login_required

bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

PROJECT_STATUS = {
    "Active": ("Active", "#1AACB8"),
    "Upcoming": ("Planning", "#6366F1"),
    "Completed": ("Completed", "#10B981"),
    "On Hold": ("On Hold", "#F59E0B"),
    "Archived": ("Archived", "#94A3B8"),
}


def _count(db, resource: str, *conditions: Any) -> int:
    table = _table(db, resource)
    query = select(func.count()).select_from(table)
    if conditions:
        query = query.where(*conditions)
    return int(db.scalar(query) or 0)


def _month_start(month: date) -> date:
    return month.replace(day=1)


def _month_offset(month: date, offset: int) -> date:
    month_number = month.year * 12 + month.month - 1 + offset
    return date(month_number // 12, month_number % 12 + 1, 1)


def _upcoming_events(db) -> list[dict[str, str]]:
    events = _table(db, "events")
    rows = db.execute(
        select(events.c.title, events.c.starts_at, events.c.location, events.c.event_type)
        .where(events.c.starts_at >= datetime.now(timezone.utc), events.c.status == "Scheduled")
        .order_by(events.c.starts_at.asc())
        .limit(5)
    ).mappings().all()
    return [
        {
            "title": row["title"],
            "date": row["starts_at"].isoformat() if row["starts_at"] else "",
            "location": row["location"],
            "type": row["event_type"],
        }
        for row in rows
    ]


def _pending_tasks(db, *, assignee_id=None) -> list[dict[str, str]]:
    tasks = _table(db, "tasks")
    query = select(tasks.c.title, tasks.c.status, tasks.c.priority, tasks.c.due_date).where(
        tasks.c.status != "Done"
    )
    if assignee_id is not None:
        query = query.where(tasks.c.assignee_id == assignee_id)
    rows = db.execute(
        query.order_by(
            case(
                (tasks.c.priority == "Critical", 0),
                (tasks.c.priority == "High", 1),
                (tasks.c.priority == "Medium", 2),
                else_=3,
            ),
            tasks.c.due_date.asc().nulls_last(),
        ).limit(5)
    ).mappings().all()
    return [
        {
            "task": row["title"],
            "priority": row["priority"],
            "due": row["due_date"].isoformat() if row["due_date"] else "No due date",
        }
        for row in rows
    ]


@bp.get("/reminders")
@login_required
def get_reminders():
    user, db = g.user, Session
    if user.role not in {"Admin", "Project Manager", "Staff", "Volunteer", "Board"}:
        raise ApiError(403, "You do not have permission to view reminders.")

    if user.role == "Volunteer":
        pending_tasks = _pending_tasks(db, assignee_id=user.id)
    elif user.role in {"Admin", "Project Manager", "Staff"}:
        pending_tasks = _pending_tasks(db)
    else:
        pending_tasks = []

    return jsonify({
        "upcomingEvents": _upcoming_events(db),
        "pendingTasks": pending_tasks,
    })


@bp.get("")
@login_required
def get_dashboard():
    user, db = g.user, Session
    if user.role not in {"Admin", "Project Manager", "Staff"}:
        raise ApiError(403, "You do not have permission to view dashboard data.")

    today = date.today()
    current_month = _month_start(today)
    first_month = _month_offset(current_month, -6)

    projects = _table(db, "projects")
    project_rows = db.execute(
        select(
            projects.c.id,
            projects.c.name,
            projects.c.status,
            projects.c.progress,
            projects.c.end_date,
        )
        .order_by(projects.c.updated_at.desc())
        .limit(5)
    ).mappings().all()
    project_counts = {
        row["status"]: int(row["count"])
        for row in db.execute(
            select(projects.c.status, func.count().label("count")).group_by(projects.c.status)
        ).mappings()
    }

    project_ids = [row["id"] for row in project_rows]
    budgets_by_project: dict[Any, Decimal] = {}
    if project_ids:
        budget_items = _table(db, "budget-items")
        budget_rows = db.execute(
            select(
                budget_items.c.project_id,
                budget_items.c.quantity,
                budget_items.c.unit_cost,
            ).where(budget_items.c.project_id.in_(project_ids))
        ).mappings()
        for row in budget_rows:
            budgets_by_project[row["project_id"]] = budgets_by_project.get(row["project_id"], Decimal(0)) + (
                Decimal(str(row["quantity"] or 0)) * Decimal(str(row["unit_cost"] or 0))
            )

    team_members = _table(db, "team-members")
    team_rows = db.execute(
        select(team_members.c.project_id, team_members.c.name)
        .where(team_members.c.project_id.in_(project_ids), team_members.c.member_group == "Core")
        .order_by(team_members.c.created_at.asc())
    ).mappings().all() if project_ids else []
    leads = {}
    for row in team_rows:
        leads.setdefault(row["project_id"], row["name"])

    recent_projects = [
        {
            "name": row["name"],
            "status": PROJECT_STATUS.get(row["status"], (row["status"], ""))[0],
            "lead": leads.get(row["id"], "—"),
            "budget": float(budgets_by_project.get(row["id"], Decimal(0))),
            "progress": int(row["progress"] or 0),
            "deadline": row["end_date"].isoformat() if row["end_date"] else None,
        }
        for row in project_rows
    ]

    contributions = _table(db, "contributions")
    contribution_rows = db.execute(
        select(contributions.c.contributed_on, contributions.c.amount)
        .where(
            contributions.c.contributed_on >= first_month,
            contributions.c.contributed_on <= today,
            contributions.c.status == "Received",
            contributions.c.currency == "INR",
        )
    ).mappings().all()
    donations_by_month: dict[date, Decimal] = {}
    for row in contribution_rows:
        month = _month_start(row["contributed_on"])
        donations_by_month[month] = donations_by_month.get(month, Decimal(0)) + Decimal(str(row["amount"] or 0))
    donation_trend = [
        {
            "month": month.isoformat(),
            "label": f"{month_name[month.month][:3]} {month.year}",
            "amount": float(donations_by_month.get(month, Decimal(0))),
        }
        for month in (_month_offset(current_month, offset) for offset in range(-6, 1))
    ]
    current_donations = float(donations_by_month.get(current_month, Decimal(0)))
    peak_month = max(donation_trend, key=lambda item: item["amount"], default={"label": "—", "amount": 0})
    if peak_month["amount"] == 0:
        peak_month = {"label": "No donations yet", "amount": 0}

    tasks = _table(db, "tasks")
    task_status = tasks.c.status

    assignments = _table(db, "volunteer-assignments")
    assignment_projects = _table(db, "projects")
    assignment_rows = db.execute(
        select(assignment_projects.c.name, func.count(assignments.c.id).label("assignments"))
        .select_from(assignments.join(assignment_projects, assignments.c.project_id == assignment_projects.c.id))
        .where(assignments.c.status == "Active")
        .group_by(assignment_projects.c.name)
        .order_by(func.count(assignments.c.id).desc(), assignment_projects.c.name.asc())
        .limit(6)
    ).mappings().all()

    month_start_datetime = datetime.combine(today, time.min)
    next_day_datetime = month_start_datetime + timedelta(days=1)
    beneficiary_table = _table(db, "beneficiaries")
    enrollments = _table(db, "beneficiary-enrollments")
    beneficiary_count = int(
        db.scalar(
            select(func.count(func.distinct(enrollments.c.beneficiary_id))).where(
                enrollments.c.status == "Active"
            )
        )
        or 0
    )
    proposal_table = _table(db, "proposals")

    return jsonify({
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "activeProjects": project_counts.get("Active", 0),
            "totalProjects": sum(project_counts.values()),
            "activeVolunteers": _count(db, "volunteers", _table(db, "volunteers").c.status == "Active"),
            "beneficiariesServed": beneficiary_count,
            "fundsRaisedThisMonth": current_donations,
            "totalDonors": _count(db, "donors"),
            "activeCampaigns": _count(db, "campaigns", _table(db, "campaigns").c.status == "Active"),
            "pendingProposals": _count(db, "proposals", proposal_table.c.status.in_(("Submitted", "Under Review", "Financial Review"))),
            "tasksCompletedToday": _count(
                db,
                "tasks",
                task_status == "Done",
                tasks.c.updated_at >= month_start_datetime,
                tasks.c.updated_at < next_day_datetime,
            ),
            "newBeneficiariesThisMonth": _count(
                db,
                "beneficiaries",
                beneficiary_table.c.created_at >= datetime.combine(current_month, time.min),
                beneficiary_table.c.created_at < next_day_datetime,
            ),
            "pendingTasks": _count(db, "tasks", task_status != "Done"),
            "activeAssignments": _count(db, "volunteer-assignments", assignments.c.status == "Active"),
            "averageProjectProgress": round(
                sum(int(row["progress"] or 0) for row in db.execute(select(projects.c.progress)).mappings())
                / sum(project_counts.values())
            ) if project_counts else 0,
        },
        "projectStatus": [
            {"name": name, "value": project_counts.get(status, 0), "color": color}
            for status, (name, color) in PROJECT_STATUS.items()
            if project_counts.get(status, 0)
        ],
        "donationTrend": donation_trend,
        "peakDonationMonth": peak_month,
        "volunteerActivity": [
            {"dept": row["name"], "assignments": int(row["assignments"])}
            for row in assignment_rows
        ],
        "recentProjects": recent_projects,
        "upcomingEvents": _upcoming_events(db),
        "pendingTasks": _pending_tasks(db),
    })
