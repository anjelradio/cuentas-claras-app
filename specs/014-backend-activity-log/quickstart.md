# Quickstart: Backend Activity Log

To validate this feature end-to-end:

1. **Start the backend and frontend**:
   ```bash
   cd app/server && poetry run uvicorn app.main:app --reload
   cd app/client && pnpm dev
   ```

2. **Trigger an audited action**:
   - Log in and navigate to an existing event.
   - Perform an action like inviting a member or editing an expense.
   - Verify the database receives a new entry:
     ```sql
     SELECT * FROM activitylog ORDER BY created_at DESC LIMIT 1;
     ```

3. **Verify Infinite Scroll Retrieval**:
   - Navigate to the Activity Log page in the frontend UI (`/[eventId]/activity`).
   - Scroll down to the bottom of the list.
   - Observe the network tab in your browser's DevTools: it should fire a new `GET` request with an updated `offset` parameter.
   - The UI should seamlessly append the older items to the list.
