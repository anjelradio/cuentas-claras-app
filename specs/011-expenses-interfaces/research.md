# Research: Interfaces de gastos

## Decisión 1: Rutas del módulo Expenses

- **Decision**: Usar el módulo independiente `app/expenses/`: `/expenses/event/[eventId]` para el listado y el registro, y `/expenses/[expenseId]` para el detalle y la edición.
- **Rationale**: Expenses es una frontera funcional propia. El prefijo fijo `event` conserva el contexto solo donde es necesario y evita el conflicto de Next.js entre dos segmentos dinámicos hermanos (`[eventId]` y `[expenseId]`).
- **Alternatives considered**:
  - `app/expenses/[eventId]` y `app/expenses/[expenseId]` como hermanos: descartada porque Next.js no puede distinguir ambos segmentos dinámicos.
  - Mantener todas las rutas dentro de `/(event)`: descartada para respetar la separación funcional solicitada.
  - Formularios independientes: descartada porque registrar y editar tienen la misma estructura.

## Decisión 2: Adaptación de Stitch

- **Decision**: Convertir `expenses.html`, `register-expense.html` y `expense-detail.html` a React con Tailwind, shadcn/ui y tokens existentes.
- **Rationale**: Stitch es la referencia visual, pero la constitución exige una implementación integrada y accesible.
- **Alternatives considered**:
  - Copiar HTML y scripts de Stitch: descartado por duplicación y falta de integración con Next.js.
  - Rediseñar libremente: descartado por la fidelidad visual solicitada.

## Decisión 3: Datos y acciones demo

- **Decision**: Centralizar datos tipados locales de gastos, categorías y participantes; las mutaciones se simulan mediante Sonner.
- **Rationale**: La feature no puede tocar API, backend, persistencia ni reglas financieras. Un origen local evita diferencias entre lista, formulario y detalle.
- **Alternatives considered**:
  - Consumir endpoints existentes: fuera de alcance.
  - Repetir datos en cada página: descartado por inconsistencias.

## Decisión 4: Interacciones visuales

- **Decision**: Usar Sheet para excluir participantes y para saldar, y AlertDialog para anular.
- **Rationale**: Son los flujos mostrados por Stitch y los componentes ya disponibles gestionan foco y teclado de forma consistente.
- **Alternatives considered**:
  - Modales a medida: duplicarían comportamiento accesible.
  - Navegación a nuevas páginas: alteraría el flujo visual entregado.
