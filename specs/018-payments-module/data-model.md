# Data Model: Módulo de Pagos y Liquidación

## Entidades Principales

### 1. `Payment` (Tabla: `payment`)
Hereda de `BaseModel` (`id: UUID`, `created_at: datetime`, `updated_at: datetime`, `deleted_at: datetime | None`).

| Campo | Tipo | Nulo | Restricciones / Descripción |
|-------|------|------|-----------------------------|
| `id` | UUID | No | Clave primaria generada por `BaseModel` |
| `split_id` | UUID | No | Foreign Key (`expensesplit.id`), indexado |
| `payment_method` | Enum / String | No | `"cash"` \| `"qr"` |
| `status` | Enum / String | No | `"pending_confirmation"` \| `"confirmed"` \| `"rejected"` |
| `proof_image_url` | String(500) | Sí | URL de Cloudinary para pagos por QR |
| `proof_image_public_id` | String(255) | Sí | Public ID de Cloudinary para ciclo de vida |
| `confirmed_at` | DateTime | Sí | Fecha/hora de confirmación por el acreedor |
| `rejection_reason` | String(500) | Sí | Motivo opcional en caso de rechazo |
| `created_at` | DateTime | No | Fecha/hora de declaración del pago |
| `updated_at` | DateTime | No | Fecha/hora de última actualización |
| `deleted_at` | DateTime | Sí | Eliminación lógica para auditoría |

### 2. `ExpenseSplit` (Extensión de campos y estados)
- Estados de cuota:
  - `status`: `"pending"` (sin declaración de pago activa)
  - `"pending_confirmation"` (declaración de pago enviada, en espera de revisión del pagador)
  - `"paid"` (declaración de pago confirmada)

## Diagrama de Relaciones y Transiciones de Estado

```text
[Expense (paid_by_member_id)]
        │ 1
        │
        ▼ N
[ExpenseSplit (member_id)]
        │ 1
        │
        ▼ 0..N (Historial de declaraciones)
[Payment]
   ├── method: cash | qr
   ├── proof_image_url (si qr)
   └── status: pending_confirmation -> confirmed | rejected
```

### Ciclo de Vida de una Declaración de Pago:

```text
   [ Cuota en estado PENDING ]
                │
                │ (Deudor declara pago en Efectivo o QR con comprobante)
                ▼
   [ Payment Creado: PENDING_CONFIRMATION ]
   [ Cuota actualizada: PENDING_CONFIRMATION ]
                │
       ┌────────┴────────┐
       │ (Pagador acepta)│ (Pagador rechaza)
       ▼                 ▼
[ Payment: CONFIRMED ]   [ Payment: REJECTED ]
[ Cuota: PAID ]          [ Cuota: PENDING ]
[ Balances actualizados] [ Deudor puede volver a declarar ]
```
