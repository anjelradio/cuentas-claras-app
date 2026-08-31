# Implementation Tasks: event-pages

**Feature**: event-pages
**Branch**: `008-event-pages`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Setup & Data Models (Shared Infrastructure)

**Purpose**: Define the shared mock data models that will be consumed by the UI pages.

- [x] T001 [P] Create `MockEvent` types and data in `app/client/src/app/(event)/my-events/page.tsx` (or a local constant)
- [x] T002 [P] Create `MockMember` types and data in `app/client/src/app/(event)/[eventId]/members/page.tsx` (or a local constant)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI structure that must be in place.

- [x] T003 Ensure Shadcn/ui Alert Dialog is available in the project, or install it if missing.
- [x] T004 Ensure Shadcn/ui Sheet is available in the project, or install it if missing.

**Checkpoint**: Core UI components ready.

---

## Phase 3: User Story 1 - Ver Mis Eventos (Priority: P1) 🎯 MVP

**Goal**: Mostrar lista de todos los eventos del usuario con sus respectivos estados y opción de abandonar.

**Independent Test**: Navigate to `/my-events` and verify the events list matches the `my-events.html` design using the static mock data.

### Implementation for User Story 1

- [x] T005 [US1] Create the page component at `app/client/src/app/(event)/my-events/page.tsx` and structure the main container.
- [x] T006 [US1] Implement inline `EventCard` component directly inside `my-events/page.tsx` representing an event item.
- [x] T007 [US1] Integrate the static mock events data and render a list of `EventCard`s.
- [x] T008 [US1] Implement "Abandonar" button with Shadcn Alert Dialog confirmation inside `EventCard`.
- [x] T009 [US1] Ensure the "Nuevo evento" button redirects to `/create-event`.
- [x] T010 [US1] Create skeleton loading state at `app/client/src/app/(event)/my-events/loading.tsx` to match the page structure.

**Checkpoint**: User Story 1 is fully functional and visually complete.

---

## Phase 4: User Story 2 - Ver y Administrar Miembros del Evento (Priority: P1)

**Goal**: Mostrar a los miembros de un evento, con acciones para invitar, ascender y remover.

**Independent Test**: Navigate to `/[eventId]/members` and verify the members list and interactive modals match `members.html` design.

### Implementation for User Story 2

- [x] T011 [US2] Create the page component at `app/client/src/app/(event)/[eventId]/members/page.tsx` and structure the main container.
- [x] T012 [US2] Implement inline `MemberItem` component directly inside `members/page.tsx` representing a member.
- [x] T013 [US2] Integrate the static mock members data and render the list of `MemberItem`s.
- [x] T014 [US2] Implement Shadcn Alert Dialogs for "Remover miembro" and "Ascender a organizador" inside `MemberItem`.
- [x] T015 [US2] Implement Shadcn Sheet (o Dialog) para "Invitar personas" (código, QR, link) inside `members/page.tsx`.
- [x] T016 [US2] Create skeleton loading state at `app/client/src/app/(event)/[eventId]/members/loading.tsx` to match the page structure.

**Checkpoint**: User Story 2 is fully functional and visually complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final design reviews and cleanup.

- [x] T017 [P] Review responsive behavior across mobile and desktop for both pages against the design system rules.
- [x] T018 Run `quickstart.md` validation scenarios.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3 & 4)**: All depend on Foundational phase completion
  - Can proceed in parallel as they touch different sub-routes.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### Within Each User Story

- Create the page structure first, then build the inline components (`EventCard`, `MemberItem`), then add interactions (Alert Dialogs).
- Add the `loading.tsx` file at the end to map to the built structure.

### Parallel Opportunities

- Setup tasks (T001, T002) can run in parallel.
- Foundational component checks (T003, T004) can run in parallel.
- Once Foundation is complete, User Story 1 (T005-T010) and User Story 2 (T011-T016) can be implemented in parallel.

---

## Parallel Example: User Story 1 & 2

```bash
# Developer A implements my-events:
Task: "Create the page component at app/client/src/app/(event)/my-events/page.tsx"
Task: "Create skeleton loading state at app/client/src/app/(event)/my-events/loading.tsx"

# Developer B implements members:
Task: "Create the page component at app/client/src/app/(event)/[eventId]/members/page.tsx"
Task: "Create skeleton loading state at app/client/src/app/(event)/[eventId]/members/loading.tsx"
```

## Implementation Strategy

### Incremental Delivery

1. Complete Setup + Foundational.
2. Build `/my-events` (US1) -> Test independently -> Deploy/Demo (MVP).
3. Build `/[eventId]/members` (US2) -> Test independently -> Deploy/Demo.
