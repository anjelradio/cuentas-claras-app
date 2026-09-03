# Research: Centro de Notificaciones y Acciones Pendientes

**Feature**: `023-notifications-center`
**Date**: 2026-09-03

---

## Decisión 1 — Arquitectura Ligera: Reutilización de `activitylog` con Tabla Pivote de Lecturas

- **Decision**: No crear una tabla `Notification` redundante. Utilizar la tabla existente `activitylog` (`Registros_Actividad`) como la fuente inmutable de eventos de dominio, y crear únicamente la tabla pivote `activity_read_receipt` (`Lecturas_Actividad`) para registrar qué usuario ha leído qué actividad.
- **Rationale**:
  - `activitylog` ya registra centralizadamente todos los eventos clave del sistema (`payment.submitted`, `payment.confirmed`, `payment.rejected`, `expense.created`, `expense.updated`, `expense.deleted`, `member.joined`, `member.left`, `member.removed`, `event.created`, `event.updated`, `event.ownership_transferred`).
  - Duplicar cada evento en una tabla independiente `Notification` por cada participante crearía sincronización redundante, mayor consumo de almacenamiento y riesgo de desalineación de datos si un gasto o pago cambia de estado.
  - La tabla pivote `activity_read_receipt` es extremadamente compacta: solo almacena `(id, user_id, activity_id, read_at)` con una restricción única `(user_id, activity_id)`.
- **Alternatives considered**:
  - *Tabla completa de notificaciones duplicadas*: Cada vez que se crea un gasto con 10 miembros, se insertarían 9 filas idénticas con títulos y mensajes desnormalizados. Descartado por ineficiencia y violación de la directriz arquitectónica del proyecto.
  - *Campo `is_read` en `activitylog`*: Imposible porque un evento es visible para múltiples miembros del evento; un flag en la propia actividad no permitiría modelar la lectura individual por participante.

---

## Decisión 2 — Reglas de Filtrado y Visibilidad de Alertas por Usuario

- **Decision**: Una actividad califica como "notificación" para el usuario autenticado si y solo si cumple:
  1. El usuario es miembro activo del evento (`eventmember.status = 'ACTIVE'` y `deleted_at IS NULL` para `event_id`).
  2. El usuario **no** es el actor de la actividad (`actor_id != current_user_id`), evitando que el usuario sea alertado sobre sus propias acciones.
  3. La actividad es relevante para el usuario:
     - Está dirigida específicamente a él (`target_id = current_user_id`, ej. pago recibido para confirmación, asignación de rol, pago confirmado/rechazado).
     - O es un evento global de su evento de interés (ej. nuevo gasto registrado, gasto modificado o eliminado, nuevo miembro incorporado).
- **Rationale**: Garantiza la privacidad y relevancia estipulada en FR-001; los usuarios nunca ven alertas sobre eventos a los que no pertenecen ni reciben avisos triviales de sus propias operaciones.
- **Alternatives considered**:
  - *Notificar también al actor*: Generaría ruido innecesario (el usuario que registra un gasto ya sabe que lo registró).

---

## Decisión 3 — Estrategia de Marcado de Lectura Masiva ("Marcar todas como leídas")

- **Decision**: Ejecutar una inserción masiva en `activity_read_receipt` con `ON CONFLICT (user_id, activity_id) DO NOTHING` basada en una subquery que selecciona todas las actividades visibles no leídas del usuario.
  ```sql
  INSERT INTO activity_read_receipt (id, user_id, activity_id, read_at)
  SELECT gen_random_uuid(), :user_id, a.id, NOW()
  FROM activitylog a
  JOIN eventmember em ON em.event_id = a.event_id
  WHERE em.user_id = :user_id AND em.status = 'ACTIVE' AND a.actor_id != :user_id
    AND NOT EXISTS (
      SELECT 1 FROM activity_read_receipt arr
      WHERE arr.user_id = :user_id AND arr.activity_id = a.id
    )
  ON CONFLICT (user_id, activity_id) DO NOTHING;
  ```
- **Rationale**: Operación atómica de un solo round-trip a la base de datos que garantiza idempotencia, escalabilidad y tiempo de respuesta inferior a 50 ms.
- **Alternatives considered**:
  - *Bucle en el servicio iterando fila por fila*: Ineficiente para usuarios con docenas de alertas pendientes.

---

## Decisión 4 — Mapeo de Enlaces Contextuales (Deep Links) y Mensajes Legibles

- **Decision**: El backend retorna tanto los datos estructurados del evento (`event_id`, `target_id`, `action_type`) como una ruta sugerida `target_path`. El frontend mapea cada `action_type` con su correspondiente ícono, etiqueta y enlace:
  - `expense.created` / `expense.updated`: `/events/{event_id}` (o `/expenses/{target_id}`)
  - `payment.submitted`: `/events/{event_id}` (sección liquidaciones para confirmar)
  - `payment.confirmed` / `payment.rejected`: `/events/{event_id}`
  - `member.joined` / `event.ownership_transferred`: `/events/{event_id}`
- **Rationale**: Las notificaciones son atajos de navegación que nunca ejecutan mutaciones financieras directamente (FR-012), facilitando que el usuario acceda inmediatamente al contexto donde puede confirmar un pago o auditar un gasto.
- **Alternatives considered**:
  - *Hardcodear URLs completas en el backend*: Vulnerable si la estructura de rutas del cliente web cambia en el futuro. Es mejor retornar rutas relativas normalizadas y tipos de evento.

---

## Decisión 5 — Estrategia de Actualización del Contador en el Frontend

- **Decision**: Componente cliente `NotificationsBell` con polling ligero / revalidación en foco (SWR / React cache) o trigger al interactuar con acciones principales, actualizando inmediatamente el estado local al marcar como leída.
- **Rationale**: Mantiene el sistema simple y confiable sin requerir WebSockets o servidores SSE dedicados, suficiente para el patrón de uso de gestión de gastos compartidos.
- **Alternatives considered**:
  - *WebSockets persistentes*: Complejidad operacional excesiva para el requerimiento actual; puede añadirse en futuras iteraciones si se requiere mensajería instantánea.
