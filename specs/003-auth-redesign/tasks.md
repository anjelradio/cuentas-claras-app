# Tasks: Rediseño de Autenticación (Stitch)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Update `tailwind.config.ts` in `app/client/tailwind.config.ts` to include Stitch color extensions (background, surface, primary-gradient, etc.).
- [x] T002 Update CSS variables in `app/client/src/app/globals.css` to map Shadcn/UI tokens to the new Stitch colors for the dark theme.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Apply global radial gradients and background color (`#0d1021`) in `app/client/src/app/auth/layout.tsx`.
- [x] T004 Define the `.glass-panel` utility class and hover states globally in `app/client/src/app/globals.css`.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Navegación y experiencia visual de acceso (Priority: P1) 🎯 MVP

**Goal**: Aplicar el diseño Stitch a todas las rutas de autenticación manteniendo la funcionalidad.

**Independent Test**: Navegar a cada ruta de `/auth` y validar que el renderizado coincida con los archivos de referencia `design/auth/*.html`.

### Implementation for User Story 1

- [x] T005 [P] [US1] Redesign login form and container to match `login.html` in `app/client/src/app/auth/login/page.tsx` and related components in `app/client/src/app/auth/components/`.
- [x] T006 [P] [US1] Redesign register form to match `register.html` in `app/client/src/app/auth/register/page.tsx` and related components.
- [x] T007 [P] [US1] Redesign forgot password view to match `forgot-password.html` in `app/client/src/app/auth/forgot-password/page.tsx` and related components.
- [x] T008 [P] [US1] Redesign reset password view to match `reset-password.html` in `app/client/src/app/auth/reset-password/page.tsx` and related components.
- [x] T009 [P] [US1] Redesign verify email view to match `verify-email.html` in `app/client/src/app/auth/verify-email/page.tsx` and related components.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T010 [P] Run existing Vitest interaction tests (e.g., `interaction.test.tsx`) in `app/client/` to verify no regressions were introduced.
- [x] T011 [P] Run quickstart.md visual validation against the UI.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Modifies CSS base. No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 colors. Blocks US1.
- **User Stories (Phase 3+)**: Can start after Phase 2.
- **Polish (Final Phase)**: Depends on Phase 3 completion.

### Within Each User Story

- Las páginas (login, registro, recuperación) se pueden rediseñar en paralelo de manera independiente.

### Parallel Opportunities

- All UI refactoring tasks marked [P] in Phase 3 can run in parallel.
- Validation tasks marked [P] in Polish phase can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch multiple page redesigns together:
Task: "Redesign login form and container..."
Task: "Redesign register form..."
Task: "Redesign forgot password view..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup Tailwind colors
2. Complete Phase 2: Apply global Auth Layout background and glass panels
3. Complete Phase 3: Redesign each Auth route using the provided HTML files
4. **STOP and VALIDATE**: Test User Story 1 independently against existing interaction tests.
