"""Tests run against a real PostgreSQL database (TEST_DATABASE_URL or DATABASE_URL) with schema.sql applied."""
import os
import uuid

import pytest
from sqlalchemy import text

from app import create_app
from app.db import Session
from app.models import User
from app.security import hash_password

PASSWORD = "Password12345!"


@pytest.fixture(scope="session")
def app():
    url = os.getenv("TEST_DATABASE_URL") or os.environ["DATABASE_URL"]
    app = create_app({"ENVIRONMENT": "test", "DATABASE_URL": url, "RATELIMIT_ENABLED": False,
                      "JWT_SECRET": os.getenv("JWT_SECRET", "x" * 40)})
    return app


@pytest.fixture()
def ctx(app):
    with app.app_context():
        yield
        Session.rollback()


def make_user(role: str) -> str:
    email = f"{role.lower().replace(' ', '')}-{uuid.uuid4().hex[:8]}@test.org"
    Session.add(User(full_name=f"Test {role}", email=email, password_hash=hash_password(PASSWORD), role=role))
    Session.commit()
    return email


@pytest.fixture()
def login(app, ctx):
    def _login(role: str):
        client = app.test_client()
        email = make_user(role)
        res = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
        assert res.status_code == 200, res.get_json()
        return client

    return _login


@pytest.fixture(autouse=True, scope="session")
def cleanup(app):
    yield
    with app.app_context():
        Session.execute(text("DELETE FROM events WHERE title LIKE 'TEST %'"))
        Session.execute(text("DELETE FROM proposals WHERE title LIKE 'TEST %'"))
        Session.execute(text("DELETE FROM users WHERE email LIKE '%@test.org'"))
        Session.commit()
