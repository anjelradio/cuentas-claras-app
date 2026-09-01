# Research: AI-Powered Expense Creation Flow

## Decision 1: AI Integration Strategy (Gemini API)

**Decision**: Use the Google Gemini API (`google-genai` Python SDK) to analyze receipt images via the `gemini-2.0-flash` model with structured JSON output.

**Rationale**:
- Gemini 2.0 Flash is cost-effective for vision tasks and supports structured output via `response_mime_type: "application/json"`.
- The SDK (`google-genai`) is lightweight and supports passing image URLs directly (no need to download the image from Cloudinary first — pass the URL).
- We define a JSON schema in the prompt so Gemini returns a predictable structure: `{ "is_receipt": boolean, "name": string|null, "description": string|null, "amount": number|null, "category": string|null, "expense_date": string|null }`.
- If `is_receipt` is `false`, the backend returns only the `image_url` and empty extracted fields.

**Alternatives considered**:
- OpenAI GPT-4o Vision: Higher cost per request, heavier SDK.
- Custom OCR pipeline (Tesseract + heuristics): Too much custom code for this stage, low accuracy on Bolivian receipts.

## Decision 2: Image Upload Timing

**Decision**: Upload to Cloudinary first (in the backend), then pass the Cloudinary URL to Gemini for analysis.

**Rationale**:
- Per the user's clarification, the image should be permanently stored before any AI processing.
- This guarantees the image is safely persisted even if Gemini fails.
- Cloudinary URLs are publicly accessible, which Gemini can fetch directly.
- The existing `ExpenseReceiptStorage` class already handles Cloudinary uploads, validation, and cleanup.

**Alternatives considered**:
- Upload to Cloudinary on the frontend directly: Would expose Cloudinary API secrets in the browser — not viable with the current architecture where secrets are backend-only.
- Upload after AI analysis: Risk of losing the image if the user confirms but Cloudinary fails.

## Decision 3: Expense Split — No Schema Changes Needed

**Decision**: Do NOT add an `is_excluded` column to `ExpenseSplit`. Simply omit excluded members from the splits list.

**Rationale**:
- The user explicitly concluded: "Si está excluida simplemente no la agregamos en el split."
- The existing `ExpenseCreateRequest` already supports `participant_member_ids` for equal splits, which is exactly the list of non-excluded members.
- The existing `calculate_equal_splits` already handles dividing the amount among only the provided member IDs, including correct handling of decimal remainders (distributes extra cents to the first N members by sorted UUID).
- No database migration needed.

**Alternatives considered**:
- Adding `is_excluded: bool` to `ExpenseSplit`: Adds complexity for no functional benefit since excluded members don't need a record.

## Decision 4: New Backend Endpoint for AI Analysis

**Decision**: Create a new endpoint `POST /api/events/{event_id}/expenses/analyze-receipt` that accepts a multipart image, uploads it to Cloudinary, sends the URL to Gemini, and returns the extracted data plus the image URL.

**Rationale**:
- Separating analysis from expense creation keeps responsibilities clean.
- The frontend can call this endpoint, get the prefilled data + image URL, then navigate to the form.
- If AI fails, the endpoint still returns the image URL with empty fields (graceful degradation per spec FR-010).
- The existing `create_expense` endpoint already accepts `receipt_url` — we just need to also accept a pre-uploaded URL instead of only file uploads.

**Alternatives considered**:
- Combining AI analysis and expense creation in a single endpoint: Too tightly coupled; the user needs to review/edit the AI-extracted data before submitting.

## Decision 5: Gemini API Key Configuration

**Decision**: Add `GEMINI_API_KEY` to `Settings` (config.py) and `.env.example`.

**Rationale**:
- Follows the existing pattern for external service credentials (Cloudinary keys, JWKS URL).
- The key is server-side only and never exposed to the frontend.

## Decision 6: Frontend Flow Architecture

**Decision**: The flow will be: Home → Select Event (existing overlay) → Upload Image (new step in the overlay) → Backend analyzes → Redirect to `/expenses/event/{eventId}/create?analyzed=true` with pre-filled data passed via URL search params or a temporary state.

**Rationale**:
- The existing `ExpenseForm` component already supports both `create` and `edit` modes and accepts initial values via props.
- The create page (`/expenses/event/{eventId}/create/page.tsx`) already fetches members and renders `ExpenseForm`.
- We can add query params or use `sessionStorage` to pass the AI-extracted data to the form.
- The existing `ExpenseParticipantsSheet` already provides the member selection bottom sheet with toggle behavior.

## Decision 7: Category Mapping from AI

**Decision**: Provide Gemini with the exact enum values (`food`, `lodging`, `transport`, `shopping`, `entertainment`, `other`) in the prompt and instruct it to return one of these values or `other` as fallback.

**Rationale**:
- The `ExpenseCategory` enum is static and small (6 values).
- Embedding the enum in the prompt ensures Gemini returns a valid value directly, no mapping layer needed.
- If Gemini can't determine the category, it returns `other`.
