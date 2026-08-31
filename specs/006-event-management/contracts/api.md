# API Contracts: Event Management

All endpoints require JWT Bearer token authentication via Better Auth.
Any endpoint acting on a specific resource (e.g. `{event_id}`) will return **404 Not Found** (handled via centralized exceptions) if the resource does not exist or has been logically deleted.

## HTTP Endpoints

### Events

- **POST /api/events**
  - **Description**: Create a new event. The authenticated user becomes the owner.
  - **Body** (`EventCreateRequest`):
    - `name` (str)
    - `description` (str, optional)
    - `icon` (str, emoji)
    - `starts_at` (datetime)
  - **Response** (201 Created) -> `EventRead`
  - **Error Responses**: 422 Unprocessable Entity (Validation Error)

- **GET /api/events**
  - **Description**: List active events for the authenticated user (where user is owner or member).
  - **Response** (200 OK) -> `list[EventSummaryRead]`
    - Summary includes: `id`, `name`, `description`, `icon`, `status`, `starts_at`.

- **GET /api/events/{event_id}**
  - **Description**: View full details of an event. User must be owner or member.
  - **Response** (200 OK) -> `EventDetailRead`
    - Includes basic fields + `user_id` (owner ID) and owner's name.
  - **Error Responses**: 404 Not Found, 403 Forbidden (If not a member)

- **PATCH /api/events/{event_id}**
  - **Description**: Update event details. Caller must be the owner. Event must be `OPEN`.
  - **Body** (`EventUpdateRequest`): (optional fields: `name`, `description`, `icon`, `starts_at`, `status`)
  - **Response** (200 OK) -> `EventRead`
  - **Error Responses**: 404 Not Found, 403 Forbidden (If not owner), 400 Bad Request (If closed)

- **DELETE /api/events/{event_id}**
  - **Description**: Soft delete event. Caller must be owner. Fails if other active members exist.
  - **Response** (204 No Content)
  - **Error Responses**: 404 Not Found, 403 Forbidden, 400 Bad Request (If members exist)

- **POST /api/events/{event_id}/transfer-ownership**
  - **Description**: Transfer ownership to another active member. Caller must be owner.
  - **Body**: `{ "new_owner_id": "str" }`
  - **Response** (200 OK)
  - **Error Responses**: 404 Not Found (Event or new owner not found), 403 Forbidden, 400 Bad Request

### Event Members

- **POST /api/events/join**
  - **Description**: Join an event using an invitation code.
  - **Body**: `{ "token_hash": "str" }`
  - **Response** (200 OK)
  - **Error Responses**: 404 Not Found (Token not found/expired), 400 Bad Request (Already a member)

- **POST /api/events/{event_id}/leave**
  - **Description**: Leave an event. Updates member status to `LEFT`. Owner cannot leave unless ownership is transferred.
  - **Response** (200 OK)
  - **Error Responses**: 404 Not Found, 400 Bad Request (If owner tries to leave without transferring)

- **DELETE /api/events/{event_id}/members/{user_id}**
  - **Description**: Remove a member. Caller must be owner. Updates member status to `REMOVED`.
  - **Response** (200 OK)
  - **Error Responses**: 404 Not Found (Event or Member not found), 403 Forbidden

### Invitations

- **POST /api/events/{event_id}/invitations**
  - **Description**: Generate or retrieve an active invitation token for an event. Caller must be owner.
  - **Response** (200 OK) -> `EventInvitationRead`
    - Includes `token_hash` and `expires_at`.
  - **Error Responses**: 404 Not Found, 403 Forbidden
