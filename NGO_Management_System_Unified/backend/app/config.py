import os

from dotenv import load_dotenv

load_dotenv()


def load_config(overrides: dict | None = None) -> dict:
    cfg = {
        "ENVIRONMENT": os.getenv("ENVIRONMENT", "development"),
        "DATABASE_URL": os.getenv("DATABASE_URL", ""),
        "JWT_SECRET": os.getenv("JWT_SECRET", ""),
        "JWT_EXPIRE_MINUTES": int(os.getenv("JWT_EXPIRE_MINUTES", "10080")),
        "SESSION_COOKIE_SECURE": os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true",
        "APP_ORIGIN": os.getenv("APP_ORIGIN", "http://localhost:5174"),
        "HOST": os.getenv("HOST", "127.0.0.1"),
        "PORT": int(os.getenv("PORT", "8000")),
        "RATELIMIT_ENABLED": True,
        "RATELIMIT_STORAGE_URI": "memory://",
    }
    cfg.update(overrides or {})
    if cfg["ENVIRONMENT"] not in {"development", "test", "production"}:
        raise RuntimeError("ENVIRONMENT must be development, test, or production")
    if not cfg["DATABASE_URL"]:
        raise RuntimeError("DATABASE_URL is required (see backend/.env.example)")
    if len(cfg["JWT_SECRET"]) < 32:
        raise RuntimeError("JWT_SECRET must contain at least 32 characters")
    if not 5 <= cfg["JWT_EXPIRE_MINUTES"] <= 43200:
        raise RuntimeError("JWT_EXPIRE_MINUTES must be between 5 and 43200")
    if cfg["ENVIRONMENT"] == "production" and not cfg["SESSION_COOKIE_SECURE"]:
        raise RuntimeError("SESSION_COOKIE_SECURE must be true in production")
    return cfg
