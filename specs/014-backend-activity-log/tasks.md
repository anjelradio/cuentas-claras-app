# Tasks: Backend Activity Log Module

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create `activity` module directory structure (`models`, `schemas`, `repositories`, `services`, `routers`) in `app/server/app/modules/activity/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T002 Create `ActivityLog` SQLModel entity inheriting from `BaseModel` in `app/server/app/modules/activity/models/activity.py`
- [x] T003 Register `ActivityLog` model in `app/server/app/db/models.py`
- [x] T004 Generate and apply Alembic migration for the `activitylog` table

---

## Phase 3: User Story 1 - Persisting Audit Events (Priority: P1) 🎯 MVP

**Goal**: Reliably capture and persist important actions happening within an event.

**Independent Test**: Perform an action (e.g., create an event) and query the database to verify the `activitylog` entry was created.

### Implementation for User Story 1

- [x] T005 [US1] Implement `ActivityRepository.create_activity` method in `app/server/app/modules/activity/repositories/activity.py`
- [x] T006 [US1] Implement `ActivityService.log_activity` public method in `app/server/app/modules/activity/services/activity.py`
- [x] T007 [US1] Integrate `ActivityService.log_activity` into existing `events` module actions (e.g., event creation) in `app/server/app/modules/events/services/events.py`

---

## Phase 4: User Story 2 - Retrieving the Activity Log (Priority: P1)

**Goal**: Expose a paginated chronological list of activities and connect the frontend infinite scroll.

**Independent Test**: Make a GET request to `/api/v1/events/{event_id}/activities?limit=10&offset=0` and see the frontend render the real data while scrolling.

### Implementation for User Story 2

- [x] T008 [P] [US2] Create Pydantic schemas (e.g., `ActivityRead`, `ActivityPaginatedRead`) in `app/server/app/modules/activity/schemas/activity.py`
- [x] T009 [US2] Add `list_activities` query method to `ActivityRepository` supporting `limit` and `offset`
- [x] T010 [US2] Add `get_event_activities` to `ActivityService`, ensuring the requesting user is a member of the event
- [x] T011 [US2] Implement the `GET /api/v1/events/{event_id}/activities` endpoint in `app/server/app/modules/activity/routers/activity.py`
- [x] T012 [US2] Register the `activity` router in the main FastAPI application registry (`app/server/app/main.py` or equivalent)
- [x] T013 [US2] Frontend: Create `app/client/src/app/(event)/_services/activity.ts` to fetch from the new endpoint
- [x] T014 [US2] Frontend: Update `ActivityList` and `page.tsx` in `app/client/src/app/(event)/[eventId]/activity/` to remove mock data and implement infinite scrolling

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T015 Run quickstart.md validation end-to-end to ensure real data flows from backend to frontend seamlessly.

---

## Dependencies & Execution Order

- **Setup & Foundational (Phase 1 & 2)**: Must happen first to establish the database schema.
- **US1 (Phase 3)**: Depends on the database schema. Can be tested entirely in the backend.
- **US2 (Phase 4)**: Depends on the database schema and ideally US1 (so there is data to fetch).
- **Polish (Phase 5)**: Final verification step.

---

## Phase 6: Deferred Tasks (Pending Dependencies)

**Purpose**: Tasks that cannot be completed right now because the required modules do not exist in the backend yet.

- [ ] T016 [US1] Integrate `ActivityService.log_activity` into `expenses` module actions (`expense_created`, `expense_updated`, `expense_voided`) once the `expenses` module is created.
- [ ] T017 [US1] Integrate `ActivityService.log_activity` into `payments` module actions (`payment_declared`, `payment_confirmed`, `payment_rejected`) once the `payments` module is created.
