# Quickstart Validation Guide: Event Pages

## Setup
1. Run `npm install` inside the `app/client` directory.
2. Ensure the dev server is running with `npm run dev`.

## Validation Scenarios

### Scenario 1: My Events Page
- Navigate to `http://localhost:3000/my-events`
- Verify that a list of event cards is rendered.
- Verify that open events have an "Abierto" badge and an "Abandonar" button.
- Click "Abandonar" and verify that a shadcn Alert Dialog appears to confirm the action.
- Click the "Nuevo evento" button and verify it redirects to `/create-event`.
- Hard-refresh the page and verify that the skeleton loading screen displays appropriately before the content.

### Scenario 2: Members Page
- Navigate to `http://localhost:3000/some-event-id/members`
- Verify that the list of members is rendered correctly inside the main card container.
- Click the "Remover miembro" action on a member and verify the Alert Dialog confirmation appears.
- Click the "Ascender a organizador" action on a member and verify the Alert Dialog confirmation appears.
- Click the "Invitar" button and verify the bottom sheet/modal appears with options to generate code, QR, or link.
- Hard-refresh the page and verify the skeleton loading screen displays appropriately.
