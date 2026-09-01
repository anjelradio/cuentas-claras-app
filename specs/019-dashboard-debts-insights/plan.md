# Implementation Plan: Dashboard Principal, Liquidación de Deudas y Resumen Estadístico

**Branch**: `019-dashboard-debts-insights` | **Date**: 2026-09-01 | **Spec**: [`specs/019-dashboard-debts-insights/spec.md`](spec.md)

---

## Summary

Implementar las consultas agregadas en backend y la integración interactiva en frontend para:
1. **Mis Deudas**: Consulta y desglose de "Lo que debo" y "Lo que me deben" a nivel global en el Home (`/home`) y contextual por evento (`/(event)/[eventId]`).
2. **Requiere atención**: Notificaciones de pagos en espera de confirmación (`pending_confirmation`) para el acreedor del gasto en el Home con botón "Revisar".
3. **Eventos recientes con gasto personal**: Consulta de los 2 últimos eventos en el Home con el consumo personal calculado del usuario.
4. **Actividad reciente global**: Consulta de las 3 últimas actividades del usuario en el Home.
5. **Resumen estadístico de evento**: Cálculo dinámico de gastos por categoría y monto total del evento en `/(event)/[eventId]` conectado al gráfico SVG existente.

---

## Technical Context

- **Lenguaje/Versión**: Python 3.14 (Backend) / TypeScript 5.9 + Node.js 26 (Frontend)
- **Frameworks**: FastAPI 0.115 + SQLModel 0.0.22 (Backend) / Next.js 16 App Router + Tailwind CSS (Frontend)
- **Base de Datos**: PostgreSQL 16 con migraciones Alembic
- **Pruebas**: Pytest (Backend) / Vitest + Testing Library + `tsc` (Frontend)
- **Integraciones**: Better Auth (JWT) para identidad del usuario, Cloudinary para comprobantes

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Monorepo y responsabilidades**: Lógica financiera y agregaciones en `app/server/`, presentación y estados UI en `app/client/`.
- [x] **IV & V. Arquitectura modular y dirección de dependencias**: Router $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Base de datos.
- [x] **VI, VII, VIII. Responsabilidades de capas**: Routers sin SQL ni lógica de dominio, Services sin dependencias HTTP, Repositories exclusivos para persistencia.
- [x] **IX. SQLModel y eliminación lógica**: Consultas filtran `deleted_at IS NULL`.
- [x] **XII. Schemas y convenciones**: Schemas terminan en `Request` y `Read`.
- [x] **XIV. Autorización contextual**: Validación de membresía del usuario en cada evento consultado.
- [x] **XVI. Integridad financiera**: Montos monetarios con precisión Decimal.
- [x] **XVIII, XIX, XXII. Frontend conventions**: Feature routes, Zod schemas, Server Components con carga asíncrona.

---

## Project Structure

### Documentation (this feature)

```text
specs/019-dashboard-debts-insights/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Technical decisions & research
├── data-model.md        # Data models & schemas
├── quickstart.md        # Validation scenarios
├── contracts/           # API request/response contracts
│   └── dashboard-api.md
└── tasks.md             # Task breakdown (generated via /speckit-tasks)
```

### Source Code Touchpoints

```text
app/server/app/
├── modules/
│   ├── expenses/
│   │   ├── routers/expense_router.py           # GET /api/expenses/debts/summary
│   │   ├── schemas/expense_schemas.py          # DebtsSummaryRead, DebtToPayItem, DebtToCollectItem
│   │   └── services/expense_service.py         # get_debts_summary(user_id, event_id=None)
│   ├── payments/
│   │   ├── routers/payment_router.py           # GET /api/payments/pending-verification
│   │   ├── schemas/payment_schemas.py          # PendingVerificationPaymentRead
│   │   └── services/payment_service.py         # get_pending_verification(user_id)
│   ├── events/
│   │   ├── routers/event_router.py             # GET /api/events/recent, GET /api/events/{id}/statistics
│   │   ├── schemas/event_schemas.py            # RecentEventRead, EventStatisticsRead
│   │   └── services/
│   │       ├── event_service.py                # get_recent_events_with_spending(user_id)
│   │       └── event_statistics_service.py     # get_event_statistics(event_id, user_id)
│   └── activity/
│       ├── routers/activity.py                 # GET /api/activities/user-recent
│       └── services/activity.py                # get_user_recent_activities(user_id, limit=3)

app/client/src/app/
├── home/
│   ├── page.tsx                                # Server Component: fetch real data for Home
│   ├── _components/
│   │   ├── my-debts-sheet.tsx                  # Connect to DebtsSummary API (global)
│   │   ├── require-attention-card.tsx          # Real pending payments with "Revisar" link
│   │   ├── recent-events-card.tsx              # Real recent events with personal spent amount
│   │   └── recent-activity-card.tsx            # Real global user activities
├── (event)/
│   ├── [eventId]/
│   │   ├── page.tsx                            # Server Component: fetch statistics & debts
│   │   ├── _components/
│   │   │   ├── event-actions-section.tsx       # Pass real debts to overlay
│   │   │   ├── event-overlay-flows.tsx         # MyDebtsSheet with eventId
│   │   │   └── event-statistics-card.tsx       # Real category statistics
├── expenses/
│   ├── _services/
│   │   ├── expense-api.ts                      # getDebtsSummary(eventId?)
│   │   └── server-expense-api.ts               # Server fetchers for SSR
│   └── _schemas/
│       └── expense-api-schemas.ts              # Zod schemas for debts & statistics
```

---

## Complexity Tracking

*No violations to the constitution.*
