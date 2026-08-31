# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Implement a new `activity` module in the FastAPI backend to persist an audit log of event actions, and connect the existing React frontend to this new API using an infinite scroll mechanism.

## Technical Context

**Language/Version**: Python 3.12 (Backend) / TypeScript & Next.js 15 (Frontend)
**Primary Dependencies**: FastAPI, SQLModel, Alembic (Backend); React, SWR/Infinite Query or basic IntersectionObserver (Frontend)
**Storage**: PostgreSQL (via SQLModel)
**Testing**: pytest (Backend integration tests)
**Target Platform**: Web
**Project Type**: Full-stack feature (FastAPI backend + Next.js frontend)
**Performance Goals**: Fast paginated queries using `limit`/`offset` and appropriate database indexing on `event_id` and `created_at`.
**Constraints**: Follow Constitution for backend module structure (`routers`, `services`, `repositories`, `models`), use `BaseModel` for persistence, and handle cross-module collaboration via public services. Frontend must respect the `Page -> Component -> Service -> API Client` dependency flow.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Monorepo & Separation**: Complies. Code strictly split between `app/server` and `app/client`.
- **IV. Backend Architecture**: Complies. A new capability-oriented module `app/server/app/modules/activity/` will be created.
- **V. Dependency Direction**: Complies. Router -> Service -> Repository -> Database.
- **IX. SQLModel & Alembic**: Complies. New model `ActivityLog` will inherit from `BaseModel` and be registered in `app/server/app/db/models.py`.
- **XI. Module Encapsulation**: Complies. `events` and other modules will call a public service exposed by `activity` to log actions, avoiding direct DB writes to another module's repository.
- **XIV. Authorization**: Complies. Event membership check happens in the backend service.
- **XVIII-XIX. Frontend Architecture**: Complies. Frontend services will encapsulate API calls.

## Project Structure

### Documentation (this feature)

```text
specs/014-backend-activity-log/
├── plan.md              
├── research.md          
├── data-model.md        
└── quickstart.md        
```

### Source Code (repository root)

```text
app/server/
├── app/db/models.py               # Register new model here
├── app/modules/activity/
│   ├── models/activity.py         # SQLModel entity
│   ├── schemas/activity.py        # Pydantic schemas (e.g. ActivityRead)
│   ├── repositories/activity.py   # DB access (save, query with limit/offset)
│   ├── services/activity.py       # Core logic, auth checks, public logger function
│   └── routers/activity.py        # API endpoint definitions
└── app/modules/events/            
    └── services/                  # Will be updated to call activity logger

app/client/
└── src/app/(event)/
    ├── _services/activity.ts      # Fetch logic calling backend endpoint
    └── [eventId]/activity/
        └── _components/           # Update ActivityList for infinite scroll
```

**Structure Decision**: 
Backend: We will create the `activity` module following standard patterns. The `events` module (and later others) will consume a public logging function from `activity/services/activity.py`.
Frontend: The pre-existing Activity log UI will be updated to remove mock data. A new `_services/activity.ts` will fetch the paginated data, and an IntersectionObserver-based sentinel will trigger subsequent fetches in the components.
