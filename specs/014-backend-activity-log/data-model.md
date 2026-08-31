# Data Model: Backend Activity Log

## Entity: `ActivityLog`

Persisted using SQLModel in PostgreSQL. Must inherit from `BaseModel` (which provides `id`, `created_at`, `updated_at`, `deleted_at`).

### Fields
- `event_id` (String / UUID): Foreign key or reference to the Event this activity belongs to. Indexed for fast querying.
- `actor_id` (String / UUID): Reference to the user who performed the action.
- `actor_name` (String): Denormalized name of the actor at the time of the event (or fetched/joined if preferred, but storing a snapshot string is common for audit logs). Wait, the spec says "actor's ID/name", so denormalized string might be better to avoid complex joins, or we can just join it if it's easy. Let's store `actor_id` and resolve name later, or store both. Let's store `actor_id` and rely on a join or `actor_name` snapshot. Let's define `actor_name` (String) as a snapshot for resilience.
- `target_id` (String / UUID, optional): Reference to the target entity (another user, expense, etc.).
- `target_name` (String, optional): Snapshot name of the target entity.
- `action_type` (Enum / String): The type of activity (e.g., `"event_created"`, `"member_joined"`, etc.).
- `description` (String, optional): The human-readable summary of what happened.

### Indexes
- Index on `(event_id, created_at DESC)` to optimize the paginated retrieval endpoint.

## State Transitions
- Activity logs are append-only. They are never updated or physically deleted by users, though `deleted_at` from `BaseModel` allows logical deletion if the entire event is destroyed.
