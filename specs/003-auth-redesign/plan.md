# Implementation Plan: Rediseño de Autenticación (Stitch)

**Branch**: `No branch` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-auth-redesign/spec.md`

## Summary

Cambiar el diseño de todas las rutas de autenticación en el frontend guiándonos por los archivos HTML provistos en `design/auth`. El layout base unificará los fondos de la aplicación, y los componentes serán modificados mediante Tailwind CSS para imitar fielmente el diseño "Stitch", sin alterar las operaciones y flujos funcionales actuales. La fuente ya configurada en la aplicación no se modificará.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.3.3 (React 19)

**Primary Dependencies**: Tailwind CSS v4, Shadcn/UI

**Storage**: N/A (Solo diseño de UI)

**Testing**: Vitest + Testing Library (Se deberá asegurar que los selectores y accesibilidad sigan pasando).

**Target Platform**: Navegador Web moderno.

**Project Type**: Next.js Frontend (`app/client`)

**Constraints**: La funcionalidad de Better Auth debe mantenerse intacta.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla | Decisión del plan | Estado |
|---|---|---|
| I. Ubicación y responsabilidades | Todos los cambios se limitarán a `app/client/src/app/auth` y `app/client/tailwind.config.ts`. | Cumple |
| III. Calidad | Las pruebas interactivas de formulario deben seguir pasando. | Cumple |
| XVIII. Arquitectura Frontend | Se mantiene la organización de páginas en `app/client/src/app`. | Cumple |
| XX. Server Components | No se agregarán "use client" a menos que sea estrictamente necesario para estados. | Cumple |

## Project Structure

### Documentation (this feature)

```text
specs/003-auth-redesign/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Source Code (repository root)

```text
app/client/
├── tailwind.config.ts                     # Modificación de colores
├── src/
│   ├── app/
│   │   ├── globals.css                    # Variables CSS del tema Stitch
│   │   └── auth/
│   │       ├── layout.tsx                 # Fondo y wrapper Stitch
│   │       ├── login/page.tsx             # Ajustes de clases
│   │       ├── register/page.tsx          # Ajustes de clases
│   │       ├── forgot-password/page.tsx   # Ajustes de clases
│   │       ├── reset-password/page.tsx    # Ajustes de clases
│   │       ├── verify-email/page.tsx      # Ajustes de clases
│   │       └── components/                # Adaptación visual de formularios a Stitch
```

**Structure Decision**: El proyecto mantendrá su estructura Next.js existente. Solo se modificarán estilos, clases en los archivos `.tsx` de las rutas de `/auth/` y archivos de configuración global de CSS/Tailwind.

