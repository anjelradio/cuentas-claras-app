# Tasks: Ciclo de vida del evento y QR de cobro

**Input**: Artefactos de `specs/010-event-lifecycle-qr/`.

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/events-lifecycle.openapi.yaml](./contracts/events-lifecycle.openapi.yaml).

**Tests**: Incluidos por el riesgo de autorización contextual, transacciones y almacenamiento externo, y porque la constitution exige pruebas proporcionales para estas reglas.

## Phase 1: Setup

**Purpose**: Incorporar la dependencia y configuración de Cloudinary sin secretos en el cliente.

- [X] T001 Add the Cloudinary Python SDK to `app/server/pyproject.toml` and regenerate the compatible pinned entry in `app/server/requirements.txt`
- [X] T002 [P] Add typed Cloudinary settings and safe validation in `app/server/app/core/config.py`
- [X] T003 [P] Document blank Cloudinary variables and QR folder in `app/server/.env.example`

---

## Phase 2: Foundational

**Purpose**: Dejar listas la persistencia, coordinación de transacciones, integración externa y contratos que bloquean todas las historias.

**⚠️ CRITICAL**: Ninguna historia puede completarse hasta terminar esta fase.

- [X] T004 Add `qr_image_public_id` and the persistent `QrAssetCleanup` SQLModel in `app/server/app/modules/events/models/event_member.py` and `app/server/app/modules/events/models/qr_asset_cleanup.py`
- [X] T005 Register the new QR cleanup model in `app/server/app/db/models.py` and create its Alembic migration in `app/server/alembic/versions/`
- [X] T006 Refactor event and member repository write methods for caller-controlled atomic transactions in `app/server/app/modules/events/repositories/event_repository.py` and `app/server/app/modules/events/repositories/member_repository.py`
- [X] T007 Create repository operations for QR metadata and pending cleanup records in `app/server/app/modules/events/repositories/member_repository.py` and `app/server/app/modules/events/repositories/qr_asset_cleanup_repository.py`
- [X] T008 Create the server-only Cloudinary adapter with upload and destroy operations in `app/server/app/modules/events/integrations/cloudinary_storage.py`
- [X] T009 Create QR request/response schemas and the public error mapping contract in `app/server/app/modules/events/schemas/qr_schemas.py` and `app/server/app/modules/events/schemas/__init__.py`
- [X] T010 Create reusable event-state and membership authorization helpers in `app/server/app/modules/events/services/event_authorization_service.py`
- [X] T011 Create a retry-safe QR cleanup service and application startup/lifespan invocation in `app/server/app/modules/events/services/qr_cleanup_service.py` and `app/server/app/main.py`
- [X] T012 [P] Create Zod response schemas and inferred event/QR types in `app/client/src/app/(event)/_schemas/event-api-schemas.ts` and `app/client/src/app/(event)/_types/event.ts`
- [ ] T013 [P] Validate external event API responses and parse the public error envelope in `app/client/src/app/(event)/_services/event-api.ts` and add valid/invalid schema coverage in `app/client/src/app/(event)/_schemas/event-api-schemas.test.ts`
- [ ] T014 [P] Create backend fakes, representative persistence fixtures and JWT-valid/JWT-expired contract fixtures in `app/server/tests/conftest.py`, `app/server/tests/fakes/cloudinary_storage.py` and `app/server/tests/contract/test_event_authentication.py`

**Checkpoint**: La infraestructura puede persistir QR, limpiar activos de forma reintentable y presentar errores seguros sin exponer secretos.

---

## Phase 3: User Story 1 - Abandonar un evento abierto (Priority: P1) 🎯 MVP

**Goal**: Permitir que un miembro regular abandone solamente un evento abierto desde “Mis eventos”, limpiando su QR y mostrando el resultado correcto; el dueño y los eventos cerrados deben ser rechazados.

**Independent Test**: Con un miembro regular, un dueño y eventos abiertos/cerrados, el contrato conserva o cambia la membresía según corresponda y la lista define la acción y resultado posterior correctos.

### Tests for User Story 1

- [ ] T015 [P] [US1] Add leave-event contract coverage for active member, owner, closed event, stale request and concurrent leave attempts in `app/server/tests/contract/test_event_leave.py`
- [ ] T016 [P] [US1] Add leave-event service coverage for QR detachment and retryable cleanup failure in `app/server/tests/unit/test_member_service.py`
- [ ] T017 [P] [US1] Add My Events leave-dialog and post-success refresh requirements coverage in `app/client/src/app/(event)/my-events/my-events-page.test.tsx`

### Implementation for User Story 1

- [X] T018 [US1] Enforce open-event status, owner denial, atomic membership change, QR detachment and cleanup recording in `app/server/app/modules/events/services/member_service.py`
- [X] T019 [US1] Keep the existing leave route aligned with the public operation result and error schemas in `app/server/app/modules/events/routers/event_router.py`
- [X] T020 [US1] Add `leaveEvent` to the validated client API in `app/client/src/app/(event)/_services/event-api.ts`
- [X] T021 [US1] Extract the open-event leave control and shadcn AlertDialog into `app/client/src/app/(event)/my-events/_components/leave-event-dialog.tsx`
- [X] T022 [US1] Integrate the Stitch-aligned leave control, toast outcomes, event-card navigation isolation and `router.refresh()` in `app/client/src/app/(event)/my-events/page.tsx`

**Checkpoint**: US1 is independently usable from “Mis eventos”; no owner or closed event can be abandoned through an outdated client or direct request.

---

## Phase 4: User Story 2 - Transferir la propiedad sin permisos obsoletos (Priority: P1)

**Goal**: Transferir propiedad solo a un miembro activo de un evento abierto y retirar de inmediato los permisos visuales del dueño anterior mediante redirección a “Mis eventos”.

**Independent Test**: Una transferencia válida deja un solo dueño y lleva al dueño anterior a una lista actualizada; intentos de miembro, destinatario inactivo o evento cerrado no cambian estado.

### Tests for User Story 2

- [ ] T023 [P] [US2] Add transfer-ownership contract and concurrency coverage for owner, inactive recipient, closed event and competing requests in `app/server/tests/contract/test_event_transfer_ownership.py`
- [ ] T024 [P] [US2] Add Members view coverage for redirect and toast after transfer success or failure in `app/client/src/app/(event)/[eventId]/members/members-view.test.tsx`

### Implementation for User Story 2

- [X] T025 [US2] Make transfer ownership conditional on current owner, active recipient and open status within one transaction in `app/server/app/modules/events/services/event_service.py`
- [X] T026 [US2] Align transfer route response and error behavior with the lifecycle contract in `app/server/app/modules/events/routers/event_router.py`
- [X] T027 [US2] Replace local member refresh after successful transfer with toast and `/my-events` redirect in `app/client/src/app/(event)/[eventId]/members/members-view.tsx`

**Checkpoint**: US2 prevents stale owner controls by redirecting after the authoritative transfer result.

---

## Phase 5: User Story 3 - Cerrar y reabrir un evento (Priority: P2)

**Goal**: Permitir únicamente al dueño cerrar/reabrir y convertir un evento cerrado en solo lectura para todas las mutaciones de eventos y membresías.

**Independent Test**: El dueño alterna entre `open` y `closed`; toda otra identidad y toda mutación distinta a reabrir es rechazada mientras está cerrado.

### Tests for User Story 3

- [ ] T028 [P] [US3] Add PATCH status contract coverage for owner, former owner, invalid transition, stale status and concurrent close/reopen requests in `app/server/tests/contract/test_event_status.py`
- [ ] T029 [P] [US3] Add closed-event denial coverage for invitation, member removal, join and event deletion in `app/server/tests/contract/test_event_closed_mutations.py`
- [ ] T030 [P] [US3] Add Event Home owner action and post-mutation refresh coverage in `app/client/src/app/(event)/[eventId]/_components/event-actions-section.test.tsx`

### Implementation for User Story 3

- [X] T031 [US3] Enforce owner-only status transitions and closed read-only semantics, including event deletion, in `app/server/app/modules/events/services/event_service.py`
- [X] T032 [US3] Enforce closed-event rejection for leave, join, member removal and invitation generation in `app/server/app/modules/events/services/member_service.py` and `app/server/app/modules/events/services/invitation_service.py`
- [X] T033 [US3] Add the owner-only close/reopen action with Sonner feedback and refresh in `app/client/src/app/(event)/[eventId]/_components/event-actions-section.tsx`
- [X] T034 [US3] Pass event status into Event Home actions and hide or disable closed-event mutations in `app/client/src/app/(event)/[eventId]/page.tsx` and `app/client/src/app/(event)/[eventId]/_components/event-actions-section.tsx`

**Checkpoint**: US3 makes closed events read-only in both interface and backend, except reopening by the current owner.

---

## Phase 6: User Story 4 - Registrar y actualizar mi QR de cobro (Priority: P2)

**Goal**: Permitir a un miembro activo de un evento abierto consultar, crear y reemplazar únicamente su propio QR sin exponer credenciales ni perder el activo anterior ante fallos.

**Independent Test**: El detalle de evento y QR propio se obtienen juntos; archivos válidos producen una referencia confirmada, errores conservan la anterior y eventos cerrados o miembros inactivos son rechazados.

### Tests for User Story 4

- [ ] T035 [P] [US4] Add QR API contract coverage for own-QR read, multipart create/replace, invalid files, inactive member, closed event and JWT authentication failures in `app/server/tests/contract/test_event_my_qr.py`
- [ ] T036 [P] [US4] Add QR service coverage for validation, persistence compensation, replacement cleanup and leave cleanup retry in `app/server/tests/unit/test_qr_service.py`
- [ ] T037 [P] [US4] Add QR Sheet coverage for empty, existing, success and recoverable error states in `app/client/src/app/(event)/[eventId]/_components/qr-sheet.test.tsx`

### Implementation for User Story 4

- [X] T038 [US4] Implement own-QR read and multipart create/replace orchestration with validated files and compensating cleanup in `app/server/app/modules/events/services/qr_service.py`
- [X] T039 [US4] Add authenticated GET/PUT `/my-qr` routes with `UploadFile` schemas and safe public errors in `app/server/app/modules/events/routers/event_router.py`
- [X] T040 [US4] Add `getMyQr` and `upsertMyQr` FormData operations with Zod response validation in `app/client/src/app/(event)/_services/event-api.ts`
- [X] T041 [US4] Create the accessible QR Sheet with empty picker, confirmed image and update state in `app/client/src/app/(event)/[eventId]/_components/qr-sheet.tsx`
- [X] T042 [US4] Fetch event detail and QR in parallel, wire the QR Sheet, Sonner outcomes, close and refresh behavior in `app/client/src/app/(event)/[eventId]/page.tsx` and `app/client/src/app/(event)/[eventId]/_components/event-actions-section.tsx`

**Checkpoint**: US4 persists only the authenticated member’s QR and remains safe across invalid input, Cloudinary failure, persistence failure and closed-event requests.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Completar validaciones de contrato, accesibilidad, migración y calidad transversal.

- [ ] T043 [P] Add cross-route schema and public-error consistency coverage in `app/server/tests/contract/test_event_lifecycle_contract.py`
- [ ] T044 [P] Add representative repository transaction and cleanup-persistence coverage in `app/server/tests/integration/test_event_qr_repository.py`
- [ ] T045 [P] Add keyboard, focus restoration and responsive overflow coverage for leave dialogs and QR Sheets in `app/client/src/app/(event)/[eventId]/_components/qr-sheet.test.tsx` and `app/client/src/app/(event)/my-events/my-events-page.test.tsx`
- [ ] T046 Run Alembic upgrade validation and model-registry migration coverage in `app/server/tests/integration/test_event_qr_migration.py`
- [ ] T047 Define and run reproducible 2-second refresh and 5-second QR confirmation measurements in `app/client/src/app/(event)/__tests__/event-lifecycle-performance.test.tsx`
- [ ] T048 Run backend and frontend quality commands documented in `specs/010-event-lifecycle-qr/quickstart.md` and record any corrections in the affected `app/server/` or `app/client/` source files

---

## Dependencies & Execution Order

- **Phase 1** has no dependencies.
- **Phase 2** depends on Phase 1 and blocks all stories.
- **US1** depends on Phase 2 and is the MVP increment.
- **US2** depends on Phase 2; run after US1 when sharing the event service transaction refactor.
- **US3** depends on Phase 2 and should precede US4 because QR writes must honor closed-event semantics.
- **US4** depends on Phase 2 and US3’s closed-state guard.
- **Polish** depends on all desired user stories.

### Parallel Opportunities

- T002 and T003 can run in parallel.
- T012 and T013 can run in parallel with independent backend infrastructure files once T004–T011 dependencies permit.
- Within each story, its test tasks marked `[P]` target independent files and can proceed concurrently.
- US1 and US2 can be assigned separately after Phase 2 only if changes to `event_service.py` are coordinated; US3 and US4 remain sequential because QR mutation depends on closed-event enforcement.

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational phases.
2. Complete US1 and its tests.
3. Validate the leave flow from “Mis eventos”, including owner/closed denials and QR cleanup recording.

### Incremental Delivery

1. Add US2 to eliminate stale ownership permissions.
2. Add US3 to enforce the closed-event lifecycle.
3. Add US4 for Cloudinary-backed QR lifecycle after the state guard is authoritative.
4. Complete cross-cutting migration, accessibility and quality validation.

## Notes

- Every task follows `- [ ] T### [P?] [US?] description with exact path`.
- `[P]` denotes a file-independent task; it does not waive the phase dependency.
- Do not modify `specs/` during implementation except task-state management explicitly requested by the user.

## Phase 8: Convergence

- [X] T049 CRITICAL Refactor event lifecycle services to depend on repositories rather than `Session` or direct SQL; move all event/member reads and writes behind repository operations in `app/server/app/modules/events/services/event_service.py`, `app/server/app/modules/events/services/member_service.py`, `app/server/app/modules/events/services/qr_service.py`, `app/server/app/modules/events/repositories/event_repository.py` and `app/server/app/modules/events/repositories/member_repository.py` per Constitution V and VII (contradicts)
- [ ] T050 CRITICAL Implement caller-controlled transaction boundaries and concurrency-safe ownership transfer/event membership mutations, including rollback behavior and persistence tests, in `app/server/app/modules/events/repositories/`, `app/server/app/modules/events/services/` and `app/server/tests/` per FR-009 and SC-009 (partial)
- [X] T051 Attempt queued Cloudinary QR cleanup after a successful leave commit without reverting the membership on failure, and retain the startup retry path, in `app/server/app/modules/events/services/member_service.py`, `app/server/app/modules/events/services/qr_cleanup_service.py` and related tests per FR-028 (partial)
- [ ] T052 Validate every event API response and public error envelope in both browser and server-side API clients, including invitations and operation results, and add valid/invalid boundary tests in `app/client/src/app/(event)/_schemas/`, `app/client/src/app/(event)/_services/` and their tests per plan: frontend boundary validation (partial)
- [ ] T053 Add the outstanding feature-level contract, concurrency, repository, QR lifecycle, accessibility and responsive UI coverage under `app/server/tests/` and `app/client/src/app/(event)/` per Constitution III and SC-001 through SC-009 (missing)
