# Data Model: Event Management

This document defines the SQLModel entities for the `events` module.

## Enums

**EventStatus**
- `OPEN` = "open"
- `CLOSED` = "closed"

**MemberStatus**
- `ACTIVE` = "active"
- `LEFT` = "left"
- `REMOVED` = "removed"

## Entities

### `User` (Proxy Model)
Since Better Auth manages the user table, we only define a minimal proxy model for relationships. Does NOT inherit from `BaseModel`.
- `id`: `str` (Primary Key)
- `name`: `str`
- `email`: `str`
- (Other fields managed by Better Auth)

### `Event` (inherits `BaseModel`)
Represents a shared expense group or event.
- `name`: `str`
- `description`: `str | None`
- `icon`: `str` (emoji)
- `starts_at`: `datetime`
- `status`: `EventStatus` (default `OPEN`)
- `closed_at`: `datetime | None`
- `user_id`: `str` (Foreign Key to `User.id` - The owner)

### `EventMember` (inherits `BaseModel`)
Represents a user's membership in an event.
- `event_id`: `UUID` (Foreign Key to `Event.id`)
- `user_id`: `str` (Foreign Key to `User.id`)
- `status`: `MemberStatus` (default `ACTIVE`)
- `qr_image`: `str | None`

**Constraints**:
- Unique constraint on `(event_id, user_id)` to prevent duplicate memberships.

### `EventInvitation` (inherits `BaseModel`)
Represents an invite token for an event.
- `event_id`: `UUID` (Foreign Key to `Event.id`)
- `token_hash`: `str` (6 alphanumeric characters, unique)
- `expires_at`: `datetime`

## State Transitions
- **Event Lifecycle**: `OPEN` -> `CLOSED`. (Owner can change, sets `closed_at`).
- **Member Lifecycle**: `ACTIVE` -> `LEFT` (by member itself), `ACTIVE` -> `REMOVED` (by owner).

## Validation Rules
- `EventInvitation` generation: Only the owner can request. Returns active one if exists, otherwise generates new.
- `Event` deletion: Allowed only if no members have status `ACTIVE` (excluding the owner, wait - owner is a member? "Event members es el link único... No se va a poder eliminar el evento si es que ya hay una persona como miembro". The owner creates the event, maybe the owner is automatically added to `EventMember` as `ACTIVE`. Yes, "El evento lo crea una persona... se asigna como propietario". We'll add the owner as an active member upon creation to ensure they show up in lists.)
