# Tasks: Deep-linking de Acciones y Apertura Automática de Modales en Gastos y Deudas

**Input**: Feature specification and plan from `specs/020-ux-action-deeplinks/`

---

## Phase 1: Setup & Schemas (Backend & Frontend DTOs)

**Purpose**: Extensión de schemas y tipos para soportar identificación de splits en notificaciones

- [x] T001 [P] Añadir `split_id: UUID` al schema `PendingVerificationPaymentRead` en `app/server/app/modules/payments/schemas/payment_schemas.py`
- [x] T002 [P] Actualizar `pendingVerificationPaymentReadSchema` en `app/client/src/app/expenses/_schemas/expense-api-schemas.ts` y tipo `PendingVerificationPayment` en `app/client/src/app/expenses/_types/expense.ts`

---

## Phase 2: Foundational (Backend Population & Tests)

**Purpose**: Garantizar que el endpoint de pagos pendientes envíe el `split_id`

- [x] T003 [P] Asignar `split_id=split.id` en `PaymentService.get_pending_verification` en `app/server/app/modules/payments/services/payment_service.py`
- [x] T004 [P] Actualizar pruebas unitarias en `app/server/tests/unit/test_pending_verification.py` para validar presencia de `split_id`

---

## Phase 3: User Story 1 - Apertura Automática de Verificación de Pago desde "Requiere atención" (Priority: P1) 🎯 MVP

**Goal**: Permitir al acreedor hacer clic en "Revisar" en el Home y ver de inmediato el modal de comprobante del deudor abierto para confirmar o rechazar el pago.

**Independent Test**: Acreedor pulsa "Revisar" en el Home y la página `/expenses/[expenseId]?action=verify&splitId=[splitId]` abre automáticamente el bottom sheet de verificación con los datos del participante.

- [x] T005 [P] [US1] Actualizar enlace del botón "Revisar" en `app/client/src/app/home/_components/require-attention-card.tsx` a `/expenses/${item.expense_id}?action=verify&splitId=${item.split_id}`
- [x] T006 [US1] Actualizar `ExpenseParticipants` en `app/client/src/app/expenses/[expenseId]/_components/expense-participants.tsx` para aceptar prop `autoOpenSplitId?: string | null` y activar automáticamente `VerifyPaymentSheet`
- [x] T007 [US1] Actualizar `ExpenseDetailView` en `app/client/src/app/expenses/[expenseId]/_components/expense-detail-view.tsx` para leer `action` y `splitId` con `useSearchParams()`, propagar a `ExpenseParticipants` y limpiar suavemente la URL tras abrir/cerrar

---

## Phase 4: User Story 2 - Apertura Automática del Modal "Saldar mi deuda" desde "Mis Deudas" (Priority: P1)

**Goal**: Permitir al deudor hacer clic en un gasto en "Lo que debes" y entrar directamente al bottom sheet con las opciones QR y Efectivo para saldar su cuota.

**Independent Test**: Deudor pulsa sobre un gasto en "Lo que debes" y la página `/expenses/[expenseId]?action=pay` abre automáticamente el bottom sheet de "Saldar mi deuda".

- [x] T008 [P] [US2] Modificar navegación en pestaña "Lo que debes" de `MyDebtsSheet` en `app/client/src/app/home/_components/my-debts-sheet.tsx` hacia `/expenses/${item.expense_id}?action=pay`
- [x] T009 [US2] Actualizar `SettleExpenseSheet` en `app/client/src/app/expenses/[expenseId]/_components/settle-expense-sheet.tsx` para soportar prop `defaultOpen?: boolean`
- [x] T010 [US2] Conectar `autoOpenPay` en `ExpenseSummary` (`app/client/src/app/expenses/[expenseId]/_components/expense-summary.tsx`) cuando `action === "pay"` y el usuario tiene saldo pendiente

---

## Phase 5: User Story 3 - Navegación Estándar para "Lo que me deben" & Spinner de Carga (Priority: P2)

**Goal**: Mejorar la experiencia visual al abrir "Mis deudas" con un spinner mientras carga el backend y mantener navegación limpia sin auto-aperturas para gastos por cobrar.

**Independent Test**: Abrir "Mis deudas", observar el spinner mientras cargan los saldos y verificar que al hacer clic en "Lo que te deben" se navegue a la URL base sin abrir modales.

- [x] T011 [P] [US3] Añadir estado visual de carga con spinner animado en `MyDebtsSheet` (`app/client/src/app/home/_components/my-debts-sheet.tsx`) antes de renderizar opciones
- [x] T012 [US3] Asegurar que los ítems en "Lo que te deben" naveguen a la URL limpia `/expenses/${item.expense_id}` sin activar ningún modal

---

## Phase 6: User Story 4 - Consulta Contextual de Deudas en Home del Evento (Priority: P2)

**Goal**: Garantizar paridad del flujo de auto-apertura en el sheet contextual "Mis deudas" dentro de `/[eventId]`.

**Independent Test**: Abrir "Mis deudas" dentro de un evento específico y verificar filtrado contextual y auto-apertura con `?action=pay`.

- [x] T013 [US4] Verificar y asegurar que `MyDebtsSheet` dentro de `app/client/src/app/(event)/[eventId]/_components/event-overlay-flows.tsx` filtre las deudas únicamente para `eventId` con soporte idéntico de auto-apertura

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificación de calidad y pruebas automatizadas

- [x] T014 [P] Ejecutar suite de pruebas pytest en `app/server/`
- [x] T015 [P] Ejecutar typecheck y vitest en `app/client/`
- [x] T016 Ejecutar validación end-to-end de `quickstart.md`

---

## Dependencies & Execution Order

```text
Phase 1 (Setup) ──► Phase 2 (Foundational)
                          │
         ┌────────────────┴────────────────┬────────────────┐
         ▼                                 ▼                ▼
     Phase 3 (US1: Revisar)        Phase 4 (US2: Pagar)   Phase 5 (US3: Spinner & Cobros)
         │                                 │                │
         └────────────────┬────────────────┴────────────────┘
                          ▼
                     Phase 6 (US4: Evento Contextual)
                          │
                          ▼
                     Phase 7 (Polish & Tests)
```
