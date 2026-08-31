# Implementation Plan: Event Management

**Branch**: `006-event-management` | **Date**: 2026-08-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-event-management/spec.md`

## Summary

Implement the backend `events` module for the Cuentas Claras application. This includes creating the `events`, `event_members`, and `event_invitations` models using SQLModel (inheriting from `BaseModel`), configuring Alembic migrations by adding them to the canonical registry, and implementing the layered architecture (Routers, Services, Repositories, Schemas) following the constitution's guidelines. Endpoints will be protected via JWT validation from Better Auth. Includes standardized error handling and 404 responses for missing entities.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI, SQLModel, Alembic, Pydantic, Better Auth (JWKS for auth)
**Storage**: PostgreSQL
**Testing**: pytest
**Target Platform**: Linux server
**Project Type**: web-service (Backend module)
**Performance Goals**: N/A
**Constraints**: JWT validation using Better Auth, Soft delete for events
**Error Handling Strategy**: Follow standard centralized exception handling from the backend (Principle XV). Services must raise domain exceptions (like NotFoundError) which global handlers translate into standardized JSON error responses, guaranteeing clear `404 Not Found` returns when an event or entity is not found.
**Configuration**: Token expiration duration must be read from an environment variable (e.g. `INVITATION_EXPIRE_DAYS`). This variable must be added to `.env.example` and the backend's core configuration/settings class.
**Scale/Scope**: 3 Models, CRUD APIs, Invitations logic

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Monorepo compliance**: Backend code will go strictly into `app/server/app/modules/events/`.
- [x] **Layered Architecture**: Routers -> Services -> Repositories -> Models.
- [x] **Persistence Framework**: SQLModel and Alembic. All models inherit from `app/server/app/db/base.py`'s `BaseModel`.
- [x] **Canonical Registry & Migrations**: Models will be added to `app/server/app/db/models.py`. As this is the first migration being made, it will centralize all models (including the proxy `User` model for Better Auth) and generate the initial database schema script.
- [x] **Authentication**: Validate JWT using Better Auth (no global roles, just UUID in `event_members` or `events`).
- [x] **Centralized Exception Handling**: Use domain exceptions in services; no manual HTTP responses built in routers.

## Project Structure

### Documentation (this feature)

```text
specs/006-event-management/
├── plan.md              # This file
├── research.md          
├── data-model.md        
├── quickstart.md        
└── contracts/           
```

### Source Code (repository root)

```text
app/server/
├── app/
│   ├── db/
│   │   └── models.py (updated canonical registry)
│   └── modules/
│       └── events/
│           ├── routers/
│           │   └── event_router.py
│           ├── schemas/
│           │   ├── event_schemas.py
│           │   ├── member_schemas.py
│           │   └── invitation_schemas.py
│           ├── services/
│           │   ├── event_service.py
│           │   └── invitation_service.py
│           ├── repositories/
│           │   ├── event_repository.py
│           │   ├── member_repository.py
│           │   └── invitation_repository.py
│           └── models/
│               ├── event.py
│               ├── event_member.py
│               └── event_invitation.py
└── tests/
    └── modules/
        └── events/
```

**Structure Decision**: Standard modular FastAPI backend as mandated by the constitution (Principle IV).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations.
