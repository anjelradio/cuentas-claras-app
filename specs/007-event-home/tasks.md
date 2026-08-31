---

description: "Task list for the Event Home frontend feature"

---

# Tasks: Home de evento

**Input**: Design documents from `specs/007-event-home/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/event-home-ui.md](contracts/event-home-ui.md), [quickstart.md](quickstart.md)

**Scope**: Solo `app/client/`. No modificar `app/server`, `docs`, `design/event-home.html` ni archivos de `specs/` durante la implementación.

**Tests**: Se incluyen pruebas de comportamiento observable y accesibilidad porque la constitución las exige para componentes interactivos y flujos críticos del frontend.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar la frontera de la ruta y confirmar los componentes reutilizables antes de escribir la UI.

- [X] T001 [P] Verificar en `app/client/src/app/(event)/layout.tsx` que la nueva ruta heredará sesión, header y contenedor existentes sin duplicarlos.
- [X] T002 [P] Verificar en `app/client/src/components/custom/quick-action-button.tsx` las variantes `primary-blue`, `primary-orange` y `secondary-purple` y documentar su API de uso en el trabajo de la feature.
- [X] T003 Crear las carpetas privadas `app/client/src/app/(event)/[event-id]/_components/`, `app/client/src/app/(event)/[event-id]/_data/` y `app/client/src/app/(event)/[event-id]/_types/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Definir los contratos locales que necesitan todas las historias antes de componer la página.

**⚠️ CRITICAL**: Ninguna historia debe integrar la página hasta completar esta fase.

- [X] T004 [P] Definir `EventHomeData`, `EventView`, `EventStatistics`, `CategorySlice`, `ExpenseSummary`, `ActivityItem`, `DebtSummary`, `InvitationOption` y `EventOverlayState` en `app/client/src/app/(event)/[event-id]/_types/event-home-types.ts` según `data-model.md`.
- [X] T005 Crear la fixture `EVENT_HOME_FIXTURE` y sus listas estáticas en `app/client/src/app/(event)/[event-id]/_data/event-home-fixture.ts`, usando los datos visuales de Stitch y tokens semánticos en lugar de colores hexadecimales.
- [X] T006 [P] Añadir documentación breve en español a `app/client/src/app/(event)/[event-id]/page.tsx`, `app/client/src/app/(event)/[event-id]/_types/event-home-types.ts`, `app/client/src/app/(event)/[event-id]/_data/event-home-fixture.ts` y los componentes privados previstos, respetando la posición de cualquier directiva `use client`.

**Checkpoint**: Tipos, datos estáticos y límites de la ruta están listos; no existe dependencia de API o backend.

---

## Phase 3: User Story 1 - Consultar el resumen de un evento (Priority: P1) 🎯 MVP

**Goal**: Renderizar la ruta dinámica con una home estática completa y sus tres cards de información.

**Independent Test**: Con una sesión válida, visitar `/<event-id>` con un identificador no vacío y comprobar encabezado, acciones visibles, estadísticas, gastos y actividad; actualizar y usar otro identificador sin solicitudes de datos ni mutaciones.

### Tests for User Story 1

- [X] T007 [P] [US1] Crear pruebas de renderizado de la ruta y del parámetro dinámico en `app/client/src/app/(event)/[event-id]/__tests__/page.test.tsx`, cubriendo identificador no vacío, fixture estática y ausencia de llamadas a API.
- [X] T008 [P] [US1] Crear pruebas de props y contenido accesible de las cards en `app/client/src/app/(event)/[event-id]/__tests__/event-home-sections.test.tsx`, incluyendo total, leyenda textual y listas de gastos/actividad.

### Implementation for User Story 1

- [X] T009 [P] [US1] Implementar `EventStatisticsCard` con donut SVG, título accesible, total, porcentajes y leyenda textual en `app/client/src/app/(event)/[event-id]/_components/event-statistics-card.tsx`.
- [X] T010 [P] [US1] Implementar `RecentExpensesCard` como card de shadcn/ui que reciba `ExpenseSummary[]` y muestre estado de lista vacía representable en `app/client/src/app/(event)/[event-id]/_components/recent-expenses-card.tsx`.
- [X] T011 [P] [US1] Implementar `RecentActivitiesCard` como card de shadcn/ui que reciba `ActivityItem[]` y comunique estados con texto/icono además del color en `app/client/src/app/(event)/[event-id]/_components/recent-activities-card.tsx`.
- [X] T012 [US1] Crear la page Server Component en `app/client/src/app/(event)/[event-id]/page.tsx`, leer `params["event-id"]`, seleccionar la fixture estática y componer encabezado del evento, resumen, `EventStatisticsCard`, `RecentExpensesCard` y `RecentActivitiesCard` sin duplicar layout ni sesión.
- [X] T013 [US1] Ajustar la composición de `app/client/src/app/(event)/[event-id]/page.tsx` y sus cards para que la jerarquía, espaciado, superficies y responsive coincidan con `design/event-home.html` usando Tailwind y tokens existentes.

**Checkpoint**: US1 puede demostrarse y probarse sin overlays ni operaciones de negocio.

---

## Phase 4: User Story 2 - Explorar las acciones y el estado del evento (Priority: P1)

**Goal**: Exponer las acciones del evento con `QuickActionButton` y estados visuales claros, listos para abrir los flujos de la siguiente historia.

**Independent Test**: Montar la sección de acciones con props estáticas, recorrerla con teclado y comprobar que cada acción tiene título, descripción, icono Lucide, foco visible y variante visual correcta.

### Tests for User Story 2

- [X] T014 [P] [US2] Crear pruebas de variantes, nombres accesibles y activación de acciones en `app/client/src/app/(event)/[event-id]/__tests__/event-actions-section.test.tsx`.

### Implementation for User Story 2

- [X] T015 [US2] Implementar `EventActionsSection` en `app/client/src/app/(event)/[event-id]/_components/event-actions-section.tsx` reutilizando `QuickActionButton` para `Invitar personas`, `Registrar gasto`, `Mis deudas`, `Ver miembros`, `Registrar QR` y `Editar evento`.
- [X] T016 [US2] Configurar en `app/client/src/app/(event)/[event-id]/_components/event-actions-section.tsx` la asignación de variantes azul, naranja y morada, iconos de `lucide-react`, descripciones y callbacks de presentación sin mutaciones.
- [X] T017 [US2] Integrar `EventActionsSection` en `app/client/src/app/(event)/[event-id]/page.tsx` manteniendo el orden de lectura y el layout mobile-first de Stitch.

**Checkpoint**: US1 y US2 funcionan de forma observable; todas las acciones son accesibles aunque todavía no ejecuten operaciones reales.

---

## Phase 5: User Story 3 - Usar los flujos visuales de la guía (Priority: P2)

**Goal**: Reproducir los diálogos y sheets estáticos de invitación, gasto, deudas, creación, unión y selección de evento.

**Independent Test**: Activar cada acción, comprobar apertura del overlay correspondiente, cerrar con botón, fondo y Escape, y verificar retorno de foco sin persistencia ni llamadas de red.

### Tests for User Story 3

- [X] T018 [P] [US3] Crear pruebas de apertura, cierre, Escape, fondo y retorno de foco en `app/client/src/app/(event)/[event-id]/__tests__/event-overlay-flows.test.tsx`.
- [X] T019 [P] [US3] Añadir comprobaciones de nombres accesibles, roles y ausencia de mutaciones simuladas en `app/client/src/app/(event)/[event-id]/__tests__/event-overlay-accessibility.test.tsx`.

### Implementation for User Story 3

- [X] T020 [US3] Implementar los overlays de invitación, registro de gasto, deudas, creación, unión y selección en `app/client/src/app/(event)/[event-id]/_components/event-overlay-flows.tsx` usando `Dialog`, `AlertDialog` o `Sheet` de shadcn/ui y estado local mínimo.
- [X] T021 [US3] Conectar `EventActionsSection` con `event-overlay-flows.tsx` para que cada acción abra el overlay definido en `app/client/src/app/(event)/[event-id]/_components/event-actions-section.tsx` sin importar componentes privados de `app/home/`.
- [X] T022 [US3] Implementar cierre por botón, fondo y Escape, gestión de foco y bloqueo/restauración segura del scroll en `app/client/src/app/(event)/[event-id]/_components/event-overlay-flows.tsx`.
- [X] T023 [US3] Sustituir todos los iconos de la referencia en `app/client/src/app/(event)/[event-id]/_components/` por equivalentes de `lucide-react` con etiquetas accesibles y aplicar superficies/tokens sin colores hex duplicados.

**Checkpoint**: US3 reproduce los flujos de Stitch como UI estática y no afirma éxitos ni persiste datos.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validar la integración completa, calidad y límites de la feature.

- [X] T024 [P] Añadir pruebas de regresión para la ruta dinámica y el no desbordamiento en `app/client/src/app/(event)/[event-id]/__tests__/event-home-responsive.test.tsx`.
- [X] T025 [P] Revisar documentación en español y convenciones de nombres de todos los archivos nuevos bajo `app/client/src/app/(event)/[event-id]/`.
- [X] T026 Ejecutar `pnpm lint` desde `app/client/` y corregir únicamente problemas introducidos por esta feature.
- [X] T027 Ejecutar `pnpm typecheck` desde `app/client/` y verificar contratos de props, parámetros y componentes.
- [X] T028 Ejecutar `pnpm test` desde `app/client/` y confirmar que pasan las pruebas nuevas y existentes.
- [ ] T029 Ejecutar la validación manual de `specs/007-event-home/quickstart.md` en móvil y escritorio, documentando cualquier discrepancia visual antes de cerrar la feature.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; confirma los puntos de extensión existentes.
- **Foundational (Phase 2)**: Depende de Setup y bloquea todas las historias.
- **User Story 1 (Phase 3)**: Depende de Foundational; constituye el MVP.
- **User Story 2 (Phase 4)**: Depende de Foundational. Sus pruebas y componentes pueden desarrollarse en paralelo con US1, pero su integración visual en la page espera T012.
- **User Story 3 (Phase 5)**: Depende de US2 para conectar los triggers; la implementación del overlay puede prepararse en paralelo con la integración de US2.
- **Polish (Phase 6)**: Depende de las historias que se quieran entregar.

### User Story Dependencies

```text
Phase 1 → Phase 2 → ┬→ US1 (MVP) ──────┐
                    └→ US2 ────────────┼→ US3 → Polish
                                      └───────┘
```

US1 y US2 son verificables de forma independiente después de Foundational; US3
requiere los triggers de US2 para demostrar el flujo completo.

### Within Each User Story

- Ejecutar primero las pruebas de la historia y comprobar que fallan por la ausencia de implementación.
- Completar tipos/fixture antes de la composición visual.
- Mantener cada componente privado junto a la ruta y evitar imports desde carpetas privadas de otras funcionalidades.
- Verificar la historia en su checkpoint antes de comenzar la siguiente.

### Parallel Opportunities

- T001 y T002 pueden ejecutarse en paralelo.
- T004, T005 y T006 pueden ejecutarse en paralelo una vez creadas las carpetas de T003.
- T007 y T008 son paralelas; T009, T010 y T011 también son paralelas entre sí.
- T014 puede desarrollarse en paralelo con las pruebas y cards de US1.
- T018 y T019 son paralelas; T020 y T023 pueden prepararse en paralelo antes de conectar T021.
- T024 y T025 pueden ejecutarse en paralelo antes de los comandos globales T026–T028.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Setup y Foundational.
2. Implementar la ruta dinámica, fixture y las tres cards de US1.
3. Ejecutar las pruebas de renderizado y el quickstart para demostrar la home estática.
4. Detenerse en el checkpoint y validar antes de añadir overlays.

### Incremental Delivery

1. Añadir US2 para exponer acciones visuales reutilizando `QuickActionButton`.
2. Añadir US3 para abrir/cerrar los overlays de Stitch.
3. Ejecutar Polish y todas las comprobaciones del cliente.

### Scope Guardrails

- No crear ni modificar archivos de `app/server`, `docs`, `design/` o `specs/` durante `$speckit-implement`.
- No instalar una librería de gráficos para esta versión; el donut es SVG local accesible.
- No crear services, endpoints, schemas de API, conexiones a bucket ni lógica de negocio.
- No usar Phosphor Icons, emojis como única señal semántica ni colores hex duplicados.

---

## Phase 7: Convergence

- [X] T030 CRITICAL Migrar las variantes, fondos y estados de `app/client/src/components/custom/quick-action-button.tsx` a tokens semánticos o variables del sistema de diseño, sin cambiar su API pública, y cubrir las variantes consumidas por Event Home per Constitución XXIV / FR-008 (contradicts)
- [X] T031 Exponer controles estáticos y accesibles para activar los flujos `join` y `select` de `app/client/src/app/(event)/[event-id]/_components/event-overlay-flows.tsx`, alimentándolos desde el fixture en lugar de valores hardcodeados, y añadir sus pruebas de apertura per FR-005, FR-009, US3/AC5 y SC-002 (partial)
- [X] T032 Ampliar las pruebas de `app/client/src/app/(event)/[event-id]/__tests__/` para comprobar cierre por botón, fondo y Escape, además de la restauración de foco, en cada overlay alcanzable per FR-006, US3/AC4, SC-003 y Constitución XXX (partial)
- [X] T033 Restablecer en `app/client/src/app/(event)/[event-id]/_components/event-actions-section.tsx` la jerarquía visual responsive de Stitch, destacando la acción principal de invitación antes de las acciones secundarias per FR-003, SC-002 y Constitución XXV (partial)
