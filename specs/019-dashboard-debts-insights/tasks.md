# Tasks: Dashboard Principal, Liquidación de Deudas y Resumen Estadístico

**Input**: Feature specification and plan from `specs/019-dashboard-debts-insights/`

---

## Phase 1: Setup & Schemas (Backend DTOs & Frontend API Clients)

**Purpose**: Definición de contratos, esquemas Pydantic y clientes frontend para agregaciones

- [x] T001 [P] Definir schemas Pydantic de deudas (`DebtsSummaryRead`, `DebtToPayItem`, `DebtToCollectItem`) en `app/server/app/modules/expenses/schemas/expense_schemas.py`
- [x] T002 [P] Definir schema Pydantic de pagos por verificar (`PendingVerificationPaymentRead`) en `app/server/app/modules/payments/schemas/payment_schemas.py`
- [x] T003 [P] Definir schemas Pydantic de eventos recientes y estadísticas (`RecentEventRead`, `EventStatisticsRead`, `EventCategoryStatItem`) en `app/server/app/modules/events/schemas/event_schemas.py`
- [x] T004 [P] Crear/actualizar schemas Zod y tipos en `app/client/src/app/expenses/_schemas/expense-api-schemas.ts` y `_types/expense.ts`
- [x] T005 [P] Crear cliente de servicios de deudas en `app/client/src/app/expenses/_services/expense-api.ts` y `server-expense-api.ts`

---

## Phase 2: Foundational (Servicios de Agregación en Backend)

**Purpose**: Lógica de consulta y cálculo central requerida para los endpoints del dashboard

- [x] T006 [P] Implementar método de consulta de resumen de deudas `get_debts_summary(user_id, event_id=None)` en `app/server/app/modules/expenses/services/expense_service.py`
- [x] T007 [P] Implementar método `get_pending_verification(user_id)` en `app/server/app/modules/payments/services/payment_service.py`
- [x] T008 [P] Implementar método `get_recent_events_with_spending(user_id, limit=2)` en `app/server/app/modules/events/services/event_service.py`
- [x] T009 [P] Implementar método `get_event_statistics(event_id, user_id)` en `app/server/app/modules/events/services/event_service.py`
- [x] T010 [P] Implementar método `get_user_recent_activities(user_id, limit=3)` en `app/server/app/modules/activity/services/activity.py`

---

## Phase 3: User Story 1 - Consulta Global y Contextual de "Mis Deudas" (Priority: P1) 🎯 MVP

**Goal**: Permitir al usuario consultar el total consolidado y desglose de lo que debe y lo que le deben en el Home y filtrado por evento.

**Independent Test**: Usuario abre "Mis deudas" en el Home o dentro de un evento específico y visualiza los saldos acumulados con enlaces a cada gasto.

- [x] T011 [P] [US1] Implementar pruebas unitarias de agregación de deudas en `app/server/tests/unit/test_debts_summary.py`
- [x] T012 [US1] Implementar endpoint `GET /api/expenses/debts/summary` en `app/server/app/modules/expenses/routers/expense_router.py`
- [x] T013 [US1] Actualizar `MyDebtsSheet` en `app/client/src/app/home/_components/my-debts-sheet.tsx` para cargar dinámicamente las deudas globales con enlaces directos al detalle del gasto
- [x] T014 [US1] Conectar `MyDebtsSheet` contextual en `app/client/src/app/(event)/[eventId]/_components/event-overlay-flows.tsx` pasando `eventId={event.id}`

---

## Phase 4: User Story 2 - Notificaciones y Pagos Pendientes en "Requiere atención" (Priority: P1)

**Goal**: Listar en el Home los pagos declarados pendientes de confirmación para que el acreedor los revise y confirme/rechace.

**Independent Test**: Deudor declara pago y el acreedor ve la tarjeta en "Requiere atención" con botón "Revisar" que navega a `/expenses/[expenseId]`.

- [x] T015 [P] [US2] Implementar pruebas unitarias para consulta de pagos pendientes de verificación en `app/server/tests/unit/test_pending_verification.py`
- [x] T016 [US2] Implementar endpoint `GET /api/payments/pending-verification` en `app/server/app/modules/payments/routers/payment_router.py`
- [x] T017 [US2] Actualizar componente `RequireAttentionList` en `app/client/src/app/home/_components/require-attention-card.tsx` para listar pagos reales con botón "Revisar"

---

## Phase 5: User Story 3 - Resumen Estadístico por Categoría en el Home del Evento (Priority: P2)

**Goal**: Mostrar la distribución porcentual de gastos por categoría y monto total del evento en `/(event)/[eventId]`.

**Independent Test**: Consultar Home de evento y verificar que los porcentajes y montos por categoría coincidan con los gastos activos en el gráfico SVG.

- [x] T018 [P] [US3] Implementar pruebas unitarias de cálculo de estadísticas de evento en `app/server/tests/unit/test_event_statistics.py`
- [x] T019 [US3] Implementar endpoint `GET /api/events/{event_id}/statistics` en `app/server/app/modules/events/routers/event_router.py`
- [x] T020 [US3] Actualizar componente `EventStatisticsCard` y `page.tsx` en `app/client/src/app/(event)/[eventId]/` para conectar estadísticas reales al gráfico SVG

---

## Phase 6: User Story 4 - Visualización de Eventos Recientes con Total Personal Gastado (Priority: P2)

**Goal**: Mostrar los 2 últimos eventos del usuario en el Home con el cálculo de su gasto personal consumido.

**Independent Test**: Consultar Home y verificar que los 2 eventos más recientes reflejen el consumo personal exacto del usuario.

- [x] T021 [P] [US4] Implementar endpoint `GET /api/events/recent` en `app/server/app/modules/events/routers/event_router.py`
- [x] T022 [US4] Actualizar componente `RecentEventsCard` en `app/client/src/app/home/_components/recent-events-card.tsx` para mostrar los 2 últimos eventos con gasto personal real

---

## Phase 7: User Story 5 - Actividad Reciente Global en el Home (Priority: P3)

**Goal**: Mostrar las 3 actividades más recientes ocurridas en los eventos donde participa el usuario.

**Independent Test**: Consultar Home y verificar que aparezcan las 3 actividades más recientes de sus eventos.

- [x] T023 [P] [US5] Implementar endpoint `GET /api/activities/user-recent` en `app/server/app/modules/activity/routers/activity.py`
- [x] T024 [US5] Actualizar componente `RecentActivityCard` en `app/client/src/app/home/_components/recent-activity-card.tsx` para mostrar las 3 actividades más recientes
- [x] T025 [US5] Integrar Server Component en `app/client/src/app/home/page.tsx` realizando fetch en paralelo de todos los datos reales del Home

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validación integral de calidad, pruebas automatizadas y cierre

- [x] T026 [P] Ejecutar suite de pruebas pytest de backend en `app/server/`
- [x] T027 [P] Ejecutar chequeo de tipos TypeScript y pruebas unitarias de frontend en `app/client/`
- [x] T028 Ejecutar validación end-to-end de `quickstart.md`

---

## Dependencies & Execution Order

```text
Phase 1 (Setup) ──► Phase 2 (Foundational)
                          │
         ┌────────────────┼────────────────┬────────────────┐
         ▼                ▼                ▼                ▼
     Phase 3 (US1)    Phase 4 (US2)    Phase 5 (US3)    Phase 6 (US4)
         │                │                │                │
         └────────────────┴───────┬────────┴────────────────┘
                                  ▼
                             Phase 7 (US5: Home Integration)
                                  │
                                  ▼
                             Phase 8 (Polish & Tests)
```
