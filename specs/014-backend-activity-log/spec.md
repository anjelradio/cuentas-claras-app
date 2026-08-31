# Feature Specification: Backend Activity Log Module

**Feature Branch**: `[014-backend-activity-log]`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "implementar un módulo en el backend, el cual se va a llamar Activity... funcionalidad va a ser auditar... endpoint el cual solo va a listar... limit, offset, etcétera."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Persisting Audit Events (Priority: P1)

As a system, I need to reliably capture and persist important actions happening within an event (like expenses created, members joining, or payments made) so that a transparent audit trail is maintained for all event participants.

**Why this priority**: Without capturing these actions precisely when they occur, the activity log will not exist, rendering the entire feature useless.

**Independent Test**: Can be tested independently by performing a core action (e.g., creating an event) and verifying that a corresponding activity log entry was written to the database.

**Acceptance Scenarios**:

1. **Given** a user performs an audited action in the Events or Expenses module, **When** the main transaction succeeds, **Then** an activity log entry is persisted containing the action type, actor, target (if applicable), and timestamp.
2. **Given** a user performs an action, **When** the main transaction fails and rolls back, **Then** no activity log entry is saved.

---

### User Story 2 - Retrieving the Activity Log (Priority: P1)

As a member of an event, I want to fetch a paginated chronological list of activities for my event, so that the frontend can display them efficiently using an infinite scroll mechanism.

**Why this priority**: Retrieving the data is essential for the frontend interface built previously to actually display real information.

**Independent Test**: Can be tested independently by querying the new endpoint with an event ID and pagination parameters, then verifying the returned list is sorted by date and limited correctly.

**Acceptance Scenarios**:

1. **Given** I am a member of an event with multiple activities, **When** I request the activity log with a `limit` of 10 and `offset` of 0, **Then** I receive the 10 most recent activities.
2. **Given** I am a member of an event, **When** I request the next page (`limit` 10, `offset` 10), **Then** I receive the next batch of 10 older activities.
3. **Given** I do not belong to the event, **When** I request its activity log, **Then** I am denied access.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a new backend module responsible for managing activity logs.
- **FR-002**: System MUST persist an activity log record when specific actions occur in the platform: `event_created`, `event_updated`, `event_closed`, `member_joined`, `member_left`, `member_removed`, `owner_transferred`, `expense_created`, `expense_updated`, `expense_voided`, `payment_declared`, `payment_confirmed`, `payment_rejected`.
- **FR-003**: System MUST expose an API endpoint to retrieve the activity log for a specific event.
- **FR-004**: System MUST secure the retrieval endpoint so that only the event owner or active members can fetch the log.
- **FR-005**: System MUST support pagination on the retrieval endpoint via `limit` and `offset` parameters to enable infinite scrolling on clients.
- **FR-006**: System MUST return activity logs sorted chronologically, newest first.
- **FR-007**: System MUST record the actor (who performed the action) and the target entity (e.g., the name of the expense or user affected) in the activity log.

### Key Entities

- **ActivityLog**: Represents a single audited action. Contains the event ID, the actor's ID/name, the action type (enum string), the target's name/ID, and a timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the specified actions trigger the creation of an activity log entry without disrupting or slowing down the primary action significantly.
- **SC-002**: The retrieval endpoint returns a paginated page of 20 activities in under 200ms at the 95th percentile, even for events with thousands of logged activities.
- **SC-003**: Unauthorized users are blocked from retrieving an event's activity log 100% of the time.

## Assumptions

- The action types list is static and known upfront; an Enum or literal strings will suffice.
- The activity log table can grow large, so appropriate database indexing (like by `event_id` and `created_at`) will be necessary for fast paginated queries.
- Generating the activity log entries will happen synchronously within the same transaction as the action itself to guarantee consistency (if the action fails, the log is rolled back).
