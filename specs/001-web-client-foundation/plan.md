# Implementation Plan: Base del cliente web

**Branch**: `001-web-client-foundation` | **Date**: 2026-08-29 | **Spec**:
[spec.md](./spec.md)

**Input**: Base reutilizable del cliente web con sistema de diseño, componentes
accesibles y alcance sin funcionalidades de negocio.

## Summary

Inicializar el cliente en `app/client/` con las versiones estables resueltas por
las herramientas oficiales al implementar. Configurar TypeScript, App Router,
ESLint, Tailwind CSS, la opción `src-dir` y el alias `@/*` a
`app/client/src/*`. Integrar shadcn/ui con un preset Vega generado oficialmente,
Lucide React y los 15
componentes solicitados. La colección exacta es `alert-dialog`, `breadcrumb`,
`button`, `card`, `checkbox`, `dialog`, `field`, `input`, `input-otp`, `label`,
`select`, `sheet`, `skeleton`, `spinner` y `sonner`; Sonner será el único
sistema de notificaciones y no se agregará Toast por separado.

El App Router residirá específicamente en `app/client/src/app/`.

Definir un tema único con variables CSS, la paleta aprobada y las asignaciones
Google definitivas Montserrat Alternates (headline) y Montserrat (body/label). La
ruta inicial verificará
visualmente la base sin autenticación, API, persistencia ni lógica de negocio.

Los tokens `primary`, `secondary`, `tertiary`, `neutral`, `background`, `surface`,
`headline`, `body`, `label`, `success`, `info`, `warning` y `error` se
centralizarán en variables CSS. `background` será el fondo global; `surface` será
el fondo predeterminado de Card, Dialog, AlertDialog y Sheet.

### Decisiones de diseño aprobadas

| Token | Valor definitivo |
|---|---|
| `primary` | `#FF6B35` |
| `secondary` | `#6366F1` |
| `tertiary` | `#A855F7` |
| `neutral` | `#0B0E1A` |
| `background` | `#111522` |
| `surface` | `#1D202D` |
| `headline` | `#E9E8FF` |
| `body` | `#F2C4B4` |
| `label` | `#FFD1C2` |
| `success` | `#22C55E` |
| `info` | `#38BDF8` |
| `warning` | `#F59E0B` |
| `error` | `#EF4444` |

Las asignaciones tipográficas Google definitivas son Montserrat Alternates para
`headline` y Montserrat para `body` y `label`.

## Technical Context

**Language/Version**: TypeScript; versión estable de Next.js resuelta con
`@latest` y bloqueada por pnpm al implementar.

**Primary Dependencies**: Next.js con App Router, React compatible, Tailwind CSS
actual, shadcn/ui con Vega, Lucide React y las fuentes Google Montserrat
Alternates (headline) y Montserrat (body/label) mediante Next.js.

**Storage**: N/A; esta base no persiste datos.

**Testing**: ESLint, comprobación de tipos mediante compilación de Next.js,
Vitest y Testing Library para componentes interactivos; revisión teclado y
responsive de la ruta de verificación.

**Target Platform**: Navegadores modernos móviles y de escritorio.

**Project Type**: Aplicación web de frontend dentro de un monorepo.

**Performance Goals**: La ruta de verificación no presenta desplazamiento
horizontal a 320 px y permite completar sus interacciones básicas con teclado.

**Constraints**: Código fuente exclusivo en `app/client/src/`; tema único; sin
pantallas de negocio, autenticación, almacenamiento, API ni cambios en
`app/server/`.

**Scale/Scope**: Una ruta de verificación, una capa de tokens y 15 componentes
base.

## Constitution Check

*GATE: Passed before Phase 0 research. Re-checked after Phase 1 design: Passed.*

- **Ámbito**: Frontend exclusivo bajo `app/client/`, con el código fuente,
  incluido App Router, bajo `app/client/src/`.
- **Arquitectura**: App Router y Server Components por defecto; los límites
  `"use client"` se mantendrán mínimos.
- **Diseño**: Tailwind CSS y shadcn/ui; componentes en
  `app/client/src/components/ui/`; iconos solo desde Lucide React.
- **Tokens**: Colores, superficies y tipografías se centralizan como tokens
  semánticos sin duplicar valores equivalentes.
- **Calidad**: Diseño mobile-first, teclado, foco visible, etiquetas accesibles,
  lint, tipado y pruebas proporcionales antes de integrar.
- **Fuera de alcance**: Sin API, JWT, autenticación, datos ni cambios de backend.

No hay violaciones constitucionales ni excepciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/001-web-client-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-foundation.md
└── tasks.md                 # Creado por speckit-tasks
```

### Source Code (repository root)

```text
app/client/
├── public/
├── src/
│   ├── app/
│   │   ├── globals.css       # Tokens globales y Tailwind
│   │   ├── layout.tsx        # Fuentes por rol, fondo y Toaster de Sonner
│   │   └── page.tsx          # Verificación visual mínima
│   ├── components/
│   │   ├── ui/               # Componentes instalados de shadcn/ui
│   │   └── shared/           # Composición reutilizable, si aplica
│   ├── lib/
│   │   └── utils.ts
│   └── styles/
│       └── tokens.css         # Si se separa de globals.css
├── components.json
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
└── tsconfig.json
```

**Structure Decision**: Solo se afecta el cliente. `src/app` es la frontera de
rutas y `components/ui` la ubicación obligatoria de shadcn/ui. No se crean
proyectos anidados ni archivos bajo `app/server/`.
