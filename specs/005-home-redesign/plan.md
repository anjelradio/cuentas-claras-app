# Implementation Plan: Home Page Redesign

**Branch**: `005-home-redesign` | **Date**: 2026-08-30 | **Spec**: [specs/005-home-redesign/spec.md](spec.md)

**Input**: Feature specification from `specs/005-home-redesign/spec.md`

## Summary

Rediseñar la página de inicio (`app/client/src/app/page.tsx`) y su encabezado utilizando el diseño estático `design/home.html` de referencia. Se crearán componentes modulares (Quick Actions, Requiere tu atención, Eventos Recientes, Actividad Reciente), priorizando el uso de `shadcn/ui` para modales y bottom sheets (donde el trigger convive con el overlay). Todos los datos serán estáticos/mockeados, y los componentes de uso global (Quick Actions) se ubicarán en `components/custom/`.

## Technical Context

**Language/Version**: TypeScript / Next.js (App Router)

**Primary Dependencies**: React, Tailwind CSS, shadcn/ui, lucide-react

**Storage**: N/A (Mock data)

**Testing**: Vitest / React Testing Library (si aplica verificación visual)

**Target Platform**: Navegador Web (Desktop y Mobile)

**Project Type**: Frontend (`app/client/`)

**Performance Goals**: N/A (Solo UI estática)

**Constraints**: El componente QuickActionButton debe soportar variantes de color y recibir un componente de ícono. Los triggers de modales/sheets deben envolver el contenido del overlay siguiendo la filosofía de shadcn/ui.

**Scale/Scope**: 1 página principal, 1 header rediseñado, ~5 componentes nuevos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Respetar ámbito de implementación (Frontend: `app/client/`).
- [x] Aislar la UI de la lógica de negocio (solo mocks).
- [x] Responsividad en desktop y mobile.
- [x] Uso de convenciones de nombres (kebab-case para archivos, PascalCase para componentes).
- [x] Documentación en español en todos los componentes y páginas.
- [x] Uso de librerías establecidas (`shadcn/ui` sobre componentes manuales cuando exista superposición).

## Project Structure

### Documentation (this feature)

```text
specs/005-home-redesign/
├── plan.md              # This file
├── research.md          # Resoluciones de diseño y arquitectura
├── data-model.md        # Estructuras de datos (Mocks)
├── quickstart.md        # Guía de verificación visual
└── tasks.md             # Tareas a generar por speckit-tasks
```

### Source Code (repository root)

```text
app/client/
├── src/
│   ├── app/
│   │   ├── page.tsx                       # Redirige a /home
│   │   ├── home/
│   │   │   ├── page.tsx                   # Página de inicio rediseñada
│   │   │   └── _components/               # Componentes exclusivos de la página de inicio
│   │   │       ├── require-attention-card.tsx
│   │   │       ├── recent-events-card.tsx
│   │   │       ├── recent-activity-card.tsx
│   │   │       └── home-mock-data.ts
│   │   └── layout.tsx                     # Layout global
│   └── components/
│       ├── layout/
│       │   └── home-header.tsx            # Header existente (a rediseñar, posiblemente renonbrado/movido después, pero de momento vive aquí)
│       └── custom/
│           └── quick-action-button.tsx    # Componente global de botón de acción rápida con soporte para variantes (Sheet/Modal trigger)
```

**Structure Decision**: El botón `QuickActionButton` se considera genérico y va a `components/custom/`. La página de inicio y todos los componentes de tarjetas específicas de la vista de inicio irán en una nueva ruta explícita `app/home/` y su directorio privado `app/home/_components/`. La página raíz `app/page.tsx` simplemente redirigirá a `/home`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
