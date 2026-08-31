# Implementation Plan: Home de evento

**Branch**: `007-event-home` | **Date**: 2026-08-30 | **Spec**: [specs/007-event-home/spec.md](spec.md)

**Input**: Feature specification from `specs/007-event-home/spec.md`

## Summary

Implementar la home visual de un evento bajo el route group existente
`app/client/src/app/(event)/`, con una ruta dinámica `[event-id]` y fixture
estática. La page reutilizará el layout autenticado y pasará props tipadas a
componentes privados para acciones, estadísticas, gastos recientes y actividad
reciente. Las acciones interactivas se aislarán en componentes cliente pequeños
que compondrán los primitives de shadcn/ui existentes. El gráfico de distribución
será un donut SVG accesible, sin instalar una librería adicional. No se
implementarán API, bucket, persistencia ni lógica de negocio.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 16.3.3 con App Router

**Primary Dependencies**: React 19, Tailwind CSS 4, shadcn/ui, `lucide-react`,
`class-variance-authority` y primitives existentes de `app/client/src/components/ui/`

**Storage**: N/A (fixture estática en memoria)

**Testing**: Vitest y React Testing Library; comprobaciones manuales responsive y
de accesibilidad según `quickstart.md`

**Target Platform**: Navegadores web modernos en móvil y escritorio

**Project Type**: Frontend web dentro de `app/client/`

**Performance Goals**: La primera vista debe renderizarse sin solicitudes de
datos de eventos y sin añadir dependencias de gráficos; los overlays solo deben
activar el estado necesario para la interacción.

**Constraints**: Modificar únicamente `app/client/`. Mantener el layout y la
sesión existentes. Usar `QuickActionButton` con variantes azul, naranja y
morada. Usar `Card`, `Dialog`, `AlertDialog` y `Sheet` de shadcn/ui cuando
corresponda. No copiar scripts/HTML de Stitch, no usar Phosphor ni otra
librería de iconos, no duplicar colores hex cuando exista un token, no conectar
backend ni simular mutaciones exitosas.

**Scale/Scope**: Una ruta dinámica de home de evento, una fixture de
presentación, tres cards de sección (estadísticas, gastos y actividad), una
sección de acciones y los overlays estáticos definidos por Stitch.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Ámbito y separación**: todos los cambios de implementación se limitan a
  `app/client/`; no se toca `app/server`, `docs` ni la guía Stitch.
- [x] **Frontera funcional**: la ruta vive bajo el segmento funcional existente
  `(event)` y sus componentes exclusivos permanecen en una carpeta privada de
  `[event-id]`.
- [x] **Dirección de dependencias**: no hay API ni services en esta versión;
  `page.tsx` entrega una fixture a componentes, sin llamadas directas a FastAPI.
- [x] **Server/Client Components**: la page y la composición estática permanecen
  como Server Components; el estado de overlays se aísla en Client Components.
- [x] **shadcn/ui y diseño**: se reutilizan `Card`, `Dialog`, `Sheet` y
  `QuickActionButton`; los estilos se expresan con Tailwind y tokens semánticos.
- [x] **Iconografía**: todos los iconos nuevos usan exclusivamente
  `lucide-react`; Phosphor Icons de la referencia no se trasladan.
- [x] **Stitch**: el HTML se adapta a React y preserva jerarquía, intención,
  responsive y estados sin copiar scripts ni estilos directos.
- [x] **Mobile-first y accesibilidad**: se contemplan foco, teclado, cierre de
  overlays, nombres accesibles, contraste y alternativa textual del gráfico.
- [x] **Estados y pruebas**: se documenta el estado estático sin datos reales y
  se planifican pruebas de renderizado, interacción y accesibilidad.
- [x] **Documentación y nombres**: archivos en kebab-case, componentes en
  PascalCase y documentación breve en español para pages y componentes.

## Project Structure

### Documentation (this feature)

```text
specs/007-event-home/
├── plan.md                         # Este plan
├── research.md                     # Decisiones y alternativas investigadas
├── data-model.md                   # Tipos de presentación de la fixture
├── quickstart.md                   # Guía de validación manual y automática
├── contracts/
│   └── event-home-ui.md            # Contrato observable de ruta y componentes
└── tasks.md                        # Tareas a generar por speckit-tasks
```

### Source Code (repository root)

```text
app/client/
└── src/
    └── app/
        └── (event)/
            └── [event-id]/
                ├── page.tsx
                ├── _components/
                │   ├── event-actions-section.tsx
                │   ├── event-statistics-card.tsx
                │   ├── recent-expenses-card.tsx
                │   └── recent-activities-card.tsx
                ├── _data/
                │   └── event-home-fixture.ts
                └── _types/
                    └── event-home-types.ts
```

Los overlays pueden componerse desde `event-actions-section.tsx` y componentes
cliente privados adicionales solo si el estado no puede aislarse en el trigger.
No se crearán servicios, schemas de API ni cambios en componentes privados de
`app/home/`. `app/client/src/app/(event)/layout.tsx` seguirá siendo responsable
de sesión, header y contenedor de la página.

**Structure Decision**: Mantener la frontera existente `(event)` y añadir la
ruta `[event-id]` junto con su `_components`, `_data` y `_types`. La ruta
resultante será `/<event-id>` porque los grupos entre paréntesis no se publican
como segmentos URL. Se reutiliza el `QuickActionButton` global y los primitives
shadcn/ui; las secciones de esta pantalla no se promueven a componentes globales
porque no existe reutilización entre funcionalidades.

## Implementation Sequence

1. Definir tipos y fixture estática con los datos de referencia de
   `design/event-home.html`.
2. Crear la page Server Component y conectar `params["event-id"]` con la fixture,
   sin consultar servicios.
3. Crear la sección de acciones reutilizando las variantes azul, naranja y
   morada de `QuickActionButton`.
4. Crear las cards privadas de estadísticas, gastos y actividad; representar la
   distribución como SVG con leyenda textual y tokens semánticos.
5. Componer los overlays con `Dialog`/`Sheet`, aislar el estado cliente y
   asegurar cierre por botón, fondo y Escape con retorno de foco.
6. Añadir pruebas de renderizado, props, apertura/cierre y accesibilidad; pasar
   lint, typecheck y test.
7. Verificar manualmente la ruta dinámica en móvil y escritorio siguiendo
   `quickstart.md`.

## Complexity Tracking

No hay violaciones de la constitución ni complejidad excepcional que justificar.
La ausencia de una librería de gráficos es una decisión explícita de simplicidad
para una visualización estática y accesible.
