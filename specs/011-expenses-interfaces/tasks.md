---

description: "Tareas ejecutables para las interfaces estáticas de Expenses"
---

# Tasks: Interfaces de gastos

**Input**: Artefactos de diseño de `/specs/011-expenses-interfaces/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/expense-ui-contract.md` y `quickstart.md`.

**Scope**: Solo `app/client/`. No modificar backend, persistencia, API ni documentación fuera de los artefactos de esta feature.

**Tests**: Se incluyen por los requisitos explícitos de pruebas, accesibilidad y comportamientos interactivos de la specification y la constitución.

## Phase 1: Setup

**Purpose**: Confirmar los patrones existentes y preparar el espacio exclusivo de la funcionalidad.

- [X] T001 Revisar los componentes existentes `app/client/src/components/ui/`, `app/client/src/components/custom/`, `app/client/src/app/(event)/_components/event-form.tsx` y `app/client/src/app/home/_components/add-expense-sheet.tsx` para reutilizar sus contratos y estilos antes de crear código de Expenses.
- [X] T002 Crear la estructura de rutas y directorios privados definida en `app/client/src/app/(event)/[eventId]/expenses/` y `app/client/src/app/(event)/_components/`, sin crear rutas fuera de la frontera `(event)`.

---

## Phase 2: Foundational

**Purpose**: Definir los datos estáticos y los contratos de presentación compartidos por todas las vistas.

**⚠️ CRITICAL**: Completar esta fase antes de comenzar cualquier historia de usuario.

- [X] T003 Crear tipos de presentación para gasto, categoría, participante, estado de pago y filtro en `app/client/src/app/(event)/_types/expense-demo.ts` conforme a `specs/011-expenses-interfaces/data-model.md`.
- [X] T004 Crear constantes tipadas de categorías, participantes, gastos y evento demo en `app/client/src/app/(event)/_types/expense-demo.ts`, incluyendo selectores locales por `eventId` y `expenseId` sin llamadas de red.
- [X] T005 [P] Crear pruebas de las constantes y selectores demo, incluidos gasto inexistente y gasto de otro evento, en `app/client/src/app/(event)/_types/expense-demo.test.ts`.

**Checkpoint**: La fuente de datos local permite componer todas las rutas sin backend ni datos duplicados.

---

## Phase 3: User Story 1 - Registrar un gasto (Priority: P1) 🎯 MVP

**Goal**: Permitir revisar y completar un formulario visual de gasto, seleccionar participantes y terminar en un resultado demostrativo claro.

**Independent Test**: Abrir `/[eventId]/expenses/register`, completar campos, cambiar categoría, excluir participantes en el Sheet y confirmar que se comunica que no se guardó información real.

### Tests for User Story 1

- [X] T006 [P] [US1] Crear pruebas de validación visible, categorías, selección de participantes, cancelación y toast demostrativo en `app/client/src/app/(event)/_components/expense-form.test.tsx`.
- [X] T007 [P] [US1] Crear pruebas de composición de las rutas create/edit y sus valores iniciales en `app/client/src/app/(event)/[eventId]/expenses/register/page.test.tsx` y `app/client/src/app/(event)/[eventId]/expenses/[expenseId]/edit/page.test.tsx`.

### Implementation for User Story 1

- [X] T008 [US1] Crear el formulario reutilizable `ExpenseForm` en `app/client/src/app/(event)/_components/expense-form.tsx` con documentación en español, props de modo create/edit, etiquetas accesibles, categorías, concepto, descripción, importe, fecha, pagador y comprobante visual.
- [X] T009 [US1] Implementar en `app/client/src/app/(event)/_components/expense-form.tsx` los estados interactivos fieles a `design/event/expenses/register-expense.html`, reutilizando tokens y convenciones de inputs de Event Form/login sin replicar hexadecimales existentes.
- [X] T010 [US1] Añadir al formulario el Sheet de shadcn/ui para excluir/incluir participantes, con checkboxes, foco y teclado, y confirmar mediante Sonner que registrar o editar aún es demostrativo en `app/client/src/app/(event)/_components/expense-form.tsx`.
- [X] T011 [US1] Crear la página de registro en `app/client/src/app/(event)/[eventId]/expenses/register/page.tsx`, pasando el evento demo y `mode="create"` a `ExpenseForm`.
- [X] T012 [US1] Crear la página de edición en `app/client/src/app/(event)/[eventId]/expenses/[expenseId]/edit/page.tsx`, resolviendo el gasto demo o usando `notFound()` y pasando `mode="edit"` a `ExpenseForm`.
- [X] T013 [US1] Verificar en `app/client/src/app/(event)/_components/expense-form.tsx` que cancelar vuelve a la vista anterior sin mutar los datos demo y que todos los errores recuperables usan un toast claro.

**Checkpoint**: Registro y edición comparten una sola interfaz, son accesibles y no realizan persistencia.

---

## Phase 4: User Story 2 - Consultar gastos del evento (Priority: P1)

**Goal**: Mostrar una lista fiel a Stitch con filtros de gastos propios, de otros y todos, enlazando cada elemento a su detalle.

**Independent Test**: Abrir `/[eventId]/expenses`, alternar los tres filtros, comprobar el indicador activo, el estado vacío y la navegación de una tarjeta al detalle.

### Tests for User Story 2

- [X] T014 [P] [US2] Crear pruebas de filtros, estado vacío, nombres accesibles y enlaces de tarjetas en `app/client/src/app/(event)/[eventId]/expenses/page.test.tsx`.

### Implementation for User Story 2

- [X] T015 [US2] Implementar la página de listado en `app/client/src/app/(event)/[eventId]/expenses/page.tsx` con componente cliente privado para filtros y tarjetas, conservando la page como frontera de ruta.
- [X] T016 [US2] Implementar en `app/client/src/app/(event)/[eventId]/expenses/page.tsx` la navegación “Mis gastos”, “Gastos de otros” y “Todos”, indicando semánticamente el filtro activo y usando los selectores locales.
- [X] T017 [US2] Implementar las tarjetas de gasto privadas e iteradas en `app/client/src/app/(event)/[eventId]/expenses/page.tsx`, mostrando icono Lucide o emoji de categoría, concepto, categoría, importe, estado textual y enlace a `[expenseId]/detail`.
- [X] T018 [US2] Añadir el estado vacío responsive y accesible en `app/client/src/app/(event)/[eventId]/expenses/page.tsx`, con acción para volver al filtro con resultados.
- [ ] T019 [US2] Ajustar `app/client/src/app/expenses/event/[eventId]/` contra `design/event/expenses.html` en móvil y escritorio, usando solo tokens y componentes existentes cuando correspondan.

**Checkpoint**: El listado funciona independientemente con datos locales, filtros visibles y enlaces de detalle correctos.

---

## Phase 5: User Story 3 - Consultar el detalle de un gasto (Priority: P2)

**Goal**: Mostrar el resumen, comprobante, participantes y acciones visuales del detalle de un gasto sin ejecutar operaciones financieras.

**Independent Test**: Abrir `/[eventId]/expenses/[expenseId]/detail`, revisar participantes y estado propio, recorrer el Sheet de pago y confirmar anulación; abrir un ID inválido y obtener not found.

### Tests for User Story 3

- [X] T020 [P] [US3] Crear pruebas del resumen, estados pagado/pendiente, Sheet de saldar, AlertDialog de anulación y toast demostrativo en `app/client/src/app/(event)/[eventId]/expenses/[expenseId]/detail/page.test.tsx`.
- [X] T021 [P] [US3] Crear prueba de identificador inexistente y evento no coincidente para la ruta de detalle en `app/client/src/app/(event)/[eventId]/expenses/[expenseId]/detail/page.test.tsx`.

### Implementation for User Story 3

- [X] T022 [P] [US3] Crear el resumen con icono, categoría, importe, fecha, pagador, comprobante opcional y enlaces de acción en `app/client/src/app/(event)/[eventId]/expenses/[expenseId]/detail/_components/expense-summary.tsx`.
- [X] T023 [P] [US3] Crear el listado accesible de participantes y sus estados textuales de pago en `app/client/src/app/(event)/[eventId]/expenses/[expenseId]/detail/_components/expense-participants.tsx`.
- [X] T024 [P] [US3] Crear el Sheet de pasos para “Saldar mi parte”, con métodos visuales, navegación interna y toast demostrativo, en `app/client/src/app/(event)/[eventId]/expenses/[expenseId]/detail/_components/settle-expense-sheet.tsx`.
- [X] T025 [US3] Crear la página de detalle en `app/client/src/app/(event)/[eventId]/expenses/[expenseId]/detail/page.tsx`, resolver el gasto por evento e identificador y llamar `notFound()` cuando no exista.
- [X] T026 [US3] Integrar resumen, participantes y Sheet en `app/client/src/app/(event)/[eventId]/expenses/[expenseId]/detail/page.tsx`, y añadir el AlertDialog accesible para anular con feedback demostrativo sin modificar las constantes.
- [ ] T027 [US3] Ajustar las secciones del detalle en `app/client/src/app/expenses/[expenseId]/` contra `design/event/expenses/expense-detail.html`, reemplazando todos los iconos de Stitch por lucide-react y verificando móvil/escritorio.

**Checkpoint**: El detalle presenta la información y las acciones de Stitch sin acceder a backend ni alterar datos financieros.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificar fidelidad, accesibilidad, calidad y límites de la feature.

- [X] T028 [P] Revisar documentación breve en español, nombres kebab-case, props tipadas y eliminación de estilos o colores duplicados en todos los archivos nuevos bajo `app/client/src/app/(event)/`.
- [ ] T029 [P] Revisar los tres diseños de referencia frente a las rutas implementadas: `design/event/expenses.html`, `design/event/expenses/register-expense.html` y `design/event/expenses/expense-detail.html`, corrigiendo diferencias visuales dentro de `app/client/src/app/expenses/`.
- [X] T030 Ejecutar `pnpm lint` desde `app/client/` y corregir los errores de los archivos de Expenses.
- [X] T031 Ejecutar `pnpm typecheck` desde `app/client/` y corregir errores de tipos de Expenses.
- [X] T032 Ejecutar `pnpm test` desde `app/client/` y corregir fallos de las pruebas de Expenses.
- [ ] T033 Ejecutar los escenarios de `specs/011-expenses-interfaces/quickstart.md`, verificando rutas, teclado, foco visible, ausencia de scroll horizontal y que ninguna interacción genere llamadas de red.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: inicia de inmediato.
- **Phase 2**: depende de T001-T002 y bloquea las historias.
- **US1 y US2**: pueden desarrollarse en paralelo después de T003-T005, aunque ambas reutilizan los mismos datos demo.
- **US3**: depende de T003-T005; sus enlaces de edición y coherencia visual se validan mejor después de US1 y US2, por lo que se ejecuta secuencialmente en esta feature.
- **Polish**: depende de las tres historias.

### User Story Dependencies

- **US1 (P1)**: depende únicamente de la base de datos de presentación local.
- **US2 (P1)**: depende únicamente de la base de datos de presentación local.
- **US3 (P2)**: depende de la base local; usa rutas de edición de US1 y enlaces desde US2 como integración visual.

### Parallel Opportunities

- T005 puede ejecutarse en paralelo con el trabajo de estructura tras T003-T004.
- T006-T007 se pueden desarrollar en paralelo.
- T014 puede comenzar mientras se desarrolla US1.
- T020-T021 y T022-T024 pueden ejecutarse en paralelo al iniciar US3, porque afectan archivos distintos.
- T028-T029 pueden ejecutarse en paralelo antes de los comandos finales.

## Parallel Example: User Story 3

```text
T022 Crear expense-summary.tsx
T023 Crear expense-participants.tsx
T024 Crear settle-expense-sheet.tsx
```

## Implementation Strategy

### MVP First

1. Completar fases 1 y 2.
2. Completar US1: formulario reusable, participantes y feedback demostrativo.
3. Ejecutar sus pruebas y validar visualmente `register-expense.html`.

### Incremental Delivery

1. Añadir US2 para navegar y filtrar gastos demo.
2. Añadir US3 para completar el detalle y sus interacciones visuales.
3. Finalizar con la revisión responsive, accesibilidad y comandos de calidad.

---

## Phase 7: Convergence

- [X] T034 CRITICAL Refactorizar `app/client/src/app/(event)/[eventId]/expenses/page.tsx` y `app/client/src/app/(event)/[eventId]/expenses/[expenseId]/detail/page.tsx` para mantener las pages como Server Components y aislar filtros, Sheet y AlertDialog en componentes cliente privados, conforme a Constitución XX (contradicts).
- [X] T035 Añadir fecha accesible, valor inicial de edición y validación demostrativa al formulario en `app/client/src/app/(event)/_components/expense-form.tsx`, conforme a FR-002 y US1/AC1 (missing).
- [X] T036 Añadir estado visual y `aria-invalid` para campos obligatorios de `app/client/src/app/(event)/_components/expense-form.tsx`, conservando un único toast resumido de Sonner, conforme a FR-003 y US1/AC3 (partial).
- [X] T037 Hacer que los selectores de `app/client/src/app/(event)/_types/expense-demo.ts` respeten el `eventId` del contrato y que las rutas de `app/client/src/app/(event)/[eventId]/expenses/[expenseId]/` usen notFound ante una combinación inexistente, conforme a `contracts/expense-ui-contract.md` (contradicts).
- [X] T038 Incorporar un estado vacío alcanzable y su prueba en `app/client/src/app/(event)/[eventId]/expenses/`, conforme a FR-007 y US2/AC3 (partial).
- [X] T039 Ampliar pruebas de comportamiento real para filtros, formulario inválido, Sheet de participantes/pago, AlertDialog de anulación y not-found en `app/client/src/app/(event)/_components/expense-form.test.tsx` y `app/client/src/app/(event)/[eventId]/expenses/**/*.test.tsx`, conforme a Constitución III y XXX (partial).

## Phase 8: Reubicación de rutas Expenses

- [X] T040 Reubicar las rutas, componentes, tipos y pruebas de Expenses bajo `app/client/src/app/expenses/`, con `/expenses/event/[eventId]` para listado/registro y `/expenses/[expenseId]` para detalle/edición; actualizar enlaces internos, contrato, investigación, plan y guía de validación. La estructura anterior queda sustituida por esta decisión de rutas.
