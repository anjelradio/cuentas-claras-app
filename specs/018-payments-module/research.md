# Research & Technical Decisions: Módulo de Pagos y Liquidación

## Technical Context & Decisions

### Decision 1: Arquitectura y Ubicación del Módulo de Pagos
- **Decision**: Crear el módulo `payments` como una capacidad modular independiente bajo `app/server/app/modules/payments/` siguiendo estrictamente la constitución del backend: `routers/`, `schemas/`, `services/`, `repositories/`, `models/`, `dependencies.py`.
- **Rationale**: Cumple el Principio IV y XI de la constitución (monolito modular y encapsulación entre módulos). Colabora con `expenses` y `events` a través de interfaces públicas de servicios.
- **Alternatives considered**:
  - *Extender `expenses` para incluir pagos*: Rechazado porque los pagos representan un dominio financiero transaccional propio con estados, métodos de pago, almacenamiento de comprobantes de transferencia y lógica de resolución por acreedores.

### Decision 2: Modelo de Datos para `Payment`
- **Decision**: Crear la entidad `Payment` heredando de `BaseModel` (`id: UUID`, `created_at`, `updated_at`, `deleted_at`) con relación a `ExpenseSplit` (`split_id: UUID, foreign_key="expensesplit.id", index=True`).
- **Rationale**: Cada cuota (`split`) representa la deuda individual entre un deudor y el pagador del gasto. Vincular `Payment` al `split_id` garantiza integridad referencial 1-a-1 / 1-a-N para auditoría y no duplica campos como `debtor_member_id` o `payer_member_id` (que se resuelven a través de las relaciones de `split` y `expense`).
- **Fields**:
  - `id`: UUID (BaseModel)
  - `split_id`: UUID (FK `expensesplit.id`)
  - `payment_method`: Enum `PaymentMethod` (`"cash"`, `"qr"`)
  - `status`: Enum `PaymentStatus` (`"pending_confirmation"`, `"confirmed"`, `"rejected"`)
  - `proof_image_url`: Optional[str]
  - `proof_image_public_id`: Optional[str]
  - `confirmed_at`: Optional[datetime]
  - `rejection_reason`: Optional[str]

### Decision 3: Almacenamiento de Comprobantes de Transferencia QR
- **Decision**: Utilizar Cloudinary Storage mediante una abstracción de integración `ProofStorage` o reutilizando la infraestructura existente de subida segura (`CloudinaryStorage`).
- **Rationale**: El backend ya cuenta con configuración probada de Cloudinary para comprobantes de gastos y códigos QR de miembros.
- **Validation**: Formatos válidos: `image/jpeg`, `image/png`, `image/webp`. Tamaño máximo: 5 MB.

### Decision 4: Integración del Detalle de Gastos y Contexto de Rol
- **Decision**: Enriquecer `ExpenseDetailRead` con:
  - `is_payer: bool` (calculado comparando el usuario autenticado con el miembro que pagó el gasto).
  - `current_user_split: ExpenseSplitRead | None` (la cuota del usuario autenticado si es deudor).
  - `splits`: Cada split incluirá `payment_status` (`"no_payment"`, `"pending_confirmation"`, `"confirmed"`), `payment_id`, `payment_method`, `proof_image_url`.
- **Rationale**: Permite al frontend renderizar de forma condicional y limpia:
  - Botón "Saldar mi parte" solo para deudores con cuota sin saldar.
  - Botones "Editar gasto" / "Anular gasto" solo para el pagador.
  - Interactividad en la lista de participantes exclusiva para el pagador acreedor.

### Decision 5: Atomicidad Transaccional y Auditoría
- **Decision**: Confirmar o rechazar un pago ejecutará un límite transaccional atómico (Unit of Work) que actualiza el `Payment.status`, el `ExpenseSplit.status`, recalcula saldos y emite un registro de auditoría en `ActivityLog` (`PAYMENT_DECLARED`, `PAYMENT_CONFIRMED`, `PAYMENT_REJECTED`).
- **Rationale**: Garantiza los Principios X, XV y XVI de la constitución (transacciones atómicas, integridad financiera sin floats y trazabilidad completa).
