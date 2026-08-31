# Implementation Plan: event-pages

**Branch**: `008-event-pages` | **Date**: 2026-08-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-event-pages/spec.md`

## Summary

Implement two new frontend pages for the event domain: `/my-events` (list of user's events) and `/[eventId]/members` (list of event members). The implementation will use strictly static mock data, inline components within `page.tsx`, loading skeletons, and shadcn/ui Alert Dialogs for confirmations, while perfectly matching the design mocks via Tailwind CSS utility classes.

## Technical Context

**Language/Version**: TypeScript / React 19

**Primary Dependencies**: Next.js App Router, Tailwind CSS, shadcn/ui, lucide-react, phosphor-icons

**Storage**: N/A (Mock data in frontend)

**Testing**: N/A

**Target Platform**: Web Browsers (Mobile and Desktop)

**Project Type**: Frontend Application

**Performance Goals**: Instant UI response via static layouts, smooth loading states.

**Constraints**: Adhere exactly to provided HTML designs. No new global design system tokens, inline custom colors.

**Scale/Scope**: 2 Routes, 2 Loading states, several interactive Alert Dialogs/Modals.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Responsive limits respected (no overflowing, max-width applied).
- [x] No logic in page boundaries (simple client components).
- [x] Loading states handled gracefully via `loading.tsx`.
- [x] Accessibility preserved (shadcn primitives handle focus and a11y).
- [x] Clear documentation and comments in Spanish where applicable.
- [x] Proper kebab-case naming for folders/files, camelCase for functions, PascalCase for components.

## Project Structure

### Documentation (this feature)

```text
specs/008-event-pages/
├── plan.md              
├── research.md          
├── data-model.md        
├── quickstart.md        
├── contracts/           
└── tasks.md             
```

### Source Code (repository root)

```text
app/client/src/app/(event)/
├── my-events/
│   ├── page.tsx
│   └── loading.tsx
└── [eventId]/
    └── members/
        ├── page.tsx
        └── loading.tsx
```

**Structure Decision**: A Next.js App Router folder structure inside `app/client/src/app/(event)`. As explicitly requested by the user, we will NOT create a `_components` directory for these pages. The custom cards and list items will be defined as internal, inline private components directly in `page.tsx`.

## Complexity Tracking

N/A - Standard route implementations without deviating from core principles.
