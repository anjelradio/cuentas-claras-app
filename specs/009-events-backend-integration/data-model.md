# Data Model: events-backend-integration

## Backend Entities

The backend relies on the existing SQLAlchemy/SQLModel models, with implicit roles.

### `Event`
- `id` (UUID): Primary key.
- `name` (String): Event name.
- `description` (String, nullable): Optional details.
- `icon` (String): Emoji or icon identifier.
- `starts_at` (Datetime): Start date.
- `status` (Enum): `open` or `closed`.
- `closed_at` (Datetime, nullable): When the event was archived/closed.
- `user_id` (String): The ID of the user who owns the event (Foreign Key to `User.id`).

### `EventMember`
- `event_id` (UUID): Foreign Key to `Event.id`.
- `user_id` (String): Foreign Key to `User.id`.
- `status` (Enum): `active`, `left`, or `removed`.
- `qr_image` (String, nullable): Used if individual QRs per member are generated (though invitations currently handle this).

### `User` (Proxy)
- `id` (String): The Better Auth standard string ID.
- `name` (String): User's full name.
- `email` (String): User's email.
- `image` (String, nullable): User's profile picture from Better Auth.

## Frontend Data Structures

The frontend will consume these models via centralized types.

### `EventDetail`
```typescript
interface EventDetail {
  id: string;
  name: string;
  description?: string;
  icon: string;
  startsAt: string;
  status: 'open' | 'closed';
  userId: string; // The owner
  ownerName?: string;
  isOwner: boolean;
}
```

### `EventMemberInfo`
Used for the members listing page.
```typescript
interface EventMemberInfo {
  userId: string;
  name: string;
  email: string;
  image?: string;
  role: 'owner' | 'member';
  joinedAt: string; // Typically from EventMember.created_at
}
```

### `EventInvitation`
```typescript
interface EventInvitation {
  id: string;
  eventId: string;
  tokenHash: string;
  expiresAt: string;
}
```
