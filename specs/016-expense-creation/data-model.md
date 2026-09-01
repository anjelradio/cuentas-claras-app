# Data Model: AI-Powered Expense Creation Flow

## Existing Entities (No Changes Required)

### Expense (table: `expense`)
> Already exists at `app/server/app/modules/expenses/models/expense.py`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, indexed | From BaseModel |
| event_id | UUID | FK → event.id, indexed | Event this expense belongs to |
| created_by_member_id | UUID | FK → eventmember.id, indexed | Member who created the record |
| paid_by_member_id | UUID | FK → eventmember.id, indexed | Member who actually paid |
| name | str | max 100 chars | AI can extract this |
| description | str \| None | max 500 chars | AI can extract this |
| amount | Decimal(10,2) | CHECK > 0 | AI can extract this from receipt |
| category | ExpenseCategory | String(30), NOT NULL | AI maps to enum value |
| split_type | ExpenseSplitType | String(20), NOT NULL | Default: "equal" |
| expense_date | datetime | NOT NULL | AI can extract this from receipt |
| receipt_url | str \| None | max 500 chars | Cloudinary URL — already supported |
| receipt_public_id | str \| None | max 200 chars | Cloudinary public_id for deletion |
| created_at | datetime | NOT NULL | From BaseModel |
| updated_at | datetime | NOT NULL | From BaseModel |
| deleted_at | datetime \| None | Soft delete | From BaseModel |

**Index**: `ix_expense_event_id_deleted_at_date` on `(event_id, deleted_at, expense_date)`

### ExpenseSplit (table: `expensesplit`)
> Already exists at `app/server/app/modules/expenses/models/expense_split.py`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, indexed | From BaseModel |
| expense_id | UUID | FK → expense.id, indexed | Parent expense |
| member_id | UUID | FK → eventmember.id, indexed | Participant member |
| assigned_amount | Decimal(10,2) | CHECK >= 0 | Calculated share |
| created_at | datetime | NOT NULL | From BaseModel |
| updated_at | datetime | NOT NULL | From BaseModel |
| deleted_at | datetime \| None | Soft delete | From BaseModel |

**Unique constraint**: `uq_expense_split_member` on `(expense_id, member_id)`

> **Decision**: No `is_excluded` column needed. Excluded members are simply omitted from the splits list. The existing `participant_member_ids` field in `ExpenseCreateRequest` already defines who is included.

## Existing Enums (No Changes Required)

### ExpenseCategory (StrEnum)
```
FOOD = "food"
LODGING = "lodging"
TRANSPORT = "transport"
SHOPPING = "shopping"
ENTERTAINMENT = "entertainment"
OTHER = "other"
```

### ExpenseSplitType (StrEnum)
```
EQUAL = "equal"
EXACT = "exact"
```

## New Schemas (Response DTOs)

### ReceiptAnalysisResponse (new Pydantic model)
> For the new AI analysis endpoint response

| Field | Type | Notes |
|-------|------|-------|
| image_url | str | Cloudinary URL of the uploaded image |
| is_receipt | bool | Whether Gemini detected a receipt/invoice |
| name | str \| None | Extracted expense name/title |
| description | str \| None | Extracted description |
| amount | Decimal \| None | Extracted total amount |
| category | ExpenseCategory \| None | Mapped to existing enum |
| expense_date | str \| None | Extracted date as ISO string |

## New Integration: Gemini AI Service

### Configuration
- New setting: `GEMINI_API_KEY` in `Settings` class
- New config: `CLOUDINARY_RECEIPTS_FOLDER` already exists as `cuentas-claras/receipts`

### GeminiReceiptAnalyzer (new class)
> Location: `app/server/app/modules/expenses/integrations/gemini_analyzer.py`

**Responsibilities**:
1. Accept a Cloudinary image URL
2. Send to Gemini 2.0 Flash with a structured prompt
3. Parse the JSON response
4. Return extracted fields or empty values on failure

**Prompt strategy**:
- Instruct Gemini to classify: receipt/invoice vs. product photo
- If receipt: extract name, description, total amount, category (from enum list), and date
- If product photo: return `is_receipt: false` with all other fields null
- Always return valid JSON matching the schema

## Relationships Diagram

```
Event (1) ──── (N) EventMember
  │                    │
  │                    │ paid_by_member_id
  │                    │ created_by_member_id
  │                    ▼
  └──── (N) Expense ──── (N) ExpenseSplit
                │                  │
                │ receipt_url      │ member_id → EventMember
                ▼
           Cloudinary
                │
                ▼
          Gemini API (analysis only, at creation time)
```
