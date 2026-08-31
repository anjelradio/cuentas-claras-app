# UI Contract: Event Home

**Feature**: [007-event-home](../spec.md)
**Ámbito**: Frontend: `app/client/`

Este contrato describe la interfaz observable de la página. No es un contrato
HTTP y no implica llamadas al backend.

## Route contract

- **Route file**: `app/client/src/app/(event)/[event-id]/page.tsx`
- **URL con la estructura actual**: `/<event-id>`; `(event)` es un route group y
  no aparece en la URL.
- **Input**: un segmento `event-id` no vacío.
- **Output**: la home estática del evento con la estructura definida en la
  specification.
- **Invalid input**: un path sin segmento dinámico conserva el `not-found` del
  App Router; no se inventa un evento para una ruta que no coincide.

## Component contracts

La page entrega props tipadas a estos componentes privados:

| Componente | Entrada | Salida observable |
|---|---|---|
| `EventActionsSection` | Acciones y handlers de overlay | Tarjetas `QuickActionButton` con variantes azul, naranja y morada; activan el flujo correspondiente. |
| `EventStatisticsCard` | `EventStatistics` | Card con total, donut SVG, leyenda textual y porcentajes. |
| `RecentExpensesCard` | `ExpenseSummary[]` | Card con gastos recientes y estados de lista vacía representables. |
| `RecentActivitiesCard` | `ActivityItem[]` | Card con actividad reciente y señales de estado no basadas solo en color. |

Los overlays de invitación, registro de gasto y deudas utilizan primitives de
shadcn/ui (`Dialog` o `Sheet`) y respetan:

1. apertura desde el control que lo anuncia;
2. título y descripción accesibles;
3. cierre mediante botón, fondo y Escape;
4. retorno de foco al trigger cuando sea posible;
5. ninguna mutación, llamada de API ni mensaje de éxito simulado.

## Visual contract

- La jerarquía de `design/event-home.html` se conserva en la vista inicial:
  encabezado del evento, acciones, resumen estadístico, gastos y actividad.
- `Card`, `Dialog`, `AlertDialog` y `Sheet` consumen las superficies y tokens del
  sistema de diseño existente.
- Los iconos se implementan exclusivamente con `lucide-react`.
- Los elementos con interacción son operables por teclado y mantienen foco
  visible en móvil y escritorio.
