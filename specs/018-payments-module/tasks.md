# Tasks: Módulo de Pagos y Liquidación (Efectivo y QR)

**Input**: Feature specification and plan from `specs/018-payments-module/`

---

## Phase 1: Setup (Módulo de Pagos & Infraestructura)

**Purpose**: Inicialización del módulo backend de pagos y contratos base

- [x] T001 Crear estructura del módulo en `app/server/app/modules/payments/` (`models/`, `repositories/`, `schemas/`, `services/`, `routers/`, `dependencies.py`)
- [x] T002 [P] Definir Enums `PaymentMethod` y `PaymentStatus` en `app/server/app/modules/payments/models/enums.py`
- [x] T003 [P] Crear cliente de servicios frontend en `app/client/src/app/expenses/_services/payment-api.ts`

---

## Phase 2: Foundational (Modelos, Repositorios y Persistencia)

**Purpose**: Infraestructura central de datos requerida para todas las historias de usuario

- [x] T004 Implementar modelo persistente `Payment` heredando de `BaseModel` en `app/server/app/modules/payments/models/payment.py`
- [x] T005 Registrar `Payment`, `PaymentMethod` y `PaymentStatus` en `app/server/app/db/models.py`
- [x] T006 [P] Implementar schemas Pydantic de entrada y lectura (`PaymentCreateRequest`, `PaymentRead`, `PaymentConfirmRequest`, `PaymentRejectRequest`, `PayerQrRead`) en `app/server/app/modules/payments/schemas/payment_schemas.py`
- [x] T007 [P] Implementar repositorio de pagos `PaymentRepository` en `app/server/app/modules/payments/repositories/payment_repository.py`
- [x] T008 Generar y aplicar migración de Alembic para la tabla `payment` en `app/server/alembic/versions/`

---

## Phase 3: User Story 1 - Declaración de pago por el deudor (Efectivo y QR) (Priority: P1) 🎯 MVP

**Goal**: Permitir al deudor con cuota asignada declarar su pago en efectivo o por QR con comprobante de transferencia bancaria.

**Independent Test**: Deudor autenticado declara pago en efectivo o adjunta comprobante QR para su cuota. La cuota pasa a estado `pending_confirmation` y la declaración queda almacenada.

- [x] T009 [P] [US1] Implementar pruebas de declaración de pagos en `app/server/tests/unit/test_payment_service.py`
- [x] T010 [US1] Implementar lógica de negocio para `declare_cash_payment` y `declare_qr_payment` con subida a Cloudinary en `app/server/app/modules/payments/services/payment_service.py`
- [x] T011 [US1] Implementar endpoints `GET /api/expenses/{expense_id}/payer-qr` y `POST /api/expenses/{expense_id}/splits/{split_id}/pay` en `app/server/app/modules/payments/routers/payment_router.py`
- [x] T012 [US1] Registrar router de pagos en `app/server/app/main.py` y resolver `dependencies.py`
- [x] T013 [US1] Implementar Bottom Sheet `SettleExpenseSheet` interactivo (flujo de 3 pasos: método, QR/efectivo, subida de comprobante) en `app/client/src/app/expenses/[expenseId]/_components/settle-expense-sheet.tsx`

---

## Phase 4: User Story 2 - Verificación, confirmación y rechazo por el pagador (Priority: P1)

**Goal**: Permitir al pagador original revisar los pagos declarados, inspeccionar comprobantes y confirmar o rechazar cada uno.

**Independent Test**: Pagador abre un pago en estado `pending_confirmation`, confirma la recepción (pasando cuota a `paid`) o lo rechaza (regresando cuota a `pending`).

- [x] T014 [P] [US2] Implementar pruebas para confirmación y rechazo atómico de pagos en `app/server/tests/unit/test_payment_service.py`
- [x] T015 [US2] Implementar métodos `confirm_payment` y `reject_payment` con transacciones atómicas y logs de auditoría en `app/server/app/modules/payments/services/payment_service.py`
- [x] T016 [US2] Implementar endpoints `POST /api/payments/{payment_id}/confirm` y `POST /api/payments/{payment_id}/reject` en `app/server/app/modules/payments/routers/payment_router.py`
- [x] T017 [US2] Crear componente Bottom Sheet de verificación `VerifyPaymentSheet` (previsualización de comprobante y botones Confirmar/Rechazar) en `app/client/src/app/expenses/[expenseId]/_components/verify-payment-sheet.tsx`

---

## Phase 5: User Story 3 - Visualización contextual del detalle del gasto (Priority: P2)

**Goal**: Presentar botones y secciones adaptadas según si el usuario actual es el pagador o un deudor en la vista del gasto.

**Independent Test**: Consultar detalle de gasto con usuario pagador (muestra Editar/Anular y lista interactiva) vs usuario deudor (muestra Saldar mi parte y lista solo lectura).

- [x] T018 [US3] Enriquecer `ExpenseDetailRead` y `get_expense_detail` con `is_payer`, `current_user_split` y `payment_status` por participante en `app/server/app/modules/expenses/services/expense_service.py` y `schemas/expense_schemas.py`
- [x] T019 [US3] Actualizar tipos en `app/client/src/app/expenses/_types/expense.ts` y schemas Zod en `app/client/src/app/expenses/_schemas/expense-api-schemas.ts`
- [x] T020 [US3] Actualizar `ExpenseSummary` en `app/client/src/app/expenses/[expenseId]/_components/expense-summary.tsx` para alternar botones de edición vs saldar deuda
- [x] T021 [US3] Actualizar `ExpenseParticipants` en `app/client/src/app/expenses/[expenseId]/_components/expense-participants.tsx` con badges de estado y apertura de `VerifyPaymentSheet`
- [x] T022 [US3] Integrar vista completa en `app/client/src/app/expenses/[expenseId]/_components/expense-detail-view.tsx`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validación integral de calidad, pruebas automatizadas y cierre

- [x] T023 [P] Ejecutar suite de pruebas pytest de backend en `app/server/`
- [x] T024 [P] Ejecutar chequeo de tipos TypeScript y pruebas unitarias de frontend en `app/client/`
- [x] T025 Ejecutar validación end-to-end de `quickstart.md`

---

## Dependencies & Execution Order

```text
Phase 1 (Setup) ──► Phase 2 (Foundational)
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
Phase 3 (US1: Declaración)        Phase 4 (US2: Verificación)
         │                                 │
         └────────────────┬────────────────┘
                          ▼
              Phase 5 (US3: Contexto UI)
                          │
                          ▼
              Phase 6 (Polish & Tests)
```
