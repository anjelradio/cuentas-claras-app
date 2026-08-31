# Data Model: Home de evento

**Feature**: [007-event-home](spec.md)
**Fecha**: 2026-08-30

Esta feature no crea modelos persistentes ni modifica contratos de backend. Las
estructuras siguientes son tipos de presentación para una fixture estática y
para las props que recibe cada componente privado.

## EventHomeData

Representa el conjunto de información que `page.tsx` entrega a la composición
de la home.

| Campo | Tipo | Reglas |
|---|---|---|
| `event` | `EventView` | Obligatorio; identifica el evento mostrado. |
| `statistics` | `EventStatistics` | Obligatorio; total y distribución de gastos. |
| `recentExpenses` | `ExpenseSummary[]` | Lista estática ordenada de más reciente a más antigua. |
| `recentActivities` | `ActivityItem[]` | Lista estática ordenada de más reciente a más antigua. |
| `debts` | `DebtSummary[]` | Datos de referencia para el panel de deudas. |
| `invitations` | `InvitationOption[]` | Opciones visuales del panel de invitación. |

## EventView

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | `string` | Proviene del segmento `[event-id]`; no se trata como identidad confiable. |
| `name` | `string` | Nombre visible; fixture: `Samaipata 2026`. |
| `description` | `string` | Descripción breve del evento. |
| `dateLabel` | `string` | Fecha preparada para presentación localizada. |
| `memberCount` | `number` | Entero no negativo para el resumen de participantes. |
| `icon` | `string` | Clave de presentación, no HTML ni componente dinámico arbitrario. |

## EventStatistics

| Campo | Tipo | Reglas |
|---|---|---|
| `totalAmount` | `number` | Valor de presentación; no se usa para cálculos financieros reales. |
| `currency` | `string` | Fixture: `Bs.`. |
| `categories` | `CategorySlice[]` | Porcentajes no negativos cuya suma es 100. |

## CategorySlice

| Campo | Tipo | Reglas |
|---|---|---|
| `label` | `string` | Nombre legible de la categoría. |
| `percentage` | `number` | Porcentaje visible y usado para el SVG. |
| `amount` | `number` | Importe de presentación asociado. |
| `tone` | `string` | Token semántico de color, nunca un hex inline. |

## ExpenseSummary

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | `string` | Identificador local estable para renderizado. |
| `title` | `string` | Nombre del gasto. |
| `amountLabel` | `string` | Importe ya formateado para lectura. |
| `payer` | `string` | Participante que aparece en la fixture. |
| `category` | `string` | Categoría visible. |
| `dateLabel` | `string` | Fecha o antigüedad de presentación. |

## ActivityItem

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | `string` | Identificador local estable para renderizado. |
| `actor` | `string` | Participante que realizó la actividad. |
| `actionLabel` | `string` | Descripción comprensible de la actividad. |
| `dateLabel` | `string` | Momento relativo o fecha de presentación. |
| `status` | `success`, `info` o `warning` | Tono con texto o icono complementario; nunca solo color. |

## DebtSummary

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | `string` | Identificador local estable para renderizado. |
| `direction` | `owed` u `owing` | Indica si deben al usuario o si el usuario debe. |
| `person` | `string` | Participante relacionado. |
| `description` | `string` | Concepto del saldo. |
| `amountLabel` | `string` | Importe de presentación. |

## InvitationOption

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | `string` | Identificador local de la opción. |
| `label` | `string` | Acción visible (enlace, código o QR). |
| `description` | `string` | Explicación breve del flujo. |

## Estados de presentación

`EventOverlayState` mantiene como máximo un overlay abierto: `null`, `invite`,
`expense`, `debts`, `create`, `join` o `select`. Abrir un overlay no modifica
ninguna estructura de datos; cerrar restaura el foco al control de origen cuando
sea posible. No existe estado de mutación, carga remota o persistencia en esta
feature.
