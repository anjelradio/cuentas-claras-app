# API Contracts: AI-Powered Expense Creation Flow

## New Endpoint: Analyze Receipt Image

### `POST /api/events/{event_id}/expenses/analyze-receipt`

**Purpose**: Uploads an image to Cloudinary, sends it to Gemini for AI analysis, and returns extracted expense data.

**Authentication**: Bearer JWT (must be active member of the event)

**Request**: `multipart/form-data`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| file | binary | Yes | Image file (JPEG, PNG, WebP). Max 5MB. |

**Response 200**:
```json
{
  "image_url": "https://res.cloudinary.com/.../receipts/event-id/uuid.jpg",
  "is_receipt": true,
  "name": "Cena Restaurante El Puerto",
  "description": "Mariscos y bebidas",
  "amount": 185.50,
  "category": "food",
  "expense_date": "2026-09-01"
}
```

**Response 200 (product photo, not a receipt)**:
```json
{
  "image_url": "https://res.cloudinary.com/.../receipts/event-id/uuid.jpg",
  "is_receipt": false,
  "name": null,
  "description": null,
  "amount": null,
  "category": null,
  "expense_date": null
}
```

**Response 200 (AI failure / timeout — graceful degradation)**:
```json
{
  "image_url": "https://res.cloudinary.com/.../receipts/event-id/uuid.jpg",
  "is_receipt": false,
  "name": null,
  "description": null,
  "amount": null,
  "category": null,
  "expense_date": null
}
```

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid JWT |
| 403/404 | User is not an active member of the event |
| 422 | No file provided or invalid file format/size |
| 500 | Cloudinary upload failure (infrastructure error) |

---

## Existing Endpoints (No Changes to Contract)

### `POST /api/events/{event_id}/expenses`
> Already supports `multipart/form-data` with `data` (JSON) + `file` (image).
> The `participant_member_ids` field in `ExpenseCreateRequest` already controls who is included in the split.
> No contract changes needed — the frontend will now pass the Cloudinary `receipt_url` pre-filled from the analysis step instead of uploading the file again.

**Note**: We may need to add a `receipt_url` field to `ExpenseCreateRequest` so the frontend can pass the already-uploaded Cloudinary URL from the analysis step, avoiding a duplicate upload. Alternatively, the frontend can send the image again as `file` in the multipart request — the backend will upload to Cloudinary again (simple but wastes a Cloudinary upload).

**Recommended approach**: Add optional `receipt_url: str | None` to `ExpenseCreateRequest`. If provided AND no `file` is in the form data, use this URL directly. This avoids re-uploading.

### `GET /api/events/{event_id}/expenses`
> No changes. Returns `list[ExpenseSummaryRead]`.

### `GET /api/expenses/{expense_id}`
> No changes. Returns `ExpenseDetailRead` with splits.

### `PATCH /api/expenses/{expense_id}`
> No changes to contract. Image cannot be changed per spec (FR-009).
> The existing endpoint already supports updating all other fields including `participant_member_ids`.

### `DELETE /api/expenses/{expense_id}`
> No changes. Soft-deletes the expense.

---

## Frontend Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `/(event)/[eventId]` | Event home with "Registrar gasto" action | Modify: wire up image upload flow |
| `/expenses/event/[eventId]/create` | Expense creation form | Modify: accept pre-filled data from AI |
| `/expenses/[expenseId]/edit` | Expense edit form | No changes needed (image is read-only) |
| `/expenses/[expenseId]` | Expense detail view | No changes needed |
