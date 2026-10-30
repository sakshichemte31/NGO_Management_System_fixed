from getpass import getpass
from sqlalchemy import select
from app import create_app
from app.db import Session
from app.models import User
from app.security import hash_password

app = create_app()

with app.app_context():
    name = input("Project Manager full name: ").strip()
    email = input("Project Manager email: ").strip().lower()
    password = getpass("Password (minimum 12 characters): ")

    if len(name) < 2:
        raise SystemExit("Enter a valid name.")

    if len(password) < 12 or len(password.encode()) > 128:
        raise SystemExit("Password must be 12 to 128 characters.")

    existing = Session.scalar(select(User).where(User.email == email))

    if existing:
        raise SystemExit("This email already exists.")

    user = User(
        full_name=name,
        email=email,
        password_hash=hash_password(password),
        role="Project Manager",
        is_active=True
    )

    Session.add(user)
    Session.commit()

    print("Project Manager account created successfully.")
