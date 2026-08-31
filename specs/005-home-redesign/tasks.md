# Implementation Tasks: Home Page Redesign

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Crear el archivo de datos estáticos en `app/client/src/app/home/_components/home-mock-data.ts`
- [x] T002 Crear los directorios `app/client/src/app/home/_components` y configurar `app/client/src/app/page.tsx` para que redirija permanentemente a `/home`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T003 Inicializar la página raíz del nuevo dashboard en `app/client/src/app/home/page.tsx` con un contenedor vacío.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Exploración visual de la página de inicio (Priority: P1) 🎯 MVP

**Goal**: Rediseñar el Header y crear las tarjetas principales con la información estática para que la página de inicio replique fielmente el HTML.

**Independent Test**: Visitar `/home` y observar el Header, la tipografía, y las tarjetas estáticas sin flujos interactivos de overlays.

### Implementation for User Story 1

- [x] T004 [P] [US1] Rediseñar el componente `HomeHeader` en `app/client/src/components/layout/home-header.tsx` según el estilo de `design/home.html`
- [x] T005 [P] [US1] Crear el componente `RequireAttentionCard` en `app/client/src/app/home/_components/require-attention-card.tsx`
- [x] T006 [P] [US1] Crear el componente `RecentEventsCard` en `app/client/src/app/home/_components/recent-events-card.tsx`
- [x] T007 [P] [US1] Crear el componente `RecentActivityCard` en `app/client/src/app/home/_components/recent-activity-card.tsx`
- [x] T008 [US1] Integrar el Header y todas las tarjetas creadas dentro del grid principal de `app/client/src/app/home/page.tsx`, consumiendo la información de `home-mock-data.ts`.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Interacción visual con acciones rápidas (Priority: P2)

**Goal**: Crear el componente genérico de botones de acceso rápido e implementar los flujos interactivos modales y de bottom sheets.

**Independent Test**: Hacer clic en los botones de "Unirse", "Registrar Gasto" y "Mis Deudas" desde el Home para ver cómo se abren los overlays de shadcn.

### Implementation for User Story 2

- [x] T009 [P] [US2] Desarrollar el componente global `QuickActionButton` en `app/client/src/components/custom/quick-action-button.tsx` soportando variantes (naranja, azul, morado) y paso de iconos.
- [x] T010 [US2] Implementar la sección de "Accesos rápidos" y el modal interactivo de "Unirse" en `app/client/src/app/home/page.tsx` utilizando `QuickActionButton` como trigger de `Dialog` de shadcn.
- [x] T011 [US2] Implementar los bottom sheets multi-pasos para "Mis Deudas" y "Registrar Gasto" dentro de la misma vista `app/client/src/app/home/page.tsx`, usando componentes `Sheet` de shadcn y manejando los estados de pasos localmente.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T012 Revisar la vista final de `/home` para garantizar que no hay desbordes (overflow) en móviles (<375px) y que se cumplan las guías de diseño general.
- [x] T013 Validar la accesibilidad básica por teclado de los nuevos botones y modales implementados con shadcn/ui.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Se integra directamente en la página generada en US1, por lo tanto conviene hacerla después.
