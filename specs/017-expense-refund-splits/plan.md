# Implementation Plan: División de gastos con devolución al pagador

**Branch**: `017-expense-refund-splits` | **Date**: 2026-09-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/017-expense-refund-splits/spec.md`

## Summary

Modificar el módulo transversal de gastos para que el usuario autenticado que registra un gasto sea siempre su pagador, nunca tenga un `ExpenseSplit` propio y pueda indicar si participó en el consumo. El backend persistirá `refund_amount` y `payer_participated`, calculará en `Decimal` las cuotas equitativas o exactas y reconciliará gasto y splits de forma atómica. El frontend convertirá el selector actual en un bottom sheet de dos pasos, excluirá al pagador de la lista editable y mostrará en tiempo real total, devolución y aporte personal, manteniendo al backend como fuente de verdad.

## Technical Context

**Language/Version**: Python 3.14; TypeScript 5, React 19 y Next.js 16.3

**Primary Dependencies**: FastAPI, SQLModel, SQLAlchemy, Alembic, Pydantic; Next.js App Router, Zod, shadcn/ui, Tailwind CSS, Sonner y lucide-react

**Storage**: PostgreSQL (Neon) mediante SQLModel/SQLAlchemy; migraciones Alembic

**Testing**: pytest para servicios, repositorios y endpoints; Vitest + Testing Library para schemas, services y componentes React

**Target Platform**: Backend Linux/ASGI y cliente web responsive

**Project Type**: Aplicación web monorepo con frontend y backend separados

**Performance Goals**: El resumen local de cuotas debe actualizarse perceptiblemente en menos de 100 ms y el usuario debe poder verificar la distribución en menos de 10 segundos

**Constraints**: Cálculos monetarios exclusivamente con `Decimal`/centavos enteros; ningún split del pagador; ningún split activo de 0.00; `refund_amount <= amount`; mutaciones atómicas; soft-delete; identidad derivada del JWT validado
**Scale/Scope**: Un módulo de dominio existente, cuatro endpoints existentes, un formulario compartido create/edit, listado y detalle de gastos; sin nuevas dependencias externas

## Constitution Check

*GATE: aprobado antes de Phase 0 y comprobado nuevamente después de Phase 1.*

| Regla aplicable | Verificación del plan | Estado |
|---|---|---|
| Separación `app/client` / `app/server` | Los cambios de UI quedan en `app/client`; dominio, persistencia y API en `app/server`; los contratos viven en `specs/017-expense-refund-splits`. | PASS |
| Backend como fuente de verdad | El backend deriva al pagador del JWT y vuelve a validar pertenencia, participación, montos y conservación financiera. | PASS |
| Router → Service → Repository | Los routers solo traducen HTTP; `ExpenseService` calcula y coordina; los repositories persisten sin commit. | PASS |
| Encapsulación entre módulos | Expenses consumirá una interfaz pública de consulta/autorización de Events; dejará de importar modelos y repositories internos de Events. | PASS |
| SQLModel y Alembic | `Expense` se amplía con una migración Alembic y se conserva el registro canónico de modelos existente. | PASS |
| Soft-delete y atomicidad | La reconciliación reutiliza, restaura o marca `deleted_at`; gasto, devolución y splits comparten un solo Unit of Work. | PASS |
| Schemas explícitos e identidad segura | Los Request no aceptan `paid_by_member_id`; los Read exponen únicamente campos financieros intencionales. | PASS |
| Integridad financiera | Todos los cálculos usan `Decimal` o centavos enteros, con regla determinista de residuos e invariantes comprobables. | PASS |
| Arquitectura frontend | Pages servidor cargan sesión/datos; el componente cliente interactivo permanece en la frontera `expenses`; llamadas mediante services y Zod. | PASS |
| Sistema de diseño y accesibilidad | Se reutilizan Sheet, Button, Checkbox/Input y Sonner; iconos solo con lucide-react; flujo mobile-first y operable por teclado. | PASS |
| Pruebas y regresión | Se planifican pruebas unitarias, integración/contrato y componentes para reglas financieras, autorización y edición atómica. | PASS |

No existen violaciones constitucionales ni excepciones que requieran justificación.

## Project Structure

### Documentation (this feature)

```text
specs/017-expense-refund-splits/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── expenses-api.md
└── tasks.md                 # Se generará posteriormente con /speckit-tasks
```

### Source Code (repository root)

```text
app/server/
├── alembic/versions/
├── app/modules/events/
│   ├── dependencies.py      # Construcción de la interfaz pública
│   ├── schemas/             # DTOs públicos de contexto de membresía
│   └── services/            # Consulta/autorización pública de Events
├── app/modules/expenses/
│   ├── dependencies.py
│   ├── models/expense.py
│   ├── repositories/
│   ├── routers/expense_router.py
│   ├── schemas/expense_schemas.py
│   └── services/expense_service.py
└── tests/
    ├── integration/
    └── unit/

app/client/src/app/expenses/
├── [expenseId]/_components/
├── event/[eventId]/
├── _components/
│   ├── expense-form.tsx
│   └── expense-participants-sheet.tsx
├── _schemas/expense-api-schemas.ts
├── _services/
│   ├── expense-api.ts
│   └── server-expense-api.ts
└── _types/expense.ts
```

**Structure Decision**: Se conserva el monorepo y el feature folder `expenses` existente. No se crea un proyecto ni una capa nueva. La única colaboración entre dominios se realiza mediante una interfaz pública mínima del módulo Events para obtener el contexto del evento, el miembro actual y los miembros activos, evitando que Expenses dependa de repositories o modelos internos ajenos.

## Implementation Design

### 1. Identidad y participación del pagador

- `create` fija `created_by_member_id` y `paid_by_member_id` al miembro activo asociado al `sub` del JWT.
- `paid_by_member_id` se elimina de `ExpenseCreateRequest` y `ExpenseUpdateRequest`; tampoco se puede cambiar al editar.
- `payer_participated: bool` se persiste porque no puede inferirse inequívocamente a partir de los splits.
- El cliente debe resolver un `EventMember.id` real para presentar el formulario, pero nunca usa ese valor como autoridad; si la sesión o la membresía no se resuelven, la página muestra error y no usa `members[0]` ni un `user_id` como fallback.

### 2. División equitativa

- La entrada contiene únicamente IDs de otros miembros seleccionados y `payer_participated`.
- Consumidores = otros seleccionados + pagador cuando `payer_participated=true`.
- Si el pagador participa y no hay otros seleccionados, el gasto es personal: cero splits y devolución 0.00.
- Si el pagador no participa, debe existir al menos otro consumidor y los otros miembros cubren el 100% del total.
- El reparto se calcula en centavos enteros. Cuando participa el pagador, el primer centavo residual se asigna a su aporte y los restantes a los otros miembros ordenados por UUID; cuando no participa, los residuos se asignan por UUID ascendente. Luego se omite la parte del pagador y solo se persisten cuotas de terceros.

### 3. Montos exactos

- La entrada acepta cuotas únicamente para otros miembros activos del evento.
- Las cuotas negativas, duplicadas, pertenecientes al pagador o a otro evento se rechazan.
- Las cuotas 0.00 se normalizan fuera del conjunto persistido.
- Si el pagador participó, la suma puede estar entre 0 y el total; la diferencia es su aporte personal.
- Si el pagador no participó, la suma debe ser exactamente igual al total para que su aporte sea 0.00.

### 4. Persistencia, migración y edición

- `Expense.refund_amount` será `Numeric(10,2)`, no nulo y con check `0 <= refund_amount <= amount`.
- `payer_contribution` será un valor derivado (`amount - refund_amount`) expuesto por los Read schemas, no una columna redundante.
- La migración depende de `d3e4f5a6b7c8`, agrega inicialmente campos anulables, infiere `payer_participated` por la existencia de un split activo del pagador, marca lógicamente ese split como eliminado, calcula `refund_amount` desde los splits activos de terceros y finalmente aplica `NOT NULL` y el check financiero.
- Los splits históricos de 0.00 se marcan lógicamente como eliminados. Se conserva el check físico `assigned_amount >= 0`; el service impide crear o reactivar cuotas 0.00.
- En edición, el service recalcula el conjunto objetivo y, dentro del mismo Unit of Work, actualiza/restaura filas existentes, crea las nuevas y marca con `deleted_at` las que ya no correspondan. `refund_amount` se actualiza antes del único commit.

### 5. Contrato y experiencia de usuario

- Create/Patch reciben `payer_participated`; equal recibe IDs de otros miembros; exact recibe solo cuotas positivas de otros miembros.
- Create, summary y detail exponen `refund_amount`, `payer_contribution` y `payer_participated`; `paid_by_*` permanece solo de lectura.
- El bottom sheet se convierte en wizard: (1) “¿Tú participaste en este gasto?” y (2) selección/asignación de los demás miembros.
- “Este eres tú” se muestra como bloque fijo no seleccionable en el paso 1 o resumen, nunca dentro de la lista editable del paso 2.
- El resumen usa centavos enteros en el cliente y muestra total, devolución y aporte propio. La respuesta del backend reemplaza cualquier cálculo optimista.
- Equal usa checkboxes; exact usa inputs monetarios y omite cuotas cero del payload. Se deshabilita confirmar mientras el estado sea inválido o la mutación esté en curso.
- Los errores se conservan en el formulario y se comunican con Sonner; el éxito invalida/refresca el estado y redirige según el flujo existente.

## Verification Strategy

1. **Dominio unitario**: combinaciones con/sin participación del pagador, exclusiones, gasto personal, residuos de centavos, exactos parciales/completos, ceros y rechazos.
2. **Persistencia e integración**: migración de datos previos, check de devolución, restauración/soft-delete de splits y rollback al fallar cualquier escritura.
3. **Contrato HTTP**: identidad del pagador derivada del JWT, campos retirados/rechazados, nuevos campos Read, errores centralizados y permisos de edición.
4. **Frontend**: wizard accesible, pagador ausente de la lista/payload, resumen reactivo, reglas exact/equal, restauración en edición y bloqueo durante submit.
5. **Regresión**: listado, detalle, filtros `all|mine|others`, carga de comprobante y flujos create/edit existentes.
6. **Arquitectura**: prueba estática que impida imports de `events.repositories` y `events.models` desde `expenses`.

Los estados de pago `pending|paid|cancelled` mencionados descriptivamente en la specification no se agregan en esta feature porque no existen en el modelo actual ni son necesarios para sus escenarios; pertenecen a una feature futura de liquidación de pagos.

## Post-Design Constitution Check

La revisión posterior a `research.md`, `data-model.md`, `contracts/expenses-api.md` y `quickstart.md` mantiene todos los gates en PASS. El diseño elimina además dos incumplimientos existentes: identidad del pagador aceptada desde el cliente y acceso directo de Expenses a internos de Events.

## Complexity Tracking

No aplica: el diseño no introduce violaciones ni excepciones constitucionales.
