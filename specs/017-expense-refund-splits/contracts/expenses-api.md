# API Contract: División y devolución de gastos

**Feature**: `017-expense-refund-splits` | **Date**: 2026-09-01

Todos los endpoints requieren `Authorization: Bearer <jwt>`. El backend obtiene el usuario desde el JWT validado y resuelve su membresía activa. Los importes JSON se representan como cadenas decimales de dos posiciones.

## Reglas comunes

- `paid_by_member_id` deja de aceptarse en Request; permanece en Read.
- `payer_participated` es obligatorio en creación.
- Si PATCH recalcula monto o reparto, debe incluir `payer_participated` y la distribución completa resultante.
- El ID del pagador en `participant_member_ids` o `splits` produce `VALIDATION_ERROR`.
- Cuotas exactas 0.00 se omiten de persistencia y respuesta.
- Campos desconocidos de identidad como `paid_by_member_id` se rechazan, no se ignoran.

## POST `/api/events/{event_id}/expenses`

Conserva `application/json` y `multipart/form-data` (`data` JSON + `file`).

### Equal con pagador participante

```json
{
  "name": "Cena",
  "description": null,
  "amount": "200.00",
  "category": "food",
  "split_type": "equal",
  "payer_participated": true,
  "expense_date": "2026-09-01T20:00:00Z",
  "participant_member_ids": [
    "22222222-2222-2222-2222-222222222222",
    "33333333-3333-3333-3333-333333333333",
    "44444444-4444-4444-4444-444444444444"
  ],
  "splits": null,
  "receipt_url": null
}
```

Respuesta `201`:

```json
{
  "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "event_id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  "created_by_member_id": "11111111-1111-1111-1111-111111111111",
  "paid_by_member_id": "11111111-1111-1111-1111-111111111111",
  "name": "Cena",
  "description": null,
  "amount": "200.00",
  "refund_amount": "150.00",
  "payer_contribution": "50.00",
  "payer_participated": true,
  "category": "food",
  "split_type": "equal",
  "expense_date": "2026-09-01T20:00:00Z",
  "receipt_url": null,
  "created_at": "2026-09-01T20:01:00Z",
  "updated_at": "2026-09-01T20:01:00Z"
}
```

### Equal con pagador no participante

Usa `payer_participated: false`. Los IDs enviados son todos los consumidores; sus splits suman `200.00`, la devolución es `200.00` y el aporte del pagador `0.00`.

### Exact

```json
{
  "name": "Pedidos distintos",
  "amount": "200.00",
  "category": "food",
  "split_type": "exact",
  "payer_participated": true,
  "expense_date": "2026-09-01T20:00:00Z",
  "participant_member_ids": null,
  "splits": [
    {"member_id": "22222222-2222-2222-2222-222222222222", "assigned_amount": "50.00"},
    {"member_id": "33333333-3333-3333-3333-333333333333", "assigned_amount": "50.00"},
    {"member_id": "44444444-4444-4444-4444-444444444444", "assigned_amount": "70.00"}
  ]
}
```

Resultado: `refund_amount = 170.00`, `payer_contribution = 30.00`.

## PATCH `/api/expenses/{expense_id}`

Los campos descriptivos siguen siendo parciales. Todo cambio que obligue a recalcular (`amount`, `split_type`, `payer_participated`, `participant_member_ids` o `splits`) envía un reparto completo y coherente.

```json
{
  "amount": "120.00",
  "split_type": "equal",
  "payer_participated": true,
  "participant_member_ids": [
    "22222222-2222-2222-2222-222222222222",
    "33333333-3333-3333-3333-333333333333",
    "44444444-4444-4444-4444-444444444444"
  ],
  "splits": null
}
```

Respuesta `200`: `ExpenseDetailRead` con devolución `90.00`, aporte `30.00` y tres splits de `30.00`.

## GET `/api/events/{event_id}/expenses`

Conserva `filter=all|mine|others`. Cada resumen agrega:

```json
{
  "amount": "200.00",
  "refund_amount": "150.00",
  "payer_contribution": "50.00",
  "payer_participated": true
}
```

`mine` considera al usuario si es pagador o tiene split activo; `others` conserva el complemento actual.

## GET `/api/expenses/{expense_id}`

El detalle agrega los mismos tres campos. `splits` contiene exclusivamente deudores distintos del pagador con cuotas mayores a 0.00.

## Errores relevantes

Todos usan `{ code, message, details }`.

| HTTP | code | Caso |
|---|---|---|
| 401 | `AUTHENTICATION_ERROR` | JWT ausente o inválido |
| 403 | `FORBIDDEN_ERROR` | No es miembro activo o no puede editar |
| 404 | `NOT_FOUND` | Evento/gasto inexistente o eliminado |
| 422 | `VALIDATION_ERROR` | Pagador como deudor, miembro ajeno/inactivo, duplicados o reparto inválido |

Mensajes esperados:

- “El pagador no puede tener una cuota de deuda en su propio gasto.”
- “Selecciona al menos una persona cuando indicas que no participaste en el gasto.”
- “La devolución no puede superar el monto total del gasto.”
- “Si no participaste, las cuotas de los demás deben cubrir el monto total.”

## Compatibilidad

Es un cambio intencional del contrato de escritura. Cliente y backend deben desplegarse coordinadamente. No se versiona una ruta paralela porque el monorepo controla ambos consumidores y no hay clientes externos definidos.
