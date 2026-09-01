# Feature Specification: AI-Powered Expense Creation Flow

**Feature Branch**: `[016-expense-creation]`
**Created**: 2026-09-01
**Status**: Draft

**Input**: User description: "implementar un flujo en donde una persona cuando quiere registrar un gasto tiene que seleccionar un evento... adjuntar una imagen de la factura o compras... procesarla con Gemini... si es factura extraer datos... si son productos no extraer nada... llenar formulario... al confirmar deseleccionar miembros para excluir... guardar imagen en Cloudinary"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Image Upload and AI Analysis
As a user creating an expense, I want to upload a photo of a receipt or purchased items so that the AI can automatically extract expense details to save me time.
**Why this priority**: Core functionality of the new flow.
**Independent Test**: Upload an image in the frontend, check that the request goes to the backend, reaches Gemini, and returns either extracted data (for a receipt) or empty data (for products).
**Acceptance Scenarios**:
1. **Given** the user selects an active event and uploads a receipt image, **When** Gemini processes it, **Then** the user is redirected to the form pre-filled with the extracted total amount and category.
2. **Given** the user uploads a photo of market products (no receipt), **When** Gemini processes it, **Then** the user is redirected to the form with empty/default fields.

### User Story 2 - Expense Form and Member Exclusion
As a user submitting an expense, I want to review the pre-filled data, correct it if necessary, and optionally exclude specific event members from the split before confirming.
**Why this priority**: Required to finalize the expense and calculate correct debts.
**Independent Test**: Submit the expense form with 1 excluded member out of 4, verify the backend calculates the correct split and saves the expense.
**Acceptance Scenarios**:
1. **Given** a pre-filled expense form, **When** the user manually corrects a field (e.g. amount), **Then** the manual change is preserved upon submission.
2. **Given** an event with 4 members, **When** the user submits an expense of $100 and excludes 1 member, **Then** the total cost is split equally among the remaining 3 members.
3. **Given** an expense is confirmed, **When** it saves, **Then** the original image is uploaded and stored in Cloudinary and the resulting URL is saved with the expense.

### User Story 3 - Expense Editing
As a user who created an expense, I want to be able to edit its details later without changing the attached image.
**Why this priority**: Allows corrections for mistakes.
**Independent Test**: Edit an existing expense, change the amount, and verify the split updates and the image remains intact.
**Acceptance Scenarios**:
1. **Given** an existing expense, **When** the user edits the amount and confirms, **Then** the changes are saved and the original image in Cloudinary is kept.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST provide a UI to select an active event before starting the expense creation flow.
- **FR-002**: System MUST allow uploading a single image as proof of the expense.
- **FR-003**: System MUST immediately upload the selected image to Cloudinary and use the resulting URL for the subsequent backend operations.
- **FR-004**: System MUST send the image URL to the backend for analysis using the Gemini API.
- **FR-005**: System MUST differentiate between receipt images and product images via Gemini: extracting amount and category from receipts, and skipping extraction for products.
- **FR-006**: System MUST redirect the user to an expense form pre-filled with Gemini's extracted data (if any), linking the permanent Cloudinary URL to the expense record.
- **FR-007**: System MUST allow the user to select/deselect specific event members to exclude them from the split, including allowing the payer to exclude themselves.
- **FR-008**: System MUST divide the expense amount equally only among the non-excluded members.
- **FR-009**: System MUST allow editing all fields of an existing expense (including exclusions) except the attached image.
- **FR-010**: System MUST handle AI processing failures gracefully by displaying a warning and redirecting the user to an empty manual form.

### Key Entities
- **Expense**: Represents the main expense record. Must now include an `image_url` field (for Cloudinary URL).
- **ExpenseSplit / Exclusion**: Mechanism to record which members are included or excluded from the cost split.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: AI analysis completes and redirects to the form in under 5 seconds for 90% of requests.
- **SC-002**: The expense amount split is mathematically exact and distributes evenly among only the selected members.
- **SC-003**: Image is successfully persisted in Cloudinary 99.9% of the time before Gemini processing begins.

## Assumptions
- The split is always equal among included members (no custom percentages/amounts for this iteration).
- Image size and format constraints (e.g. max 5MB, JPEG/PNG) will be enforced on the frontend.
- Cloudinary credentials and Gemini API keys are already configured or will be provided in the backend environment.

## Clarifications
### Session 2026-09-01
- **AI Failure Fallback**: If Gemini fails or times out, the system will show a warning and immediately fall back to the empty manual form.
- **Image Upload Timing**: The image is uploaded to Cloudinary immediately upon selection in the frontend, and its URL is passed to Gemini for analysis, improving speed and reliability.
- **Payer Exclusion**: The user who pays the expense is allowed to exclude themselves from the split (e.g. paying on behalf of others without participating in the cost).
