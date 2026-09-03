# API Contract: Dashboard y Analítica Visual del Evento

**Feature**: `021-event-analytics-dashboard`
**Date**: 2026-09-03

---

## Endpoint

### GET /api/events/{event_id}/dashboard

Retorna la vista analítica consolidada de un evento para el usuario autenticado.

**Autenticación**: Bearer JWT (requerido)

**Autorización**: El usuario debe ser miembro activo del evento (`EventMember.status = "active"`).

---

### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `event_id` | UUID | Identificador del evento |

---

### Response 200 OK

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "currency": "Bs.",
  "total_spent": "850.00",
  "expense_count": 7,
  "pending_settlements_count": 3,
  "personal_balance": {
    "paid": "500.00",
    "consumed": "283.33",
    "net_difference": "216.67",
    "status": "acreedor"
  },
  "categories": [
    {
      "category": "food",
      "label": "Comida",
      "amount": "420.00",
      "percentage": 49.41,
      "count": 3
    },
    {
      "category": "transport",
      "label": "Transporte",
      "amount": "230.00",
      "percentage": 27.06,
      "count": 2
    },
    {
      "category": "lodging",
      "label": "Hospedaje",
      "amount": "200.00",
      "percentage": 23.53,
      "count": 2
    }
  ],
  "payer_contributions": [
    {
      "member_id": "660e8400-e29b-41d4-a716-446655440001",
      "display_name": "Ana García",
      "total_paid": "500.00",
      "percentage": 58.82
    },
    {
      "member_id": "660e8400-e29b-41d4-a716-446655440002",
      "display_name": "Carlos López",
      "total_paid": "350.00",
      "percentage": 41.18
    }
  ],
  "expense_timeline": [
    {
      "date": "2026-08-20",
      "daily_total": "200.00",
      "cumulative_total": "200.00"
    },
    {
      "date": "2026-08-21",
      "daily_total": "420.00",
      "cumulative_total": "620.00"
    },
    {
      "date": "2026-08-22",
      "daily_total": "230.00",
      "cumulative_total": "850.00"
    }
  ]
}
```

---

### Invariantes de coherencia (verificables)

- `sum(categories[*].amount) == total_spent`
- `sum(categories[*].percentage) ≈ 100.0` (± errores de redondeo mínimos)
- `sum(payer_contributions[*].total_paid) == total_spent`
- `sum(payer_contributions[*].percentage) ≈ 100.0`
- `expense_timeline[-1].cumulative_total == total_spent`
- `categories` solo incluye categorías con al menos 1 gasto activo
- `expense_timeline` tiene exactamente un punto por fecha distinta

---

### Response 403 Forbidden

Cuando el usuario no es miembro activo del evento.

```json
{
  "code": "AUTHORIZATION_ERROR",
  "message": "No tienes acceso a este evento."
}
```

### Response 404 Not Found

Cuando el `event_id` no existe.

```json
{
  "code": "NOT_FOUND",
  "message": "Evento no encontrado."
}
```

---

### Caso: evento sin gastos

Cuando el evento no tiene gastos activos, la respuesta es válida con valores en cero/vacíos:

```json
{
  "event_id": "...",
  "currency": "Bs.",
  "total_spent": "0.00",
  "expense_count": 0,
  "pending_settlements_count": 0,
  "personal_balance": {
    "paid": "0.00",
    "consumed": "0.00",
    "net_difference": "0.00",
    "status": "neutro"
  },
  "categories": [],
  "payer_contributions": [],
  "expense_timeline": []
}
```

---

### Notas de implementación

- Los valores `Decimal` de Python se serializan como **strings** en JSON para preservar precisión (comportamiento estándar de FastAPI con `Decimal`).
- El frontend convierte los strings a `number` mediante la transformación Zod `.transform(Number)` o `parseFloat`.
- Los porcentajes se expresan como `float` (ej.: `49.41`, no `0.4941`).
- El campo `label` de `EventCategoryStatItem` es generado en el service como la representación legible de la categoría en español.
- El orden de `categories` es descendente por `amount`; el orden de `payer_contributions` es descendente por `total_paid`; el orden de `expense_timeline` es ascendente por `date`.
