# Modelo conceptual: Base del cliente web

No se crean entidades persistentes ni datos de negocio. Este modelo describe los
elementos configurables del sistema de diseño.

## Grupo de tokens

| Campo | Descripción | Reglas |
|---|---|---|
| Nombre | Identificador semántico | Único; expresa un rol, no un valor visual. |
| Categoría | Color, superficie, tipografía o estado | Debe pertenecer a una categoría admitida. |
| Valor | Valor CSS asignado | Debe conservar contraste suficiente para su uso. |
| Consumidores | Capas o componentes que lo usan | No duplican valores equivalentes. |

Tokens: `primary`, `secondary`, `tertiary`, `neutral`, `background`, `surface`,
`headline`, `body`, `label`, `success`, `info`, `warning` y `error`.

## Rol tipográfico

| Campo | Descripción | Reglas |
|---|---|---|
| Rol | `headline`, `body` o `label` | Obligatorio y único. |
| Familia | Fuente del rol | `headline`: Montserrat Alternates; `body` y `label`: Montserrat. |
| Variable | Variable reutilizable | Se aplica desde el layout raíz. |

## Componente de interfaz

| Campo | Descripción | Reglas |
|---|---|---|
| Nombre | Tipo reutilizable | Debe figurar en la colección solicitada. |
| Estado | Reposo, foco, deshabilitado, carga o error | No depende solo del color. |
| Interacción | Teclado, foco y etiqueta accesible | Obligatorio para controles. |
| Superficie | Fondo semántico | Card, Dialog, AlertDialog y Sheet usan `surface`. |

Los componentes consumen tokens; los roles tipográficos se aplican por elemento;
los estados consumen tokens semánticos sin definir colores locales.
