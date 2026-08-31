# Implementation Tasks: events-backend-integration

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Clean up project structure and establish centralized directories per the constitution.

- [X] T001 Remove unused folders `app/client/src/app/(event)/[eventId]/_data`, `_types`, and `_tests`.
- [X] T002 [P] Create centralized `app/client/src/app/(event)/_types` directory and `event.ts` for frontend data models.
- [X] T003 [P] Create centralized `app/client/src/app/(event)/_services` directory and `event-api.ts`.

---

## Phase 2: Foundational (Backend Modifications)

**Purpose**: Core backend changes that MUST be complete before ANY frontend user story can be implemented.

- [X] T004 Update backend `User` proxy model in `app/server/app/modules/events/models/user_proxy.py` to include `image: str | None`.
- [X] T005 Update backend `EventDetailRead` schema in `app/server/app/modules/events/schemas/event_schemas.py` to include `is_owner: bool`.
- [X] T006 Update `EventService.get_event_detail` in `app/server/app/modules/events/services/event_service.py` to calculate and return `is_owner`.

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Create and Edit Events (Priority: P1) 🎯 MVP

**Goal**: Connect the EventForm to the backend for creating and updating events.

**Independent Test**: Can fill out the form on the create or edit page, and a successful mutation reflects in the backend with a success toast.

### Implementation for User Story 1

- [X] T007 [P] [US1] Implement `createEvent` and `updateEvent` in `app/client/src/app/(event)/_services/event-api.ts` with Next.js router/Sonner error handling.
- [X] T008 [US1] Wire up `EventForm` in `app/client/src/app/(event)/_components/event-form.tsx` to consume the API for mutations.
- [X] T009 [US1] Update `app/client/src/app/(event)/create-event/page.tsx` to handle the server action / client submission properly.
- [X] T010 [US1] Update `app/client/src/app/(event)/[eventId]/edit-event/page.tsx` to pre-fetch event details and pre-fill the form.

---

## Phase 4: User Story 2 - View My Events (Priority: P1)

**Goal**: Fetch and render the user's events from the backend.

**Independent Test**: Navigating to `/my-events` displays events returned by the backend endpoint.

### Implementation for User Story 2

- [X] T011 [P] [US2] Implement `listUserEvents` in `app/client/src/app/(event)/_services/event-api.ts`.
- [X] T012 [US2] Update `app/client/src/app/(event)/my-events/page.tsx` to fetch events and render them dynamically.

---

## Phase 5: User Story 3 - Manage Event Members (Priority: P1)

**Goal**: View members, transfer ownership, and remove members.

**Independent Test**: A user can see the members list. An owner can transfer ownership (and become a member) or remove a member.

### Implementation for User Story 3

- [X] T013 [P] [US3] Create `MemberRead` schema in `app/server/app/modules/events/schemas/member_schemas.py` (including `image` and `role`).
- [X] T014 [US3] Implement `get_event_members` service logic in `app/server/app/modules/events/services/member_service.py`.
- [X] T015 [US3] Implement `GET /api/events/{event_id}/members` endpoint in `app/server/app/modules/events/routers/event_router.py`.
- [X] T016 [US3] Ensure `transfer_ownership` logic in `app/server/app/modules/events/services/event_service.py` demotes current owner and elevates target.
- [X] T017 [US3] Implement `getEventMembers`, `removeMember`, and `transferOwnership` in `app/client/src/app/(event)/_services/event-api.ts`.
- [X] T018 [US3] Update `app/client/src/app/(event)/[eventId]/members/page.tsx` to display backend members list and handle owner actions.

---

## Phase 6: User Story 4 - Invite and Join Events (Priority: P2)

**Goal**: Allow owners to generate invites, and users to join via link/hex code.

**Independent Test**: Generate an invite, and successfully join the event as another user by inputting the code or visiting the `?redirect=` link.

### Implementation for User Story 4

- [X] T019 [P] [US4] Implement `generateInvitation` and `joinEvent` in `app/client/src/app/(event)/_services/event-api.ts`.
- [X] T020 [US4] Conditionally render "Invitar" and "Editar" buttons in the event dashboard (e.g. `event-actions-section.tsx`) based on `is_owner`.
- [X] T021 [US4] Implement the "Invitar" modal/sheet to generate and copy the hex code/link.
- [X] T022 [US4] Implement the "Join Event" flow from the home page input using the hex code.
- [X] T023 [US4] Implement the login-redirect intercept logic (using `?redirect=`) to auto-join users from an invite link.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T024 [P] Ensure all new `loading.tsx` and `error.tsx` boundaries are in place per constitution rules.
- [X] T025 [P] Add Spanish inline documentation to all new services and components.
- [X] T026 Run quickstart.md validation scenarios to ensure end-to-end functionality.

---

## Dependencies & Execution Order

- **Phase 1** must happen first to clear out illegal folders.
- **Phase 2** unblocks the rest of the work.
- **Phase 3, Phase 4, Phase 5, Phase 6** can proceed in parallel (or sequentially).
- **Phase N** is performed at the end to ensure UI resilience and documentation quality.

### Parallel Opportunities
- Frontend service skeleton (T002, T003) and backend schema updates (T004, T005, T013) can happen concurrently.
- Once the EventAPI services are established, frontend UI wiring can happen in parallel with backend endpoints.

## Phase 7: Convergence

- [X] T027 Add Spanish JSDoc documentation to `EventHomeClient`, `EditEventClient`, `MembersClient`, `MyEventsClient`, and `EventApi` per Constitution XXVIII (missing)
- [X] T028 Replace static QR placeholder with an actual QR code generator library (e.g. `react-qr-code`) per FR-006 (partial)
