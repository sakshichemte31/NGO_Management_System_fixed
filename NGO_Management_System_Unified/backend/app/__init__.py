import logging

from flask import Flask, jsonify, request
from sqlalchemy import text

from app.config import load_config
from app.db import Session, init_db
from app.errors import ApiError, register_error_handlers
from app.jsonutil import ApiJSONProvider
from app.limiter import limiter
from app.records import build_resource_blueprint

logger = logging.getLogger(__name__)


def create_app(overrides: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.update(load_config(overrides))
    app.json = ApiJSONProvider(app)
    app.url_map.strict_slashes = False
    init_db(app)
    limiter.init_app(app)
    register_error_handlers(app)

    @app.before_request
    def require_expected_origin():
        origin = request.headers.get("Origin")
        if (request.path.startswith("/api/") and request.method not in {"GET", "HEAD", "OPTIONS"}
                and origin and origin != app.config["APP_ORIGIN"]):
            raise ApiError(403, "Request origin is not allowed.")

    @app.get("/api/health")
    def health():
        try:
            Session.execute(text("SELECT 1"))
        except Exception as error:
            logger.exception("Database health check failed")
            raise ApiError(503, "Database is unavailable.") from error
        return jsonify({"status": "ok"})

    from app import admin, auth, dashboard, events, proposals, reports

    for module in (auth, admin, dashboard, reports, proposals, events):
        app.register_blueprint(module.bp)

    # Other modules (owned by teammates) keep the generic, role-checked CRUD endpoints.
    app.register_blueprint(build_resource_blueprint("projects_api", (
        "projects", "team-members", "partners", "milestones", "tasks", "department-checklists", "documents",
        "budget-items", "expenses", "funding-sources", "impact-indicators", "impact-measurements", "resources",
        "risks", "activity")))
    app.register_blueprint(build_resource_blueprint("beneficiaries_api", (
        "beneficiaries", "beneficiary-enrollments", "beneficiary-services")))
    app.register_blueprint(build_resource_blueprint("donors_api", (
        "donors", "donor-occasions", "campaigns", "contributions", "donor-interactions")))
    app.register_blueprint(build_resource_blueprint("people_api", (
        "staff", "staff-attendance", "volunteers", "volunteer-assignments", "intern-applications")))
    app.register_blueprint(build_resource_blueprint("communications_api", ("communications",)))

    from app.cli import register_cli

    register_cli(app)
    return app
