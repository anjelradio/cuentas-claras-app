---

description: "Tareas para división de gastos con devolución al pagador"
---

# Tasks: División de gastos con devolución al pagador

**Input**: Design documents from `/specs/017-expense-refund-splits/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/expenses-api.md`, `quickstart.md`

**Tests**: Se incluyen pruebas porque la specification define escenarios verificables y la constitución exige pruebas para invariantes financieras, contratos, atomicidad, autorización y componentes interactivos.

**Organization**: Las tareas se agrupan por historia de usuario para mantener incrementos demostrables y verificables.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo porque modifica archivos distintos y no depende de una tarea incompleta.
- **[Story]**: Relaciona la tarea con una historia de `spec.md`.
- Todas las tareas incluyen rutas concretas del repositorio.

## Phase 1: Setup y línea base

**Purpose**: Confirmar el comportamiento existente antes de cambiar el contrato financiero.

- [X] T001 Ejecutar la línea base backend de gastos en `app/server/tests/unit/test_expense_split_calculator.py`, `app/server/tests/unit/test_expense_service_create.py`, `app/server/tests/unit/test_expense_split_sync.py`, `app/server/tests/unit/test_expense_detail.py` y `app/server/tests/api/test_expense_router.py`, registrando cualquier fallo previo antes de modificar código.
- [X] T002 [P] Ejecutar la línea base frontend en `app/client/src/app/expenses/_components/expense-form.test.tsx`, `app/client/src/app/expenses/_services/expense-api.test.ts`, `app/client/src/app/expenses/event/[eventId]/_components/expenses-list.test.tsx` y `app/client/src/app/expenses/[expenseId]/page.test.tsx`, registrando cualquier fallo previo.

---

## Phase 2: Fundamentos compartidos y migración

**Purpose**: Crear los campos, contratos internos y fronteras arquitectónicas que bloquean todas las historias.

**⚠️ CRITICAL**: Ninguna historia puede completarse hasta terminar esta fase y aplicar la migración.

- [X] T003 [P] Agregar `refund_amount` y `payer_participated` con sus constraints SQLModel al modelo `Expense` en `app/server/app/modules/expenses/models/expense.py`, manteniendo `payer_contribution` como valor derivado y sin cambiar el check histórico de `ExpenseSplit` en `app/server/app/modules/expenses/models/expense_split.py`.
- [X] T004 Crear la migración `app/server/alembic/versions/f4a5b6c7d8e9_add_expense_refund_and_payer_participation.py` con `down_revision = "d3e4f5a6b7c8"`, backfill de participación, soft-delete de splits propios/cero, cálculo de devolución, `NOT NULL` y check `0 <= refund_amount <= amount`.
- [ ] T005 Crear pruebas de upgrade sobre datos históricos y downgrade estructural en `app/server/tests/integration/test_expense_refund_migration.py`, comprobando que no haya hard-delete y que la devolución sea la suma de splits activos de terceros.
- [X] T006 [P] Definir DTOs públicos de contexto de evento/membresía en `app/server/app/modules/events/schemas/expense_context_schemas.py` e implementar la capacidad pública mínima para Expenses en `app/server/app/modules/events/services/expense_context_service.py`.
- [X] T007 Construir la factoría pública del contexto de Events en `app/server/app/modules/events/dependencies.py` y exportarla desde `app/server/app/modules/events/services/__init__.py` sin exponer repositories ni modelos internos.
- [X] T008 Sustituir en `app/server/app/modules/expenses/dependencies.py` la construcción/importación directa de `EventRepository`, `MemberRepository` y modelos de Events por la interfaz pública creada en T006-T007.
- [X] T009 [P] Actualizar los Request/Read de gastos en `app/server/app/modules/expenses/schemas/expense_schemas.py`: retirar `paid_by_member_id` de escritura, agregar `payer_participated`, `refund_amount` y `payer_contribution`, rechazar campos de identidad desconocidos y conservar nombres constitucionales.
- [X] T010 [P] Actualizar contratos Zod y tipos inferidos en `app/client/src/app/expenses/_schemas/expense-api-schemas.ts` y `app/client/src/app/expenses/_types/expense.ts`, haciendo obligatorio `EventMember.id`, retirando `paid_by_member_id` de payloads y agregando los tres campos financieros nuevos a las lecturas.
- [X] T011 Crear una prueba de frontera modular en `app/server/tests/unit/test_expenses_module_boundaries.py` que falle ante imports desde `app.modules.events.repositories` o `app.modules.events.models` dentro de `app/server/app/modules/expenses/`.

**Checkpoint**: Modelo migrado, contratos base disponibles y Expenses desacoplado de internos de Events.

---

## Phase 3: User Story 1 - Gasto equitativo sin deuda propia (Priority: P1) 🎯 MVP

**Goal**: Registrar un gasto equal donde el actor autenticado es el pagador, solo terceros reciben splits y la devolución/aporte conservan el total.

**Independent Test**: Registrar 200.00 Bs. con pagador participante y B/C/D seleccionados; deben existir tres splits de 50.00, devolución 150.00 y aporte 50.00. Con solo B/C, los splits deben sumar 133.33 y el aporte 66.67.

### Tests for User Story 1

> Escribir y ejecutar estas pruebas antes de la implementación; deben demostrar el fallo del comportamiento anterior.

- [ ] T012 [P] [US1] Actualizar pruebas del cálculo equal en `app/server/tests/unit/test_expense_split_calculator.py` para pagador participante/no participante, gasto personal, exclusión de invitados, duplicados y residuos deterministas sin floats.
- [ ] T013 [P] [US1] Actualizar pruebas de creación en `app/server/tests/unit/test_expense_service_create.py` para derivar pagador del JWT, impedir split propio, persistir devolución/participación y rechazar miembros ajenos o inactivos.
- [ ] T014 [P] [US1] Actualizar contratos de creación equal en `app/server/tests/api/test_expense_router.py`, comprobando rechazo de `paid_by_member_id`, respuesta 201 con campos financieros y errores uniformes para distribuciones inválidas.
- [ ] T015 [P] [US1] Crear pruebas del wizard equal en `app/client/src/app/expenses/_components/expense-participants-sheet.test.tsx`, verificando pregunta obligatoria, bloque “Este eres tú”, ausencia del pagador en el paso 2, teclado, selección y resumen reactivo.
- [ ] T016 [P] [US1] Actualizar pruebas del payload equal en `app/client/src/app/expenses/_components/expense-form.test.tsx` y `app/client/src/app/expenses/_services/expense-api.test.ts`, verificando que no se envíen `paid_by_member_id` ni el ID del pagador.

### Implementation for User Story 1

- [ ] T017 [US1] Refactorizar `ExpenseService` en `app/server/app/modules/expenses/services/expense_service.py` para usar el contexto público de Events, derivar creador/pagador del actor autenticado y calcular equal en centavos según `payer_participated` sin producir split propio.
- [ ] T018 [US1] Persistir en `ExpenseService.create_expense` dentro de `app/server/app/modules/expenses/services/expense_service.py` el gasto, `refund_amount`, `payer_participated` y solo splits positivos de terceros bajo un único `ExpenseUnitOfWork`.
- [ ] T019 [US1] Adaptar `app/server/app/modules/expenses/routers/expense_router.py` al nuevo contrato equal para JSON/multipart, dejando al router sin decisiones financieras ni identidad suministrada por cliente.
- [ ] T020 [US1] Convertir `app/client/src/app/expenses/_components/expense-participants-sheet.tsx` en wizard de dos pasos mobile-first, con pagador fijo no seleccionable, lista filtrada de otros miembros, controles shadcn/ui y resumen total/devolución/aporte.
- [ ] T021 [US1] Actualizar el estado y envío equal de `app/client/src/app/expenses/_components/expense-form.tsx` para usar centavos enteros, `payerParticipated`, IDs de terceros y bloqueo accesible durante validación/submit; eliminar el fallback al primer miembro.
- [ ] T022 [US1] Endurecer la resolución del miembro actual en `app/client/src/app/expenses/event/[eventId]/create/page.tsx`, mostrando el estado de error existente si sesión o `EventMember.id` no pueden resolverse y pasando únicamente IDs de membresía válidos al formulario.

**Checkpoint**: US1 funciona de punta a punta y constituye el MVP demostrable.

---

## Phase 4: User Story 2 - Montos exactos para terceros (Priority: P1)

**Goal**: Permitir cuotas exactas positivas de otros miembros, devolución parcial cuando participa el pagador y devolución completa cuando no participa.

**Independent Test**: Para 200.00 Bs. con pagador participante, B=50, C=50 y D=70 debe producir devolución 170.00 y aporte 30.00; una cuota 0 no crea split y una suma superior a 200 se rechaza.

### Tests for User Story 2

- [ ] T023 [P] [US2] Actualizar pruebas exactas en `app/server/tests/unit/test_expense_split_calculator.py` para suma menor/igual al total, pagador no participante con cobertura completa, cuotas cero omitidas, pagador rechazado, negativos y duplicados.
- [ ] T024 [P] [US2] Agregar casos exactos del contrato POST en `app/server/tests/api/test_expense_router.py`, incluyendo devolución 170.00, rechazo por 220.00 y error cuando un pagador no participante deja saldo sin asignar.
- [ ] T025 [P] [US2] Ampliar `app/client/src/app/expenses/_components/expense-participants-sheet.test.tsx` con inputs exclusivos de terceros, cálculo 170/30, validación de cobertura completa y navegación atrás/adelante conservando valores.
- [ ] T026 [P] [US2] Ampliar `app/client/src/app/expenses/_components/expense-form.test.tsx` para comprobar que el payload exact omite cuotas 0.00 y miembros no seleccionados, conserva el formulario ante error y bloquea sumas inválidas.

### Implementation for User Story 2

- [ ] T027 [US2] Implementar normalización/validación exacta en `app/server/app/modules/expenses/services/expense_service.py`: solo terceros activos, montos `> 0`, suma `<= amount` si participa, suma `== amount` si no participa y devolución igual a la suma normalizada.
- [ ] T028 [US2] Implementar en `app/client/src/app/expenses/_components/expense-participants-sheet.tsx` y `app/client/src/app/expenses/_components/expense-form.tsx` la captura exacta de terceros, omisión de ceros, resumen en centavos y mensajes Sonner comprensibles para cada invariante.

**Checkpoint**: US2 puede probarse creando un gasto exacto sin depender de pantallas de lectura nuevas.

---

## Phase 5: User Story 3 - Visualización de total, devolución y cuotas (Priority: P2)

**Goal**: Exponer y mostrar total pagado, devolución esperada, aporte del pagador y splits de terceros en listado y detalle.

**Independent Test**: Consultar un gasto de 200.00/150.00 y verificar en API y UI total 200.00, devolución 150.00, aporte 50.00 y tres deudores de 50.00 sin fila del pagador.

### Tests for User Story 3

- [ ] T029 [P] [US3] Actualizar pruebas de lectura backend en `app/server/tests/unit/test_expense_detail.py` y `app/server/tests/unit/test_expense_filters.py` para devolución, aporte derivado, participación y exclusión del pagador de splits/balances.
- [ ] T030 [P] [US3] Agregar contratos GET de listado/detalle en `app/server/tests/api/test_expense_router.py` con validación de `refund_amount`, `payer_contribution`, `payer_participated` y filtros `all|mine|others`.
- [ ] T031 [P] [US3] Actualizar pruebas Zod/service en `app/client/src/app/expenses/_schemas/expense-api-schemas.test.ts` y `app/client/src/app/expenses/_services/expense-api.test.ts` para respuestas válidas e inválidas con los nuevos campos.
- [ ] T032 [P] [US3] Actualizar pruebas visuales de datos en `app/client/src/app/expenses/event/[eventId]/_components/expenses-list.test.tsx` y `app/client/src/app/expenses/[expenseId]/page.test.tsx` para total, devolución, aporte y deudores.

### Implementation for User Story 3

- [ ] T033 [US3] Mapear los campos financieros y splits activos de terceros en `ExpenseService.list_event_expenses` y `ExpenseService.get_expense_detail` dentro de `app/server/app/modules/expenses/services/expense_service.py`, usando DTOs públicos de Events para nombres.
- [ ] T034 [US3] Actualizar `app/client/src/app/expenses/event/[eventId]/_components/expenses-list.tsx`, `app/client/src/app/expenses/[expenseId]/_components/expense-summary.tsx` y `app/client/src/app/expenses/[expenseId]/_components/expense-participants.tsx` para presentar total, devolución, aporte y deudores con tokens semánticos y estados accesibles.

**Checkpoint**: US3 es verificable por cualquier miembro activo a partir de gastos existentes.

---

## Phase 6: User Story 4 - Edición y recálculo atómico (Priority: P2)

**Goal**: Editar monto, modalidad o participantes restaurando/retirando splits mediante soft-delete y recalculando devolución en la misma transacción.

**Independent Test**: Editar un gasto equal de 200.00 a 120.00 con A/B/C/D como consumidores; deben quedar tres splits de 30.00, devolución 90.00 y aporte 30.00. Si falla una escritura, todo permanece en el estado anterior.

### Tests for User Story 4

- [ ] T035 [P] [US4] Actualizar `app/server/tests/unit/test_expense_split_sync.py` para recalcular devolución, restaurar splits eliminados, eliminar lógicamente cuotas retiradas/cero y garantizar ausencia de split del pagador tras equal/exact.
- [ ] T036 [P] [US4] Crear pruebas de rollback conjunto en `app/server/tests/unit/test_expense_refund_atomicity.py` forzando fallos al actualizar Expense y ExpenseSplit y comprobando conservación del estado previo.
- [ ] T037 [P] [US4] Agregar contratos PATCH en `app/server/tests/api/test_expense_router.py` para reparto completo, pagador inmutable, respuesta 200 recalculada y errores 403/404/422.
- [ ] T038 [P] [US4] Actualizar `app/client/src/app/expenses/[expenseId]/edit/page.test.tsx` y `app/client/src/app/expenses/_components/expense-form.test.tsx` para restaurar `payer_participated`, splits de terceros, exactos, resumen y estado durante submit.

### Implementation for User Story 4

- [ ] T039 [US4] Refactorizar `ExpenseService.update_expense` en `app/server/app/modules/expenses/services/expense_service.py` para recalcular por estrategia, hacer inmutable al pagador y sincronizar Expense/refund/splits con restauración o soft-delete antes del único commit.
- [ ] T040 [US4] Actualizar `app/client/src/app/expenses/[expenseId]/edit/page.tsx` y `app/client/src/app/expenses/_components/expense-form.tsx` para cargar `payer_participated`, excluir al pagador del estado editable, enviar el reparto completo y refrescar/redirigir solo tras respuesta exitosa.

**Checkpoint**: Las cuatro historias funcionan y las correcciones preservan atomicidad y auditoría.

---

## Phase 7: Polish y validación transversal

**Purpose**: Cubrir regresiones, accesibilidad, arquitectura y escenarios end-to-end.

- [ ] T041 [P] Actualizar fixtures/mocks financieros afectados en `app/server/tests/unit/test_expense_authorization.py`, `app/server/tests/unit/test_expense_receipt_atomicity.py` y `app/client/src/app/expenses/_types/expense-demo.test.ts` para el nuevo contrato sin agregar estados de pago fuera de alcance.
- [ ] T042 [P] Documentar en español las decisiones no evidentes de centavos, participación y soft-delete en `app/server/app/modules/expenses/services/expense_service.py` y `app/client/src/app/expenses/_components/expense-participants-sheet.tsx`, evitando comentarios triviales.
- [ ] T043 Ejecutar todas las pruebas y controles backend sobre `app/server/` (`pytest` y `ruff check .`) y corregir regresiones de gastos, Events, actividades, comprobantes y JWT.
- [ ] T044 [P] Ejecutar todas las verificaciones frontend sobre `app/client/` (`pnpm test`, `pnpm lint` y `pnpm build`) y corregir errores de tipos, Zod, accesibilidad y renderizado responsive.
- [ ] T045 Ejecutar manualmente los escenarios de `specs/017-expense-refund-splits/quickstart.md` y verificar que los contratos observados coincidan con `specs/017-expense-refund-splits/contracts/expenses-api.md` sin modificar los artefactos durante `$speckit-implement`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: Sin dependencias; establece la línea base.
- **Phase 2**: Depende de Phase 1 y bloquea todas las historias.
- **US1 / Phase 3**: Depende de Phase 2 y constituye el MVP.
- **US2 / Phase 4**: Depende de la canalización de creación de US1; sus pruebas de cálculo/UI pueden prepararse en paralelo con US1.
- **US3 / Phase 5**: Depende de Phase 2 y puede desarrollarse en paralelo con US1/US2 usando fixtures persistidos; la validación integrada requiere al menos un gasto creado.
- **US4 / Phase 6**: Depende de los algoritmos equal/exact de US1 y US2.
- **Phase 7**: Depende de todas las historias incluidas en la entrega.

### User Story Dependencies

```text
Foundation
├── US1 Equal (MVP)
│   └── US2 Exact
├── US3 Lectura
└── US1 + US2 ──> US4 Edición atómica

US1 + US2 + US3 + US4 ──> Polish
```

### Within Each User Story

- Escribir y ejecutar primero las pruebas de la historia para demostrar el comportamiento faltante.
- Completar cálculo/servicio backend antes del endpoint.
- Completar contrato/Zod antes de conectar componentes.
- Mantener un único commit por mutación completa.
- Validar el checkpoint independiente antes de pasar a la siguiente historia dependiente.

### Parallel Opportunities

- T001 y T002 pueden ejecutarse en paralelo.
- T003, T006, T009 y T010 trabajan en archivos distintos; T004 espera a T003 y T007 espera a T006.
- Las pruebas T012-T016 pueden prepararse en paralelo.
- T023-T026 pueden prepararse en paralelo.
- US3 puede desarrollarse en paralelo con US1/US2 después de Phase 2.
- T035-T038 pueden prepararse en paralelo.
- T043 y T044 pueden ejecutarse en paralelo una vez terminado el código.

---

## Parallel Examples

### User Story 1

```text
Task T012: pruebas de cálculo equal backend
Task T014: pruebas de contrato POST
Task T015: pruebas del wizard equal
Task T016: pruebas del payload frontend
```

### User Story 2

```text
Task T023: pruebas exactas backend
Task T024: contrato exact POST
Task T025: interacción exact del Sheet
Task T026: payload exact del formulario
```

### User Story 3

```text
Task T029: lecturas unitarias backend
Task T030: contratos GET
Task T031: schemas y service frontend
Task T032: listado y detalle visual
```

### User Story 4

```text
Task T035: sincronización de splits
Task T036: rollback financiero
Task T037: contrato PATCH
Task T038: restauración del formulario edit
```

---

## Implementation Strategy

### MVP First

1. Completar Phase 1 y Phase 2.
2. Implementar y probar US1 de extremo a extremo.
3. Detenerse en el checkpoint con equal: 200.00 → devolución 150.00 → aporte 50.00 → cero split propio.
4. Demostrar el MVP antes de incorporar exact, lectura ampliada o edición.

### Incremental Delivery

1. **Incremento 1**: identidad segura, migración y equal (US1).
2. **Incremento 2**: cuotas exactas y omisión de ceros (US2).
3. **Incremento 3**: transparencia en listado/detalle (US3).
4. **Incremento 4**: edición y recálculo atómico (US4).
5. **Cierre**: regresiones, arquitectura, accesibilidad y quickstart.

## Notes

## Phase 8: Convergence

Hallazgos detectados al comparar la implementación con la specification, el plan, las
tareas y la constitución después de la pasada de implementación.

- [X] T046 Crear pruebas de upgrade y downgrade para `app/server/alembic/versions/f4a5b6c7d8e9_add_expense_refund_and_payer_participation.py` en `app/server/tests/integration/test_expense_refund_migration.py`, verificando backfill, soft-delete y devolución derivada (HIGH; T005/FR-005; missing).
- [ ] T047 Reparar el fixture HTTP de `app/server/tests/api/test_expense_router.py` que queda bloqueado en el primer request y completar los contratos POST/GET/PATCH equal y exact, incluyendo rechazo de identidad suministrada y campos financieros (HIGH; T014/T024/T030/T037; partial).
- [X] T048 Crear `app/client/src/app/expenses/_components/expense-participants-sheet.test.tsx` para cubrir el wizard, la pregunta obligatoria de participación, exclusión del pagador, cuotas exactas, resumen reactivo y payload sin el ID del pagador (HIGH; T015/T025/T026; missing).
- [X] T049 Crear `app/server/tests/unit/test_expense_refund_atomicity.py` y forzar fallos en Expense y ExpenseSplit para demostrar rollback conjunto y conservación del estado anterior (HIGH; T036/FR-010; missing).
- [X] T050 Corregir el prefill de `app/client/src/app/expenses/_components/expense-form.tsx` para que no actualice estado síncronamente dentro de un effect y deje el archivo sin errores de lint (MEDIUM; Constitución III/T044; partial).
- [ ] T051 Diagnosticar y corregir la imposibilidad de `pnpm build` de parsear `tsc --showConfig`, y resolver los errores de lint introducidos o bloqueantes del feature en `app/client/` y `app/server/` (MEDIUM; T043/T044/Constitución III; partial).

- No instalar nuevas dependencias.
- No crear estados `pending|paid|cancelled` en esta feature.
- No aceptar identidad del pagador desde el cliente.
- No realizar hard-delete de ExpenseSplit.
- No modificar archivos bajo `specs/` durante `$speckit-implement`; T045 solo los usa como guía de validación.
