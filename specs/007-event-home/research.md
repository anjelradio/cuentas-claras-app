# Research: Home de evento

**Feature**: [007-event-home](spec.md)
**Fecha**: 2026-08-30

## Decisión 1: reutilizar los componentes existentes de acciones y overlays

**Decisión**: Reutilizar `QuickActionButton` desde
`app/client/src/components/custom/quick-action-button.tsx` para las acciones
principales. Usar los primitives `Card`, `Dialog`, `AlertDialog` y `Sheet` de
`app/client/src/components/ui/` para las superficies y flujos superpuestos.

**Razonamiento**:

- El botón ya ofrece las variantes `primary-blue`, `primary-orange` y
  `secondary-purple` solicitadas, además de sus estados de foco y su API de
  icono, título y descripción.
- La constitución prioriza shadcn/ui y evita duplicar componentes base.
- La home general ya demuestra patrones de `Dialog` y `Sheet` que pueden
  adaptarse sin importar componentes privados de otra funcionalidad.

**Alternativas consideradas**:

- Crear botones y modales nuevos dentro de la ruta: rechazado porque duplicaría
  infraestructura visual y aumentaría el acoplamiento.
- Importar directamente los componentes privados de `app/home`: rechazado
  porque las carpetas privadas no son una API pública de otra funcionalidad.

## Decisión 2: mantener la ruta bajo el route group existente

**Decisión**: Crear `app/client/src/app/(event)/[event-id]/page.tsx` y sus
componentes privados. El grupo `(event)` no forma parte de la URL en Next.js,
por lo que la ruta resultante será `/<event-id>` con la estructura actual.

**Razonamiento**: El repositorio ya contiene
`app/client/src/app/(event)/create-event/` y su layout protege la sesión y
comparte el header. Mantener el grupo evita crear una frontera paralela y
permite que la página reciba el parámetro dinámico sin duplicar autenticación ni
layout.

**Alternativas consideradas**:

- Crear `app/client/src/app/events/[event-id]/`: permitiría una URL
  `/events/<event-id>`, pero introduciría un segmento público distinto al route
  group existente y contradice la estructura indicada para esta feature.
- Mover o renombrar `(event)`: rechazado porque afectaría la ruta existente de
  creación de eventos.

## Decisión 3: gráfico de distribución en SVG local

**Decisión**: Implementar el gráfico circular como un componente React local
basado en SVG, con `figure`, título accesible, texto visible del total y una
leyenda textual por categoría. No instalar una librería dedicada de gráficos.

**Razonamiento**:

- El Stitch solo requiere un donut estático de cuatro segmentos (40%, 25%, 20%
  y 15%) para esta versión.
- SVG permite controlar con precisión los segmentos, el grosor y la composición
  visual sin añadir dependencias ni convertir toda la página en un componente
  cliente.
- El total y los porcentajes quedan disponibles como texto, por lo que la
  información no depende únicamente del color.
- La constitución exige simplicidad y justificación para nuevas librerías.

**Alternativas consideradas**:

- `conic-gradient`: rechazado como representación principal porque no ofrece
  semántica accesible por sí mismo y limita el control de segmentos y etiquetas.
- Recharts u otra librería: reservada para una specification futura si se
  requieren datos dinámicos, tooltips, filtros, animaciones o varios tipos de
  gráfico; no se justifica para esta fixture estática.

## Decisión 4: fixture estática y props tipadas

**Decisión**: La page Server Component resolverá el `event-id` y pasará una
fixture estática tipada a los componentes de acciones, estadísticas, gastos y
actividades. Las interacciones de overlays vivirán en Client Components
pequeños.

**Razonamiento**:

- No existe todavía un contrato de API ni conexión con bucket para esta
  feature.
- Mantener los datos en una fixture separada permite sustituirla por una
  respuesta validada en una specification posterior sin rehacer la composición.
- El layout existente ya resuelve sesión; la página no debe duplicar ese control.

**Alternativas consideradas**:

- Crear un service o endpoint temporal: rechazado porque introduciría una
  dependencia de backend fuera de alcance.
- Hacer toda la página Client Component: rechazado porque solo los overlays
  requieren estado de cliente.

## Decisión 5: adaptación de la referencia Stitch

**Decisión**: Usar el HTML Stitch exclusivamente como referencia visual y
funcional. Sustituir Phosphor Icons por `lucide-react`, colores directos por
tokens existentes y scripts imperativos por componentes shadcn/ui controlados.

**Razonamiento**: La constitución exige conversión a React, Tailwind, tokens,
accesibilidad y responsive; copiar el HTML o sus scripts incumpliría esas reglas.
