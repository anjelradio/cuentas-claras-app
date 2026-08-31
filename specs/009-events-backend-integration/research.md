# Research: events-backend-integration

## Backend Endpoints Analysis

### Existing Endpoints
- **Create Event**: `POST /api/events` (returns `EventRead`)
- **List Events**: `GET /api/events` (returns `EventSummaryRead[]`)
- **Get Event Detail**: `GET /api/events/{event_id}` (returns `EventDetailRead`, requires modification to include `is_owner: bool`)
- **Update Event**: `PATCH /api/events/{event_id}` (returns `EventRead`)
- **Delete Event**: `DELETE /api/events/{event_id}` (status 204)
- **Transfer Ownership**: `POST /api/events/{event_id}/transfer-ownership` (status 200, handles the ownership logic)
- **Generate Invitation**: `POST /api/events/{event_id}/invitations` (returns `EventInvitationRead`, providing the `token_hash`)
- **Join Event**: `POST /api/events/join` (takes `token_hash`)
- **Leave Event**: `POST /api/events/{event_id}/leave`
- **Remove Member**: `DELETE /api/events/{event_id}/members/{member_user_id}`

### Missing Endpoints
- **List Event Members**: `GET /api/events/{event_id}/members` does not exist yet. Needs to be created to fulfill `FR-003`. It must validate that the requester is a member of the event and join `EventMember` with `User` (from `user_proxy.py`) to return member details (including name, email, and image from Better Auth's user table) and roles.

## Technical Context Unknowns Resolution

### State & Navigation
- **Decision**: The URL `?redirect=` parameter will be used for persisting the invite code through the login flow, avoiding local storage edge cases and matching the Next.js App Router paradigm.
- **Rationale**: Best practice for SSR applications, allows easy sharing of links, avoids cross-tab issues.

### Frontend Service Architecture
- **Decision**: Centralize all event-related API calls in `app/client/src/app/(event)/_services/event-api.ts` and types in `_types/event.ts`.
- **Rationale**: Aligns with the project's Constitution rule that requires grouping domain responsibilities properly. Mock data, unused types folders, and outdated tests in the `[eventId]` directory will be removed.

### Role Management
- **Decision**: There are only two roles: `owner` and `member`. `owner` is determined by `Event.user_id`. `transfer-ownership` demotes the current owner to a regular member and elevates the selected member.
- **Rationale**: Keeps authorization logic simple. `EventMember` has no explicit role column, and ownership is securely tied to the `Event` entity itself.
