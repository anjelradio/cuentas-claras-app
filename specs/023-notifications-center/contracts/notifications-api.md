# API Contract: Centro de Notificaciones y Acciones Pendientes

**Prefix**: `/api/notifications`
**Tags**: `["notifications"]`
**Authentication**: Obligatoria mediante `Authorization: Bearer <jwt>` (Better Auth JWKS).

---

## 1. Listar Notificaciones del Usuario

### `GET /api/notifications`

Obtiene la lista paginada de notificaciones del usuario autenticado, derivadas de las actividades de los eventos donde es miembro activo y no fue el autor.

#### Query Parameters

| Parámetro | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `limit` | `integer` | No | `20` | Cantidad máxima de registros a retornar (1-100). |
| `offset` | `integer` | No | `0` | Desplazamiento para paginación. |
| `unread_only` | `boolean` | No | `false` | Si es `true`, filtra solo las alertas no leídas. |

#### Respuestas

- **`200 OK`**:
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "event_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "actor_id": "usr_carlos_123",
      "actor_name": "Carlos Ruiz",
      "target_id": "usr_ana_456",
      "target_name": "Ana López",
      "action_type": "payment.submitted",
      "title": "Pago recibido por confirmar",
      "description": "Carlos Ruiz registró un pago de Bs. 85.00 hacia ti.",
      "target_path": "/events/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "is_read": false,
      "read_at": null,
      "created_at": "2026-09-03T18:30:00Z"
    }
  ],
  "unread_count": 1,
  "total": 12
}
```

- **`401 Unauthorized`**: Token JWT ausente o inválido.

---

## 2. Obtener Conteo de Notificaciones No Leídas

### `GET /api/notifications/unread-count`

Consulta ultraligera diseñada para la campana de navegación y polling del frontend.

#### Respuestas

- **`200 OK`**:
```json
{
  "unread_count": 3
}
```

---

## 3. Marcar Notificación Individual como Leída

### `PATCH /api/notifications/{activity_id}/read`

Registra la lectura de una actividad por parte del usuario autenticado de forma idempotente.

#### Path Parameters

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `activity_id` | `UUID` | Sí | Identificador de la actividad a marcar como leída. |

#### Respuestas

- **`200 OK`**: Retorna la notificación actualizada con `is_read = true` y `read_at` establecido.
- **`404 Not Found`**: La actividad no existe o el usuario no es miembro activo del evento correspondiente.

---

## 4. Marcar Todas las Notificaciones como Leídas

### `POST /api/notifications/mark-all-read`

Marca en lote todas las notificaciones no leídas del usuario como leídas en una sola operación atómica.

#### Respuestas

- **`200 OK`**:
```json
{
  "marked_count": 5,
  "status": "ok"
}
```
