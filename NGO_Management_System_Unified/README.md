# NGO Management System

NGO operations application with a React, TypeScript, and Vite frontend, a Flask backend, and PostgreSQL database scripts. The repository is organized into three application folders: `frontend/`, `backend/`, and `database/`.

## Requirements

- Node.js 22 (see `frontend/.mise.toml`)
- pnpm 10.34.3 (see `frontend/.mise.toml`)

## Development

```sh
cd frontend
pnpm install
pnpm dev       # Vite on http://localhost:5174 by default
pnpm build     # production build in dist/
pnpm preview   # preview the build on port 8443 by default
pnpm format    # format files with oxfmt
```

Set `PORT` to override the development or preview port. The dev server uses `5174` by default; preview uses `8443`.

## Sign-In

Authentication is backed by the Flask service and PostgreSQL. Follow [backend/README.md](backend/README.md) to configure the database and start the API, then run the Vite frontend with `npm run dev`. Open `/login` to sign in or `/register` to create a Volunteer account. Authenticated pages redirect to sign-in when the session is missing or expired.

## Modules

- Core operations: dashboard, projects, proposals, planning, events, beneficiaries, resources, occasions, engagement, outcomes, communications, reports, and administration.
- Birthday Project: `/birthday-project/dashboard`, `/profiles`, `/occasions`, `/engagement`, `/outcomes`, `/departments`, `/reports`, and `/action-workspace`.
- Donor Management: `/donor-management/admin/dashboard`, `/directory`, `/contributions`, `/campaigns`, `/communications`, `/followup`, and `/reports`.
- People Management: `/people-management`, `/people-management/hr`, `/people-management/interns`, and `/people-management/volunteers`.

Project management routes include `/projects`, `/projects/create`, `/projects/planning`, `/projects/proposals`, `/projects/reports`, and `/projects/:id`.

## Project Map

- `frontend/src/App.tsx` registers routes; `frontend/src/components/Layout.tsx` defines the shared application shell and navigation.
- `frontend/src/pages/` contains the feature modules; `frontend/src/components/` contains shared UI.
- `frontend/src/services/` contains API clients and feature services; `frontend/src/data/` contains prototype seed data.
- `frontend/src/types/project.ts` defines project-domain types.
- `API_CONTRACT.md` documents the proposed project API and data model. It is a backend integration contract, not a live API.
- `frontend/.figma/make/` contains Figma Make development and deployment integration scripts.
- `backend/app/` contains the Flask app (blueprints for auth, proposals/planning, events, dashboard, reports and generic CRUD) and database integration; `backend/tests/` contains pytest tests.
- `database/schema.sql` and `database/seed.sql` define and seed the PostgreSQL schema.

## Data and Authentication

The Flask service connects to PostgreSQL, stores Argon2 password hashes and revocable JWT sessions, and provides authenticated CRUD endpoints for the persisted NGO data tables. Resource access is checked server-side and mutations are written to the audit log. The main dashboard, project reports, **Proposals, Detailed Planning and Events (including registrations and the calendar)** call the API.

Most other React feature pages still use mock data or browser storage and are not yet connected to the backend. The application is therefore not production-ready until those service integrations and end-to-end workflows are completed and verified. See [backend/README.md](backend/README.md) for setup, endpoint conventions, and deployment requirements.

## PostgreSQL

`database/schema.sql` creates the PostgreSQL schema for NGO operations, and `database/seed.sql` inserts the department lookup rows. For the Windows PostgreSQL, backend environment, migration, and local server commands, follow [backend/README.md](backend/README.md#local-setup). Keep database credentials and beneficiary/donor personal data on the server, never in browser code.
