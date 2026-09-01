# API Contracts: Dashboard Principal, Liquidación de Deudas y Resumen Estadístico

**Feature**: `019-dashboard-debts-insights`
**Date**: 2026-09-01

---

## 1. Resumen de Deudas (`/api/expenses/debts/summary`)

### `GET /api/expenses/debts/summary`

Retorna el total adeudado, total por cobrar y el desglose de gastos asociados al usuario.

**Query Parameters:**
- `event_id` (opcional, UUID): Si se proporciona, filtra únicamente las deudas y acreencias dentro del evento indicado.

**Headers:**
- `Authorization: Bearer <jwt>`

**Response: `200 OK`**
```json
{
  "total_i_owe": "50.00",
  "total_i_am_owed": "120.00",
  "debts_to_pay": [
    {
      "expense_id": "813c94c8-783a-4723-ac0c-de77a81f6c06",
      "split_id": "a90b8f41-3b47-492a-a9e3-e2985cb961a8",
      "expense_name": "Almuerzo Samaipata",
      "category": "food",
      "event_id": "4a51e6cb-f823-40e9-b593-0e10dc51a021",
      "event_name": "Viaje Samaipata",
      "payer_name": "Carla Rodríguez",
      "amount": "25.00",
      "payment_status": "no_payment",
      "payment_id": null
    }
  ],
  "debts_to_collect": [
    {
      "expense_id": "b182e140-520e-4d43-85f8-d4508492ac9b",
      "expense_name": "Hospedaje Cabaña",
      "category": "lodging",
      "event_id": "4a51e6cb-f823-40e9-b593-0e10dc51a021",
      "event_name": "Viaje Samaipata",
      "total_pending_amount": "120.00",
      "unpaid_count": 2,
      "pending_verification_count": 1
    }
  ]
}
```

---

## 2. Pagos Pendientes de Verificación (`/api/payments/pending-verification`)

### `GET /api/payments/pending-verification`

Retorna la lista de declaraciones de pago en espera de confirmación que deben ser revisadas por el usuario actual.

**Headers:**
- `Authorization: Bearer <jwt>`

**Response: `200 OK`**
```json
[
  {
    "payment_id": "f5e6d7c8-b9a0-1234-5678-9abcdef01234",
    "expense_id": "b182e140-520e-4d43-85f8-d4508492ac9b",
    "expense_name": "Hospedaje Cabaña",
    "event_id": "4a51e6cb-f823-40e9-b593-0e10dc51a021",
    "event_name": "Viaje Samaipata",
    "debtor_name": "Ana López",
    "amount": "60.00",
    "payment_method": "qr",
    "created_at": "2026-09-01T14:30:00Z"
  }
]
```

---

## 3. Eventos Recientes con Gasto Personal (`/api/events/recent`)

### `GET /api/events/recent?limit=2`

Retorna los últimos eventos activos en los que participa el usuario con su gasto personal acumulado.

**Headers:**
- `Authorization: Bearer <jwt>`

**Response: `200 OK`**
```json
[
  {
    "id": "4a51e6cb-f823-40e9-b593-0e10dc51a021",
    "name": "Viaje Samaipata",
    "icon": "mountain",
    "status": "open",
    "member_count": 4,
    "expense_count": 5,
    "personal_spent_amount": "145.00",
    "created_at": "2026-08-20T10:00:00Z"
  }
]
```

---

## 4. Actividad Reciente Global (`/api/activities/user-recent`)

### `GET /api/activities/user-recent?limit=3`

Retorna las actividades más recientes registradas en los eventos donde participa el usuario.

**Headers:**
- `Authorization: Bearer <jwt>`

**Response: `200 OK`**
```json
[
  {
    "id": "c1d2e3f4-a5b6-7890-1234-56789abcdef0",
    "event_id": "4a51e6cb-f823-40e9-b593-0e10dc51a021",
    "actor_id": "user-123",
    "actor_name": "Ana López",
    "action_type": "payment_declared",
    "description": "Ana declaró un pago de Bs. 60.00 en QR para el gasto Hospedaje Cabaña",
    "target_id": "f5e6d7c8-b9a0-1234-5678-9abcdef01234",
    "target_name": "Hospedaje Cabaña",
    "created_at": "2026-09-01T14:30:00Z"
  }
]
```

---

## 5. Resumen Estadístico de Evento (`/api/events/{event_id}/statistics`)

### `GET /api/events/{event_id}/statistics`

Retorna el desglose de gastos agrupados por categoría para el evento indicado.

**Headers:**
- `Authorization: Bearer <jwt>`

**Response: `200 OK`**
```json
{
  "event_id": "4a51e6cb-f823-40e9-b593-0e10dc51a021",
  "total_amount": "400.00",
  "currency": "Bs.",
  "categories": [
    {
      "category": "food",
      "label": "Comida",
      "amount": "300.00",
      "percentage": 75.0,
      "count": 3
    },
    {
      "category": "transport",
      "label": "Transporte",
      "amount": "100.00",
      "percentage": 25.0,
      "count": 1
    }
  ]
}
```
