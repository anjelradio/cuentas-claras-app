# Implementation Plan: AI-Powered Expense Creation Flow

**Branch**: `016-expense-creation` | **Date**: 2026-09-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/016-expense-creation/spec.md`

## Technical Context

| Area | Detail |
|------|--------|
| Backend | FastAPI + SQLModel + Alembic, Python 3.14, venv |
| Frontend | Next.js 16.3 (Turbopack), React 19, TailwindCSS 4, @base-ui/react |
| Database | PostgreSQL (via SQLModel/SQLAlchemy) |
| Auth | Better Auth with JWT (EdDSA via JWKS) |
| Cloud Storage | Cloudinary (receipts already configured) |
| AI | Gemini 2.0 Flash via `google-genai` Python SDK (NEW) |
| Existing Module | `app/server/app/modules/expenses/` — full CRUD already built |

## Existing Code Analysis

### Backend — What Already Exists
- **Expense model** with `receipt_url` and `receipt_public_id` fields ✅
- **ExpenseSplit model** with `assigned_amount` per member ✅
- **ExpenseReceiptStorage** integration with Cloudinary (upload, validate, destroy) ✅
- **ExpenseService** with `create_expense`, `update_expense`, `list_event_expenses`, `get_expense_detail`, `delete_expense`, `replace_receipt`, `delete_receipt` ✅
- **calculate_equal_splits** with proper decimal remainder handling ✅
- **ExpenseCreateRequest** already accepts `participant_member_ids` for selective splits ✅
- **Expense router** with full CRUD endpoints under `/api/events/{event_id}/expenses` ✅
- **ActivityService** integration for audit logging on expense CRUD ✅

### Frontend — What Already Exists
- **ExpenseForm** component (`create` and `edit` modes) with category selector, amount, name, description, date, receipt upload, and participant sheet ✅
- **ExpenseParticipantsSheet** with member toggle (select/deselect) and "Confirmar" button ✅
- **ExpenseDetailView** with receipt viewer, edit/delete actions ✅
- **Event home "Registrar gasto" button** exists but currently opens a placeholder `ReceiptUploadPlaceholder` ❌
- **Create expense page** at `/expenses/event/[eventId]/create` ✅

### What Needs to Be Built

#### Backend
1. Add `GEMINI_API_KEY` to `Settings` and `.env.example`
2. Install `google-genai` package
3. Create `GeminiReceiptAnalyzer` integration class
4. Create `POST /api/events/{event_id}/expenses/analyze-receipt` endpoint
5. Add `receipt_url` field to `ExpenseCreateRequest` to avoid re-uploading

#### Frontend
1. Replace the placeholder `ReceiptUploadPlaceholder` in event-actions-section with a real image upload flow
2. Wire the upload to call the new `analyze-receipt` backend endpoint
3. Redirect to the create form with pre-filled data (from AI) and the image URL
4. Update the create page to accept pre-filled data via query params / sessionStorage
5. Add "Este eres tú" indicator in the participants sheet
6. Ensure edit mode shows the image as read-only (no upload/replace button)

## Design Artifacts

- [research.md](research.md) — Technology decisions and rationale
- [data-model.md](data-model.md) — Entity schemas (no DB changes needed)
- [contracts/api.md](contracts/api.md) — API endpoint contracts
- [quickstart.md](quickstart.md) — Validation scenarios
