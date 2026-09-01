# API & URL Contracts: Deep-linking de Acciones

## 1. Backend Endpoint: `GET /api/payments/pending-verification`

- **Método**: `GET`
- **Ruta**: `/api/payments/pending-verification`
- **Autenticación**: `Bearer <JWT>`
- **Respuesta**: `200 OK`
- **Schema**: `list[PendingVerificationPaymentRead]`

### Response Payload Example:
```json
[
  {
    "payment_id": "c71a3962-4217-48f0-b962-23c2a6bf9583",
    "split_id": "b1a37c98-e711-4775-be71-49b827e8a931",
    "expense_id": "3bb626fb-4554-44df-be9a-9e1e07b8b27c",
    "expense_name": "Almuerzo Trucha",
    "event_id": "8fae6a39-38e5-4d76-880c-e2f7ae8e4a9e",
    "event_name": "Viaje Copacabana",
    "debtor_name": "Juan Pérez",
    "amount": "50.00",
    "payment_method": "qr",
    "created_at": "2026-09-01T14:00:00Z"
  }
]
```

---

## 2. Frontend URL Deep-Link Contract

### Caso 1: Revisar Pago Declarado
- **Origen**: Tarjeta en "Requiere tu atención" en `/home`.
- **Destino**: `/expenses/${expense_id}?action=verify&splitId=${split_id}`
- **Efecto en destino**: Abre `VerifyPaymentSheet` para el `split_id` proporcionado.

### Caso 2: Saldar Deuda Pendiente
- **Origen**: Ítem en pestaña "Lo que debes" dentro de `MyDebtsSheet` en `/home` o `/[eventId]`.
- **Destino**: `/expenses/${expense_id}?action=pay`
- **Efecto en destino**: Abre `SettleExpenseSheet` para el usuario conectado.

### Caso 3: Ver Gasto de Acreencia
- **Origen**: Ítem en pestaña "Lo que te deben" dentro de `MyDebtsSheet`.
- **Destino**: `/expenses/${expense_id}`
- **Efecto en destino**: Muestra la vista estándar de detalle del gasto sin abrir modales de pago.
