# Quickstart & Validation Guide

Follow these steps to validate the Events Backend Integration end-to-end.

## Prerequisites

1. Ensure the backend and frontend are running (`npm run dev` in both `app/server` and `app/client`).
2. Log into the application as User A.

## Validation Scenarios

### Scenario 1: Create and Edit an Event
1. Navigate to `/home` and click "Crear evento".
2. Fill the form (Name: "Weekend Trip", Icon: "✈️", Date: Tomorrow) and submit.
3. **Verify**: You are redirected to `/Weekend-Trip-ID`. A success toast appears.
4. Click "Editar" from the event page. Change the name to "Weekend Trip Updated".
5. **Verify**: You are redirected back, the name is updated, and a success toast appears.

### Scenario 2: Invitations and Joining
1. As User A (Owner), go to the event page and click "Invitar".
2. Choose "Copiar enlace". A toast confirms the copy.
3. Open an Incognito window and paste the link (`http://localhost:3000/join?redirect=...`).
4. **Verify**: You are prompted to login. Log in as a different user (User B).
5. **Verify**: After login, you are automatically joined to the event and redirected to the event page. A success toast says "Unido al evento exitosamente".

### Scenario 3: Member Management (Ownership Transfer)
1. Close the Incognito window and return to User A's session.
2. Go to the "Miembros" page of the event.
3. **Verify**: You see both User A (Dueño) and User B (Miembro).
4. Click the options for User B and select "Hacer dueño". Confirm the action.
5. **Verify**: A success toast appears. The list revalidates: User B is now "Dueño" and User A is "Miembro".
6. Click the options for User B again.
7. **Verify**: As a regular member, you no longer see options to remove members or transfer ownership.
