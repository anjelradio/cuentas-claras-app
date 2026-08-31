# Contrato de interfaz: Expenses estáticos

## Rutas

| Ruta | Parámetros | Resultado |
|---|---|---|
| `/expenses/event/[eventId]` | `eventId` | Lista estática y filtros del evento. |
| `/expenses/event/[eventId]/create` | `eventId` | Formulario en modo create. |
| `/expenses/[expenseId]/edit` | `expenseId` | Formulario compartido en modo edit. |
| `/expenses/[expenseId]` | `expenseId` | Resumen, comprobante, participantes y acciones demo. |

Un `expenseId` demo inexistente debe conducir a la página de no encontrado. El evento se conserva dentro del gasto estático para volver a su listado correspondiente.

## Interacciones

| Acción | Entrada | Salida requerida | Efecto externo |
|---|---|---|---|
| Cambiar filtro | `mine`, `others`, `all` | Indicador activo y lista filtrada | Ninguno. |
| Registrar o editar | Formulario y participantes | Toast demostrativo | Ninguno. |
| Saldar mi parte | Método seleccionado | Progreso y toast demostrativo | Ninguno. |
| Anular gasto | Confirmación explícita | Toast demostrativo | Ninguno. |

## Accesibilidad

- Todo control tiene texto visible o nombre accesible.
- Iconos accionables tienen texto o `aria-label`.
- Filtros exponen su selección.
- Sheets y AlertDialogs conservan foco y funcionan con teclado.
- Pagado/pendiente combina texto e indicador visual.
