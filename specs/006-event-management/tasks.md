---
description: "Task list for Event Management backend implementation"
---

# Tasks: Event Management

**Input**: Design documents from `/specs/006-event-management/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Tests are included as per standard testing requirements.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [x] T001 Create module directory structure (`routers`, `services`, `schemas`, `repositories`, `models`) in `app/server/app/modules/events/`
- [x] T002 [P] Create `__init__.py` files for all created directories to make them Python packages.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

- [x] T003 Create proxy User model (without inheriting `BaseModel`) in `app/server/app/modules/events/models/user_proxy.py` to allow SQLAlchemy relationships.
- [x] T004 Define `EventStatus` and `MemberStatus` enums in `app/server/app/modules/events/models/enums.py`.
- [x] T005 [P] Register the new models in the canonical registry at `app/server/app/db/models.py` (importing the enums and proxy).
- [x] T006 [P] Add domain exception classes (`NotFoundError`, `ForbiddenError`, `ValidationError`) mapped to the centralized exception handlers in the appropriate shared/exception module, if not already present.
- [x] T006a [P] Add `INVITATION_EXPIRE_DAYS` to `.env.example` and register it in the backend's core configuration/settings class (`app/server/app/core/config.py` or similar).

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Creación y Visualización de Eventos (Priority: P1) 🎯 MVP

**Goal**: As an authenticated user, I want to create new events, view their details, and see a list of all events I am a part of.

**Independent Test**: Can be tested by creating an event, listing the user's events, and retrieving the event details via cURL or Swagger UI.

### Tests for User Story 1 (OPTIONAL) ⚠️

- [ ] T007 [P] [US1] Create unit tests for event creation in `app/server/tests/modules/events/test_event_service.py`
- [ ] T008 [P] [US1] Create integration tests for POST and GET endpoints in `app/server/tests/modules/events/test_event_api.py`

### Implementation for User Story 1

- [x] T009 [P] [US1] Create `Event` model inheriting from BaseModel in `app/server/app/modules/events/models/event.py`
- [x] T010 [P] [US1] Create `EventMember` model inheriting from BaseModel in `app/server/app/modules/events/models/event_member.py`
- [x] T011 [P] [US1] Define `EventCreateRequest`, `EventRead`, `EventSummaryRead`, and `EventDetailRead` schemas in `app/server/app/modules/events/schemas/event_schemas.py`
- [x] T012 [US1] Implement `EventRepository` and `MemberRepository` for creation and listing in `app/server/app/modules/events/repositories/event_repository.py` and `member_repository.py`
- [x] T013 [US1] Implement `EventService` (create event logic, list events) in `app/server/app/modules/events/services/event_service.py`
- [x] T014 [US1] Implement POST `/api/events`, GET `/api/events`, and GET `/api/events/{event_id}` endpoints in `app/server/app/modules/events/routers/event_router.py`

**Checkpoint**: User Story 1 is fully functional. Users can create events and view them.

---

## Phase 4: User Story 2 - Modificación y Ciclo de Vida del Evento (Priority: P2)

**Goal**: As an event owner, I want to update my event's details, change its status, or logically delete it.

**Independent Test**: Can be tested by taking an existing open event, updating it, closing it, transferring ownership, and soft deleting it.

### Tests for User Story 2 (OPTIONAL) ⚠️

- [ ] T015 [P] [US2] Create integration tests for PATCH and DELETE endpoints in `app/server/tests/modules/events/test_event_lifecycle_api.py`

### Implementation for User Story 2

- [x] T016 [P] [US2] Define `EventUpdateRequest` and ownership transfer schemas in `app/server/app/modules/events/schemas/event_schemas.py`
- [x] T017 [US2] Add update and soft-delete methods to `EventRepository`
- [x] T018 [US2] Add lifecycle methods (update, delete, transfer_ownership) in `EventService`, enforcing ownership checks and active member checks.
- [x] T019 [US2] Implement PATCH `/api/events/{event_id}`, DELETE `/api/events/{event_id}`, and POST `/api/events/{event_id}/transfer-ownership` in `event_router.py`

**Checkpoint**: Event lifecycle and ownership transfer are functional.

---

## Phase 5: User Story 4 - Generación de Invitaciones (Priority: P2)

**Goal**: As an event owner, I want to generate an invitation code to share with other users.

**Independent Test**: Can be tested by generating an invite as the owner, and verifying it returns an existing active one or creates a new one.

### Tests for User Story 4 (OPTIONAL) ⚠️

- [ ] T020 [P] [US4] Create unit tests for invitation logic in `app/server/tests/modules/events/test_invitation_service.py`

### Implementation for User Story 4

- [x] T021 [P] [US4] Create `EventInvitation` model inheriting from BaseModel in `app/server/app/modules/events/models/event_invitation.py`
- [x] T022 [P] [US4] Define `EventInvitationRead` schema in `app/server/app/modules/events/schemas/invitation_schemas.py`
- [x] T023 [US4] Implement `InvitationRepository` in `app/server/app/modules/events/repositories/invitation_repository.py`
- [x] T024 [US4] Implement `InvitationService` with token generation (6 chars `secrets`) and expiration logic (reading `INVITATION_EXPIRE_DAYS` from config) in `app/server/app/modules/events/services/invitation_service.py`
- [x] T025 [US4] Implement POST `/api/events/{event_id}/invitations` in `event_router.py`

**Checkpoint**: Owners can generate and manage invitations.

---

## Phase 6: User Story 3 - Gestión de Membresía del Evento (Priority: P3)

**Goal**: As a user, I want to join an event via a code, or leave an event if I no longer wish to participate.

**Independent Test**: Can be tested by joining an event with a valid code, verifying active membership, and then leaving the event.

### Tests for User Story 3 (OPTIONAL) ⚠️

- [ ] T026 [P] [US3] Create integration tests for join/leave/remove endpoints in `app/server/tests/modules/events/test_membership_api.py`

### Implementation for User Story 3

- [x] T027 [P] [US3] Define join payload schemas in `app/server/app/modules/events/schemas/member_schemas.py`
- [x] T028 [US3] Add methods to `MemberRepository` to update member status to `LEFT` or `REMOVED`.
- [x] T029 [US3] Implement join, leave, and remove logic in `EventService` or `MemberService` (handling token validation).
- [x] T030 [US3] Implement POST `/api/events/join`, POST `/api/events/{event_id}/leave`, and DELETE `/api/events/{event_id}/members/{user_id}` in `event_router.py`

**Checkpoint**: All user stories should now be independently functional. Users can join, leave, and be removed from events.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [x] T031 [P] Generate the initial Alembic migration script (`alembic revision --autogenerate -m "Initial schema"`) covering all models including the proxy User model.
- [x] T032 [P] Verify JWT Better Auth integration globally across all `event_router.py` endpoints via `Depends()`.
- [x] T033 Execute `alembic upgrade head` locally to ensure migrations apply correctly.
- [ ] T034 Run the `quickstart.md` validation scenarios.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- Schemas, Models, and empty Repositories can often be scaffolded in parallel per User Story.
- The `EventInvitation` and `EventMember` structures can be built simultaneously by different developers once the base `Event` is available.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and 2 (Setup & Foundational).
2. Complete Phase 3 (US1).
3. Validate: Users can create and view events.
4. Proceed to US2, US4, and US3 incrementally.

---

## Phase 8: Convergence

**Purpose**: Address gaps identified between the implementation and the specifications/constitution.

- [x] T035 [US2] Allow changing event status from `closed` back to `open` (reopening) in `EventService.update_event`, which currently blocks all updates on closed events per `FR-004` (`partial`)
- [x] T036 [US1] Populate `owner_name` in `EventDetailRead` by joining or querying the `User` proxy model in `EventService.get_event` per `FR-007` (`partial`)
