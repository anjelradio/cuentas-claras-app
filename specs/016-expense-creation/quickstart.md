# Quickstart: AI-Powered Expense Creation Flow

## Prerequisites

1. Backend running: `cd app/server && source venv/bin/activate && fastapi dev`
2. Frontend running: `cd app/client && pnpm dev`
3. Cloudinary credentials configured in `app/server/.env`
4. **New**: `GEMINI_API_KEY` configured in `app/server/.env`
5. At least one event created with 2+ active members
6. User authenticated via Better Auth

## Validation Scenario 1: Receipt Image Analysis

**Goal**: Verify that uploading a receipt image extracts expense data via AI.

### Steps
1. Navigate to the event home page (`/{eventId}`)
2. Click "Registrar gasto" button
3. The event should already be selected (you're on its home page)
4. Upload a photo of a receipt/invoice
5. Wait for the loading indicator (AI is processing)
6. Verify you're redirected to the expense form with:
   - Name field pre-filled (if AI could extract)
   - Amount field pre-filled with the receipt total
   - Category auto-selected (food, transport, etc.)
   - The uploaded image visible in the form
7. Verify the image is accessible via the Cloudinary URL in the backend

### Expected Backend Log
```
POST /api/events/{event_id}/expenses/analyze-receipt → 200
Response: { "is_receipt": true, "amount": 185.50, "category": "food", ... }
```

## Validation Scenario 2: Product Photo (No Receipt)

**Goal**: Verify that a non-receipt image skips AI extraction.

### Steps
1. Follow steps 1-4 from Scenario 1, but upload a photo of market products (not a receipt)
2. Verify you're redirected to an empty expense form
3. Verify the uploaded image is still visible in the form (it was saved to Cloudinary)
4. Fill in the form manually and submit

### Expected Backend Log
```
POST /api/events/{event_id}/expenses/analyze-receipt → 200
Response: { "is_receipt": false, "name": null, "amount": null, ... }
```

## Validation Scenario 3: AI Failure Graceful Degradation

**Goal**: Verify the system handles Gemini API failures gracefully.

### Steps
1. Temporarily set an invalid `GEMINI_API_KEY` in `.env`
2. Restart the backend
3. Upload any image through the expense creation flow
4. Verify a warning message appears ("No se pudo analizar la imagen")
5. Verify you're redirected to the empty form with the image still attached
6. Restore the valid API key

## Validation Scenario 4: Member Exclusion Split

**Goal**: Verify that excluding members from the split calculates correctly.

### Steps
1. Create an event with 4 members
2. Start the expense creation flow with a receipt for Bs. 100
3. Fill in the form (or accept AI pre-filled data)
4. Click "Confirmar" / "Registrar gasto"
5. In the participant selector bottom sheet:
   - Verify all 4 members are shown with checkboxes
   - Verify "Este eres tú" indicator appears next to your name
   - Uncheck 1 member to exclude them
6. Confirm submission
7. Verify the expense detail shows 3 splits of Bs. 33.34, Bs. 33.33, Bs. 33.33

### Expected Backend Behavior
```
POST /api/events/{event_id}/expenses
Body: { ..., "participant_member_ids": [member1, member2, member3], "split_type": "equal" }
→ 201 Created
```

## Validation Scenario 5: Expense Editing (Image Immutable)

**Goal**: Verify editing preserves the original image.

### Steps
1. Navigate to an existing expense with an attached receipt image
2. Click "Editar gasto"
3. Verify the image is displayed but not editable (no upload/replace button)
4. Change the amount from Bs. 100 to Bs. 120
5. Modify the participant list (exclude one more member)
6. Submit the changes
7. Verify the expense detail shows the new amount, updated splits, and the same original image URL
