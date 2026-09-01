---

description: "Lista de tareas ejecutables para la implementación del módulo de Gastos y Comprobantes"
---

# Tasks: Gestión de Gastos y Comprobantes

**Input**: Artefactos de diseño de `/specs/015-expenses-management/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/expenses-api-contract.md`, `quickstart.md`).

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/expenses-api-contract.md`, `.specify/memory/constitution.md`.

**Scope**: Backend (`app/server/`) y Frontend (`app/client/`). Conexión funcional completa sin rediseño visual.

**Traceability**:
- **HU-17, HU-18, HU-19, HU-20** → User Story 1 (Fase 3)
- **HU-21** → User Story 2 (Fase 4)
- **HU-26 & Listado** → User Story 3 (Fase 6)
- **HU-27** → User Story 4 (Fase 8)
- **HU-28** → User Story 5 (Fase 8)

---

## Phase 1: Infraestructura y Prerrequisitos Transversales

**Purpose**: Asegurar la posesión atómica del límite transaccional en `ExpenseUnitOfWork` y preparar la estructura base del módulo de gastos.

- [x] T001 Modificar `app/server/app/modules/activity/repositories/activity.py` para eliminar el `self.session.commit()` interno en `create_activity()`, limitándose a `self.session.add(activity)` y `self.session.flush()` para permitir coordinación transaccional externa.
- [x] T002 [P] Crear pruebas de regresión en `app/server/tests/unit/test_activity_service.py` y `app/server/tests/integration/test_event_activity_regression.py` para verificar que `EventService` sigue registrando actividades (`event_created`, `event_updated`, `owner_transferred`) correctamente con su propio commit de Unit of Work tras el cambio en `ActivityRepository`.
- [x] T003 [P] Crear la estructura modular de directorios para `app/server/app/modules/expenses/` (`models/`, `schemas/`, `repositories/`, `services/`, `integrations/`, `routers/`).
- [x] T004 Crear `app/server/app/modules/expenses/repositories/unit_of_work.py` implementando `ExpenseUnitOfWork` con control exclusivo de `commit()` y `rollback()` para los casos de uso de gastos.
- [x] T005 [P] Crear `app/server/app/modules/expenses/integrations/receipt_storage.py` con `ExpenseReceiptStorage` reutilizando las credenciales de Cloudinary de `Settings` para upload seguro (JPEG, PNG, WebP hasta 5 MB) y método `destroy(public_id)` para compensación.

---

## Phase 2: Persistencia y Repositorios

**Purpose**: Definir modelos SQLModel, constraints monetarias, índices, migración Alembic y repositorios con soporte de soft-delete.

- [x] T006 [P] Crear enumeraciones `ExpenseCategory` y `ExpenseSplitType` en `app/server/app/modules/expenses/models/enums.py`.
- [x] T007 [P] Crear el modelo persistente `Expense` en `app/server/app/modules/expenses/models/expense.py` heredando de `BaseModel` con foreign keys (`event.id`, `eventmember.id`), tipos monetarios `NUMERIC(10, 2)` con check `amount > 0`, campos de comprobante opcionales e índices de fecha y pagador.
- [x] T008 [P] Crear el modelo persistente `ExpenseSplit` en `app/server/app/modules/expenses/models/expense_split.py` heredando de `BaseModel` con `UniqueConstraint("expense_id", "member_id")`, foreign keys y `NUMERIC(10, 2)` con check `assigned_amount >= 0`.
- [x] T009 Registrar los modelos `Expense` y `ExpenseSplit` en `app/server/app/db/models.py` para cargarlos en el registro de SQLModel y generar la migración de Alembic en `app/server/alembic/versions/` para las tablas `expense` y `expensesplit`.
- [x] T010 Crear `app/server/app/modules/expenses/repositories/expense_repository.py` con operaciones CRUD (`create`, `get_by_id`, `update`, `soft_delete`, `list_by_event`) excluyendo por defecto registros con `deleted_at IS NOT NULL` y sin ejecutar commits internos.
- [x] T011 Crear `app/server/app/modules/expenses/repositories/expense_split_repository.py` con operaciones de persistencia de cuotas (`create_all`, `list_active_by_expense`, `list_all_by_expense(include_deleted=True)`, `update_all`) sin commits internos.

---

## Phase 3: User Story 1 - Registrar Gasto Manual y División Financiera (Priority: P1) 🎯 MVP

**Goal**: Registrar un gasto manual en un evento abierto con validación de membresías activas, cálculo determinista de cuotas en centavos para división equitativa (**HU-18**), validación estricta de sumas para división exacta (**HU-19**) y categorización (**HU-20**).

**Independent Test**: Registrar un gasto de Bs. 100.00 entre 3 participantes en división equitativa y verificar que se generan cuotas de 33.34, 33.33 y 33.33 que suman exactamente 100.00; probar rechazo inmediato ante suma no coincidente en división exacta.

### Tests for User Story 1
- [x] T012 [P] [US1] Crear pruebas unitarias del algoritmo de cálculo de cuotas en `app/server/tests/unit/test_expense_split_calculator.py` verificando reparto en centavos enteros deterministas (100.00/3, 10.00/6), ordenamiento estable por `member_id`, validación exacta (99.99 vs 100.00 rechazada) y 0 uso de floats.
- [x] T013 [P] [US1] Crear pruebas unitarias de `ExpenseService.create_expense` en `app/server/tests/unit/test_expense_service_create.py` para validación de evento abierto, membresía activa del pagador y participantes, rechazo de participantes duplicados o de otros eventos, y rollback ante fallo.

### Implementation for User Story 1
- [x] T014 [US1] Implementar en `app/server/app/modules/expenses/services/expense_service.py` el método de cálculo de división equitativa en centavos enteros con distribución determinista del residuo y la validación de igualdad estricta para división por montos exactos.
- [x] T015 [US1] Implementar en `app/server/app/modules/expenses/services/expense_service.py` la orquestación de `create_expense`: validar membresías mediante `EventAuthorizationService` y `MemberService`, persistir `Expense` y `ExpenseSplit`, invocar `ActivityService.log_activity("expense_created")` y confirmar mediante `ExpenseUnitOfWork.commit()`.

---

## Phase 4: User Story 2 - Adjuntar y Gestionar Comprobantes de Gasto (Priority: P1)

**Goal**: Permitir adjuntar comprobantes digitales (JPEG/PNG/WebP hasta 5 MB) de forma atómica en creación/edición y soportar reemplazo y eliminación aislada (**HU-21**), con compensación en caso de fallo SQL.

**Independent Test**: Registrar un gasto con comprobante adjunto; simular fallo en base de datos tras subida a Cloudinary y comprobar que se ejecuta `destroy(public_id)` para limpiar el archivo huérfano; simular fallo previo de Cloudinary y comprobar que no se crea ningún registro en BD.

### Tests for User Story 2
- [x] T016 [P] [US2] Crear pruebas unitarias de `ExpenseReceiptStorage` y compensación en `app/server/tests/unit/test_expense_receipt_storage.py` validando formatos permitidos, límite de 5 MB y llamadas al método `destroy`.
- [x] T017 [P] [US2] Crear pruebas de atomicidad en `app/server/tests/unit/test_expense_receipt_atomicity.py` simulando: 1) fallo en Cloudinary antes de persistencia (0 filas en BD), 2) Cloudinary exitoso + fallo en BD (rollback SQL y ejecución de `destroy(public_id)`).

### Implementation for User Story 2
- [x] T018 [US2] Integrar en `ExpenseService.create_expense` y `ExpenseService.update_expense` en `app/server/app/modules/expenses/services/expense_service.py` la secuencia atómica con comprobantes: subida previa a Cloudinary, persistencia SQL y bloque `except` con `ExpenseReceiptStorage.destroy` como acción de compensación ante fallo en BD.
- [x] T019 [US2] Implementar en `ExpenseService` en `app/server/app/modules/expenses/services/expense_service.py` los métodos dedicados `replace_receipt` y `delete_receipt` para actualización o remoción aislada de comprobantes desde la vista de detalle.

---

## Phase 5: Schemas, Inyección de Dependencias y Router REST (API Layer)

**Purpose**: Exponer los contratos REST formales definidos en `contracts/expenses-api-contract.md` mediante schemas Pydantic y endpoints de FastAPI.

- [x] T020 [P] Crear los schemas Pydantic de entrada y salida (`ExpenseCreateRequest`, `ExpenseUpdateRequest`, `ExpenseSplitRequest`, `ExpenseRead`, `ExpenseDetailRead`, `ExpenseSummaryRead`, `ExpenseReceiptRead`) en `app/server/app/modules/expenses/schemas/expense_schemas.py`.
- [x] T021 Crear `app/server/app/modules/expenses/dependencies.py` con la función inyectable `get_expense_service` resolviendo repositorios, `ExpenseUnitOfWork`, `ExpenseReceiptStorage`, `EventAuthorizationService` y `ActivityService`.
- [x] T022 Implementar `app/server/app/modules/expenses/routers/expense_router.py` con los endpoints:
  - `POST /api/events/{event_id}/expenses` (soporte multipart `data` + `file` y JSON plano)
  - `GET /api/events/{event_id}/expenses` (con query param `filter`)
  - `GET /api/expenses/{expense_id}`
  - `PATCH /api/expenses/{expense_id}` (soporte multipart + JSON)
  - `DELETE /api/expenses/{expense_id}`
  - `PUT /api/expenses/{expense_id}/receipt`
  - `DELETE /api/expenses/{expense_id}/receipt`
- [x] T023 Registrar `expense_router` en `create_app()` dentro de `app/server/app/main.py`.
- [x] T024 [P] Crear pruebas de endpoints y contratos en `app/server/tests/api/test_expense_router.py` validando respuestas 201, 200, 204, 401, 403, 404, 422 y códigos uniformes de error.

---

## Phase 6: User Story 3 - Consultar Listado y Detalle con Filtros (Priority: P1)

**Goal**: Consultar los gastos reales del evento con filtros funcionales ("Todos", "Mis gastos", "Gastos de otros") y acceder al detalle completo con desglose de cuotas y comprobante (**HU-26**).

**Independent Test**: Consultar el listado de gastos con cada uno de los 3 filtros comprobando que "Mis gastos" incluye gastos donde el usuario es pagador o participante, "Gastos de otros" incluye solo gastos ajenos y abrir el detalle para verificar el desglose de cuotas.

### Tests for User Story 3
- [x] T025 [P] [US3] Crear pruebas de filtrado en `app/server/tests/unit/test_expense_filters.py` verificando los criterios `all`, `mine` y `others` frente a la membresía del usuario autenticado.
- [x] T026 [P] [US3] Crear pruebas de detalle en `app/server/tests/unit/test_expense_detail.py` comprobando la inclusión de nombres de pagador/creador, cuotas activas asignadas, URL del comprobante y rechazo para usuarios no miembros.

### Implementation for User Story 3
- [x] T027 [US3] Implementar en `ExpenseRepository.list_by_event` y `ExpenseService.list_event_expenses` en `app/server/app/modules/expenses/` la lógica de filtrado SQL para `all`, `mine` (pagador O en splits) y `others` (ni pagador ni en splits) con ordenamiento por `expense_date` descendente.
- [x] T028 [US3] Implementar en `ExpenseService.get_expense_detail` en `app/server/app/modules/expenses/services/expense_service.py` la resolución del detalle completo mapeando nombres de miembros y splits activos.

---

## Phase 7: User Stories 4 & 5 - Edición, Sincronización y Eliminación Lógica (Priority: P2)

**Goal**: Permitir la edición de gastos con sincronización inteligente de `ExpenseSplit` que reutiliza filas soft-deleted evitando colisiones de unicidad (**HU-27**), y la anulación lógica con confirmación explícita y trazabilidad (**HU-28**).

**Independent Test**: Editar un gasto removiendo un participante (pasa a soft-delete) y luego volver a incluirlo en una segunda edición (reutiliza la fila existente sin error de unicidad); anular un gasto y verificar que desaparece del listado activo pero conserva su registro en BD y la actividad `expense_deleted`.

### Tests for User Stories 4 & 5
- [x] T029 [P] [US4] Crear pruebas de sincronización de participaciones en `app/server/tests/unit/test_expense_split_sync.py` cubriendo: permanencia de participante, remoción (soft-delete), reincorporación de participante soft-deleted previo y adición de nuevo participante, comprobando que nunca se violan constraints de unicidad ni se duplican filas.
- [x] T030 [P] [US4] [US5] Crear pruebas de autorización para edición y eliminación en `app/server/tests/unit/test_expense_authorization.py` validando que solo el creador del gasto o el propietario del evento (`Event.user_id`) pueden modificar o anular el gasto en un evento `OPEN`.

### Implementation for User Stories 4 & 5
- [x] T031 [US4] Implementar en `ExpenseService.update_expense` en `app/server/app/modules/expenses/services/expense_service.py` el algoritmo de sincronización de `ExpenseSplit` (actualizar activos, restaurar soft-deleted con `deleted_at=None`, insertar nuevos y marcar soft-delete en excluidos) y el registro de `ActivityService.log_activity("expense_updated")`.
- [x] T032 [US5] Implementar en `ExpenseService.delete_expense` en `app/server/app/modules/expenses/services/expense_service.py` la anulación lógica marcando `deleted_at = datetime.now(UTC)` en `Expense`, registrando la actividad `expense_deleted` y validando permisos de creador/owner.

---

## Phase 8: Integración Frontend (Client & Server APIs)

**Purpose**: Conectar las interfaces existentes en `app/client/src/app/expenses/` con el backend FastAPI mediante servicios tipados y schemas Zod sin rediseño visual.

- [x] T033 [P] Crear los schemas Zod de validación (`expenseCreateSchema`, `expenseUpdateSchema`, `expenseReadSchema`, `expenseDetailSchema`, `expenseSummarySchema`, `expenseReceiptSchema`) en `app/client/src/app/expenses/_schemas/expense-api-schemas.ts`.
- [x] T034 [P] Crear los tipos TypeScript oficiales derivados (`Expense`, `ExpenseDetail`, `ExpenseSummary`, `ExpenseSplit`, `ExpenseCreatePayload`, `ExpenseUpdatePayload`) en `app/client/src/app/expenses/_types/expense.ts`.
- [x] T035 [P] Crear el cliente API de navegador `ExpenseApi` en `app/client/src/app/expenses/_services/expense-api.ts` implementando llamadas con `fetch`, inyección de token JWT, soporte `FormData` para comprobantes y manejo uniforme de errores.
- [x] T036 [P] Crear el cliente API de Server Components `server-expense-api.ts` en `app/client/src/app/expenses/_services/server-expense-api.ts` con funciones cacheadas (`getCachedEventExpenses`, `getCachedExpenseDetail`).
- [x] T037 Conectar `RegisterExpensePage` (`app/client/src/app/expenses/event/[eventId]/create/page.tsx`) y `ExpenseForm` (`app/client/src/app/expenses/_components/expense-form.tsx`) para cargar miembros reales del evento vía `EventApi.getEventMembers`, soportar división equitativa/exacta y enviar datos persistentes con comprobante opcional a `ExpenseApi.createExpense`.
- [x] T038 Adaptar `ExpenseParticipantsSheet` en `app/client/src/app/expenses/_components/expense-participants-sheet.tsx` para recibir la lista de miembros reales del evento y permitir captura de montos asignados cuando la división sea por montos exactos.
- [x] T039 Conectar `ExpensesPage` (`app/client/src/app/expenses/event/[eventId]/page.tsx`) y `ExpensesList` (`app/client/src/app/expenses/event/[eventId]/_components/expenses-list.tsx`) para renderizar gastos reales obtenidos del backend, gestionar filtros interactivos ("Todos", "Mis gastos", "Gastos de otros") y estados vacíos.
- [x] T040 Conectar `ExpenseDetailPage` (`app/client/src/app/expenses/[expenseId]/page.tsx`), `ExpenseDetailView` (`app/client/src/app/expenses/[expenseId]/_components/expense-detail-view.tsx`), `ExpenseSummary` y `ExpenseParticipants` para renderizar datos reales del gasto, cuotas individuales y comprobante real.
- [x] T041 Conectar `ExpenseReceiptSheet` en `app/client/src/app/expenses/[expenseId]/_components/expense-receipt-sheet.tsx` con acciones reales de subida y eliminación de comprobante consumiendo `ExpenseApi.uploadReceipt` y `ExpenseApi.deleteReceipt`.
- [x] T042 Conectar `EditExpensePage` (`app/client/src/app/expenses/[expenseId]/edit/page.tsx`) y la anulación en `ExpenseDetailView` para ejecutar `ExpenseApi.updateExpense` y `ExpenseApi.deleteExpense` con diálogo de confirmación `AlertDialog`.

---

## Phase 9: Pruebas Frontend y Validación de Interfaces

**Purpose**: Probar componentes interactivos, formularios, filtros, accesibilidad y manejo de errores con Sonner en el cliente.

- [x] T043 [P] Actualizar pruebas de formulario en `app/client/src/app/expenses/_components/expense-form.test.tsx` verificando validación de campos obligatorios, selección de modalidad de división, integración con Sheet de participantes y feedback mediante Sonner.
- [x] T044 [P] Crear pruebas de listado y filtros en `app/client/src/app/expenses/event/[eventId]/_components/expenses-list.test.tsx` verificando alternancia entre pestañas ("Mis gastos", "Gastos de otros", "Todos"), estados vacíos y navegación al detalle.
- [x] T045 [P] Crear pruebas de vista de detalle y anulación en `app/client/src/app/expenses/[expenseId]/_components/expense-detail-view.test.tsx` verificando renderizado de cuotas, diálogo accesible de anulación y visualización de comprobantes.

---

## Phase 10: Limpieza, Verificación End-to-End y Validación Final

**Purpose**: Retirar código demo obsoleto, verificar suites completas de pruebas, linters y escenarios de `quickstart.md`.

- [x] T046 Retirar referencias obsoletas a `expense-demo.ts` en componentes y rutas de `app/client/src/app/expenses/`, preservando únicamente utilidades de formato que no dependan de constantes estáticas.
- [x] T047 Ejecutar suite de pruebas backend con `pytest` y linters con `ruff` desde `app/server/` y resolver cualquier discrepancia.
- [x] T048 Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm test` desde `app/client/` y verificar que no existan errores ni advertencias de compilación.
- [x] T049 Ejecutar manualmente los 8 escenarios de validación de `specs/015-expenses-management/quickstart.md` verificando la división determinista de centavos, compensación con Cloudinary, sincronización de splits en edición y soft-delete.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Infraestructura)**: Inicia de inmediato; T001 desbloquea el uso transaccional seguro de `ActivityService`.
- **Phase 2 (Persistencia)**: Depende de Phase 1 (T003-T004) y bloquea los servicios y routers.
- **Phase 3 (User Story 1 - Core)**: Depende de Phase 2; implementa la lógica financiera central.
- **Phase 4 (User Story 2 - Comprobantes)**: Depende de T005 y Phase 3; añade atomicidad con Cloudinary.
- **Phase 5 (API)**: Depende de Phase 3 y Phase 4; expone los endpoints REST.
- **Phase 6 (User Story 3 - Consultas)**: Depende de Phase 5.
- **Phase 7 (User Stories 4 & 5 - Edición/Eliminación)**: Depende de Phase 5.
- **Phase 8 (Frontend Integration)**: Depende de Phase 5, Phase 6 y Phase 7.
- **Phase 9 (Frontend Tests)**: Depende de Phase 8.
- **Phase 10 (Limpieza y Verificación)**: Depende de todas las fases anteriores.

### User Story Dependencies
- **US1 (P1)**: Depende de Phase 1 y Phase 2. Es el MVP Core.
- **US2 (P1)**: Depende de US1 y del componente de storage T005.
- **US3 (P1)**: Depende de US1 y endpoints de lectura.
- **US4 (P2)**: Depende de US1, US2 y la lógica de sincronización de splits.
- **US5 (P2)**: Depende de US1 y la política de soft-delete.

---

## Parallel Opportunities

```bash
# Paralelo en Fase 1 y 2:
Task T002 (Pruebas regresión Activity) en paralelo con T003, T005, T006, T007 y T008.

# Paralelo en Fase 3 y 4 (Tests unitarios):
Task T012 (Cálculo splits) en paralelo con T016 (Storage comprobantes).

# Paralelo en Fase 5 (API Schemas y Tests):
Task T020 (Schemas Pydantic) en paralelo con T024 (Tests de API).

# Paralelo en Fase 8 (Frontend Foundation):
Task T033 (Zod schemas), T034 (Tipos TS), T035 (ExpenseApi) y T036 (Server API).

# Paralelo en Fase 9 (Frontend Tests):
Task T043 (ExpenseForm test), T044 (ExpensesList test) y T045 (ExpenseDetailView test).
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Completar Phase 1 y Phase 2 (Infraestructura, modelos y migración).
2. Completar Phase 3 (Algoritmo de cálculo en centavos y servicio de creación).
3. Completar Phase 5 (Endpoint de creación de gastos).
4. Conectar `ExpenseForm` en frontend y validar creación básica independiente.

### Incremental Delivery
1. **Incremento 1**: MVP Core (HU-17, HU-18, HU-19, HU-20).
2. **Incremento 2**: Comprobantes con atomicidad y compensación Cloudinary (HU-21).
3. **Incremento 3**: Consultas y listados filtrables ("Todos", "Mis gastos", "Gastos de otros") (HU-26).
4. **Incremento 4**: Edición con sincronización de participaciones y anulación lógica (HU-27, HU-28).
5. **Incremento 5**: Frontend conectado al 100%, pruebas exhaustivas y retiro de datos demo.
