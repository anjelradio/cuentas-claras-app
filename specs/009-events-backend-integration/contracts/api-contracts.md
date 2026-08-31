## 0. Get Event Detail (Modified Endpoint)

**Endpoint**: `GET /api/events/{event_id}`
**Modification**: The response schema `EventDetailRead` will be extended to include an `is_owner` boolean attribute.

**Response Snippet**:
```json
{
  "id": "...",
  "name": "...",
  "user_id": "usr_123",
  "owner_name": "Alice Wonderland",
  "is_owner": true
}
```

# API Contracts: events-backend-integration

## 1. List Event Members (New Endpoint)

**Endpoint**: `GET /api/events/{event_id}/members`
**Auth**: Required. User must be a member of the event (status = active).

**Response** (200 OK):
```json
[
  {
    "user_id": "usr_123",
    "name": "Alice Wonderland",
    "email": "alice@example.com",
    "image": "https://example.com/alice.jpg",
    "role": "owner",
    "joined_at": "2026-08-30T10:00:00Z"
  },
  {
    "user_id": "usr_456",
    "name": "Bob Builder",
    "email": "bob@example.com",
    "image": null,
    "role": "member",
    "joined_at": "2026-08-30T11:00:00Z"
  }
]
```

## 2. Frontend Services Contract (`event-api.ts`)

The frontend will export these centralized service functions that map to the backend endpoints, handling authentication tokens transparently via the internal fetch client.

### Error Handling Strategy
All service functions will enforce the following strategy:
- **404 Not Found**: Triggers `notFound()` from `next/navigation`.
- **Other API Errors (400, 401, 403, 422, 500)**: Catches the error and displays the backend's provided message using Sonner toasts, returning a safe failure state or re-throwing for specific component handling if necessary.
- **Network/Connection Errors**: Executes a raw `throw new Error(...)` to trigger the closest Next.js `error.tsx` boundary.

```typescript
export const EventApi = {
  // Queries
  listUserEvents: (): Promise<EventSummary[]> => { ... },
  getEventDetail: (eventId: string): Promise<EventDetail> => { ... },
  getEventMembers: (eventId: string): Promise<EventMemberInfo[]> => { ... },
  
  // Mutations
  createEvent: (data: EventCreatePayload): Promise<EventDetail> => { ... },
  updateEvent: (eventId: string, data: EventUpdatePayload): Promise<EventDetail> => { ... },
  deleteEvent: (eventId: string): Promise<void> => { ... },
  
  // Membership & Invitations
  generateInvitation: (eventId: string): Promise<EventInvitation> => { ... },
  joinEvent: (tokenHash: string): Promise<void> => { ... },
  removeMember: (eventId: string, memberId: string): Promise<void> => { ... },
  transferOwnership: (eventId: string, newOwnerId: string): Promise<void> => { ... },
};
```
