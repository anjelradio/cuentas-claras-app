# Contrato de interfaz: Base del cliente web

## Alcance

Contrato interno reutilizable del cliente. No expone endpoints ni integra
servicios externos.

## Tokens obligatorios

| Token | Valor o regla | Consumidores mínimos |
|---|---|---|
| `primary` | `#FF6B35` | Acciones principales y énfasis. |
| `secondary` | `#6366F1` | Acciones o estados secundarios. |
| `tertiary` | `#A855F7` | Énfasis terciario. |
| `neutral` | `#0B0E1A` | Base neutral y contraste profundo. |
| `background` | `#111522` | Fondo global de la aplicación. |
| `surface` | `#1D202D` | Card, Dialog, AlertDialog y Sheet. |
| `headline` | `#E9E8FF` | Texto de titulares. |
| `body` | `#F2C4B4` | Texto general y párrafos. |
| `label` | `#FFD1C2` | Etiquetas y elementos auxiliares. |
| `success` | `#22C55E` | Notificaciones y estados de éxito. |
| `info` | `#38BDF8` | Notificaciones y estados informativos. |
| `warning` | `#F59E0B` | Notificaciones y estados de advertencia. |
| `error` | `#EF4444` | Notificaciones y estados de error. |

## Roles tipográficos obligatorios

| Rol | Familia Google | Variable y uso |
|---|---|---|
| `headline` | Montserrat Alternates | Variable reutilizable para titulares. |
| `body` | Montserrat | Variable reutilizable para párrafos y contenido general. |
| `label` | Montserrat | Variable reutilizable para etiquetas y elementos auxiliares. |

## Colección requerida

AlertDialog, Breadcrumb, Button, Card, Checkbox, Dialog, Field, Input, InputOTP,
Label, Select, Sheet, Skeleton, Spinner y Sonner, todos bajo
`@/components/ui/`.

## Reglas de comportamiento

- Los controles son utilizables con teclado y muestran foco visible.
- Los iconos proceden exclusivamente de Lucide React; los iconos sin texto tienen
  un nombre accesible.
- Los estados comunican su significado por texto, icono o etiqueta, además del
  color.
- Los componentes consumen únicamente variables de tokens; no definen colores
  hex ni valores de color directos.
- Sonner es el único sistema de notificaciones breves; no se agrega Toast como
  componente separado.
- La composición de verificación no contiene datos de negocio ni llamadas de red.
