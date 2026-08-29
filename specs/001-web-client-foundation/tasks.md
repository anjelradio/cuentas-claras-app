---

description: "Task list for the Cuentas Claras web client foundation"
---

# Tasks: Base del cliente web

**Input**: Design documents from `specs/001-web-client-foundation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/ui-foundation.md` and `quickstart.md`.

**Scope**: Frontend only. All application source belongs under `app/client/src/`;
no implementation task may modify `app/server/`, `docs/` or another product
application.

**Tests**: Validation tasks are included because the constitution requires
proportionate tests for interactive components and accessibility. They are
behavior-focused and do not introduce business logic.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the standalone Next.js client in the definitive
directory and establish the toolchain without creating `client/client`.

- [X] T001 Initialize the Next.js project directly in `app/client/` with the stable `@latest` release, TypeScript, ESLint, Tailwind CSS, App Router, `src-dir`, pnpm and alias `@/*` mapped to `app/client/src/*`; verify generated files remain inside `app/client/`
- [X] T002 Configure strict TypeScript compiler options and the `@/*` path mapping in `app/client/tsconfig.json`
- [X] T003 Configure the client package scripts and pnpm metadata in `app/client/package.json` and preserve the generated lockfile at `app/client/pnpm-lock.yaml`
- [X] T004 [P] Configure Tailwind/PostCSS and ESLint for the client in `app/client/postcss.config.mjs`, `app/client/eslint.config.mjs` and related generated configuration files
- [X] T005 Initialize shadcn/ui in `app/client/components.json` using the official Vega preset and Lucide React icon library without adding any Toast component
- [X] T006 Configure the Vitest and Testing Library harness in `app/client/vitest.config.ts`, `app/client/src/test/setup.ts` and `app/client/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the decisions, token layer, typography, component
inventory and accessibility primitives required by every user story.

**⚠️ CRITICAL**: T007 is a read-only decision gate. Do not implement CSS tokens
or font imports until the definitive palette and Google font assignments are
already recorded.

- [X] T007 Confirm, without modifying files, that the approved values for `primary`, `secondary`, `tertiary`, `neutral`, `background`, `surface`, `headline`, `body`, `label`, `success`, `info`, `warning` and `error`, plus Montserrat Alternates for `headline` and Montserrat for `body`/`label`, are recorded in `specs/001-web-client-foundation/contracts/ui-foundation.md`; if absent, block T008–T013
- [X] T008 Define the centralized CSS custom properties and Tailwind semantic mappings for all 13 approved tokens in `app/client/src/app/globals.css`, without duplicated hex values or direct component colors
- [X] T009 Configure the root layout in `app/client/src/app/layout.tsx` with the three approved `next/font/google` variables, role mappings for headline/body/label, global `background`, metadata and the Sonner `Toaster`
- [X] T010 Add exactly `alert-dialog`, `breadcrumb`, `button`, `card`, `checkbox`, `dialog`, `field`, `input`, `input-otp`, `label`, `select`, `sheet`, `skeleton`, `spinner` and `sonner` under `app/client/src/components/ui/` through shadcn/ui; do not add `toast.tsx` or any other notification component
- [X] T011 Apply `surface` as the default elevated background in `app/client/src/components/ui/card.tsx`, `app/client/src/components/ui/dialog.tsx`, `app/client/src/components/ui/alert-dialog.tsx` and `app/client/src/components/ui/sheet.tsx`
- [X] T012 Configure shared class composition and token-aware utility access in `app/client/src/lib/utils.ts` and `app/client/src/app/globals.css`, keeping shadcn components compatible with the Vega preset
- [X] T013 Establish visible focus, semantic state, reduced-motion and accessible text primitives in `app/client/src/app/globals.css` for all interactive components

**Checkpoint**: The client toolchain, decisions, token layer, typography and
exact component inventory are ready before story-specific composition begins.

---

## Phase 3: User Story 1 - Construir interfaces coherentes (Priority: P1) 🎯 MVP

**Goal**: Provide a single visual foundation whose colors, surfaces and
typography are consumed through centralized roles.

**Independent Test**: A sample composition uses headline, body and label roles,
all required token categories and elevated surfaces without introducing a new
visual value or business data.

### Implementation for User Story 1

- [X] T014 [US1] Create the reusable visual foundation showcase in `app/client/src/components/shared/design-system-showcase.tsx`, exposing the approved token roles, typography roles, semantic states and surface examples
- [X] T015 [US1] Build the minimal verification route in `app/client/src/app/page.tsx` by composing the design-system showcase with no product screens, authentication, persistence, API calls or expense logic
- [X] T016 [P] [US1] Add focused render and token-consumption coverage for the showcase in `app/client/src/components/shared/design-system-showcase.test.tsx`

**Checkpoint**: User Story 1 is independently demonstrable through the root
verification route and its centralized visual roles.

---

## Phase 4: User Story 2 - Componer interacciones reutilizables (Priority: P2)

**Goal**: Make the exact 15-component collection usable as consistent,
composable controls and containers.

**Independent Test**: Each requested component type can be represented in an
isolated composition with its basic states, token usage and no additional
notification system.

### Implementation for User Story 2

- [X] T017 [P] [US2] Configure action and container variants for `button.tsx`, `card.tsx`, `breadcrumb.tsx` and `label.tsx` in `app/client/src/components/ui/`
- [X] T018 [P] [US2] Configure form controls and validation states for `field.tsx`, `input.tsx`, `input-otp.tsx`, `select.tsx` and `checkbox.tsx` in `app/client/src/components/ui/`
- [X] T019 [P] [US2] Configure overlay, loading and notification composition for `alert-dialog.tsx`, `dialog.tsx`, `sheet.tsx`, `skeleton.tsx`, `spinner.tsx` and `sonner.tsx` in `app/client/src/components/ui/`
- [X] T020 [US2] Create the reusable component collection showcase in `app/client/src/components/shared/component-collection-showcase.tsx`, covering all 15 types and using Sonner as the sole notification path
- [X] T021 [US2] Integrate `component-collection-showcase.tsx` into `app/client/src/app/page.tsx` without adding product data or a second route
- [X] T022 [P] [US2] Add observable interaction coverage for the component collection in `app/client/src/components/ui/tests/component-collection.test.tsx`, including dialog, alert-dialog, sheet, select, checkbox, input-otp and Sonner semantics

**Checkpoint**: User Stories 1 and 2 can each be reviewed independently; the
collection remains exactly the 15 requested types.

---

## Phase 5: User Story 3 - Usar una base accesible (Priority: P3)

**Goal**: Ensure the shared foundation communicates purpose and state through
keyboard behavior, focus, labels, semantics and non-color signals.

**Independent Test**: A reviewer can traverse the interactive collection with a
keyboard, identify every control, perceive state changes without color alone and
use the composition at 320 px without horizontal action loss.

### Implementation for User Story 3

- [X] T023 [US3] Audit and refine accessible names, labels, descriptions, focus order and keyboard behavior in all interactive files under `app/client/src/components/ui/`
- [X] T024 [US3] Add text or Lucide React icon signals for success, info, warning and error states in `app/client/src/components/ui/` without introducing another icon library or hard-coded colors
- [X] T025 [US3] Make the showcase layout responsive from 320 px through desktop in `app/client/src/components/shared/design-system-showcase.tsx`, `app/client/src/components/shared/component-collection-showcase.tsx` and `app/client/src/app/globals.css`
- [X] T026 [P] [US3] Add keyboard and accessible-name coverage in `app/client/src/components/ui/tests/accessibility.test.tsx`

**Checkpoint**: All three user stories are independently reviewable, with
accessibility and responsive behavior represented in the shared foundation.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Apply repository-wide quality gates while preserving the frontend
boundary and the no-business-logic scope.

- [X] T027 [P] Add the client-only test scripts and coverage command in `app/client/package.json` for Vitest, Testing Library, lint, type checking and production build
- [X] T028 [P] Review imports in `app/client/src/` to ensure every icon comes from `lucide-react` and no custom icon replaces an existing Lucide icon
- [X] T029 Run the lint, type-check, test and production-build commands from `app/client/` and resolve findings only within `app/client/`
- [X] T030 Run every scenario in `specs/001-web-client-foundation/quickstart.md` against the verification route and resolve implementation findings only within `app/client/`
- [X] T031 Review the final change set for accidental modifications outside `app/client/`, especially `app/server/` and `docs/`, before marking the feature ready

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T001 must precede configuration tasks that consume generated files.
- **Foundational (Phase 2)**: Depends on Setup; T007 blocks T008–T013 and all user stories.
- **User Stories (Phases 3–5)**: Depend on Foundational completion. US1 and US2 can proceed in parallel after Phase 2; US3 can proceed after Phase 2, with its final responsive audit using the showcases from US1/US2.
- **Polish (Phase 6)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on another story. It is the suggested MVP.
- **US2 (P2)**: Starts after Phase 2; uses the token and component infrastructure but is independently testable.
- **US3 (P3)**: Starts after Phase 2; its final responsive composition may consume US1/US2 showcase components but its accessibility rules apply independently to the shared collection.

### Parallel Opportunities

- After T001, T002, T004 and T006 can be handled in parallel when they touch distinct configuration files.
- After T007, token and accessibility groundwork can proceed; T009 follows the approved font decision and T010 follows the token mappings before component installation.
- T014 and the component-group tasks T017–T019 can proceed in parallel once their foundational prerequisites are complete.
- T016, T022 and T026 are independent test files and can run in parallel after their corresponding implementation surfaces exist.
- T028 and T030 are independent final review activities and can run in parallel with T027 after implementation.

## Parallel Example: User Story 1

```text
Task: "Create the reusable visual foundation showcase in app/client/src/components/shared/design-system-showcase.tsx"
Task: "Add focused render and token-consumption coverage in app/client/src/components/shared/design-system-showcase.test.tsx"
```

## Parallel Example: User Story 2

```text
Task: "Configure action/container variants in app/client/src/components/ui/"
Task: "Configure form controls in app/client/src/components/ui/"
Task: "Configure overlay/loading/notification components in app/client/src/components/ui/"
```

## Parallel Example: User Story 3

```text
Task: "Audit accessible names and keyboard behavior in app/client/src/components/ui/"
Task: "Add non-color state signals in app/client/src/components/ui/"
Task: "Add keyboard and accessible-name coverage in app/client/src/components/ui/tests/accessibility.test.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational, including the palette/font decision gate.
3. Complete Phase 3: User Story 1.
4. Validate the verification route against its independent test criteria.
5. Stop for review before expanding the component showcase.

### Incremental Delivery

1. Setup + Foundational → toolchain and visual contracts ready.
2. US1 → centralized design-system showcase (MVP).
3. US2 → exact 15 reusable components and Sonner-only notifications.
4. US3 → keyboard, semantic-state and responsive accessibility hardening.
5. Polish → lint, types, tests, build and scope review.

### Notes

- Every task uses the required checkbox, sequential ID and explicit path format.
- `[P]` appears only where work can be separated by file ownership after its prerequisites.
- No task introduces product screens, authentication, expense logic, persistence or API communication.
- The definitive palette and font assignments are already registered in the design contract; T007 only confirms their presence and never modifies `specs/`.

## Phase 7: Convergence

- [X] T032 CRITICAL Replace the direct `bg-black/10` overlay colors in `app/client/src/components/ui/alert-dialog.tsx`, `app/client/src/components/ui/dialog.tsx` and `app/client/src/components/ui/sheet.tsx` with a centralized semantic token per FR-004 and Constitution XXIV (contradicts)
- [X] T033 Extend keyboard-driven observable coverage in `app/client/src/components/ui/tests/component-collection.test.tsx` and `app/client/src/components/ui/tests/accessibility.test.tsx` for checkbox, select, input OTP, sheet and Sonner focus/state behavior per FR-006, SC-003 and T022/T026 (partial)
