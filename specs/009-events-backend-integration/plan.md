# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Integrate the frontend event UI with the backend endpoints. Establish centralized frontend API services in `app/client/src/app/(event)/_services/event-api.ts`. Create a new backend endpoint to list event members. Clean up unused and non-constitutional data/type folders in the frontend.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->


**Language/Version**: TypeScript (Frontend), Python 3.12 (Backend)

**Primary Dependencies**: Next.js App Router, FastAPI, SQLModel

**Storage**: PostgreSQL

**Testing**: Vitest (Frontend), Pytest (Backend)

**Target Platform**: Web Browsers

**Project Type**: Fullstack Web Application (React + FastAPI)

**Performance Goals**: Standard web performance (<500ms API response)

**Constraints**: Must strictly follow the constitution rules for file placements. Must use URL parameters (`?redirect=`) for unauthenticated invite links.

**Scale/Scope**: Moderate. Affects event creation, member management, and invite flows.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*


*GATE: Passed.*

- **Directory Structure**: Removing private `_data`, `_types`, and `_tests` from `app/client/src/app/(event)/[eventId]` to comply with Rule XIX (Components Directory) and standard project layout. Creating central `_services` and `_types` inside `(event)` level.
- **Naming Conventions**: Files are kebab-case, components PascalCase, hooks camelCase (Rule XXIX).
- **Error Handling & State**: Using Sonner toasts for mutation results (Rule XXVII).
- **Backend Architecture**: Using existing `routers`, `services`, `schemas`, and `models` inside `app/server/app/modules/events`.


## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->


```text
app/
├── client/src/app/(event)/
│   ├── _services/
│   │   └── event-api.ts
│   ├── _types/
│   │   └── event.ts
│   ├── [eventId]/
│   │   ├── members/page.tsx
│   │   └── edit-event/page.tsx
│   ├── create-event/page.tsx
│   └── my-events/page.tsx
└── server/app/modules/events/
    ├── routers/
    │   └── event_router.py
    ├── schemas/
    │   └── member_schemas.py
    └── services/
        └── member_service.py
```

**Structure Decision**: Option 2 (Web application). We are creating centralized services/types in the frontend's feature root `(event)` while purging illegal folders (`_data`, `_types`, `_tests` in `[eventId]`), and extending the backend's Event module router to include the new members endpoint.


