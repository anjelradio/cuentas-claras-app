---

description: "Tareas ejecutables para fechas y filtro de eventos"
---

# Tasks: Fechas y filtro de eventos

**Input**: Artefactos de diseño en `/specs/012-event-dates-filter/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contrato API](./contracts/events-dates-filter.openapi.yaml) y [quickstart.md](./quickstart.md)

**Tests**: Se incluyen porque la constitución exige pruebas proporcionales al riesgo y el plan define pruebas de contrato, service y UI.

**Organization**: Las tareas se agrupan por historia para poder construir y validar cada incremento de forma independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo porque no comparte archivo ni depende de una tarea incompleta.
- **[US#]**: historia de usuario a la que pertenece la tarea.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Alinear la suite existente con los contratos de la feature sin introducir infraestructura nueva.

- [X] T001 Revisar los escenarios y el contrato antes de implementar, usando `specs/012-event-dates-filter/spec.md`, `specs/012-event-dates-filter/contracts/events-dates-filter.openapi.yaml` y `specs/012-event-dates-filter/quickstart.md` como fuente de verdad.
- [X] T002 Preparar fixtures deterministas de Event, EventMember y servicios inyectables para pruebas de Events en `app/server/tests/conftest.py`, sin usar Neon, JWKS ni servicios externos reales.
- [X] T003 [P] Configurar mocks reutilizables de JWT/fetch y datos de Event para las pruebas del cliente en `app/client/src/test-utils/event-test-helpers.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establecer los contratos compartidos que bloquean creación, edición, listado y detalle.

**⚠️ CRITICAL**: No iniciar las integraciones de UI ni las rutas ampliadas hasta completar esta fase.

- [X] T004 [P] Definir pruebas de contrato para creación, PATCH, detalle y respuestas de período inválido en `app/server/tests/contract/test_events_dates_filter.py` conforme a `specs/012-event-dates-filter/contracts/events-dates-filter.openapi.yaml`.
- [X] T005 [P] Definir pruebas de esquema y cliente para `ends_at`, `member_count` y el parámetro `activeOnly` en `app/client/src/app/(event)/_services/event-api.test.ts`.
- [X] T006 Actualizar el contrato de lectura/escritura común en `app/server/app/modules/events/schemas/event_schemas.py` para representar `ends_at` y `member_count` en los tipos de respuesta adecuados, preservando PATCH parcial.
- [X] T007 Actualizar los schemas Zod y tipos de Events en `app/client/src/app/(event)/_schemas/event-api-schemas.ts` y `app/client/src/app/(event)/_types/event.ts` para exigir `ends_at`, exponer `member_count` solo en resúmenes y tipar payloads de creación/edición.

**Checkpoint**: Los contratos compartidos están definidos y sus pruebas fallan hasta que modelo, migración, servicios, endpoints y clientes se implementen.

---

## Phase 3: User Story 1 - Definir la duración de un evento (Priority: P1) 🎯 MVP

**Goal**: Crear y editar eventos con inicio y fin válidos, conservando ambos valores de extremo a extremo.

**Independent Test**: Crear y editar un evento con el mismo día o con fin posterior; intentar un fin anterior y comprobar que no se persiste ningún cambio parcial.

### Tests for User Story 1

- [X] T008 [P] [US1] Añadir pruebas de la regla `ends_at >= starts_at`, incluidos PATCH con un solo campo de fecha y eventos cerrados, en `app/server/tests/unit/test_event_service.py`.
- [X] T009 [P] [US1] Añadir pruebas accesibles del formulario para dos fechas, precarga de edición y error de fecha final anterior en `app/client/src/app/(event)/_components/event-form.test.tsx`.

### Implementation for User Story 1

- [X] T010 [US1] Añadir el atributo persistente `ends_at` al modelo en `app/server/app/modules/events/models/event.py`, manteniendo BaseModel, auditoría y eliminación lógica sin cambios.
- [X] T011 [US1] Crear una revisión Alembic posterior a `b1f2c3d4e5f6` en `app/server/alembic/versions/` que agregue `event.ends_at`, rellene los eventos históricos con `starts_at` y haga la columna obligatoria según `specs/012-event-dates-filter/data-model.md`.
- [X] T012 [US1] Implementar en `app/server/app/modules/events/services/event_service.py` la validación del período efectivo para crear y PATCH, usando los valores existentes para campos no enviados y errores públicos comprensibles.
- [X] T013 [US1] Actualizar los endpoints de creación, edición y detalle en `app/server/app/modules/events/routers/event_router.py` para usar los schemas ampliados y devolver ambas fechas conforme al contrato.
- [X] T014 [US1] Actualizar el cliente HTTP de eventos en `app/client/src/app/(event)/_services/event-api.ts` para serializar y validar `ends_at` en creación y edición.
- [X] T015 [US1] Ampliar el formulario compartido de creación/edición en `app/client/src/app/(event)/_components/event-form.tsx` con estados de inicio y fin, leyendas centradas y accesibles, validación de UX y el estilo existente de card, emoji e inputs.
- [X] T016 [US1] Ejecutar las pruebas de contrato, servicio y formulario de fechas en `app/server/tests/contract/test_events_dates_filter.py`, `app/server/tests/unit/test_event_service.py` y `app/client/src/app/(event)/_components/event-form.test.tsx` y corregir regresiones detectadas.

**Checkpoint**: La creación y edición son utilizables de forma independiente, preservan ambos valores y rechazan períodos inválidos desde cliente y backend.

---

## Phase 4: User Story 2 - Consultar todos mis eventos o solo los abiertos (Priority: P1)

**Goal**: Mantener el listado completo predeterminado y habilitar el filtro de eventos abiertos para el selector de “Registrar gasto” en Home.

**Independent Test**: Con eventos abiertos/cerrados y membresías activas/inactivas, comprobar que la lista sin filtro incluye los dos estados propios y que `active_only=true` devuelve solo abiertos con el conteo de miembros activos.

### Tests for User Story 2

- [X] T017 [P] [US2] Añadir casos de repository para membresía activa, eliminación lógica, estados abierto/cerrado y conteo de miembros activos en `app/server/tests/unit/test_event_repository.py`.
- [X] T018 [P] [US2] Extender las pruebas de contrato de listado predeterminado, `active_only=true`, lista vacía y exclusión de eventos ajenos en `app/server/tests/contract/test_events_dates_filter.py`.
- [X] T019 [P] [US2] Añadir pruebas de `activeOnly` y de las respuestas resumidas con `member_count` en `app/client/src/app/(event)/_services/event-api.test.ts`.
- [X] T020 [P] [US2] Añadir pruebas del Sheet con lista de eventos abiertos, contador visible y estado vacío accesible en `app/client/src/app/home/_components/add-expense-sheet.test.tsx`.

### Implementation for User Story 2

- [X] T021 [US2] Implementar en `app/server/app/modules/events/repositories/event_repository.py` el listado de membresías activas con filtro opcional de estado abierto y `member_count` agregado de miembros activos, sin consultas N+1 ni inclusión de eliminados lógicos.
- [X] T022 [US2] Propagar `active_only` y los resúmenes enriquecidos mediante `app/server/app/modules/events/services/event_service.py` y `app/server/app/modules/events/routers/event_router.py`, conservando `false` como predeterminado.
- [X] T023 [US2] Extender los clientes de Events en `app/client/src/app/(event)/_services/event-api.ts` y `app/client/src/app/(event)/_services/server-event-api.ts` con la opción tipada `activeOnly`, construyendo el query únicamente cuando se solicite.
- [X] T024 [US2] Obtener eventos abiertos reales en `app/client/src/app/home/page.tsx` y entregarlos como prop al selector de gasto, manteniendo la protección de sesión existente.
- [X] T025 [US2] Sustituir la tarjeta estática por una lista accesible de emoji, nombre y miembros en `app/client/src/app/home/_components/add-expense-sheet.tsx`; conservar su paso de comprobante y asociarlo al evento seleccionado, además de un estado vacío sin selección posible.
- [X] T026 [US2] Ejecutar las pruebas de listado y Sheet en `app/server/tests/unit/test_event_repository.py`, `app/server/tests/contract/test_events_dates_filter.py`, `app/client/src/app/(event)/_services/event-api.test.ts` y `app/client/src/app/home/_components/add-expense-sheet.test.tsx` y corregir regresiones detectadas.

**Checkpoint**: La lista completa y el filtro de abiertos son verificables sin depender de la pantalla de detalle; Home presenta solo eventos abiertos reales sin cargas por evento.

---

## Phase 5: User Story 3 - Ver la duración completa de un evento (Priority: P2)

**Goal**: Mostrar el período completo del evento con un formato humano uniforme en español.

**Independent Test**: Consultar un evento autorizado y verificar que Event Home presenta inicio y fin como fechas humanas, sin cambiar el día por la zona horaria.

### Tests for User Story 3

- [X] T027 [P] [US3] Añadir pruebas del formateador español y su comportamiento UTC en `app/client/src/app/(event)/_lib/format-event-date.test.ts`.
- [X] T028 [P] [US3] Añadir una prueba de Event Home que verifique las dos fechas del período devuelto por detalle en `app/client/src/app/(event)/[eventId]/page.test.tsx`.

### Implementation for User Story 3

- [X] T029 [US3] Crear el formateador reutilizable de fecha de Event en `app/client/src/app/(event)/_lib/format-event-date.ts` con `Intl.DateTimeFormat` en español y zona UTC.
- [X] T030 [US3] Actualizar la presentación del período en `app/client/src/app/(event)/[eventId]/page.tsx` para mostrar fecha de inicio y fecha de fin con la utilidad compartida, preservando el diseño actual del Event Home.
- [X] T031 [US3] Ejecutar las pruebas de formato y Event Home en `app/client/src/app/(event)/_lib/format-event-date.test.ts` y `app/client/src/app/(event)/[eventId]/page.test.tsx` y corregir regresiones detectadas.

**Checkpoint**: El detalle muestra ambas fechas con formato humano coherente y sigue protegiendo acceso mediante el flujo de detalle existente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirmar la calidad transversal, accesibilidad y compatibilidad del cambio completo.

- [X] T032 [P] Revisar y alinear comentarios públicos y mensajes de validación de Events en `app/server/app/modules/events/services/event_service.py` y `app/client/src/app/(event)/_components/event-form.tsx` para que sean claros y no expongan detalles internos.
- [X] T033 [P] Revisar las respuestas y contratos finales frente a `specs/012-event-dates-filter/contracts/events-dates-filter.openapi.yaml` y actualizar únicamente los tests de Events en `app/server/tests/contract/test_events_dates_filter.py` y `app/client/src/app/(event)/_services/event-api.test.ts` cuando haya una discrepancia verificable.
- [X] T034 Ejecutar la validación final de `specs/012-event-dates-filter/quickstart.md`: `pytest`, `ruff check app tests`, `mypy app tests`, `pnpm lint`, `pnpm typecheck` y `pnpm test`; registrar y resolver fallos relacionados con esta feature en los archivos que los originen.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: puede comenzar inmediatamente.
- **Foundational (Phase 2)**: depende de las fixtures y bloquea la implementación de las historias.
- **US1 (Phase 3)**: depende de Phase 2; es el MVP y entrega el modelo/migración de fechas compartido.
- **US2 (Phase 4)**: depende de Phase 2 y del contrato de `ends_at` de US1; puede preparar sus pruebas en paralelo, pero su implementación final sigue a US1 para reutilizar los schemas de resumen.
- **US3 (Phase 5)**: depende de US1 porque consume `ends_at` desde el detalle.
- **Polish (Phase 6)**: depende de las historias que se desee entregar.

### User Story Dependencies

- **US1 (P1)**: no depende de otra historia; alcance MVP recomendado.
- **US2 (P1)**: reutiliza los schemas enriquecidos y el modelo de fechas de US1, pero su listado/filtro y Sheet siguen siendo verificables por sí mismos.
- **US3 (P2)**: reutiliza el detalle ampliado de US1, pero su formateo y presentación se validan de forma independiente.

### Parallel Opportunities

- T002 y T003 pueden realizarse en paralelo.
- T004 y T005 pueden realizarse en paralelo una vez disponibles las fixtures correspondientes.
- En US1, T008 y T009 se pueden escribir en paralelo; T014 puede avanzar tras T007 mientras T010–T013 completan el backend.
- En US2, T017–T020 se pueden escribir en paralelo; tras T022, T023 y T024 pueden avanzar en paralelo, seguidas por T025.
- En US3, T027 y T028 se pueden escribir en paralelo; T029 precede a T030.

## Parallel Example: User Story 2

```text
Task: "Añadir pruebas de repository en app/server/tests/unit/test_event_repository.py"
Task: "Extender pruebas de contrato en app/server/tests/contract/test_events_dates_filter.py"
Task: "Añadir pruebas del Sheet en app/client/src/app/home/_components/add-expense-sheet.test.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar T001–T007.
2. Completar T008–T016.
3. Validar creación, edición y detalle de fechas con las pruebas de US1.
4. Demostrar el período de evento antes de incorporar el filtro y Home.

### Incremental Delivery

1. Entregar US1: fechas completas y migración segura.
2. Entregar US2: lista filtrable y selector de gastos con datos reales.
3. Entregar US3: formato humano y uniforme del período en Event Home.
4. Ejecutar T032–T034 antes de integrar.

## Notes

- Todas las tareas siguen el formato de checklist obligatorio, contienen ruta exacta y mantienen el alcance dentro de `app/client/`, `app/server/` y los artefactos de esta feature.
- No se deben editar migraciones ya aplicadas ni crear rutas de API alternativas.
