# Research: Dashboard y Analítica Visual del Evento

**Feature**: `021-event-analytics-dashboard`
**Date**: 2026-09-03

---

## Decisión 1: Endpoint único vs. endpoints individuales

**Decision**: Un único endpoint `GET /api/events/{event_id}/dashboard` que retorna todos los bloques analíticos.

**Rationale**: La página del evento es un Server Component que necesita los cuatro bloques simultáneamente. Consolidarlos en una sola petición reduce la latencia de carga inicial (sin waterfalls) y simplifica el contrato de la API. El costo de cálculo es bajo: todas las agregaciones operan sobre los mismos registros de `Expense` filtrados por `event_id` y `deleted_at IS NULL`.

**Alternatives considered**:
- Cuatro endpoints separados: descartado porque el Server Component dispararía cuatro peticiones en paralelo con mayor overhead de conexiones y mayor complejidad en manejo de errores parciales.
- Endpoint paginado con campos opcionales (field selection): descartado por innecesaria complejidad para esta escala.

---

## Decisión 2: Módulo propietario del nuevo endpoint

**Decision**: El endpoint y los nuevos artefactos (service, repository, schemas) viven en el módulo `events/` de `app/server/`.

**Rationale**: El dashboard es fundamentalmente una vista derivada del evento; el `event_id` es su parámetro principal y la validación de membresía es una operación nativa de ese módulo. El módulo `expenses/` ya tiene `GET /api/expenses/debts/summary` para la vista de deudas personales cross-event, por lo que ambas preocupaciones permanecen separadas y cohesivas.

**Alternatives considered**:
- Módulo nuevo `analytics/`: descartado por principio de simplicidad (Constitution §II); no existe una capacidad del negocio suficientemente diferenciada para justificar un módulo separado.
- Módulo `expenses/`: descartado porque el endpoint requiere autorización por evento (membresía), responsabilidad del módulo `events/`.

---

## Decisión 3: Repository consolidado vs. acceso directo en el service

**Decision**: Un `analytics_repository.py` específico para este módulo con cuatro métodos de query.

**Rationale**: La Constitution §VIII exige que los repositories sean la única capa autorizada para consultar la base de datos. Cuatro métodos de query en un único repository cohesionado por el dominio "analytics del evento" mantiene el patrón sin crear un repository excesivamente pequeño.

**Alternatives considered**:
- Reutilizar `expense_repository.py`: descartado porque ese repository pertenece al módulo `expenses/` (Constitution §XI prohíbe acceder a repositories de otros módulos).
- Queries directas en el service: descartado por violar Constitution §VII.

---

## Decisión 4: Cálculo de porcentajes — Decimal vs. float

**Decision**: Calcular porcentajes en Python con `Decimal` dividiendo por el total con `quantize(Decimal("0.01"))`, serializados a `float` solo en el schema Pydantic.

**Rationale**: La Constitution §XVI exige precisión decimal. Las sumas se realizan en la BD con `SUM(Numeric(10,2))`. La división en Python con `Decimal` evita errores de punto flotante binario. El schema Pydantic acepta `float` para porcentaje porque es un valor presentacional que ya perdió la cadena de precisión primaria (los montos siguen siendo `Decimal`).

**Alternatives considered**:
- Calcular porcentaje en SQL con `ROUND(SUM(amount)*100.0/total_sum, 2)`: descartado porque mezcla lógica de presentación en la capa de persistencia.
- Serializar `Decimal` directamente al frontend: el frontend recibe `number` de JSON de todas formas; la conversión es inevitables en el límite HTTP.

---

## Decisión 5: Componentes frontend — nuevos vs. extensión de existentes

**Decision**: Dos componentes nuevos (`event-personal-balance-card.tsx`, `event-expense-timeline-card.tsx`) más extensión de `event-statistics-card.tsx` para la sección de aportes por pagador.

**Rationale**: El balance personal y la cronología son responsabilidades de presentación completamente distintas al gráfico de categorías. Crear componentes dedicados mantiene cada archivo enfocado y facilita las pruebas unitarias. La sección de aportes por pagador es temáticamente contigua a la de categorías (ambas son distribuciones del gasto) y se añade como sección nueva dentro del card existente para no fragmentar la vista.

**Alternatives considered**:
- Un único `event-dashboard-card.tsx` con todo: descartado porque violaría el principio de componentes enfocados y dificultaría el mantenimiento.
- Cuatro componentes completamente nuevos: descartado porque duplica la tarjeta de estadísticas de categorías existente sin necesidad.

---

## Hallazgos de arquitectura relevantes (codebase analysis)

1. **`EventStatisticsRead` ya existe** en `event_schemas.py` con `total_amount`, `currency` y `categories: list[EventCategoryStatItem]`. Este schema cubre la distribución por categoría (FR-006) y monto total (FR-002) del dashboard. El nuevo `EventDashboardRead` lo **compone** (embebe) en lugar de duplicarlo.

2. **`GET /api/events/{event_id}/statistics`** ya existe en `event_router.py`. El nuevo endpoint `GET /api/events/{event_id}/dashboard` lo amplía conceptualmente, pero no lo reemplaza (el endpoint existente puede seguir usándose por compatibilidad).

3. **`getCachedEventStatistics`** ya existe en `server-event-api.ts`. El nuevo `getCachedEventDashboard` sigue el mismo patrón de caché Next.js con `cache()` y `revalidatePath`.

4. **`payment.status = PENDING_CONFIRMATION`** es el campo correcto para contar liquidaciones pendientes (FR-005). La relación es: `Expense → ExpenseSplit → Payment`.

5. **`ExpenseSplit.assigned_amount`** es el monto de consumo del miembro (cuota asignada). Para el balance personal: `paid = SUM(expense.amount) WHERE paid_by_member_id = member_id`; `consumed = SUM(split.assigned_amount) WHERE split.member_id = member_id`.

6. **`payer_contribution`** en `ExpenseRead` se calcula en el service como `amount - refund_amount - sum_of_splits_of_others`. Para los aportes por pagador en el dashboard, el monto real aportado es `expense.amount` (el total pagado por el pagador), no el `payer_contribution`.

7. **El index existente** `ix_expense_event_id_deleted_at_date` optimiza directamente las queries de este dashboard.
