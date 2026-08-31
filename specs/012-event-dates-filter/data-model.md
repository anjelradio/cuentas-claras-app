# Data Model: fechas y filtro de eventos

## Event (extendido)

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | Identificador estable heredado de BaseModel. |
| `name`, `description`, `icon` | texto | Datos existentes del evento. |
| `starts_at` | fecha y hora | Inicio del período; ya existente. |
| `ends_at` | fecha y hora, **nuevo** | Fin del período; obligatorio después de la migración. Puede coincidir con `starts_at`, nunca ser anterior. |
| `status` | `open \| closed` | Un evento `open` se considera activo para el filtro de esta feature. |
| `user_id` | texto | Dueño del evento; reglas existentes sin cambios. |
| auditoría | UUID, timestamps y `deleted_at` | Heredado de BaseModel. Se conserva la eliminación lógica. |

### Invariantes de período

1. Crear un evento requiere `starts_at` y `ends_at`.
2. `ends_at >= starts_at`.
3. En PATCH, los valores omitidos conservan su valor guardado; la validación compara el período completo resultante, no solo los campos recibidos.
4. Las reglas existentes de dueño, membresía y evento cerrado se aplican antes de persistir una edición.

## EventMember (existente, usado por el listado)

| Campo | Uso en esta feature |
|---|---|
| `event_id`, `user_id` | Restringen la lista a eventos de la persona autenticada. |
| `status` | Solo `active` permite incluir la relación en la lista. |
| `deleted_at` | Las consultas funcionales conservan la exclusión de datos eliminados lógicamente. |

## EventSummary (contrato de lectura extendido)

| Campo | Origen | Regla |
|---|---|---|
| datos base de Event | Event | Incluye `starts_at`, `ends_at` y `status`. |
| `member_count` | Membresías activas del evento | Entero no negativo calculado en la consulta de resumen; se usa en el selector del Home. |

## Filtro de lista

| Entrada | Resultado |
|---|---|
| sin `active_only` o `active_only=false` | Todos los eventos no eliminados de la persona con membresía `active`, abiertos y cerrados. |
| `active_only=true` | El mismo conjunto limitado a eventos con estado `open`. |

La consulta no concede acceso a eventos de otras personas ni revive membresías `left` o `removed`.

## Migración

1. Añadir `event.ends_at` como columna temporalmente nullable en una nueva revisión posterior al head vigente.
2. Completar cada registro existente con `ends_at = starts_at`.
3. Convertir la columna en no nullable.

La migración no modifica migraciones aplicadas, membresías, estado, propiedad ni registros eliminados lógicamente. `Event` ya forma parte del registro canónico `app/server/app/db/models.py`; no se necesita registrar otro modelo.
