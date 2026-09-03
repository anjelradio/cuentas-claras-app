# Implementation Plan: Dashboard y Analítica Visual del Evento

**Branch**: `021-event-analytics-dashboard` | **Date**: 2026-09-03 | **Spec**: [`specs/021-event-analytics-dashboard/spec.md`](spec.md)

---

## Summary

Implementar el módulo de analítica de evento que expone métricas agregadas en tiempo real a los miembros activos. El alcance es **transversal**: el backend (FastAPI) provee un nuevo endpoint de dashboard con cuatro bloques de datos derivados de la base de datos existente (balance personal, distribución por categoría, aportes por pagador, cronología temporal); el frontend (Next.js) consume ese endpoint y renderiza las secciones KPI, gráfico de categorías, contribuciones y cronología dentro de la página del evento.

Decisión arquitectónica clave: consolidar las cuatro vistas analíticas en **un único endpoint de agregación** (`GET /api/events/{event_id}/dashboard`) para minimizar round-trips desde el Server Component, en lugar de cuatro llamadas independientes. El endpoint reutiliza los modelos de datos existentes (`Expense`, `ExpenseSplit`, `Payment`, `EventMember`) sin agregar nuevas tablas.

---

## Technical Context

- **Lenguaje/Versión**: Python 3.14 (Backend) / TypeScript 5.9 + Node.js 26 (Frontend)
- **Frameworks**: FastAPI 0.115 + SQLModel 0.0.22 (Backend) / Next.js 16 App Router + Tailwind CSS v3 + shadcn/ui (Frontend)
- **Base de Datos**: PostgreSQL 16 con migraciones Alembic (solo lectura — sin nuevos modelos ni migraciones en esta feature)
- **Pruebas**: Pytest (Backend) / Vitest + Testing Library + `tsc` (Frontend)
- **Integridades existentes reutilizadas**:
  - `Expense.deleted_at` para exclusión lógica (ya indexado con `ix_expense_event_id_deleted_at_date`)
  - `ExpenseSplit.assigned_amount` con `Numeric(10,2)` para balances personales
  - `Payment.status` enum `pending_confirmation | confirmed | rejected` para conteo de liquidaciones
  - `EventMember.status` enum `active | left | removed` para gate de autorización

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Monorepo y responsabilidades**: Toda lógica de agregación y reglas financieras en `app/server/`; presentación, estados y componentes en `app/client/`.
- [x] **IV & V. Arquitectura modular y dirección de dependencias**: Router → Service → Repository → Base de datos. El nuevo `analytics_service.py` no accede a la sesión ni a SQL directamente.
- [x] **VI. Routers**: El nuevo endpoint solo valida identidad, invoca el service y devuelve la respuesta tipada. Sin SQL ni lógica de negocio.
- [x] **VII. Services**: `EventAnalyticsService` orquesta el caso de uso completo sin depender de `Request`, `Response` ni `HTTPException`.
- [x] **VIII. Repositories**: El nuevo `analytics_repository.py` es el único punto de acceso a PostgreSQL para este módulo.
- [x] **IX. SQLModel + eliminación lógica**: Todas las queries filtran `Expense.deleted_at IS NULL`. Sin `create_all`. Sin migraciones (solo lectura).
- [x] **XI. Encapsulación entre módulos**: `EventAnalyticsService` en el módulo `events/` accede a datos de `expenses` y `payments` a través de su propio repository consolidado, sin importar repositories ni servicios de otros módulos.
- [x] **XII. Schemas y convenciones**: Nuevos schemas siguen convención `*Read`. Sin sufijo `Response`.
- [x] **XIV. Autorización contextual**: El service verifica que el `user_id` del JWT sea miembro activo del evento antes de ejecutar cualquier cálculo.
- [x] **XVI. Integridad financiera**: Todos los montos se agregan con `sum(Numeric(10,2))` via SQLAlchemy; los porcentajes se calculan en Python con `Decimal` antes de serializar a `float`.
- [x] **XVII. Pruebas del backend**: Service con pruebas unitarias (mock de repository), repository con pruebas de integración, endpoint con prueba de contrato (autorización denegada + datos correctos).
- [x] **XVIII, XIX, XX. Frontend conventions**: Server Component en `page.tsx` hace fetch SSR; límites `use client` solo en componentes con interacción; datos fluyen vía props.
- [x] **XXII. Schemas y tipos del frontend**: Zod valida la respuesta del endpoint; los tipos se infieren con `z.infer`.
- [x] **XXIV. shadcn/ui + Tailwind**: Nuevos componentes usan tokens semánticos; gráfico SVG reutiliza patrón existente de `event-statistics-card.tsx`.
- [x] **XXVI. Mobile-first**: Dashboard diseñado para móvil primero; redistribución en grid en desktop.
- [x] **XXVII. Estados de interfaz**: Skeleton/loading en `loading.tsx`, estado vacío cuando `total_spent = 0`, error boundary con `error.tsx`.
- [x] **XXVIII. Comentarios en español**: Toda documentación inline en español.
- [x] **XXX. Pruebas del frontend**: Service con pruebas de contrato y manejo de errores; schemas Zod con datos válidos e inválidos.

---

## Project Structure

### Documentation (this feature)

```text
specs/021-event-analytics-dashboard/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Technical decisions & research
├── data-model.md        # Entities, schemas y relaciones
├── quickstart.md        # Guía de validación end-to-end
├── contracts/
│   └── analytics-api.md # Contrato completo del endpoint
└── tasks.md             # Breakdown de tareas (generado por /speckit-tasks)
```

### Source Code Touchpoints

```text
app/server/app/
├── modules/
│   └── events/
│       ├── routers/
│       │   └── event_router.py            [MODIFY] Agrega route GET /{event_id}/dashboard
│       ├── schemas/
│       │   └── event_schemas.py           [MODIFY] Agrega EventDashboardRead y subtipos
│       ├── services/
│       │   └── analytics_service.py       [NEW] EventAnalyticsService.get_dashboard(event_id, user_id)
│       ├── repositories/
│       │   └── analytics_repository.py    [NEW] Queries SQL de agregación para el dashboard
│       └── dependencies.py                [MODIFY] Expone get_analytics_service()

app/client/src/app/
├── expenses/
│   └── _schemas/
│       └── expense-api-schemas.ts         [MODIFY] Agrega schemas Zod para dashboard (personal balance, payer, chronology)
├── (event)/
│   ├── _services/
│   │   └── server-event-api.ts            [MODIFY] Agrega getCachedEventDashboard(eventId)
│   └── [eventId]/
│       ├── page.tsx                       [MODIFY] Incluye fetch del dashboard y pasa props a nuevos componentes
│       ├── loading.tsx                    [MODIFY] Agrega skeleton para secciones nuevas
│       └── _components/
│           ├── event-statistics-card.tsx  [MODIFY] Añade sección de aportes por pagador debajo de categorías
│           ├── event-personal-balance-card.tsx  [NEW] KPI card: pagado / consumido / estado
│           └── event-expense-timeline-card.tsx  [NEW] Cronología temporal de gastos
```

---

## Complexity Tracking

*No violations to the constitution.*
