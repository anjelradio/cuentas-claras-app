# Quickstart: Centro de Notificaciones y Acciones Pendientes

**Feature**: `023-notifications-center`
**Date**: 2026-09-03

---

## 1. Prerrequisitos

- Base de datos PostgreSQL activa con migraciones al día.
- Backend FastAPI en ejecución (`http://localhost:8000`).
- Frontend Next.js en ejecución (`http://localhost:3000`).

---

## 2. Pasos de Verificación Rápida (Backend)

### 2.1. Aplicar la migración de Alembic

```bash
cd app/server
alembic upgrade head
```
*Verificación*: La tabla `activity_read_receipt` se crea exitosamente con su índice y restricción única `(user_id, activity_id)`.

### 2.2. Ejecutar la suite de pruebas automatizadas

```bash
cd app/server
pytest tests/unit/test_notification_service.py tests/api/test_notification_router.py
```
*Resultado esperado*: Todas las pruebas pasan sin errores (lectura individual, conteo, marcado masivo, aislamiento por usuario).

---

## 3. Flujo de Validación de Extremo a Extremo (Manual / API)

1. **Generar actividad**:
   - Inicia sesión como Usuario A (Carlos).
   - Registra un nuevo gasto en un evento donde Usuario B (Ana) es participante.
2. **Consultar conteo de alertas pendientes**:
   - Envía solicitud como Usuario B (Ana):
     ```bash
     curl -H "Authorization: Bearer <jwt_ana>" "http://localhost:8000/api/notifications/unread-count"
     ```
   - *Respuesta*: `{"unread_count": 1}`.
3. **Listar notificaciones**:
   - Envía solicitud como Usuario B:
     ```bash
     curl -H "Authorization: Bearer <jwt_ana>" "http://localhost:8000/api/notifications"
     ```
   - *Respuesta*: Lista con la alerta de gasto de Carlos, con `is_read = false`.
4. **Marcar como leída**:
   - Envía solicitud PATCH con el `activity_id`:
     ```bash
     curl -X PATCH -H "Authorization: Bearer <jwt_ana>" "http://localhost:8000/api/notifications/<activity_id>/read"
     ```
   - *Respuesta*: Retorna la notificación con `is_read: true`.
   - Consulta nuevamente el conteo de no leídas → Retorna `{"unread_count": 0}`.
5. **Marcar masivamente**:
   - Genera dos nuevas actividades desde la cuenta de Carlos.
   - Como Ana, ejecuta:
     ```bash
     curl -X POST -H "Authorization: Bearer <jwt_ana>" "http://localhost:8000/api/notifications/mark-all-read"
     ```
   - *Respuesta*: `{"marked_count": 2, "status": "ok"}`.
   - El conteo de no leídas regresa a `0`.

---

## 4. Verificación en la Interfaz de Usuario (Frontend)

1. Inicia sesión en `http://localhost:3000`.
2. En la barra superior, observa el ícono de la campana (`NotificationsBell`) con el badge numérico de alertas pendientes.
3. Haz clic en la campana para desplegar el panel/popover de notificaciones.
4. Verifica que cada notificación muestra:
   - Ícono representativo del tipo de acción.
   - Título y mensaje legible.
   - Fecha relativa (ej. "hace 5 min").
   - Indicador visual de no leída (punto o fondo destacado).
5. Haz clic en "Marcar todas como leídas": el badge se oculta y las notificaciones cambian a estilo leído.
6. Haz clic sobre una notificación: la aplicación navega directamente al detalle del evento o gasto correspondiente.
