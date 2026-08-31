# Tasks: Event Activity Log

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Basic file structures and data contracts

- [x] T001 [P] Create `ActivityLogEntry` type and `ActivityType` union in `app/client/src/app/(event)/_types/activity-types.ts`
- [x] T002 [P] Create mock data array populated with all event types in `app/client/src/app/(event)/_demo/activity-demo.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core components that stories depend on

- [x] T003 Create the empty page component at `app/client/src/app/(event)/[eventId]/activity/page.tsx`

---

## Phase 3: User Story 1 - View Full Event History (Priority: P1) 🎯 MVP

**Goal**: Display a chronological list of activities.

**Independent Test**: Page renders an empty state or basic list when navigated to.

### Implementation for User Story 1

- [x] T004 [US1] Implement `ActivityList` component in `app/client/src/app/(event)/[eventId]/activity/_components/activity-list.tsx`
- [x] T005 [US1] Update `page.tsx` to pass the mock data from `activity-demo.ts` to `ActivityList`

---

## Phase 4: User Story 2 - Identify Specific Actions and Actors (Priority: P2)

**Goal**: Display detailed activity cards with accurate icons, actors, and metadata.

**Independent Test**: The activity list correctly displays the Stitch design cards with appropriate icons based on action type.

### Implementation for User Story 2

- [x] T006 [P] [US2] Implement `ActivityItem` component in `app/client/src/app/(event)/[eventId]/activity/_components/activity-item.tsx` with icon mapping logic
- [x] T007 [US2] Apply the exact HTML/Tailwind layout from `design/event/activity.html` to `ActivityItem`
- [x] T008 [US2] Update `ActivityList` to render `ActivityItem` for each entry

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and styling adjustments

- [x] T009 Run quickstart.md validation to ensure responsive rendering

---

## Dependencies & Execution Order

- **Phase 1 & 2** block everything. Data types and the basic page structure must exist first.
- **Phase 3 (US1)** depends on the page and mock data to render a basic list wrapper.
- **Phase 4 (US2)** depends on US1, adding the granular visual details to each item in the list.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T005 to get a simple, unstructured list of data rendering on the page.
2. Validate the data is accessible.

### Incremental Delivery

1. Add US2 (T006-T008) to transform the unstructured list into the polished UI matching the Stitch design.
2. Run polish checks.

## Phase 6: Convergence

- [ ] T010 Implement access control logic (e.g., redirect or error state) to prevent unauthorized users from viewing the Activity Log per FR-002 (missing)
- [ ] T011 Implement basic pagination or infinite scrolling for the ActivityList component to handle massive event histories per FR-008 (missing)
