# Data Model: ciclo de vida del evento y QR de cobro

## Event (existente)

| Campo | Tipo | Reglas de esta feature |
|---|---|---|
| `id` | UUID | Identificador estable. |
| `user_id` | string | Dueño vigente; solo esta identidad puede transferir, cerrar o reabrir. |
| `status` | `open \| closed` | `closed` deja el evento en solo lectura. |
| `closed_at` | datetime nullable | Se asigna al cerrar y se limpia al reabrir. |
| auditoría | UUID + timestamps + `deleted_at` | Heredada de BaseModel; no se elimina físicamente. |

### Transiciones

```text
OPEN -- dueño / PATCH {status: closed} --> CLOSED
CLOSED -- dueño / PATCH {status: open} --> OPEN
```

En `CLOSED`, todas las mutaciones de eventos y membresías se rechazan salvo la reapertura del dueño actual.

## EventMember (existente, extendido)

| Campo | Tipo | Reglas de esta feature |
|---|---|---|
| `id` | UUID | Identificador de la relación. |
| `event_id` / `user_id` | UUID / string | Únicos en conjunto; el usuario autenticado determina exclusivamente su QR. |
| `status` | `active \| left \| removed` | Solo `active` puede abandonar o administrar QR en evento abierto. |
| `qr_image` | string nullable | URL segura de la imagen QR activa; no se expone para miembros inactivos. |
| `qr_image_public_id` | string nullable, **nuevo** | Identificador opaco de Cloudinary para destruir el activo. |
| auditoría | UUID + timestamps + `deleted_at` | El abandono cambia a `left`; la relación no se elimina físicamente. |

### Transiciones relevantes

```text
ACTIVE + evento OPEN -- abandonar --> LEFT + QR desvinculado
ACTIVE + evento OPEN -- PUT my-qr --> ACTIVE + QR nuevo
ACTIVE + evento CLOSED -- PUT my-qr --> rechazo
```

El abandono desasocia los dos campos de QR en la misma transacción que cambia la membresía, y registra limpieza externa. Una sustitución no borra el QR previo hasta que el nuevo URL/public ID se confirma.

## QrAssetCleanup (nuevo, módulo events)

Registro de limpieza persistente para compensar la falta de una transacción distribuida entre PostgreSQL y Cloudinary.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | UUID | BaseModel. |
| `event_member_id` | UUID | Referencia a la membresía afectada, para trazabilidad. |
| `public_id` | string | Activo Cloudinary a destruir; nunca se devuelve al navegador. |
| `reason` | `replacement \| leave` | Origen de la limpieza. |
| `status` | `pending \| completed` | `pending` se puede reintentar; no se borra físicamente. |
| `attempt_count` / `last_attempt_at` | integer / datetime nullable | Control operativo de reintentos. |
| `last_error_code` | string nullable | Código seguro, sin secretos ni respuesta bruta de proveedor. |
| auditoría | UUID + timestamps + `deleted_at` | Auditoría y eliminación lógica obligatorias. |

### Invariantes

1. Solo hay una referencia de QR activa por membresía.
2. Nunca se cambia una referencia activa si la subida nueva o su persistencia falla.
3. Un trabajo `pending` no vuelve a activar una membresía ni sustituye el QR vigente.
4. La transferencia siempre deja un solo `Event.user_id`; la membresía del dueño anterior se mantiene activa y pasa a ser miembro contextual.
5. Gastos, pagos, deudas y actividades históricas no se actualizan en estas transiciones.

## Migraciones

Una migración Alembic debe añadir `event_member.qr_image_public_id` y crear la tabla de limpieza con claves, índices para trabajos pendientes y sus metadatos. Debe importar los modelos desde `app/db/models.py` antes de generar la migración y no alterar migraciones ya aplicadas.
