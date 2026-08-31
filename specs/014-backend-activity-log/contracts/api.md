# API Contracts: Activity Log

## `GET /api/v1/events/{event_id}/activities`

Retrieves a paginated list of activities for a given event.

### Request
- **Headers**: `Authorization: Bearer <token>`
- **Path Parameters**:
  - `event_id`: ID of the event
- **Query Parameters**:
  - `limit`: Number of items to return (default: 20, max: 50)
  - `offset`: Number of items to skip (default: 0)

### Response (200 OK)
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "event_created",
      "actorName": "Ana López",
      "targetName": "Viaje a la playa",
      "createdAt": "2026-08-31T14:00:00Z",
      "description": "Ana López creó el evento \"Viaje a la playa\"."
    }
  ],
  "total": 150,
  "has_more": true
}
```

### Errors
- `401 Unauthorized`: Missing or invalid token.
- `403 Forbidden`: User is not a member or owner of the event.
- `404 Not Found`: Event does not exist.
