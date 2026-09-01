# Data Model: Deep-linking de Acciones y Auto-apertura de Modales

## DTOs y Modelos de Interfaz

### 1. Extensión de `PendingVerificationPaymentRead` (Backend & Frontend)

Representa un pago pendiente de verificación notificado al acreedor en la sección "Requiere tu atención".

```typescript
interface PendingVerificationPayment {
  payment_id: string;        // UUID del pago
  split_id: string;          // UUID del split/cuota correspondiente (NUEVO)
  expense_id: string;        // UUID del gasto
  expense_name: string;      // Nombre del gasto
  event_id: string;          // UUID del evento
  event_name: string;        // Nombre del evento
  debtor_name: string;       // Nombre de la persona que declaró el pago
  amount: number;            // Monto de la cuota
  payment_method: "cash" | "qr"; // Método de pago
  created_at: string;        // Fecha de declaración (ISO 8601)
}
```

---

### 2. Contrato de Parámetros de Búsqueda URL (Query Parameters)

```text
/expenses/[expenseId]?action=[action]&splitId=[splitId]
```

| Parámetro | Tipo | Requerido | Valores Permitidos | Descripción |
|---|---|---|---|---|
| `action` | string | Opcional | `"verify"`, `"pay"` | Acción contextual a ejecutar en el detalle del gasto. |
| `splitId` | string (UUID) | Condicional (si `action="verify"`) | UUID válido | Identificador de la cuota del participante que se va a verificar. |

---

### 3. Estados de Apertura de Modales en el Cliente

```typescript
type AutoOpenActionState = 
  | { type: "idle" }
  | { type: "verify"; splitId: string }
  | { type: "pay" };
```
