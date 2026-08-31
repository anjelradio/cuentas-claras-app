# Modelo de datos de presentación: Expenses

Estos datos sirven únicamente para componer interfaces estáticas. No representan contratos API, tablas ni reglas financieras definitivas.

## ExpenseDemo

| Campo | Descripción | Regla de presentación |
|---|---|---|
| `id` | Identificador para detalle y edición | Debe corresponder a un gasto demo conocido. |
| `eventId` | Evento al que pertenece | Debe coincidir con la ruta. |
| `name` | Concepto corto | Obligatorio en el formulario demo. |
| `category` | Nombre e icono de categoría | Una categoría disponible. |
| `description` | Detalle opcional | Puede estar vacío. |
| `amount` | Importe formateado | No se calcula ni persiste. |
| `date` | Fecha visible | Mantiene formato consistente. |
| `payer` | Persona pagadora | Se muestra en resumen. |
| `receipt` | Referencia visual opcional | La página no se rompe si falta. |
| `status` | Estado visual | Siempre acompañado de texto. |

## ExpenseParticipantDemo

| Campo | Descripción | Regla de presentación |
|---|---|---|
| `id` | Identificador local | Único dentro del gasto. |
| `name` | Nombre visible | No debe desbordar con texto largo. |
| `avatar` | Imagen o inicial demo | Incluye alternativa textual. |
| `share` | Parte mostrada | Solo presentación, sin cálculos. |
| `paymentStatus` | `paid` o `pending` | Combina texto y color. |
| `isCurrentUser` | Distingue parte propia | Habilita acción visual de saldar si está pendiente. |

## ExpenseFilter

| Valor | Propósito |
|---|---|
| `mine` | Gastos propios de la persona demo. |
| `others` | Gastos de otras personas. |
| `all` | Todos los gastos demo. |

## Estados de interfaz

| Flujo | Transición | Resultado |
|---|---|---|
| Registro | Confirmar participantes | Toast que aclara que no se guarda información real. |
| Edición | Confirmar cambios | Toast demostrativo sin modificar las constantes. |
| Filtro | Elegir pestaña | Lista local filtrada e indicador activo. |
| Saldar | Elegir método | Progreso visual y toast; no cambia estado persistente. |
| Anular | Confirmar diálogo | Toast; el gasto sigue disponible. |
