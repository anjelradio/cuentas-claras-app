# Data Model: División de gastos con devolución al pagador

**Feature**: `017-expense-refund-splits` | **Date**: 2026-09-01

## Expense

| Campo | Tipo | Estado | Reglas |
|---|---|---|---|
| `id` | UUID | existente | PK heredada de `BaseModel` |
| `event_id` | UUID | existente | FK a Event |
| `created_by_member_id` | UUID | existente | Miembro derivado del JWT |
| `paid_by_member_id` | UUID | existente | Igual al creador en esta feature; solo lectura pública |
| `amount` | Decimal(10,2) | existente | `amount > 0` |
| `refund_amount` | Decimal(10,2) | **nuevo** | `0 <= refund_amount <= amount`; suma de splits activos |
| `payer_participated` | bool | **nuevo** | Indica si el pagador consumió |
| `payer_contribution` | Decimal(10,2) | derivado | `amount - refund_amount`; no persistido |
| `split_type` | equal \| exact | existente | Estrategia de cálculo |
| metadatos restantes | existentes | sin cambio | Incluyen auditoría y comprobante |

### Invariantes

1. `created_by_member_id == paid_by_member_id` al crear bajo este contrato.
2. `refund_amount == SUM(active ExpenseSplit.assigned_amount)`.
3. `amount == refund_amount + payer_contribution`.
4. Todos los montos tienen dos decimales y son no negativos.

## ExpenseSplit

| Campo | Tipo | Reglas |
|---|---|---|
| `expense_id` | UUID | FK al gasto |
| `member_id` | UUID | Miembro activo del mismo evento; nunca el pagador |
| `assigned_amount` | Decimal(10,2) | Todo split activo es estrictamente mayor a 0.00 |
| auditoría | BaseModel | Reutilización y soft-delete; nunca hard-delete |

### Invariantes

1. No existe split activo con `member_id == expense.paid_by_member_id`.
2. No existe split activo con `assigned_amount == 0.00`.
3. Existe como máximo una fila física por `(expense_id, member_id)`; una reincorporación restaura la fila eliminada.

## Modelo de entrada

### Equal

`participant_member_ids` contiene solo otros miembros consumidores.

- Consumidores = otros + pagador si `payer_participated=true`.
- Consumidores = otros si `false`.
- Pagador participante y cero otros: gasto personal válido.
- Pagador no participante y cero otros: inválido.

### Exact

`splits` contiene cuotas para otros miembros.

- Montos cero se omiten.
- Si participa: `0 <= sum(splits) <= amount`.
- Si no participa: `sum(splits) == amount`.

## Estados de edición de splits

```text
nuevo miembro con monto > 0      -> INSERT
miembro activo que permanece     -> UPDATE amount, deleted_at = null
miembro eliminado que regresa    -> UPDATE amount, deleted_at = null
miembro que deja de corresponder -> UPDATE deleted_at = now
monto exacto cambia a 0          -> UPDATE deleted_at = now
pagador presente históricamente  -> UPDATE deleted_at = now
```

Todas las transiciones, la modificación de `Expense` y `refund_amount` pertenecen a una sola transacción.

## Migración Alembic

1. Crear una revisión con `down_revision = "d3e4f5a6b7c8"`.
2. Agregar `refund_amount` y `payer_participated` temporalmente anulables.
3. Para cada gasto, inferir participación por un split activo del pagador; marcar con `deleted_at` splits propios y activos de 0.00; sumar los restantes en `refund_amount`.
4. Validar el rango y aplicar `nullable=False` y check `refund_amount >= 0 AND refund_amount <= amount`.
5. Mantener el check físico de splits `>= 0`; el service evita nuevos splits activos cero.
6. El downgrade elimina check y columnas, pero no reactiva deudas propias ficticias.

## Vistas de lectura

- `ExpenseRead`, `ExpenseSummaryRead` y `ExpenseDetailRead` añaden `refund_amount`, `payer_contribution` y `payer_participated`.
- `ExpenseSplitRead` no cambia y nunca representa al pagador.
