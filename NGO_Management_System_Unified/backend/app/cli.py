"""Flask CLI: `flask --app wsgi init-db | create-admin | seed-demo`."""
import json
from pathlib import Path

import click
from sqlalchemy import func, select, text

from app.db import Session, get_engine
from app.models import User
from app.security import hash_password

DB_DIR = Path(__file__).resolve().parents[2] / "database"


def register_cli(app):
    @app.cli.command("init-db")
    def init_db_command():
        """Apply database/schema.sql, the upgrade migration and database/seed.sql."""
        raw = get_engine().raw_connection()
        try:
            cur = raw.cursor()
            for name in ("schema.sql", "migrations/002_proposals_planning_events.sql", "seed.sql"):
                cur.execute((DB_DIR / name).read_text(encoding="utf-8"))
                raw.commit()
                click.echo(f"applied {name}")
        finally:
            raw.close()

    @app.cli.command("create-admin")
    @click.option("--email", prompt=True)
    @click.option("--name", "full_name", prompt="Full name")
    @click.password_option(confirmation_prompt=True)
    def create_admin(email, full_name, password):
        """Create (or promote) an Admin account."""
        if len(password) < 12:
            raise click.ClickException("Password must be at least 12 characters.")
        email = email.strip().lower()
        user = Session.scalar(select(User).where(func.lower(User.email) == email))
        if user:
            user.role, user.is_active = "Admin", True
        else:
            Session.add(User(full_name=full_name, email=email, password_hash=hash_password(password), role="Admin"))
        Session.commit()
        click.echo(f"Admin ready: {email}")

    @app.cli.command("seed-demo")
    def seed_demo():
        """Insert sample proposals, events and projects (each part is skipped if its table already has rows)."""
        if Session.scalar(text("SELECT count(*) FROM proposals")):
            click.echo("Proposals already exist - skipping proposals/events.")
        else:
            Session.execute(text((DB_DIR / "sample_data.sql").read_text(encoding="utf-8")))
            Session.commit()
            click.echo("Sample proposals and events inserted.")
        if Session.scalar(text("SELECT count(*) FROM projects")):
            click.echo("Projects already exist - skipping projects.")
        else:
            Session.execute(text((DB_DIR / "sample_projects.sql").read_text(encoding="utf-8")))
            Session.commit()
            click.echo("Sample projects (for Project Reports) inserted.")
