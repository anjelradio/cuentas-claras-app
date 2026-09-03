# Data Model: Centro de Notificaciones y Acciones Pendientes

**Feature**: `023-notifications-center`
**Date**: 2026-09-03

---

## 1. Modelo Relacional y Entidades

La solución implementa una **arquitectura ligera**: en lugar de duplicar notificaciones en una tabla pesada, se aprovecha la tabla inmutable `activitylog` (`Registros_Actividad`) y se añade únicamente la tabla pivote `activity_read_receipt` (`Lecturas_Actividad`) para el seguimiento de lectura por usuario.

```
┌────────────────────────────────────────┐
│               activitylog              │
├────────────────────────────────────────┤
│ id: UUID (PK)                          │
│ event_id: VARCHAR (Index)              │
│ actor_id: VARCHAR (Index)              │
│ actor_name: VARCHAR                    │
│ target_id: VARCHAR (Nullable)          │
│ target_name: VARCHAR (Nullable)        │
│ action_type: VARCHAR (Index)           │
│ description: TEXT (Nullable)           │
│ created_at: TIMESTAMP WITH TIME ZONE   │
└──────────────────┬─────────────────────┘
                   │ 1
                   │
                   │ N
┌──────────────────▼─────────────────────┐
│         activity_read_receipt          │
├────────────────────────────────────────┤
│ id: UUID (PK)                          │
│ user_id: VARCHAR (Index)               │
│ activity_id: UUID (FK -> activitylog)  │
│ read_at: TIMESTAMP WITH TIME ZONE      │
├────────────────────────────────────────┤
│ UNIQUE(user_id, activity_id)           │
└────────────────────────────────────────┘
```

---

## 2. Definición del Modelo de Datos (SQLModel / SQLAlchemy)

### `ActivityReadReceipt`

```python
from datetime import UTC, datetime
from uuid import UUID, uuid4
from pydantic import ConfigDict
from sqlmodel import Field, Index, SQLModel, UniqueConstraint

from app.db.base import BaseModel


class ActivityReadReceipt(BaseModel, table=True):
    __tablename__ = "activity_read_receipt"
    __table_args__ = (
        UniqueConstraint("user_id", "activity_id", name="uq_activity_read_user_activity"),
        Index("ix_activity_read_receipt_user_activity", "user_id", "activity_id"),
    )

    user_id: str = Field(index=True, nullable=False)
    activity_id: UUID = Field(foreign_key="activitylog.id", index=True, nullable=False)
    read_at: datetime = Field(default_factory=lambda: datetime.now(UTC), nullable=False)

    model_config = ConfigDict(from_attributes=True)
```

---

## 3. Schemas de Transferencia de Datos (DTOs / Pydantic)

### `NotificationRead`
Representa una notificación proyectada para el usuario solicitante:
```python
class NotificationRead(BaseModel):
    id: UUID  # Identificador de la actividad
    event_id: str
    actor_id: str
    actor_name: str
    target_id: str | None = None
    target_name: str | None = None
    action_type: str
    title: str
    description: str
    target_path: str
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime
```

### `NotificationListResponse`
```python
class NotificationListResponse(BaseModel):
    items: list[NotificationRead]
    unread_count: int
    total: int
```

### `UnreadCountResponse`
```python
class UnreadCountResponse(BaseModel):
    unread_count: int
```

### `BatchReadResponse`
```python
class BatchReadResponse(BaseModel):
    marked_count: int
    status: str = "ok"
```

---

## 4. Mapeo de Títulos y Enlaces por Tipo de Acción (`action_type`)

| `action_type` | Título legible | `target_path` sugerido |
|---|---|---|
| `expense.created` | Nuevo gasto registrado | `/events/{event_id}` |
| `expense.updated` | Gasto modificado | `/events/{event_id}` |
| `expense.deleted` | Gasto anulado | `/events/{event_id}` |
| `payment.submitted` | Pago recibido por confirmar | `/events/{event_id}` |
| `payment.confirmed` | Pago confirmado | `/events/{event_id}` |
| `payment.rejected` | Pago rechazado | `/events/{event_id}` |
| `member.joined` | Nuevo participante en el evento | `/events/{event_id}/members` |
| `event.ownership_transferred` | Propiedad de evento transferida | `/events/{event_id}` |
