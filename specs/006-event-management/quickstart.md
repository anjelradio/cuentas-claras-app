# Quickstart: Event Management Backend

This guide outlines how to validate the event management API endpoints.

## Setup
1. Ensure the PostgreSQL database is running.
2. Run Alembic migrations: `alembic upgrade head`.
3. Start the FastAPI server: `fastapi run app/server/app/main.py`.
4. Obtain a JWT token via Better Auth from the frontend or simulate one for testing. 

## Validation Flows

### 1. Create an Event
```bash
curl -X POST http://localhost:8000/api/events \
  -H "Authorization: Bearer <VALID_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Viaje a Cancún", "description": "Viaje grupal", "icon": "✈️", "starts_at": "2026-09-15T10:00:00Z"}'
```
Expected: `201 Created` with event details.

### 2. Generate an Invitation
```bash
curl -X POST http://localhost:8000/api/events/<EVENT_ID>/invitations \
  -H "Authorization: Bearer <VALID_JWT>"
```
Expected: `200 OK` with `token_hash` (e.g. `A1B2C3`).

### 3. Join an Event (as another user)
```bash
curl -X POST http://localhost:8000/api/events/join \
  -H "Authorization: Bearer <SECOND_USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"token_hash": "A1B2C3"}'
```
Expected: `200 OK`. The second user is now an active member.

### 4. List User Events
```bash
curl -X GET http://localhost:8000/api/events \
  -H "Authorization: Bearer <SECOND_USER_JWT>"
```
Expected: `200 OK` returning an array containing the joined event summary.

### 5. Soft Delete Event
```bash
curl -X DELETE http://localhost:8000/api/events/<EVENT_ID> \
  -H "Authorization: Bearer <VALID_JWT>"
```
Expected: `400 Bad Request` if members are active. If members left/removed, `204 No Content`.
