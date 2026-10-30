import re
from threading import RLock

from sqlalchemy import MetaData, Table, create_engine, text
from sqlalchemy.exc import NoSuchTableError
from sqlalchemy.orm import scoped_session, sessionmaker

from app.errors import ApiError

Session = scoped_session(sessionmaker(autoflush=False, expire_on_commit=False))
_engine = None
_metadata = MetaData()
_tables: dict[str, Table] = {}
_lock = RLock()


def init_db(app) -> None:
    global _engine
    _engine = create_engine(app.config["DATABASE_URL"], pool_pre_ping=True)
    Session.remove()
    Session.configure(bind=_engine)
    _tables.clear()
    _metadata.clear()

    @app.teardown_appcontext
    def _remove_session(_exc):
        Session.remove()


def get_engine():
    return _engine


def reflect_table(name: str) -> Table:
    with _lock:
        if name not in _tables:
            try:
                _tables[name] = Table(name, _metadata, autoload_with=_engine)
            except NoSuchTableError as error:
                raise ApiError(503, f"Database schema is missing the required table: {name}.") from error
        return _tables[name]


_camel_boundary = re.compile(r"(?<!^)(?=[A-Z])")


def snake_case(value: str) -> str:
    return _camel_boundary.sub("_", value).lower()


def camel_case(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


def camelize(row) -> dict:
    return {camel_case(k): v for k, v in dict(row).items()}


def fetch_all(sql: str, **params) -> list[dict]:
    return [camelize(r) for r in Session.execute(text(sql), params).mappings().all()]


def fetch_one(sql: str, **params) -> dict | None:
    row = Session.execute(text(sql), params).mappings().first()
    return camelize(row) if row else None


def execute(sql: str, **params):
    return Session.execute(text(sql), params)


def record_audit(user, action: str, entity_type: str, entity_id: str, changes: dict) -> None:
    import json

    execute(
        "INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, changes) "
        "VALUES (CAST(:actor AS uuid), :action, :etype, :eid, CAST(:changes AS jsonb))",
        actor=str(user.id), action=action, etype=entity_type, eid=entity_id, changes=json.dumps(changes),
    )
