# Implementation Plan: Deep-linking de Acciones y Apertura Automática de Modales en Gastos y Deudas

**Branch**: `020-ux-action-deeplinks` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

## Summary

Implementar mejoras de experiencia de usuario (UX) mediante deep-linking por URL (`?action=verify&splitId=...` y `?action=pay`) para auto-abrir los modales de verificación de pago y declaración de saldo al navegar desde "Requiere tu atención" y "Mis deudas", junto con un estado visual de carga (spinner) al abrir "Mis deudas".

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend Next.js 15 App Router) & Python 3.14 (Backend FastAPI / SQLModel)

**Primary Dependencies**: Next.js, React 19, Lucide React, Tailwind CSS, Base UI Sheet/Dialog, FastAPI, Pydantic v2

**Storage**: PostgreSQL / SQLite (no schema migrations required; only DTO field additions)

**Testing**: `pytest` (backend), `vitest` y `tsc --noEmit` (frontend)

**Target Platform**: Web (Desktop & Mobile responsive)

**Performance Goals**: Auto-apertura de modal en menos de 50 ms tras la carga del cliente; fetching de deudas < 300 ms.

**Constraints**: Respetar la jerarquía de componentes Next.js App Router y la constitución del proyecto.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I (Monorepo & Boundaries)**: Frontend bajo `app/client/`, Backend bajo `app/server/`.
- [x] **Principle V & VI (Router $\to$ Service $\to$ Repository)**: FastAPI routers solo manejan HTTP y delegan a services.
- [x] **Principle XII (DTO Naming)**: `PendingVerificationPaymentRead` mantiene el sufijo `Read`.
- [x] **Principle XVIII & XIX (Frontend Structure & Dependencies)**: Comunicación a través de services tipados con Zod.
- [x] **Principle XX (Server vs Client Components)**: La lectura de searchParams y el control de modales se encapsula en Client Components (`ExpenseDetailView`, `MyDebtsSheet`).

## Project Structure

### Documentation (this feature)

```text
specs/020-ux-action-deeplinks/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── action-deeplink-contracts.md
└── tasks.md
```

### Source Code

```text
app/
├── server/
│   ├── app/modules/payments/
│   │   ├── schemas/payment_schemas.py        # split_id en PendingVerificationPaymentRead
│   │   └── services/payment_service.py        # Población de split_id
│   └── tests/unit/
│       └── test_pending_verification.py       # Verificación de split_id en tests
└── client/
    └── src/app/
        ├── expenses/
        │   ├── _schemas/expense-api-schemas.ts  # Zod schema con split_id
        │   ├── _types/expense.ts               # TypeScript interface con split_id
        │   └── [expenseId]/
        │       ├── page.tsx                    # Suspense wrapper para useSearchParams
        │       └── _components/
        │           ├── expense-detail-view.tsx  # Detección de ?action= y control de sheets
        │           ├── expense-participants.tsx # Auto-apertura de VerifyPaymentSheet por splitId
        │           └── expense-summary.tsx      # Auto-apertura de SettleExpenseSheet con action=pay
        └── home/_components/
            ├── require-attention-card.tsx       # Enlace con ?action=verify&splitId=...
            └── my-debts-sheet.tsx              # Spinner de carga + enlace con ?action=pay
```

## Planned Changes by Component

### Backend: Pagos & DTOs
1. `app/server/app/modules/payments/schemas/payment_schemas.py`:
   - Añadir `split_id: UUID` a `PendingVerificationPaymentRead`.
2. `app/server/app/modules/payments/services/payment_service.py`:
   - Asignar `split_id=split.id` al construir `PendingVerificationPaymentRead`.
3. `app/server/tests/unit/test_pending_verification.py`:
   - Afirmar que `pending[0].split_id == split.id`.

### Frontend: Schemas & Tipos
1. `app/client/src/app/expenses/_schemas/expense-api-schemas.ts`:
   - Incluir `split_id: z.string().uuid()` en `pendingVerificationPaymentReadSchema`.
2. `app/client/src/app/expenses/_types/expense.ts`:
   - Incluir `split_id: string` en `PendingVerificationPayment`.

### Frontend: Home & Deudas
1. `app/client/src/app/home/_components/require-attention-card.tsx`:
   - Construir el enlace del botón "Revisar" hacia `/expenses/${item.expense_id}?action=verify&splitId=${item.split_id}`.
2. `app/client/src/app/home/_components/my-debts-sheet.tsx`:
   - Añadir estado de carga visual con spinner en la vista `"select"` mientras `loading` sea `true`.
   - Modificar la navegación de ítems en "Lo que debes" para redirigir a `/expenses/${item.expense_id}?action=pay`.
   - Mantener la navegación de "Lo que te deben" hacia `/expenses/${item.expense_id}` sin acción.

### Frontend: Detalle del Gasto & Auto-apertura de Modales
1. `app/client/src/app/expenses/[expenseId]/_components/expense-detail-view.tsx`:
   - Leer query parameters con `useSearchParams()`.
   - Propagar la acción `action` y `splitId` hacia `ExpenseParticipants` y `ExpenseSummary`.
2. `app/client/src/app/expenses/[expenseId]/_components/expense-participants.tsx`:
   - Aceptar `autoOpenSplitId?: string | null` y activar `selectedSplit` y `verifyOpen` cuando coincida con un split en estado `pending_confirmation` o `confirmed`.
3. `app/client/src/app/expenses/[expenseId]/_components/expense-summary.tsx`:
   - Aceptar `autoOpenPay?: boolean` y pasar `defaultOpen={true}` a `SettleExpenseSheet` si el usuario tiene una cuota adeudada.
4. `app/client/src/app/expenses/[expenseId]/_components/settle-expense-sheet.tsx`:
   - Soportar prop `defaultOpen?: boolean` o control de apertura.

## Verification Plan

### Automated Tests
```bash
# Backend pytest suite
./venv/bin/pytest tests/ -v

# Frontend typecheck & vitest
pnpm typecheck
pnpm test
```

### Manual Verification
1. Abrir `/home` -> Sección "Requiere tu atención" -> Clic en "Revisar" -> Verificar auto-apertura del modal de comprobante del deudor.
2. Abrir `/home` -> Clic en "Mis deudas" -> Verificar spinner de carga -> Clic en "Lo que debes" -> Clic en gasto adeudado -> Verificar auto-apertura del modal "Saldar mi deuda".
3. Abrir `/[eventId]` -> Clic en "Mis deudas" -> Verificar filtro contextual por evento y auto-apertura con `?action=pay`.
