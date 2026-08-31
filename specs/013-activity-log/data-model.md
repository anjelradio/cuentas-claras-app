# Data Model: Activity Log

For the frontend implementation phase, we will define the `ActivityLogEntry` TypeScript interface that will be used for the static mock data and later map to the backend API response.

## Entity: `ActivityLogEntry`

Represents a single event in the audit log.

- `id` (string): Unique identifier.
- `type` (ActivityType): Enum-like string defining the action.
  - Types defined: `event_created`, `event_updated`, `event_closed`, `member_joined`, `member_left`, `member_removed`, `owner_transferred`, `expense_created`, `expense_updated`, `expense_voided`, `payment_declared`, `payment_confirmed`, `payment_rejected`
- `actorName` (string): The name of the user who performed the action.
- `targetName` (string | optional): The name of the entity affected (e.g., the expense name).
- `createdAt` (string): ISO 8601 timestamp or formatted string (e.g., "Hoy, 12:45").
- `description` (string | optional): Extra detailed text describing the change.
