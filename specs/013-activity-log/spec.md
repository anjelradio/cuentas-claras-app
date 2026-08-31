# Feature Specification: Event Activity Log

**Feature Branch**: `[013-activity-log]`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Página nueva en el frontend para las actividades que se hagan en el evento, una bitácora (auditoría)..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Full Event History (Priority: P1)

As a member of an event, I want to view a chronological log of all activities that have happened in the event, so that I can stay updated on changes, expenses, and membership movements.

**Why this priority**: It is the core value proposition of the feature, providing transparency and trust among event participants.

**Independent Test**: Can be fully tested by opening the new Activity Log page and verifying that past simulated or real activities render chronologically.

**Acceptance Scenarios**:

1. **Given** I am a member of the event, **When** I navigate to the Activity Log page, **Then** I see a list of activities sorted from most recent to oldest.
2. **Given** I am not a member of the event, **When** I attempt to access the Activity Log page, **Then** I am denied access or redirected.
3. **Given** the event has no activities yet (unlikely, as creation itself is an activity, but conceptually possible), **When** I view the page, **Then** I see a friendly empty state message.

---

### User Story 2 - Identify Specific Actions and Actors (Priority: P2)

As a member of an event, I want to easily understand who performed an action and what the action was (e.g., "Ana added a new expense", "Beto joined the group"), so that I know exactly who is responsible for each change.

**Why this priority**: Without knowing who did what, the audit log loses its accountability purpose.

**Independent Test**: Can be fully tested by verifying that activity entries clearly display the actor's name and the specific action taken.

**Acceptance Scenarios**:

1. **Given** an activity exists in the log, **When** I read the entry, **Then** I can clearly identify the user who performed it, the action taken, and the timestamp.
2. **Given** an activity involves a specific entity (like an expense), **When** I view the log entry, **Then** I can see the name of that entity (e.g., "Gasto 'Cena'").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated page within the event context to display the activity log.
- **FR-002**: System MUST restrict access to the activity log to users who are active members or the organizer of the event.
- **FR-003**: System MUST display a chronological list of activities, ordered by date descending (newest first).
- **FR-004**: System MUST log and display event lifecycle events (created, updated, closed).
- **FR-005**: System MUST log and display membership events (user joined, user left, user kicked, ownership transferred).
- **FR-006**: System MUST log and display expense events (expense created, updated, settled/paid).
- **FR-007**: System MUST log and display payment events (payment created, updated, etc.).
- **FR-008**: System MUST support pagination or infinite scrolling for the activity log to handle events with a massive history without performance degradation.

### Key Entities

- **Activity / Audit Log Entry**: Represents a single event that occurred. Key attributes include the actor (who did it), the action type (what happened), the target entity (e.g., which expense or user), and the timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the specified event types (creation, membership, expenses, payments) are accurately captured and displayed on the page.
- **SC-002**: The page loads and displays the first batch of activities in under 1 second, regardless of the total number of activities in the event's history.
- **SC-003**: Unauthorized users are blocked from viewing the activity log 100% of the time.

## Assumptions

- The backend already records or can provide these audit logs via an API endpoint.
- Activity data includes all necessary information (actor name, action type, target name, timestamp) so the frontend doesn't need to make complex subsequent joins to render a simple text entry.
- The UI design for the activity log page will follow the existing project's design system (similar to the "Actividades recientes" card but expanded for a full page).
