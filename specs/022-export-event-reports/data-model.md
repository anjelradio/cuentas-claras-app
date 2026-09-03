# Data Model: Exportación y Resumen Portable del Evento

**Feature**: `022-export-event-reports`
**Date**: 2026-09-03

> Esta feature es **solo lectura**: no crea ni modifica tablas. No requiere migración Alembic.
> Todos los datos se derivan de modelos existentes.

---

## Modelos persistentes reutilizados (sin cambios)

### Event
`app/server/app/modules/events/models/event.py`

| Campo | Tipo | Uso en reporte |
|---|---|---|
| `id` | UUID | Filtro principal |
| `name` | String | Encabezado del reporte y nombre del archivo |
| `currency` | String | Encabezado del reporte |
| `status` | String/Enum | Encabezado del reporte |
| `created_at` | datetime | Encabezado del reporte |
| `user_id` | str | Join con User para obtener nombre del creador |
| `deleted_at` | datetime\|null | Verificación de existencia del evento |

### EventMember
`app/server/app/modules/events/models/event_member.py`

| Campo | Tipo | Uso en reporte |
|---|---|---|
| `id` | UUID | Join con Expense (paid_by_member_id) y ExpenseSplit (member_id) |
| `event_id` | UUID | Filtro de membresía |
| `user_id` | str | Join con User para obtener display_name |
| `status` | MemberStatus | Filtro: solo miembros ACTIVE |
| `deleted_at` | datetime\|null | Exclusión de miembros eliminados |

### Expense
`app/server/app/modules/expenses/models/expense.py`

| Campo | Tipo | Uso en reporte |
|---|---|---|
| `id` | UUID | Join con ExpenseSplit |
| `event_id` | UUID | Filtro principal |
| `paid_by_member_id` | UUID | Join con EventMember → nombre del pagador |
| `name` | String | Descripción del gasto en el reporte |
| `amount` | Numeric(10,2) | Monto del gasto en el reporte y balance del pagador |
| `category` | String(30) | Categoría del gasto en el reporte |
| `split_type` | String | Método de división en el reporte |
| `expense_date` | datetime | Fecha del gasto en el reporte |
| `deleted_at` | datetime\|null | Exclusión de gastos eliminados (FR-009) |

### ExpenseSplit
`app/server/app/modules/expenses/models/expense_split.py`

| Campo | Tipo | Uso en reporte |
|---|---|---|
| `id` | UUID | Join con Payment |
| `expense_id` | UUID | Join con Expense |
| `member_id` | UUID | Balance del consumidor |
| `assigned_amount` | Numeric(10,2) | Monto consumido del miembro |

### Payment
`app/server/app/modules/payments/models/payment.py`

| Campo | Tipo | Uso en reporte |
|---|---|---|
| `id` | UUID | Identificador |
| `split_id` | UUID | Join con ExpenseSplit |
| `amount` | Numeric(10,2) | Monto del pago en liquidaciones |
| `status` | String(30)/Enum | Estado: `confirmed` (saldado) o `pending_confirmation` (pendiente) |
| `created_at` | datetime | Ordenación de liquidaciones |

### User
`app/server/app/modules/events/models/user_proxy.py`

| Campo | Tipo | Uso en reporte |
|---|---|---|
| `id` | str | Join con EventMember.user_id y Event.user_id |
| `name` | str | Display name del miembro en el reporte |

---

## Tipos internos de transferencia de datos (Python dataclasses)

Ubicación: `app/server/app/modules/events/services/event_export_service.py`

Estos tipos son **privados al módulo**. No son schemas Pydantic ni se serializan a JSON. Viajan entre `ExportRepository` y los formateadores.

### `EventHeaderData`
```python
@dataclass
class EventHeaderData:
    name: str               # Nombre del evento
    currency: str           # Moneda base (p. ej. "Bs.")
    status: str             # Estado del evento ("open" | "closed")
    created_at: date        # Fecha de creación
    creator_name: str       # Nombre del creador del evento
```

### `MemberBalanceData`
```python
@dataclass
class MemberBalanceData:
    display_name: str       # Nombre visible del participante
    total_paid: Decimal     # SUM(expense.amount) donde pagó el miembro
    total_consumed: Decimal # SUM(split.assigned_amount) del miembro
    net_difference: Decimal # total_paid - total_consumed (calculado en service)
    status: str             # "acreedor" | "deudor" | "neutro"
```

### `ExpenseRowData`
```python
@dataclass
class ExpenseRowData:
    expense_date: date      # Fecha del gasto
    description: str        # expense.name
    payer_name: str         # Nombre del miembro pagador
    category: str           # Categoría del gasto
    amount: Decimal         # Monto total del gasto
    split_type: str         # Método de división ("equal" | "custom" | ...)
```

### `SettlementRowData`
```python
@dataclass
class SettlementRowData:
    payer_name: str         # Nombre del miembro que pagó la cuota
    creditor_name: str      # Nombre del miembro acreedor
    amount: Decimal         # Monto del pago
    status: str             # "confirmed" | "pending_confirmation"
    created_at: date        # Fecha del pago
```

### `EventReportData` (raíz)
```python
@dataclass
class EventReportData:
    header: EventHeaderData
    member_balances: list[MemberBalanceData]
    expenses: list[ExpenseRowData]
    settlements: list[SettlementRowData]
```

---

## Estructura del CSV generado

**Sección 1 — Encabezado del evento** (filas de clave-valor)
```
Evento,{name}
Moneda,{currency}
Estado,{status}
Creador,{creator_name}
Fecha de creación,{created_at}
```

**Sección 2 — Balance de participantes** (tabla)
```
Participante,Monto Pagado,Monto Consumido,Diferencia Neta,Estado
{name},{total_paid},{total_consumed},{net_difference},{status}
...
```

**Sección 3 — Historial de Gastos** (tabla)
```
Fecha,Descripción,Pagador,Categoría,Monto,Método de División
{date},{description},{payer},{category},{amount},{split_type}
...
```

**Sección 4 — Estado de Liquidaciones** (tabla)
```
Pagador,Acreedor,Monto,Estado,Fecha
{payer},{creditor},{amount},{status},{date}
...
```

> Delimitador: `,` | Codificación: UTF-8 con BOM (`\ufeff`) | Salto de línea: `\r\n`

---

## Estructura del PDF generado

**Página**: A4 vertical, márgenes de 2 cm.

1. **Título**: `Reporte del Evento: {name}` (Heading 1)
2. **Metadatos**: Moneda, Estado, Creador, Fecha de creación (texto descriptivo)
3. **Tabla: Balance de Participantes** — columnas: Participante | Pagado | Consumido | Diferencia | Estado
4. **Tabla: Historial de Gastos** — columnas: Fecha | Descripción | Pagador | Categoría | Monto | División
5. **Tabla: Liquidaciones** — columnas: Pagador | Acreedor | Monto | Estado | Fecha
6. **Pie de página**: Fecha y hora de generación del reporte

---

## Relaciones entre tablas (solo las relevantes para este módulo)

```
Event (1) ──── (N) Expense ──── (N) ExpenseSplit ──── (0..1) Payment
    │                │                   │
    └── user_id ─── User         member_id ─────────── EventMember ──── User
                     │           paid_by_member_id ────────┘
                     └── creator
```
