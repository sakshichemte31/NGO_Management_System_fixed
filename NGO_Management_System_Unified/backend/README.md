# Backend API (Flask + PostgreSQL)

Flask service for authentication and persistent NGO data, backed by PostgreSQL (SQLAlchemy + psycopg 3), revocable JWT cookie sessions, Argon2 password hashing and role-based access control.

## Quick start

```sh
# 1. Database (PostgreSQL 14+)
psql -U postgres -c "CREATE ROLE ngo_app LOGIN PASSWORD 'change-me';" -c "CREATE DATABASE ngo_management OWNER ngo_app;"

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env                                      # set DATABASE_URL and JWT_SECRET
flask --app wsgi init-db                                  # applies schema.sql, migration 002 and seed.sql
flask --app wsgi create-admin                             # first Admin account
flask --app wsgi seed-demo                                # optional: sample proposals + events
flask --app wsgi run --port 8000                          # or: python wsgi.py
```

Check `http://127.0.0.1:8000/api/health`, then run the frontend (`cd frontend && npm install && npm run dev`, port 5174; Vite proxies `/api` to port 8000).
Production: `gunicorn -w 4 -b 127.0.0.1:8000 wsgi:app` behind HTTPS (`ENVIRONMENT=production`, `SESSION_COOKIE_SECURE=true`).

Existing database created from an older `schema.sql`? Run `database/migrations/002_proposals_planning_events.sql` once.

## Proposals, Planning and Events API (fully implemented)

All endpoints require sign-in. Reads: Admin / Project Manager / Staff. Writes: Admin / Project Manager / Staff, except review decisions (Admin / Project Manager). Errors are `{"detail": "..."}` (422 validation, 403 permission, 404 missing, 409 conflict).

| Method & path | Purpose |
|---|---|
| `GET /api/proposals?status=&search=&limit=&offset=` | List with per-status `counts` |
| `POST /api/proposals` | Create (`submit: false` saves a draft). Code `PP-YYYY-NNN` is generated |
| `GET/PATCH/DELETE /api/proposals/{id}` | Read, edit (Draft/Submitted only), delete (Draft only) |
| `POST /api/proposals/{id}/transition` | `{status, notes}` - lifecycle: Draft -> Submitted -> Under Review -> Financial Review -> Approved/Rejected; Withdraw / Reopen. Reject needs notes |
| `GET /api/planning/proposals` | Approved proposals eligible for planning |
| `GET/PUT /api/proposals/{id}/planning` | Seven planning sections + 9 department owners (approved proposals only) |
| `POST /api/proposals/{id}/planning/complete` | Validates required fields, marks the plan Complete |
| `GET /api/departments` | Department lookup |
| `GET/POST /api/events`, `GET/PATCH/DELETE /api/events/{id}` | Events (filters: `status`, `eventType`, `from`, `to`, `search`, `projectId`) with registered/attended counts |
| `GET /api/events/stats` | Totals for the summary cards |
| `GET/POST /api/events/{id}/registrations` | Capacity-checked registration of users, beneficiaries or donors |
| `PATCH/DELETE /api/event-registrations/{id}` | Attendance status / remove |
| `GET /api/events/people?type=&search=` | Lookup people to register |

Other modules (projects, beneficiaries, donors, people, communications, dashboard, reports, admin) keep their existing generic endpoints `/api/{resource}`: list (`limit`, `offset`, `search`, `sort`, `order`, exact filters), `GET/PATCH/DELETE /api/{resource}/{id}`, `POST /api/{resource}`; camelCase fields; writes are audit-logged.

## Tests

Tests use a real PostgreSQL database with the schema applied:

```sh
cd backend && DATABASE_URL=postgresql+psycopg://... JWT_SECRET=<32+ chars> python -m pytest -q
```
