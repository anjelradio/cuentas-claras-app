# API Contracts: Módulo de Pagos y Liquidación

## Endpoints del Módulo de Pagos (`/api/payments`)

### 1. `POST /api/expenses/{expense_id}/splits/{split_id}/pay`
Permite al deudor autenticado declarar el pago de su cuota (`split`) en efectivo o por QR con comprobante.

- **Content-Type**: `multipart/form-data` (para QR con archivo) o `application/json` (para efectivo)
- **Request Body (JSON o Form field `data`)**:
  ```json
  {
    "payment_method": "cash" // o "qr"
  }
  ```
- **File (si `payment_method == "qr"`)**: `file` (UploadFile: image/jpeg, image/png, image/webp, máx 5MB)
- **Response 201 Created**:
  ```json
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "split_id": "813c94c8-783a-4723-ac0c-de77a81f6c06",
    "expense_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "debtor_member_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "debtor_name": "Ana Flores",
    "amount": "90.00",
    "payment_method": "qr",
    "status": "pending_confirmation",
    "proof_image_url": "https://res.cloudinary.com/.../proof.jpg",
    "created_at": "2026-09-01T14:00:00Z"
  }
  ```

---

### 2. `GET /api/expenses/{expense_id}/payer-qr`
Obtiene el código QR registrado del pagador del gasto para que el deudor pueda realizar la transferencia.

- **Response 200 OK**:
  ```json
  {
    "payer_member_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "payer_name": "Carla",
    "has_qr": true,
    "qr_image_url": "https://res.cloudinary.com/.../qr.jpg"
  }
  ```

---

### 3. `POST /api/payments/{payment_id}/confirm`
Permite únicamente al pagador original del gasto confirmar la recepción de los fondos.

- **Response 200 OK**:
  ```json
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "split_id": "813c94c8-783a-4723-ac0c-de77a81f6c06",
    "status": "confirmed",
    "confirmed_at": "2026-09-01T14:05:00Z"
  }
  ```

---

### 4. `POST /api/payments/{payment_id}/reject`
Permite al pagador original rechazar la declaración de pago.

- **Request Body**:
  ```json
  {
    "rejection_reason": "Comprobante ilegible o transferencia no recibida"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "split_id": "813c94c8-783a-4723-ac0c-de77a81f6c06",
    "status": "rejected",
    "rejection_reason": "Comprobante ilegible o transferencia no recibida"
  }
  ```

---

### 5. `GET /api/expenses/{expense_id}` (Enriquecimiento de respuesta)
- **Response 200 OK**:
  ```json
  {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "event_id": "813c94c8-783a-4723-ac0c-de77a81f6c06",
    "name": "Cena en el Puerto",
    "description": "Cena grupal de despedida",
    "amount": "200.00",
    "refund_amount": "150.00",
    "payer_contribution": "50.00",
    "payer_participated": true,
    "category": "food",
    "split_type": "equal",
    "expense_date": "2026-09-01T12:00:00Z",
    "receipt_url": "https://res.cloudinary.com/.../receipt.jpg",
    "paid_by_member_id": "11111111-1111-1111-1111-111111111111",
    "paid_by_member_name": "Carla",
    "created_by_member_id": "11111111-1111-1111-1111-111111111111",
    "created_by_member_name": "Carla",
    "is_payer": false,
    "current_user_split": {
      "id": "22222222-2222-2222-2222-222222222222",
      "member_id": "33333333-3333-3333-3333-333333333333",
      "member_name": "Ana Flores",
      "assigned_amount": "50.00",
      "payment_status": "no_payment",
      "payment_id": null,
      "payment_method": null,
      "proof_image_url": null
    },
    "splits": [
      {
        "id": "22222222-2222-2222-2222-222222222222",
        "member_id": "33333333-3333-3333-3333-333333333333",
        "member_name": "Ana Flores",
        "assigned_amount": "50.00",
        "payment_status": "no_payment",
        "payment_id": null,
        "payment_method": null,
        "proof_image_url": null
      },
      {
        "id": "44444444-4444-4444-4444-444444444444",
        "member_id": "55555555-5555-5555-5555-555555555555",
        "member_name": "Beto",
        "assigned_amount": "50.00",
        "payment_status": "pending_confirmation",
        "payment_id": "66666666-6666-6666-6666-666666666666",
        "payment_method": "qr",
        "proof_image_url": "https://res.cloudinary.com/.../proof_beto.jpg"
      }
    ]
  }
  ```
