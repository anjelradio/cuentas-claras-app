# Data Model: Dashboard y Analítica Visual del Evento

**Feature**: `021-event-analytics-dashboard`
**Date**: 2026-09-03

> Esta feature es **solo lectura**: no crea ni modifica tablas. No requiere migración Alembic.
> Todos los datos se derivan de modelos existentes.

---

## Modelos persistentes reutilizados (sin cambios)

### Expense
`app/server/app/modules/expenses/models/expense.py`

| Campo | Tipo | Uso en dashboard |
|---|---|---|
| `id` | UUID | Join con ExpenseSplit |
| `event_id` | UUID | Filtro principal |
| `paid_by_member_id` | UUID | Aportes por pagador |
| `amount` | Numeric(10,2) | Total gastado, aporte del pagador |
| `refund_amount` | Numeric(10,2) | No usado en este módulo |
| `category` | String(30)/StrEnum | Distribución por categoría |
| `expense_date` | datetime | Cronología temporal |
| `deleted_at` | datetime\|null | Exclusión lógica (IS NULL) |

### ExpenseSplit
`app/server/app/modules/expenses/models/expense_split.py`

| Campo | Tipo | Uso en dashboard |
|---|---|---|
| `id` | UUID | Join con Payment |
| `expense_id` | UUID | Join con Expense |
| `member_id` | UUID | Balance personal (consumed) |
| `assigned_amount` | Numeric(10,2) | Monto consumido del miembro |

### Payment
`app/server/app/modules/payments/models/payment.py`

| Campo | Tipo | Uso en dashboard |
|---|---|---|
| `id` | UUID | — |
| `split_id` | UUID | Join con ExpenseSplit |
| `status` | String(30)/StrEnum | `PENDING_CONFIRMATION` → conteo de liquidaciones pendientes |

### EventMember
`app/server/app/modules/events/models/event_member.py`

| Campo | Tipo | Uso en dashboard |
|---|---|---|
| `id` | UUID | Referencia desde expense.paid_by_member_id, split.member_id |
| `event_id` | UUID | Filtro de membresía |
| `user_id` | str | Identificación del usuario autenticado |
| `status` | MemberStatus | Gate de autorización: solo `ACTIVE` |

---

## Schemas de respuesta nuevos (Backend — Pydantic)

Ubicación: `app/server/app/modules/events/schemas/event_schemas.py`

### PersonalBalanceRead
```
PersonalBalanceRead
├── paid: Decimal              # SUM(expense.amount) WHERE paid_by_member_id = mi_member_id
├── consumed: Decimal          # SUM(split.assigned_amount) WHERE split.member_id = mi_member_id
├── net_difference: Decimal    # paid - consumed
└── status: str                # "acreedor" | "deudor" | "neutro"
```

### PayerContributionRead
```
PayerContributionRead
├── member_id: UUID
├── display_name: str
├── total_paid: Decimal        # SUM(expense.amount) agrupado por paid_by_member_id
└── percentage: float          # total_paid / total_spent * 100
```

### DailyExpensePointRead
```
DailyExpensePointRead
├── date: date                 # expense_date::date (GROUP BY)
├── daily_total: Decimal       # SUM(amount) del día
└── cumulative_total: Decimal  # SUM acumulado hasta ese día (calculado en Python)
```

### EventDashboardRead  (schema raíz del endpoint)
```
EventDashboardRead
├── event_id: UUID
├── currency: str = "Bs."
├── total_spent: Decimal                         # FR-002
├── expense_count: int                           # FR-004
├── pending_settlements_count: int               # FR-005
├── personal_balance: PersonalBalanceRead        # FR-003
├── categories: list[EventCategoryStatItem]      # FR-006 (reutiliza schema existente)
├── payer_contributions: list[PayerContributionRead]  # FR-007
└── expense_timeline: list[DailyExpensePointRead]     # FR-008
```

> `EventCategoryStatItem` ya existe con: `category`, `label`, `amount`, `percentage`, `count`.

---

## Lógica de derivación de datos

### KPIs globales (FR-002, FR-004, FR-005)
```
total_spent    = SELECT SUM(amount) FROM expense WHERE event_id=? AND deleted_at IS NULL
expense_count  = SELECT COUNT(*) FROM expense WHERE event_id=? AND deleted_at IS NULL
pending_count  = SELECT COUNT(DISTINCT p.id)
                 FROM payment p
                 JOIN expense_split es ON p.split_id = es.id
                 JOIN expense e ON es.expense_id = e.id
                 WHERE e.event_id = ? AND e.deleted_at IS NULL
                   AND p.status = 'pending_confirmation'
```

### Balance personal (FR-003)
```
paid           = SELECT SUM(e.amount) FROM expense e
                 JOIN eventmember em ON e.paid_by_member_id = em.id
                 WHERE e.event_id = ? AND e.deleted_at IS NULL
                   AND em.user_id = :user_id

consumed       = SELECT SUM(es.assigned_amount) FROM expense_split es
                 JOIN expense e ON es.expense_id = e.id
                 JOIN eventmember em ON es.member_id = em.id
                 WHERE e.event_id = ? AND e.deleted_at IS NULL
                   AND em.user_id = :user_id

net_difference = paid - consumed
status         = "acreedor" if net > 0 else "deudor" if net < 0 else "neutro"
```

### Distribución por categoría (FR-006)
```
SELECT category, SUM(amount) as total, COUNT(*) as count
FROM expense
WHERE event_id = ? AND deleted_at IS NULL
GROUP BY category
ORDER BY total DESC
```
Porcentaje = total_categoria / total_spent * 100 (calculado en Python con Decimal).

### Aportes por pagador (FR-007)
```
SELECT em.id, u.name, SUM(e.amount) as total_paid
FROM expense e
JOIN eventmember em ON e.paid_by_member_id = em.id
JOIN "user" u ON em.user_id = u.id
WHERE e.event_id = ? AND e.deleted_at IS NULL
GROUP BY em.id, u.name
ORDER BY total_paid DESC
```
Porcentaje = total_paid / total_spent * 100 (calculado en Python con Decimal).

### Cronología temporal (FR-008)
```
SELECT DATE(expense_date) as day, SUM(amount) as daily_total
FROM expense
WHERE event_id = ? AND deleted_at IS NULL
GROUP BY day
ORDER BY day ASC
```
`cumulative_total` se calcula iterativamente en Python sumando `daily_total` en orden cronológico.

---

## Schemas Zod nuevos (Frontend)

Ubicación: `app/client/src/app/expenses/_schemas/expense-api-schemas.ts`

```typescript
// Schemas nuevos a añadir

personalBalanceSchema = z.object({
  paid: z.string().transform(Number),         // Decimal → string en JSON
  consumed: z.string().transform(Number),
  net_difference: z.string().transform(Number),
  status: z.enum(["acreedor", "deudor", "neutro"]),
})

payerContributionSchema = z.object({
  member_id: z.string().uuid(),
  display_name: z.string(),
  total_paid: z.string().transform(Number),
  percentage: z.number(),
})

dailyExpensePointSchema = z.object({
  date: z.string(),                           // "YYYY-MM-DD"
  daily_total: z.string().transform(Number),
  cumulative_total: z.string().transform(Number),
})

eventDashboardSchema = z.object({
  event_id: z.string().uuid(),
  currency: z.string().default("Bs."),
  total_spent: z.string().transform(Number),
  expense_count: z.number().int(),
  pending_settlements_count: z.number().int(),
  personal_balance: personalBalanceSchema,
  categories: z.array(eventCategoryStatItemSchema),  // schema existente reutilizado
  payer_contributions: z.array(payerContributionSchema),
  expense_timeline: z.array(dailyExpensePointSchema),
})
```

---

## Relación entre tablas (solo las relevantes para este módulo)

```
Event (1) ──── (N) Expense ──── (N) ExpenseSplit ──── (0..1) Payment
                     │                   │
                     └── paid_by ────── EventMember ──── User
                                        └── member_id ──
```
