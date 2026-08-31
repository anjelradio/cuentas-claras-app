# Quickstart: Activity Log

This feature is purely frontend. To validate its rendering:

1. Start the frontend server:
   ```bash
   cd app/client
   pnpm dev
   ```

2. Navigate to the activity route for a mock event:
   ```
   http://localhost:3000/demo-event/activity
   ```

3. **Expected Outcomes**:
   - The page renders a list of cards, each corresponding to an activity (event created, member joined, expense updated, etc.).
   - Each card displays an icon that matches its `type`.
   - The timestamp, actor name, and description render correctly.
   - The layout matches the `design/event/activity.html` reference perfectly.
