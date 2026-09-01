# Implementation Plan: Módulo de Pagos y Liquidación (Efectivo y QR)

**Branch**: `018-payments-module` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-payments-module/spec.md`

## Summary

Implementar el módulo completo de pagos tanto en backend como en frontend para la liquidación de deudas derivadas de gastos en eventos. Incluye la creación de la entidad `Payment` (`BaseModel`), flujo de declaración de pago por el deudor en efectivo o por QR con comprobante subido a Cloudinary, visualización condicional en el detalle del gasto según el rol del usuario (`is_payer` vs `is_debtor`), y flujo de verificación (confirmar/rechazar) interactivo con Bottom Sheets para el pagador acreedor siguiendo el diseño de Stitch (`design/event/expenses/expense-detail.html`).

## Technical Context

**Language/Version**: Python 3.12 (Backend), TypeScript 5+ / React 19 (Frontend)

**Primary Dependencies**: FastAPI, SQLModel, SQLAlchemy, Alembic, Pydantic, Cloudinary, Next.js 16 (App Router), Tailwind CSS v4, Lucide React, Sonner, Zod

**Storage**: PostgreSQL (persistencia con SQLModel y migraciones Alembic), Cloudinary (comprobantes de transferencia)

**Testing**: Pytest (unit, integration y endpoint tests en backend), Vitest / React Testing Library (frontend)

**Target Platform**: Web responsive / Mobile-first (Next.js PWA ready + FastAPI REST API)

**Project Type**: Monorepo modular (Backend FastAPI en `app/server/` y Frontend Next.js en `app/client/`)

**Performance Goals**: Declaración y confirmación de pagos en < 300ms p95, renderizado fluido de comprobantes e imágenes

**Constraints**: Manejo de decimales con `Decimal` (precisión exacta sin floats binarios), transacciones atómicas, almacenamiento seguro en Cloudinary

**Scale/Scope**: Módulo `payments` completo en backend + integración con módulo `expenses` + vistas y componentes interactivos en frontend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Monorepo y separación de responsabilidades**: Backend reside exclusivamente en `app/server/` y Frontend en `app/client/`.
- [x] **II. Simplicidad**: Reutilización de patrones existentes sin abstracciones innecesarias.
- [x] **III. Calidad y pruebas**: Incluye pruebas unitarias, de integración y de contrato.
- [x] **IV & V. Arquitectura modular y dirección de dependencias**: Router -> Service -> Repository -> Base de datos.
- [x] **VI, VII, VIII. Responsabilidad de capas**: Routers sin lógica de negocio, Services con casos de uso y UoW, Repositories con persistencia SQLModel.
- [x] **IX. SQLModel, Alembic y BaseModel**: `Payment` hereda de `BaseModel` con eliminación lógica y se registra en `app/server/app/db/models.py`.
- [x] **X. Transacciones atómicas**: Confirmación y rechazo coordinados mediante Unit of Work.
- [x] **XI. Encapsulación entre módulos**: Interacción limpia entre `payments`, `expenses` y `events`.
- [x] **XII. Schemas Pydantic**: Nombres con sufijos `Request` y `Read`.
- [x] **XIII & XIV. Autenticación y Autorización**: Better Auth JWT, validación contextual por evento y gasto (`paid_by_member_id` / `member_id`).
- [x] **XV. Manejo centralizado de excepciones**: Uso de excepciones de dominio y handlers globales.
- [x] **XVI. Integridad financiera**: Montos con `Decimal`, nunca floats.

## Project Structure

### Documentation (this feature)

```text
specs/018-payments-module/
├── plan.md              # Este plan de implementación
├── research.md          # Decisiones arquitectónicas y de diseño
├── data-model.md        # Entidades, relaciones y diagramas de estado
├── quickstart.md        # Guía de validación y ejecución
├── contracts/
│   └── payments-api.md  # Contratos de API REST y schemas
└── checklists/
    └── requirements.md  # Checklist de calidad de especificación
```

### Source Code (repository layout)

```text
app/server/
├── app/
│   ├── db/
│   │   └── models.py                        # Registro de Payment en Alembic
│   ├── modules/
│   │   ├── payments/                        # [NUEVO MÓDULO]
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── enums.py                 # PaymentMethod, PaymentStatus
│   │   │   │   └── payment.py               # Modelo Payment (BaseModel)
│   │   │   ├── repositories/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payment_repository.py
│   │   │   │   └── unit_of_work.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   └── payment_schemas.py       # PaymentCreateRequest, PaymentRead, etc.
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   └── payment_service.py       # Lógica de negocio de pagos
│   │   │   ├── routers/
│   │   │   │   ├── __init__.py
│   │   │   │   └── payment_router.py        # Endpoints REST de pagos
│   │   │   ├── dependencies.py
│   │   │   └── __init__.py
│   │   └── expenses/                        # [ACTUALIZACIÓN]
│   │       ├── schemas/expense_schemas.py   # Enriquecimiento de ExpenseDetailRead
│   │       └── services/expense_service.py  # Contexto de usuario (is_payer, splits con pagos)
└── tests/
    └── modules/
        └── payments/
            ├── test_payment_service.py
            └── test_payment_router.py

app/client/
├── src/
│   ├── app/
│   │   └── expenses/
│   │       ├── _types/
│   │       │   └── expense.ts               # Tipos extendidos con estados de pago
│   │       ├── _services/
│   │       │   └── payment-api.ts           # Cliente API para operaciones de pago
│   │       └── [expenseId]/
│   │           ├── _components/
│   │           │   ├── expense-detail-view.tsx  # Vista principal con condicionales
│   │           │   ├── expense-summary.tsx      # Botones condicionales de gestión
│   │           │   ├── expense-participants.tsx # Lista con badges interactivos
│   │           │   ├── settle-expense-sheet.tsx # Flujo completo de saldar deuda (Efectivo / QR)
│   │           │   └── verify-payment-sheet.tsx # Bottom sheet para pagador (Confirmar / Rechazar)
│   │           └── page.tsx
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Ninguna | N/A | El diseño se apega 100% a la constitución del proyecto |
