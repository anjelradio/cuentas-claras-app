# Modelo de datos: Fundación del backend

No se crean entidades ni revisiones de migración de dominio en esta feature. Las estructuras siguientes son contratos transitorios y el modelo persistente abstracto que usarán los módulos futuros.

## BaseModel persistente

`BaseModel` se define con SQLModel, es abstracto y no genera una tabla propia. Todo modelo SQLModel
persistente futuro hereda de él, salvo una justificación técnica documentada.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | UUID | Identificador primario estable, generado por el servidor. |
| `created_at` | datetime | Fecha y hora de creación para auditoría. |
| `updated_at` | datetime | Fecha y hora de la última modificación para auditoría. |
| `deleted_at` | datetime opcional | Nulo mientras el registro está activo; marca eliminación lógica. |

Los repositories futuros no eliminan filas físicamente y excluyen por defecto
los registros con `deleted_at` no nulo. El registro `app/db/models.py` importa
todos los modelos persistentes de módulos para que Alembic tenga su metadata
completo antes de autogenerar una revisión.

## Contexto de identidad

| Campo | Tipo | Origen | Regla |
|---|---|---|---|
| `user_id` | cadena | claim JWT `sub` validado | Obligatorio; representa Better Auth `user.id`. |
| `issuer` | URL | claim JWT `iss` validado | Debe coincidir con `AUTH_JWT_ISSUER`. |
| `expires_at` | fecha/hora | claim JWT `exp` validado | Debe estar en el futuro al aceptar la credencial. |

No se persiste, no se construye desde body/query y no contiene roles ni permisos de dominio.

## Error público

| Campo | Tipo | Regla |
|---|---|---|
| `code` | cadena | Estable y legible por máquina. |
| `message` | cadena | Seguro y comprensible; no contiene secretos ni trazas. |
| `details` | objeto opcional | Solo errores de validación con información permitida. |

## Estado de disponibilidad

| Campo | Tipo | Regla |
|---|---|---|
| `status` | literal | Siempre `ok` cuando la aplicación puede responder. |
| `service` | cadena | Nombre público del servicio, sin configuración interna. |
