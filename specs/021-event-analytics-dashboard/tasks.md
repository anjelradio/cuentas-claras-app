# Tasks: Dashboard y Analítica Visual del Evento

**Branch**: `021-event-analytics-dashboard`
**Input**: `specs/021-event-analytics-dashboard/` (spec.md, plan.md, data-model.md, contracts/analytics-api.md, research.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias incompletas)
- **[Story]**: A qué user story corresponde la tarea (US1–US5)
- Todas las rutas son relativas a la raíz del monorepo

---

## Phase 1: Setup (Infraestructura Compartida)

**Purpose**: Preparar los artefactos nuevos vacíos para backend y frontend antes de rellenarlos en fases posteriores.

- [x] T001 Crear archivo vacío `app/server/app/modules/events/repositories/analytics_repository.py` con docstring de módulo y clase `AnalyticsRepository` vacía
- [ ] T002 [P] Crear archivo vacío `app/server/app/modules/events/services/analytics_service.py` con docstring de módulo y clase `EventAnalyticsService` vacía

**Checkpoint**: Archivos nuevos del backend existen y son importables sin errores.

---

## Phase 2: Foundational (Prerrequisitos Bloqueantes)

**Purpose**: Schemas Pydantic + Zod + inyección de dependencias. Deben estar completos antes de implementar cualquier user story.

**⚠️ CRÍTICO**: Ninguna user story puede comenzar hasta que esta fase esté completa.

- [ ] T003 Agregar schemas Pydantic `PersonalBalanceRead`, `PayerContributionRead`, `DailyExpensePointRead` y `EventDashboardRead` en `app/server/app/modules/events/schemas/event_schemas.py` (componer `EventCategoryStatItem` existente dentro de `EventDashboardRead.categories`)
- [ ] T004 [P] Agregar la función de dependencia `get_analytics_service()` en `app/server/app/modules/events/dependencies.py` que inyecte `AnalyticsRepository` y `EventAnalyticsService`
- [ ] T005 [P] Agregar schemas Zod `personalBalanceSchema`, `payerContributionSchema`, `dailyExpensePointSchema` y `eventDashboardSchema` en `app/client/src/app/expenses/_schemas/expense-api-schemas.ts` (reutilizar `eventCategoryStatItemSchema` existente dentro de `eventDashboardSchema.categories`)
- [ ] T006 [P] Exportar los tipos inferidos `PersonalBalance`, `PayerContribution`, `DailyExpensePoint`, `EventDashboard` en `app/client/src/app/expenses/_types/expense.ts` usando `z.infer<typeof ...Schema>`

**Checkpoint**: `tsc --noEmit` pasa en el cliente; los schemas Pydantic importan sin errores en el servidor.

---

## Phase 3: User Story 1 + 2 — KPIs Globales y Balance Personal (Priority: P1) 🎯 MVP

**Goal**: El endpoint `GET /api/events/{event_id}/dashboard` retorna `total_spent`, `expense_count`, `pending_settlements_count` y `personal_balance` correctos. La página del evento muestra los KPIs y el balance personal del usuario autenticado.

**Independent Test**: Consultar el endpoint con un usuario miembro activo del evento y verificar que los cuatro KPIs numéricos coinciden con los datos de la base de datos. Consultar con un usuario no miembro y verificar HTTP 403.

### Backend — US1 + US2

- [ ] T007 [US1] Implementar `AnalyticsRepository.get_kpis(event_id)` en `app/server/app/modules/events/repositories/analytics_repository.py`: query que retorna `total_spent`, `expense_count` y `pending_settlements_count` filtrando `Expense.deleted_at IS NULL`
- [ ] T008 [US2] Implementar `AnalyticsRepository.get_personal_balance(event_id, user_id)` en `app/server/app/modules/events/repositories/analytics_repository.py`: queries de `paid` y `consumed` via join `Expense → EventMember` y `ExpenseSplit → EventMember`
- [ ] T009 [US1] Implementar `EventAnalyticsService.get_dashboard(event_id, user_id)` en `app/server/app/modules/events/services/analytics_service.py`: verificar membresía activa del usuario (lanzar excepción de autorización si no), invocar repository para KPIs y balance personal, calcular `net_difference` y `status`, retornar `EventDashboardRead` parcial (categories=[], payer_contributions=[], expense_timeline=[])
- [ ] T010 [P] [US1] Registrar el route `GET /{event_id}/dashboard` en `app/server/app/modules/events/routers/event_router.py` con `response_model=EventDashboardRead` usando `EventAnalyticsService` vía `get_analytics_service()`

### Frontend — US1 + US2

- [ ] T011 [P] [US1] Agregar función `getCachedEventDashboard(eventId: string)` en `app/client/src/app/(event)/_services/server-event-api.ts` que llame a `GET /api/events/{eventId}/dashboard`, valide con `eventDashboardSchema` y use `cache()` de React
- [ ] T012 [US1] Modificar `app/client/src/app/(event)/[eventId]/page.tsx` para incluir `getCachedEventDashboard(eventId)` en el `Promise.all` existente y pasar `dashboardData` a los componentes correspondientes
- [ ] T013 [US2] Crear componente `EventPersonalBalanceCard` en `app/client/src/app/(event)/[eventId]/_components/event-personal-balance-card.tsx`: tarjeta con tres valores (pagado, consumido, diferencia neta) y badge de estado (`acreedor` / `deudor` / `neutro`) con colores semánticos; incluir estado vacío cuando `total_spent = 0`
- [ ] T014 [US1] Crear sección de KPIs globales (total gastado, conteo de gastos, liquidaciones pendientes) directamente dentro de `app/client/src/app/(event)/[eventId]/page.tsx` o extraerlos a un sub-componente `event-kpi-strip.tsx` en `_components/`; mostrar estado vacío con texto informativo cuando `expense_count = 0`
- [ ] T015 [US1] Actualizar `app/client/src/app/(event)/[eventId]/loading.tsx` para agregar skeletons de las secciones de KPIs y balance personal

**Checkpoint**: Navegar a `/(event)/[eventId]` muestra los KPIs reales y el balance personal. HTTP 403 correcto para usuarios no miembros. Estado vacío visible con 0 gastos.

---

## Phase 4: User Story 3 + 4 — Distribución por Categoría y Aportes por Pagador (Priority: P2)

**Goal**: El endpoint incluye `categories` y `payer_contributions` con montos y porcentajes correctos. La página del evento muestra el gráfico de categorías (existente, ahora con datos reales ya conectados en 019) y la nueva sección de aportes por pagador.

**Independent Test**: Verificar que `sum(categories[*].amount) == total_spent` y `sum(payer_contributions[*].total_paid) == total_spent` en la respuesta del endpoint. El componente de aportes lista los pagadores en orden descendente.

### Backend — US3 + US4

- [ ] T016 [P] [US3] Implementar `AnalyticsRepository.get_category_breakdown(event_id)` en `app/server/app/modules/events/repositories/analytics_repository.py`: `SELECT category, SUM(amount), COUNT(*) FROM expense WHERE event_id=? AND deleted_at IS NULL GROUP BY category ORDER BY SUM(amount) DESC`
- [ ] T017 [P] [US4] Implementar `AnalyticsRepository.get_payer_contributions(event_id)` en `app/server/app/modules/events/repositories/analytics_repository.py`: join `Expense → EventMember → User`, `SUM(expense.amount) GROUP BY member`, `ORDER BY total_paid DESC`
- [ ] T018 [US3] Extender `EventAnalyticsService.get_dashboard()` en `app/server/app/modules/events/services/analytics_service.py` para invocar `get_category_breakdown()`, calcular `label` legible por categoría y `percentage` con `Decimal` (guardia de división por cero cuando `total_spent = 0`), e incluir en `EventDashboardRead.categories`
- [ ] T019 [US4] Extender `EventAnalyticsService.get_dashboard()` en `app/server/app/modules/events/services/analytics_service.py` para invocar `get_payer_contributions()`, calcular `percentage` con `Decimal` (guardia de división por cero), e incluir en `EventDashboardRead.payer_contributions`

### Frontend — US3 + US4

- [ ] T020 [P] [US3] Verificar que `EventStatisticsCard` en `app/client/src/app/(event)/[eventId]/_components/event-statistics-card.tsx` recibe `dashboardData.categories` (en lugar de `statisticsData.categories`); ajustar props si el tipo cambió
- [ ] T021 [US4] Agregar sección de aportes por pagador dentro de `app/client/src/app/(event)/[eventId]/_components/event-statistics-card.tsx`: lista ordenada de cada `PayerContribution` con nombre, barra de progreso proporcional, monto y porcentaje; estado vacío cuando `payer_contributions = []`
- [ ] T022 [P] [US4] Actualizar `app/client/src/app/(event)/[eventId]/loading.tsx` para agregar skeleton de la sección de aportes por pagador

**Checkpoint**: La sección de categorías y la de aportes muestran datos reales. Las sumas cuadran con `total_spent`. Evento sin gastos muestra estados vacíos en ambas secciones.

---

## Phase 5: User Story 5 — Evolución Temporal de Gastos (Priority: P3)

**Goal**: El endpoint incluye `expense_timeline` con puntos diarios en orden cronológico y `cumulative_total` creciente. La página del evento muestra la cronología en un nuevo componente.

**Independent Test**: Verificar que `expense_timeline[-1].cumulative_total == total_spent`. Crear dos gastos en la misma fecha y verificar que se agrupan en un único punto. Evento sin gastos retorna `expense_timeline = []`.

### Backend — US5

- [ ] T023 [US5] Implementar `AnalyticsRepository.get_expense_timeline(event_id)` en `app/server/app/modules/events/repositories/analytics_repository.py`: `SELECT DATE(expense_date) as day, SUM(amount) as daily_total FROM expense WHERE event_id=? AND deleted_at IS NULL GROUP BY day ORDER BY day ASC`
- [ ] T024 [US5] Extender `EventAnalyticsService.get_dashboard()` en `app/server/app/modules/events/services/analytics_service.py` para invocar `get_expense_timeline()`, calcular `cumulative_total` iterativamente en Python con `Decimal`, e incluir en `EventDashboardRead.expense_timeline`

### Frontend — US5

- [ ] T025 [US5] Crear componente `EventExpenseTimelineCard` en `app/client/src/app/(event)/[eventId]/_components/event-expense-timeline-card.tsx`: lista vertical cronológica de cada `DailyExpensePoint` con fecha formateada, monto diario y monto acumulado; estado vacío cuando `expense_timeline = []`
- [ ] T026 [US5] Agregar `EventExpenseTimelineCard` a `app/client/src/app/(event)/[eventId]/page.tsx` pasando `dashboardData.expense_timeline` como prop
- [ ] T027 [P] [US5] Actualizar `app/client/src/app/(event)/[eventId]/loading.tsx` para agregar skeleton de la sección de cronología

**Checkpoint**: La cronología muestra puntos diarios reales con `cumulative_total` creciente. Gastos del mismo día se agrupan. Evento sin gastos muestra estado vacío.

---

## Phase 6: Pruebas y Validación Transversal

**Purpose**: Pruebas unitarias del service, pruebas del endpoint y validación de schemas Zod. Cubre los criterios de calidad exigidos por la Constitution (§XVII y §XXX).

- [ ] T028 [P] Crear `app/server/tests/unit/test_analytics_service.py`: pruebas unitarias de `EventAnalyticsService` con mocks del repository — caso con datos, evento vacío (0.00 Bs.), usuario no miembro (excepción de autorización), estado `acreedor`/`deudor`/`neutro` del balance personal, invariante de coherencia financiera (suma categorías = total)
- [ ] T029 [P] Crear `app/server/tests/api/test_event_dashboard_endpoint.py`: pruebas de contrato del endpoint — HTTP 200 con estructura `EventDashboardRead` válida, HTTP 403 para usuario no miembro, HTTP 404 para event_id inexistente, respuesta con `total_spent = "0.00"` y listas vacías cuando el evento no tiene gastos
- [ ] T030 [P] Agregar pruebas del schema Zod `eventDashboardSchema` en `app/client/src/app/expenses/_schemas/expense-api-schemas.test.ts` (crear el archivo si no existe): datos válidos completos, `total_spent` como string Decimal, `personal_balance.status` con enum correcto, `categories` y `payer_contributions` vacías, rechazo de payload con campos faltantes

**Checkpoint**: `pytest app/server/tests/unit/test_analytics_service.py app/server/tests/api/test_event_dashboard_endpoint.py` pasan. `npx vitest run` pasa. `tsc --noEmit` sin errores.

---

## Dependencies & Execution Order

### Dependencias entre fases

- **Phase 1 (Setup)**: Sin dependencias — puede comenzar de inmediato
- **Phase 2 (Foundational)**: Depende de Phase 1 — **bloquea todas las user stories**
- **Phase 3 (US1 + US2, P1)**: Depende de Phase 2 — núcleo del MVP
- **Phase 4 (US3 + US4, P2)**: Depende de Phase 3 (el service de Phase 3 se extiende) — puede paralelizarse parcialmente con Phase 3 en backend vs. frontend
- **Phase 5 (US5, P3)**: Depende de Phase 3 — puede paralelizarse con Phase 4
- **Phase 6 (Pruebas)**: Puede iniciarse en paralelo con Phase 3 (escribir primero los mocks/stubs); la validación final requiere todas las fases completas

### Dependencias dentro de cada user story (US1 + US2)

```
T007 (repository KPIs)    ──┐
T008 (repository balance) ──┤─→ T009 (service) → T010 (router)
                            │
T011 (server fetch) ────────┤
                            └─→ T012 (page.tsx) → T013 + T014
```

### Oportunidades de paralelización

```bash
# Phase 2 — Backend y Frontend en paralelo:
T003 (schemas Pydantic)  ║  T005 (schemas Zod)
T004 (dependencies.py)   ║  T006 (types export)

# Phase 3 — Backend y Frontend se solapan una vez T009 + T010 listos:
T007 + T008 en paralelo  →  T009  →  T010
                                      ║
T011 (server fetch)      ←────────────╝  →  T012  →  T013 + T014 en paralelo

# Phase 4 — Repositories en paralelo:
T016 (category repo) ║ T017 (payer repo)  →  T018  →  T019
                                               ║
T020 + T021 en paralelo (frontend) ←──────────╝

# Phase 6 — Tres suites de pruebas en paralelo:
T028 (unit service) ║ T029 (endpoint) ║ T030 (Zod schemas)
```

---

## Implementation Strategy

### MVP — Phase 1 + 2 + 3 únicamente (US1 + US2, P1)

1. Completar Phase 1: Setup (T001–T002)
2. Completar Phase 2: Foundational (T003–T006)
3. Completar Phase 3: US1 + US2 (T007–T015)
4. **PARAR Y VALIDAR**: El endpoint `GET /api/events/{event_id}/dashboard` retorna KPIs + balance personal. La página del evento muestra los datos reales.
5. Desplegar o demostrar como MVP funcional.

### Entrega incremental

1. Phase 1 + 2 + 3 → MVP con KPIs y balance personal ✅
2. + Phase 4 → Agregar categorías y aportes por pagador ✅
3. + Phase 5 → Agregar cronología temporal ✅
4. + Phase 6 → Pruebas automatizadas y validación completa ✅

---

## Notes

- `[P]` = archivos distintos, sin dependencias de otras tareas incompletas del mismo grupo
- El backend usa `Decimal` para todos los montos financieros; los porcentajes se calculan con `Decimal` y se serializan como `float` en el schema Pydantic
- El frontend recibe `Decimal` como `string` en JSON y lo convierte via `.transform(Number)` en Zod
- `EventCategoryStatItem` y `EventStatisticsRead` ya existen — **no duplicar**; `EventDashboardRead` los compone
- La guardia de división por cero en `percentage` es obligatoria cuando `total_spent = Decimal("0")`
- Todos los comentarios y docstrings en español (Constitution §XXVIII)
- No hay migraciones Alembic en esta feature (solo lectura de tablas existentes)
