# Investigación técnica: Base del cliente web

## Inicialización del cliente

**Decision**: Desde `app/client/`, usar `pnpm create next-app@latest .` con
TypeScript, ESLint, Tailwind CSS, App Router, `--src-dir`,
`--import-alias "@/*"`, `--use-pnpm` y `--yes`.

**Rationale**: La documentación actual de Next.js y shadcn/ui respalda esta
configuración. Con `--src-dir`, el App Router queda en `src/app` y el alias se
dirige a `src/*`; `.` evita un directorio `client/client`.

**Alternatives considered**: Cualquier ubicación distinta de `app/client/` se
rechaza por contradecir la constitución. La configuración manual se rechaza por
aumentar divergencias.

## Versiones estables

**Decision**: Resolver `@latest` al implementar y conservar `pnpm-lock.yaml`.
La versión exacta se determina en ese momento para usar la línea estable vigente.

**Rationale**: Conserva la versión estable vigente el día de ejecución y el
lockfile proporciona instalaciones reproducibles.

**Alternatives considered**: Fijar números aquí se rechaza porque quedarían
obsoletos antes de la implementación.

## shadcn/ui, Vega y componentes

**Decision**: Usar shadcn/create para generar el código de preset Vega con
Next.js y Lucide React, e inicializar con
`pnpm dlx shadcn@latest init --preset <codigo-vega>`. Agregar `alert-dialog`,
`breadcrumb`, `button`, `card`, `checkbox`, `dialog`, `field`, `input`,
`input-otp`, `label`, `select`, `sheet`, `skeleton`, `spinner` y `sonner` desde
`app/client/`.

**Rationale**: El flujo oficial genera un preset a partir de selecciones
visuales; Vega es el estilo clásico de shadcn/ui y el CLI administra las
dependencias de los componentes.

**Alternatives considered**: El preset predeterminado no garantiza Vega; crear
controles propios contradice la prioridad constitucional de shadcn/ui.

## Tema, tokens y tipografía

**Decision**: Un único tema fijo con variables CSS para primary, secondary,
tertiary, neutral, background, surface, headline, body, label y estados
semánticos. Los valores de color aprobados quedan registrados en el contrato de
UI. Las asignaciones Google definitivas son Montserrat Alternates para headline y
Montserrat para body y label; cada rol se expone mediante una variable
reutilizable.

**Rationale**: El tema único, la paleta y las asignaciones tipográficas están
aprobados y registrados en el contrato de UI; la implementación debe consumirlos
mediante variables y validarlos por contraste sin introducir sustituciones.

**Alternatives considered**: Tema claro/oscuro se rechaza por la aclaración de
tema único. No se agregan familias tipográficas distintas de las asignaciones
aprobadas.

## Superficies, estados y accesibilidad

**Decision**: `background` se aplica al documento y `surface` a Card, Dialog,
AlertDialog y Sheet. Los estados success, info, warning y error tendrán contraste
suficiente y texto, icono o etiqueta además del color.

**Rationale**: Cumple los tokens y requisitos de accesibilidad constitucionales.

**Alternatives considered**: Valores locales por componente se rechazan por
duplicar decisiones visuales.

## Fuentes consultadas

- [Next.js: instalación y App Router](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js: create-next-app CLI](https://nextjs.org/docs/pages/api-reference/create-next-app)
- [Tailwind CSS: guía para Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [shadcn/ui: instalación con Next.js](https://ui.shadcn.com/docs/installation/next)
- [shadcn/ui: presets y Vega](https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create)
- [shadcn/ui: CLI](https://ui.shadcn.com/docs/cli)
