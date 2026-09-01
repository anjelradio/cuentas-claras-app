# Contrato API REST: Módulo de Gastos y Comprobantes

**Feature**: `specs/015-expenses-management/spec.md` | **Date**: 2026-08-31

Todos los endpoints requieren autenticación mediante header:
`Authorization: Bearer <jwt>`

---

## 1. Endpoints

### 1.1 `POST /api/events/{event_id}/expenses`
Registra un nuevo gasto manual dentro de un evento abierto, con soporte atómico opcional para adjuntar un comprobante en la misma solicitud.

- **Content-Type**: `application/json` (sin comprobante) o `multipart/form-data` (con comprobante opcional).
- **Multipart Form Data**:
  - `data`: Cadena JSON que serializa el schema `ExpenseCreateRequest`.
  - `file`: Archivo binario opcional (JPEG, PNG o WebP, max 5 MB).
- **JSON Request Body** (`ExpenseCreateRequest`):
```json
{
  "name": "Cena en el puerto",
  "description": "Cena compartida del equipo",
  "amount": "360.00",
  "category": "food",
  "split_type": "equal",
  "paid_by_member_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "expense_date": "2026-08-18T20:30:00Z",
  "participant_member_ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "7ca85f64-5717-4562-b3fc-2c963f66afa7",
    "8da85f64-5717-4562-b3fc-2c963f66afa8"
  ],
  "splits": null
}
```
*Nota*: Si `split_type` es `"exact"`, `participant_member_ids` es ignorado y `splits` es requerido:
```json
{
  "splits": [
    { "member_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "assigned_amount": "120.00" },
    { "member_id": "7ca85f64-5717-4562-b3fc-2c963f66afa7", "assigned_amount": "140.00" },
    { "member_id": "8da85f64-5717-4562-b3fc-2c963f66afa8", "assigned_amount": "100.00" }
  ]
}
```

- **Status Code**: `201 Created`
- **Response Body** (`ExpenseRead`):
```json
{
  "id": "1ea85f64-5717-4562-b3fc-2c963f66af99",
  "event_id": "a9a85f64-5717-4562-b3fc-2c963f66af11",
  "created_by_member_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "paid_by_member_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Cena en el puerto",
  "description": "Cena compartida del equipo",
  "amount": "360.00",
  "category": "food",
  "split_type": "equal",
  "expense_date": "2026-08-18T20:30:00Z",
  "receipt_url": "https://res.cloudinary.com/.../receipt.jpg",
  "created_at": "2026-08-31T22:00:00Z",
  "updated_at": "2026-08-31T22:00:00Z"
}
```

---

### 1.2 `GET /api/events/{event_id}/expenses`
Lista los gastos activos de un evento con soporte para filtrado.

- **Query Parameters**:
  - `filter` (opcional, enum: `all` | `mine` | `others`, default: `all`)
- **Status Code**: `200 OK`
- **Response Body** (`list[ExpenseSummaryRead]`):
```json
[
  {
    "id": "1ea85f64-5717-4562-b3fc-2c963f66af99",
    "event_id": "a9a85f64-5717-4562-b3fc-2c963f66af11",
    "name": "Cena en el puerto",
    "description": "Cena compartida del equipo",
    "amount": "360.00",
    "category": "food",
    "split_type": "equal",
    "expense_date": "2026-08-18T20:30:00Z",
    "paid_by_member_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paid_by_member_name": "Ana López",
    "has_receipt": true,
    "created_at": "2026-08-31T22:00:00Z"
  }
]
```

---

### 1.3 `GET /api/expenses/{expense_id}`
Obtiene el detalle completo de un gasto y el desglose de participantes.

- **Status Code**: `200 OK`
- **Response Body** (`ExpenseDetailRead`):
```json
{
  "id": "1ea85f64-5717-4562-b3fc-2c963f66af99",
  "event_id": "a9a85f64-5717-4562-b3fc-2c963f66af11",
  "name": "Cena en el puerto",
  "description": "Cena compartida del equipo",
  "amount": "360.00",
  "category": "food",
  "split_type": "equal",
  "expense_date": "2026-08-18T20:30:00Z",
  "receipt_url": "https://res.cloudinary.com/.../receipt.jpg",
  "created_by_member_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "created_by_member_name": "Ana López",
  "paid_by_member_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "paid_by_member_name": "Ana López",
  "created_at": "2026-08-31T22:00:00Z",
  "updated_at": "2026-08-31T22:00:00Z",
  "splits": [
    {
      "id": "9fa85f64-5717-4562-b3fc-2c963f66af01",
      "member_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "member_name": "Ana López",
      "assigned_amount": "120.00"
    },
    {
      "id": "9fa85f64-5717-4562-b3fc-2c963f66af02",
      "member_id": "7ca85f64-5717-4562-b3fc-2c963f66afa7",
      "member_name": "Diego Rojas",
      "assigned_amount": "120.00"
    },
    {
      "id": "9fa85f64-5717-4562-b3fc-2c963f66af03",
      "member_id": "8da85f64-5717-4562-b3fc-2c963f66afa8",
      "member_name": "Sofía Cruz",
      "assigned_amount": "120.00"
    }
  ]
}
```

---

### 1.4 `PATCH /api/expenses/{expense_id}`
Modifica un gasto existente, sincroniza las participaciones y opcionalmente actualiza/reemplaza el comprobante.

- **Content-Type**: `application/json` o `multipart/form-data`.
- **Status Code**: `200 OK`
- **Request Body** (`ExpenseUpdateRequest`):
```json
{
  "name": "Cena en el puerto (actualizada)",
  "description": "Nueva descripción",
  "amount": "400.00",
  "category": "food",
  "split_type": "equal",
  "paid_by_member_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "expense_date": "2026-08-18T21:00:00Z",
  "participant_member_ids": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "7ca85f64-5717-4562-b3fc-2c963f66afa7"
  ],
  "splits": null
}
```
- **Response Body**: `ExpenseDetailRead`

---

### 1.5 `DELETE /api/expenses/{expense_id}`
Eliminación lógica de un gasto y registro de auditoría.

- **Status Code**: `204 No Content`

---

### 1.6 `PUT /api/expenses/{expense_id}/receipt`
Operación dedicada para subir o reemplazar el comprobante desde la vista de detalle.

- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: Archivo binario (JPEG, PNG o WebP, max 5 MB).
- **Status Code**: `200 OK`
- **Response Body** (`ExpenseReceiptRead`):
```json
{
  "expense_id": "1ea85f64-5717-4562-b3fc-2c963f66af99",
  "receipt_url": "https://res.cloudinary.com/.../receipt.jpg"
}
```

---

### 1.7 `DELETE /api/expenses/{expense_id}/receipt`
Operación dedicada para eliminar el comprobante desde la vista de detalle.

- **Status Code**: `204 No Content`

---

## 2. Errores Uniformes Centralizados

```json
{
  "code": "VALIDATION_ERROR",
  "message": "La suma de las cuotas asignadas (Bs. 99.99) no coincide con el total del gasto (Bs. 100.00).",
  "details": null
}
```

| Código de Error | HTTP Status | Causa |
|---|---|---|
| `AUTHENTICATION_ERROR` | `401 Unauthorized` | Token JWT ausente, inválido o expirado |
| `FORBIDDEN_ERROR` | `403 Forbidden` | Usuario no es miembro activo o no tiene permisos de edición/eliminación |
| `NOT_FOUND` | `404 Not Found` | Evento o gasto inexistente o eliminado lógicamente |
| `VALIDATION_ERROR` | `422 Unprocessable Entity` | Descuadre en división exacta, montos negativos, evento cerrado o participante ajeno |
| `FILE_TOO_LARGE` | `400 Bad Request` | Comprobante excede los 5 MB permitidos |
| `INVALID_FILE_FORMAT` | `400 Bad Request` | Formato distinto de JPEG, PNG o WebP |
