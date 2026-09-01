# Implementation Plan: Gestión de Gastos y Comprobantes

**Branch**: `[015-expenses-management]` | **Date**: 2026-08-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification de `/specs/015-expenses-management/spec.md` y base visual de `/specs/011-expenses-interfaces/`.

## Summary

Implementar la capacidad funcional completa del módulo de Gastos y Comprobantes de Cuentas Claras (**HU-17, HU-18, HU-19, HU-20, HU-21, HU-26, HU-27, HU-28**), conectando las interfaces visuales existentes en `app/client/src/app/expenses/` con un backend modular en `app/server/app/modules/expenses/` sobre FastAPI, persistencia en PostgreSQL con SQLModel/Alembic, almacenamiento de comprobantes en Cloudinary con atomicidad funcional y compensación, algoritmo de división equitativa en centavos enteros deterministas, sincronización inteligente de `ExpenseSplit` que respeta la restricción única de participantes y auditoría transversal en `ActivityService` con posesión centralizada del límite transaccional en `ExpenseUnitOfWork`.

---

## Technical Context

**Language/Version**: Python 3.12 (Backend) y TypeScript 5 / React 19 (Frontend).

**Primary Dependencies**: 
- *Backend*: FastAPI, SQLModel, SQLAlchemy 2, Pydantic v2, Alembic, Cloudinary SDK, PyJWT (EdDSA/JWKS).
- *Frontend*: Next.js 16 (App Router), Tailwind CSS 4, shadcn/ui, Zod, Sonner, Lucide React.

**Storage**: PostgreSQL con tablas `expense` y `expensesplit` heredando de `BaseModel` (con UUID, marcas temporales y `deleted_at`). Cloudinary para comprobantes digitales (JPEG/PNG/WebP hasta 5 MB).

**Testing**: Pytest para backend (unit tests de cálculo y compensación, integration tests de repositories y API tests con TestClient). Vitest y Testing Library para frontend.

**Target Platform**: Web responsive (móvil y escritorio).

**Project Type**: Monorepo con separación modular en `app/client/` y `app/server/`.

**Performance Goals**: Listado y detalle de gastos con respuesta < 150 ms en condiciones normales.

**Constraints**:
- 0 uso de `float` en cálculos o persistencia monetaria (`Decimal` y `Numeric(10, 2)`).
- Reparto determinista de centavos residuales ordenado por `member_id`.
- Soft-delete obligatorio en cancelaciones de gastos y remociones de participaciones.
- Sincronización de splits que reutiliza filas soft-deleted evitando violar `UniqueConstraint("expense_id", "member_id")`.
- Transacciones atómicas: `ActivityRepository` no realiza commit propio; `ExpenseUnitOfWork` posee el único commit del caso de uso.
- Consistencia con Cloudinary mediante secuencia: Upload → SQL → Compensación `destroy` en caso de fallo SQL.
- Preservar diseño e interfaces de `011-expenses-interfaces` sin rediseño visual.

**Scale/Scope**: Módulo de gastos para eventos grupales con hasta decenas de participantes y cientos de transacciones por evento.

---

## Constitution Check (Evaluación Completa Principios I a XXX)

*GATE: Evaluación frente a todos los principios de `.specify/memory/constitution.md`*

| Principio | Nombre | Estado | Justificación y Aplicación en este Diseño |
|---|---|---|---|
| **I** | Monorepo y separación | **CUMPLE** | Código distribuido estrictamente en `app/client/` y `app/server/`. Backend es la fuente de verdad. |
| **II** | Simplicidad y excepciones | **CUMPLE** | Sin librerías adicionales ni tablas accesorias. Comprobante integrado en `Expense`. |
| **III** | Calidad y pruebas | **CUMPLE** | Pruebas unitarias para centavos, integración de repositorios, regresión de Activity y UI. |
| **IV** | Arquitectura modular backend | **CUMPLE** | Monolito modular bajo `app/server/app/modules/expenses/` con estructura canónica. |
| **V** | Dirección de dependencias | **CUMPLE** | Router → Service → Repository → Base de datos estrictamente. |
| **VI** | Responsabilidad de Routers | **CUMPLE** | Routers limitados a HTTP, schemas `*Request`/`*Read` e inyección de dependencias. |
| **VII** | Responsabilidad de Services | **CUMPLE** | `ExpenseService` concentra reglas financieras, autorización y orquestación transaccional. |
| **VIII** | Responsabilidad de Repositories | **CUMPLE** | Persistencia SQLModel/SQLAlchemy encapsulada; consultas filtran `deleted_at IS NULL`. |
| **IX** | SQLModel, BaseModel y Alembic | **CUMPLE** | `Expense` y `ExpenseSplit` heredan `BaseModel`, registrados en `db/models.py` y migrados con Alembic. |
| **X** | Transacciones atómicas | **CUMPLE** | `ExpenseUnitOfWork` posee el commit exclusivo. `ActivityRepository.create_activity()` se actualiza para no hacer commit propio. |
| **XI** | Encapsulación entre módulos | **CUMPLE** | Consumo de Events y Activity vía servicios públicos (`EventAuthorizationService`, `ActivityService`). |
| **XII** | Schemas del backend | **CUMPLE** | Sufijos `*Request` y `*Read`; sin exponer modelos de base de datos directamente. |
| **XIII** | Autenticación Better Auth / JWT | **CUMPLE** | Identidad validada mediante header `Bearer <jwt>` con JWKS EdDSA sin confiar en body. |
| **XIV** | Autorización contextual | **CUMPLE** | Permisos calculados en tiempo de ejecución (creador o `Event.user_id`, evento abierto). |
| **XV** | Manejo centralizado de errores | **CUMPLE** | Lanza excepciones de dominio (`ValidationError`, `ForbiddenError`, `NotFoundError`). |
| **XVI** | Integridad financiera | **CUMPLE** | 0 uso de `float`; uso estricto de `Decimal` y reparto determinista de centavos. |
| **XVII** | Pruebas del backend | **CUMPLE** | Pruebas planificadas para invariantes, rollback, soft-delete, eventos cruzados y compensación. |
| **XVIII** | Arquitectura frontend | **CUMPLE** | Ubicación en `app/client/src/app/expenses/` con `_services`, `_schemas`, `_types`. |
| **XIX** | Dependencias frontend | **CUMPLE** | Page → Components → Services → API Client → Backend. |
| **XX** | Server y Client Components | **CUMPLE** | Pages como Server Components; `"use client"` limitado a interactividad requerida. |
| **XXI** | Services y contratos frontend | **CUMPLE** | Funciones camelCase (`createExpense`, `getExpenseDetail`), errores tipados. |
| **XXII** | Schemas Zod en frontend | **CUMPLE** | Schemas `*Schema` para validar respuestas API y datos de entrada. |
| **XXIII** | Manejo seguro de JWT | **CUMPLE** | Token obtenido en backend/proxy Next.js sin almacenamiento inseguro en el cliente. |
| **XXIV** | shadcn/ui, Tailwind y Lucide | **CUMPLE** | Reutiliza componentes UI, tokens semánticos y Lucide React exclusivamente. |
| **XXV** | Stitch como referencia visual | **CUMPLE** | Preserva la composición visual ya convertida de Stitch sin duplicar estilos. |
| **XXVI** | Mobile-first y responsive | **CUMPLE** | Formularios, listas y sheets verificados para móvil y escritorio. |
| **XXVII** | Estados y Sonner | **CUMPLE** | Manejo de loading/empty/error; notificaciones de error y éxito mediante Sonner. |
| **XXVIII** | Documentación en español | **CUMPLE** | Toda la documentación, comentarios y artefactos generados en español. |
| **XXIX** | Nombres del frontend | **CUMPLE** | Archivos en `kebab-case`, componentes en `PascalCase`, funciones en `camelCase`. |
| **XXX** | Pruebas y accesibilidad front | **CUMPLE** | Controles con labels accesibles, foco visible, teclado y pruebas de interacción. |

**Resultado Constitucional**: PASS (0 violaciones).

---

## Project Structure

### Documentation (`specs/015-expenses-management/`)

```text
specs/015-expenses-management/
├── spec.md                  # Especificación funcional aprobada (Gate 1)
├── plan.md                  # Plan técnico de implementación (este archivo)
├── research.md              # Decisiones de atomicidad, ActivityLog y sincronización de splits
├── data-model.md            # Esquema de datos, tablas, enumeraciones y constraints
├── contracts/
│   └── expenses-api-contract.md  # Contrato formal OpenAPI/REST (multipart + JSON)
├── checklists/
│   └── requirements.md      # Checklist de validación de requisitos
└── quickstart.md            # Guía de validación y pruebas de extremo a extremo
```

### Source Code

```text
app/server/app/
├── db/
│   └── models.py                                # [MODIFY] Registrar Expense y ExpenseSplit para Alembic
├── main.py                                      # [MODIFY] Registrar expense_router en create_app()
└── modules/
    ├── activity/
    │   └── repositories/
    │       └── activity.py                      # [MODIFY] Eliminar session.commit() interno en create_activity()
    └── expenses/                                # [NEW] Nuevo módulo modular de Gastos
        ├── __init__.py
        ├── dependencies.py                      # Inyección de dependencias (get_expense_service)
        ├── models/
        │   ├── __init__.py
        │   ├── enums.py                         # ExpenseCategory, ExpenseSplitType
        │   ├── expense.py                       # Modelo persistente Expense (hereda BaseModel)
        │   └── expense_split.py                 # Modelo persistente ExpenseSplit (hereda BaseModel)
        ├── schemas/
        │   ├── __init__.py
        │   └── expense_schemas.py               # ExpenseCreateRequest, ExpenseUpdateRequest, ExpenseRead, ExpenseDetailRead, ExpenseSummaryRead
        ├── repositories/
        │   ├── __init__.py
        │   ├── expense_repository.py            # Consultas con filtro soft-delete y por evento/usuario
        │   ├── expense_split_repository.py      # Persistencia y sincronización de cuotas (soporte include_deleted)
        │   └── unit_of_work.py                  # ExpenseUnitOfWork (posesión exclusiva del commit)
        ├── services/
        │   ├── __init__.py
        │   └── expense_service.py               # Lógica financiera, sincronización de splits, Cloudinary y ActivityLog
        ├── integrations/
        │   ├── __init__.py
        │   └── receipt_storage.py               # Almacenamiento y compensación de comprobantes en Cloudinary
        └── routers/
            ├── __init__.py
            └── expense_router.py                # Endpoints REST (multipart/form-data + JSON)

app/client/src/app/expenses/
├── layout.tsx                                   # Layout autenticado compartido
├── _services/                                   # [NEW] Servicios de consumo API
│   ├── expense-api.ts                           # Cliente API de navegador (FormData / JSON)
│   └── server-expense-api.ts                    # Cliente API de Server Components
├── _schemas/                                    # [NEW] Validación Zod
│   └── expense-api-schemas.ts                   # Schemas Zod para respuestas y payloads
├── _types/
│   ├── expense.ts                               # [NEW] Tipos TypeScript oficiales para gastos y splits
│   └── expense-demo.ts                          # Preservado transitoriamente hasta completar migración
├── _components/
│   ├── expense-form.tsx                         # [MODIFY] Conectar submit atómico (gasto + comprobante) con ExpenseApi
│   ├── expense-form.test.tsx                    # [MODIFY] Actualizar pruebas de formulario con mocks de API
│   └── expense-participants-sheet.tsx           # [MODIFY] Soportar miembros dinámicos del evento e inputs de montos exactos
├── event/[eventId]/
│   ├── page.tsx                                 # [MODIFY] Server Component que carga gastos reales del evento
│   ├── create/page.tsx                          # [MODIFY] Obtiene miembros reales del evento para el formulario
│   └── _components/
│       └── expenses-list.tsx                    # [MODIFY] Conectar listado real, filtros dinámicos y enlaces
└── [expenseId]/
    ├── page.tsx                                 # [MODIFY] Server Component que resuelve el detalle real con getCachedExpenseDetail
    ├── edit/page.tsx                            # [MODIFY] Carga gasto y miembros reales en ExpenseForm
    └── _components/
        ├── expense-detail-view.tsx              # [MODIFY] Conectar anulación real (DELETE) y comprobante real
        ├── expense-summary.tsx                  # [MODIFY] Mostrar datos reales y enlace a comprobante
        ├── expense-participants.tsx             # [MODIFY] Mostrar cuotas reales asignadas sin estados de pago
        └── expense-receipt-sheet.tsx            # [MODIFY] Carga de imagen real desde Cloudinary y acciones de upload/delete
```

---

## Strategy & Implementation Phases

### Fase 1: Persistencia, Repositorios y Corrección Transversal de Activity
1. Crear enumeraciones (`ExpenseCategory`, `ExpenseSplitType`) y modelos (`Expense`, `ExpenseSplit`).
2. Registrar modelos en `app/server/app/db/models.py` y generar migración de Alembic.
3. Actualizar `ActivityRepository.create_activity()` para eliminar el `self.session.commit()` interno, ejecutando `self.session.add(activity)` y `self.session.flush()`.
4. Implementar `ExpenseReceiptStorage` con métodos `upload_receipt` y acción de compensación `destroy`.
5. Implementar `ExpenseRepository`, `ExpenseSplitRepository` (con soporte para `list_all_by_expense(include_deleted=True)`) y `ExpenseUnitOfWork`.

### Fase 2: Lógica de Negocio, Sincronización de Splits y Servicios
1. Implementar `ExpenseService`:
   - Algoritmo de división equitativa determinista en centavos enteros (**HU-18**).
   - Algoritmo de sincronización de `ExpenseSplit` en edición: actualización de activos, reutilización de soft-deleted para reincorporaciones y soft-delete de removidos (**HU-27**).
   - Orquestación atómica con comprobantes: Upload → SQL persistencia → Rollback con compensación `destroy` si SQL falla.
   - Posesión del commit en `ExpenseUnitOfWork`.
   - Integración con `ActivityService.log_activity()` (`expense_created`, `expense_updated`, `expense_deleted`).
2. Implementar `expense_router` con soporte multipart/JSON y registrarlo en `main.py`.
3. Escribir pruebas unitarias, de integración, de regresión para `Events`/`Activity`, de compensación de Cloudinary y de sincronización de splits.

### Fase 3: Integración Frontend (Client & Server APIs)
1. Definir schemas Zod (`expense-api-schemas.ts`) y tipos TypeScript (`expense.ts`).
2. Crear clientes de API `expense-api.ts` y `server-expense-api.ts` con soporte para envío de FormData/JSON.
3. Conectar `RegisterExpensePage` y `ExpenseForm` con carga de miembros reales del evento y guardado atómico con comprobante (**HU-17, HU-18, HU-19, HU-20, HU-21**).
4. Adaptar `ExpenseParticipantsSheet` para admitir tanto exclusión en reparto equitativo como captura de montos en división exacta.

### Fase 4: Listado, Detalle, Comprobantes y Acciones Reales
1. Conectar `ExpensesList` con el endpoint de gastos del evento y filtros interactivos (**HU-26**).
2. Conectar `ExpenseDetailPage` y `ExpenseDetailView` con datos reales de `GET /api/expenses/{expenseId}`.
3. Conectar reemplazo y eliminación de comprobantes en `ExpenseReceiptSheet` (**HU-21**).
4. Conectar edición (`EditExpensePage`) y eliminación lógica con diálogo de confirmación (`DELETE /api/expenses/{expenseId}`) (**HU-27, HU-28**).

### Fase 5: Validación, Calidad y Limpieza
1. Validar todos los escenarios de `quickstart.md`.
2. Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm test` en frontend.
3. Ejecutar `pytest` y `ruff` en backend.
4. Retirar dependencias y código obsoleto de `expense-demo.ts`.

---

## Complexity Tracking

*No se detectaron violaciones constitucionales que requieran justificación.*

---

## Constitution Check (Post-Design)

**Resultado posterior al diseño**: PASS.
- El 100% de los 30 principios constitucionales se cumple rigurosamente.
- La posesión del límite transaccional en `ExpenseUnitOfWork` y la eliminación del commit en `ActivityRepository` garantizan la atomicidad exigida por el Principio X.
- La sincronización de participaciones previene colisiones con `UniqueConstraint("expense_id", "member_id")` preservando el historial de auditoría.
- La atomicidad funcional con comprobantes (FR-010) queda resuelta de forma transparente y verificable.
