# Tasks: AI-Powered Expense Creation Flow

**Feature**: 016-expense-creation
**Branch**: `016-expense-creation`
**Generated**: 2026-09-01

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add Gemini API dependency and configuration

- [X] T001 Add `GEMINI_API_KEY` setting to `app/server/app/core/config.py` and add `CLOUDINARY_RECEIPTS_FOLDER` to `.env.example`
- [X] T002 Add `GEMINI_API_KEY` entry to `app/server/.env.example`
- [X] T003 Install `google-genai` package in the backend virtualenv and add to `app/server/requirements.txt` (or `pyproject.toml`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the Gemini integration class and the new receipt analysis schema — these are prerequisites for both the backend endpoint and the frontend flow.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create `GeminiReceiptAnalyzer` class in `app/server/app/modules/expenses/integrations/gemini_analyzer.py` — accepts a Cloudinary image URL, sends to Gemini 2.0 Flash with structured JSON prompt, returns extracted fields (is_receipt, name, description, amount, category, expense_date) or empty values on failure/timeout
- [X] T005 [P] Create `ReceiptAnalysisResponse` Pydantic schema in `app/server/app/modules/expenses/schemas/expense_schemas.py` with fields: image_url (str), is_receipt (bool), name (str|None), description (str|None), amount (Decimal|None), category (ExpenseCategory|None), expense_date (str|None)
- [X] T006 [P] Add optional `receipt_url: str | None = None` field to `ExpenseCreateRequest` in `app/server/app/modules/expenses/schemas/expense_schemas.py` so the frontend can pass the pre-uploaded Cloudinary URL without re-uploading the file

**Checkpoint**: Gemini integration and schemas ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Image Upload and AI Analysis (Priority: P1) 🎯 MVP

**Goal**: User uploads an image, backend uploads to Cloudinary, sends to Gemini, returns extracted data or empty fields.

**Independent Test**: Call `POST /api/events/{event_id}/expenses/analyze-receipt` with a receipt image and verify the response contains extracted fields. Call with a product photo and verify `is_receipt: false` with null fields.

### Implementation for User Story 1

- [X] T007 [US1] Add `get_gemini_analyzer` dependency factory to `app/server/app/modules/expenses/dependencies.py` that creates a `GeminiReceiptAnalyzer` from settings
- [X] T008 [US1] Add `analyze_receipt` method to `ExpenseService` in `app/server/app/modules/expenses/services/expense_service.py` — accepts event_id, user_id, file content/type; uploads to Cloudinary via `ExpenseReceiptStorage`, sends URL to `GeminiReceiptAnalyzer`, returns `ReceiptAnalysisResponse`
- [X] T009 [US1] Add `POST /api/events/{event_id}/expenses/analyze-receipt` endpoint to `app/server/app/modules/expenses/routers/expense_router.py` — accepts multipart file upload, calls `service.analyze_receipt`, returns `ReceiptAnalysisResponse`
- [X] T010 [US1] Update `create_expense` method in `ExpenseService` (`app/server/app/modules/expenses/services/expense_service.py`) to accept the new `receipt_url` field from `ExpenseCreateRequest` — if `receipt_url` is provided and no file is uploaded, use the URL directly instead of re-uploading
- [X] T011 [US1] Create `analyzeReceipt` client function in `app/client/src/app/expenses/_services/expense-api.ts` that calls the new endpoint with a File object and returns the parsed `ReceiptAnalysisResponse`
- [X] T012 [US1] Replace the `ReceiptUploadPlaceholder` in `app/client/src/app/(event)/[eventId]/_components/event-actions-section.tsx` with a real image upload step — file input with preview, calls `analyzeReceipt`, shows loading state, then navigates to `/expenses/event/{eventId}/create` passing data via `sessionStorage`
- [X] T013 [US1] Update `app/client/src/app/expenses/event/[eventId]/create/page.tsx` to read pre-filled data from `sessionStorage` (AI-extracted fields + image_url) and pass them as initial props to `ExpenseForm`
- [X] T014 [US1] Update `ExpenseForm` in `app/client/src/app/expenses/_components/expense-form.tsx` to display the pre-uploaded receipt image (from `receipt_url` prop) as a read-only preview when in create mode with AI data, and to include `receipt_url` in the submission payload instead of re-uploading the file
- [X] T015 [US1] Handle AI failure gracefully in the frontend upload flow (`event-actions-section.tsx`) — if the backend returns `is_receipt: false` or the request fails, show a warning toast and navigate to the create form with empty fields but the image_url still attached

**Checkpoint**: User Story 1 complete — user can upload an image, AI extracts data (or not), form is pre-filled, image is persisted in Cloudinary

---

## Phase 4: User Story 2 — Expense Form and Member Exclusion (Priority: P2)

**Goal**: User reviews/edits pre-filled data, selects which members to include/exclude, and submits the expense with correct equal split.

**Independent Test**: Submit an expense for an event with 4 members, exclude 1, verify backend creates 3 ExpenseSplit records with correct amounts.

### Implementation for User Story 2

- [X] T016 [US2] Update `ExpenseParticipantsSheet` in `app/client/src/app/expenses/_components/expense-participants-sheet.tsx` to add a "Este eres tú" indicator next to the current user's name in the member list
- [X] T017 [US2] Pass the current user's member ID to `ExpenseParticipantsSheet` — update `ExpenseForm` (`app/client/src/app/expenses/_components/expense-form.tsx`) to accept and forward a `currentUserMemberId` prop
- [X] T018 [US2] Update `app/client/src/app/expenses/event/[eventId]/create/page.tsx` to fetch the current user's member ID and pass it to `ExpenseForm` as `currentUserMemberId`
- [X] T019 [US2] Verify the equal split calculation handles the payer self-exclusion case — test that when the payer excludes themselves from `participant_member_ids`, the backend `calculate_equal_splits` correctly divides among remaining members and the payer is still recorded as `paid_by_member_id`

**Checkpoint**: User Story 2 complete — member exclusion and split calculation work end-to-end, "Este eres tú" indicator visible

---

## Phase 5: User Story 3 — Expense Editing (Priority: P3)

**Goal**: User can edit all expense fields except the attached image; splits are recalculated.

**Independent Test**: Edit an existing expense's amount and participant list, verify splits are recalculated and the original receipt_url is unchanged.

### Implementation for User Story 3

- [X] T020 [US3] Update `ExpenseForm` in `app/client/src/app/expenses/_components/expense-form.tsx` to hide the receipt upload/replace controls when `mode="edit"` — show the existing image as a read-only thumbnail instead
- [X] T021 [US3] Update `app/client/src/app/expenses/[expenseId]/edit/page.tsx` to pass `currentUserMemberId` and ensure the participants sheet shows pre-selected members based on existing splits
- [X] T022 [US3] Verify the backend `update_expense` in `app/server/app/modules/expenses/services/expense_service.py` correctly recalculates splits when `participant_member_ids` changes — and does NOT modify `receipt_url` or `receipt_public_id` when no file is uploaded

**Checkpoint**: All user stories independently functional — expense CRUD with AI analysis, member exclusion, and immutable image editing

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T023 [P] Add activity logging for receipt analysis in `app/server/app/modules/expenses/services/expense_service.py` — log `expense_receipt_analyzed` action type when AI analysis completes
- [X] T024 [P] Run `pnpm typecheck` in `app/client/` to verify frontend type safety
- [X] T025 [P] Run `fastapi dev` to verify backend starts without import errors
- [X] T026 Run end-to-end validation per `specs/016-expense-creation/quickstart.md` scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion. Can be done in parallel with US1 on the frontend side, but the backend parts of US1 (endpoint) should exist first.
- **User Story 3 (Phase 5)**: Depends on Phase 2. Frontend changes are independent but backend verification depends on US1/US2 endpoint existing.
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Backend already handles member exclusion via `participant_member_ids`. Frontend work (indicator) is independent.
- **User Story 3 (P3)**: Backend `update_expense` already exists and works. Frontend changes are independent.

### Within Each User Story

- Backend before frontend (endpoint must exist for frontend to call it)
- Schema/model changes before service changes
- Service changes before router changes
- Router changes before frontend integration

### Parallel Opportunities

- T005 and T006 can run in parallel (different schema additions)
- T023, T024, T025 can all run in parallel
- US2 frontend tasks (T016-T018) can run in parallel with US1 frontend tasks (T012-T015) as they touch different files
- US3 frontend tasks (T020-T021) can run in parallel with US2 tasks

---

## Parallel Example: User Story 1

```text
# Backend — sequential:
T007 → T008 → T009 → T010

# Frontend — after backend endpoint exists:
T011 → T012 (upload flow) and T013 (create page) in parallel → T014 → T015
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T006)
3. Complete Phase 3: User Story 1 (T007–T015)
4. **STOP and VALIDATE**: Upload a receipt → see pre-filled form → submit expense
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → AI receipt analysis working → Deploy (MVP!)
3. Add User Story 2 → Member exclusion + "Este eres tú" indicator → Deploy
4. Add User Story 3 → Edit mode with immutable image → Deploy
5. Each story adds value without breaking previous stories
