# Feature Specification: Event Management

**Feature Branch**: `[###-feature-name]`

**Created**: 2026-08-30

**Status**: Draft

**Input**: User description: "$ARGUMENTS"

## Clarifications
### Session 2026-08-30
- Q: ¿Cómo se unen o son añadidos los usuarios como miembros a un evento? → A: Mediante un sistema de invitaciones (`event_invitations`). El propietario genera/solicita una invitación que devuelve un código único (`token_hash`) de 6 caracteres. Si ya existe uno válido, se reutiliza; si expiró o no existe, se crea uno nuevo. Los usuarios se unen usando este código, creándose un registro en `event_members` con estado `active`, `left` o `removed`.
- Q: ¿Puede el creador (propietario) abandonar su propio evento? → A: B (Sí, pero debe transferir la propiedad a otro miembro activo antes de salir).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Creación y Visualización de Eventos (Priority: P1)

Como usuario autenticado, quiero crear nuevos eventos, ver sus detalles y ver un listado de todos los eventos de los que formo parte, para poder organizar y llevar un registro de mis actividades.

**Why this priority**: La creación y visualización de eventos es la funcionalidad principal del módulo y la base para todas las demás interacciones.

**Independent Test**: Se puede probar completamente creando un nuevo evento a través de la API, listando los eventos del usuario para verlo y obteniendo sus detalles.

**Acceptance Scenarios**:

1. **Given** que soy un usuario autenticado, **When** proporciono valores válidos para `name`, `description`, `icon` (emoji) y `starts_at`, **Then** se crea un nuevo evento en estado `open` y quedo asignado como propietario.
2. **Given** que he creado múltiples eventos, **When** solicito la lista de mis eventos, **Then** recibo una lista resumida que contiene únicamente el `name`, `description`, `icon`, `status` y `starts_at` de cada evento.
3. **Given** el ID de un evento existente, **When** solicito sus detalles, **Then** recibo la información completa del evento, incluyendo el ID y nombre del propietario.

---

### User Story 2 - Modificación y Ciclo de Vida del Evento (Priority: P2)

Como propietario de un evento, quiero actualizar los detalles de mi evento, cambiar su `status` (abierto/cerrado) o eliminarlo lógicamente, para que la información del evento se mantenga precisa y relevante.

**Why this priority**: Actualizar y gestionar el ciclo de vida de un evento es esencial para mantener los datos correctos a lo largo del tiempo.

**Independent Test**: Se puede probar tomando un evento existente en estado `open`, actualizando sus detalles, cambiando su `status` a cerrado, y eventualmente eliminándolo si no tiene miembros activos.

**Acceptance Scenarios**:

1. **Given** que soy el propietario de un evento en estado `open`, **When** actualizo su `name`, `description`, `icon` o `starts_at`, **Then** los detalles del evento se guardan exitosamente.
2. **Given** que soy el propietario de un evento cerrado, **When** intento actualizar sus detalles, **Then** la actualización es rechazada porque el evento no está abierto.
3. **Given** que soy el propietario de un evento, **When** cambio su `status` a cerrado, **Then** el estado del evento se actualiza y se registra la fecha en `closed_at`.
4. **Given** que soy el propietario de un evento sin otros miembros activos, **When** elimino el evento, **Then** el evento es eliminado lógicamente (soft delete).
5. **Given** que soy el propietario de un evento que tiene miembros activos, **When** intento eliminar el evento, **Then** la eliminación es rechazada.

---

### User Story 3 - Gestión de Membresía del Evento (Priority: P3)

Como miembro de un evento, quiero poder unirme mediante un código de invitación y poder salir del evento (abandonarlo) si ya no deseo participar.

**Why this priority**: Permite a los usuarios gestionar sus asociaciones con eventos.

**Independent Test**: Se puede probar haciendo que un usuario se una a un evento usando un código de invitación válido, y luego verificando que puede salir del evento, cambiando su estado en la membresía.

**Acceptance Scenarios**:

1. **Given** que un evento tiene un código de invitación activo, **When** un usuario ingresa dicho código, **Then** es añadido a la tabla `event_members` con el estado `active`.
2. **Given** que un evento tiene un código expirado, **When** un usuario intenta usarlo, **Then** el sistema rechaza la solicitud indicando que expiró.
3. **Given** que soy un miembro `active` (y NO el propietario), **When** decido salir del evento, **Then** mi estado en la tabla `event_members` cambia a `left`.
4. **Given** que soy el propietario del evento, **When** intento salir del evento, **Then** el sistema me exige transferir la propiedad a otro miembro activo antes de poder salir.

---

### User Story 4 - Generación de Invitaciones (Priority: P2)

Como propietario de un evento, quiero poder generar una invitación (código, enlace o QR) para compartirla con otros usuarios y que se unan a mi evento.

**Why this priority**: Es el único mecanismo para que los eventos tengan participantes además del creador.

**Independent Test**: Se solicita una invitación para un evento; luego se vuelve a solicitar dentro del periodo de validez para comprobar que devuelve la misma, y se comprueba que genere una nueva si la anterior expiró.

**Acceptance Scenarios**:

1. **Given** que soy el propietario y el evento no tiene invitaciones, **When** solicito invitar a alguien, **Then** el sistema genera una nueva invitación con un `token_hash` de 6 caracteres y una fecha de expiración por defecto.
2. **Given** que soy el propietario y el evento tiene una invitación activa, **When** solicito invitar a alguien, **Then** el sistema me devuelve el mismo `token_hash` existente.
3. **Given** que soy el propietario y la invitación del evento ha expirado, **When** solicito invitar a alguien, **Then** el sistema crea una nueva invitación y me la devuelve.
4. **Given** que no soy el propietario del evento, **When** intento generar o solicitar una invitación, **Then** la solicitud es rechazada.

### Edge Cases

- ¿Qué sucede cuando un usuario intenta crear un evento con un icono emoji inválido?
- ¿Cómo maneja el sistema la visualización de detalles de un evento que ha sido eliminado lógicamente?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir a los usuarios autenticados crear eventos con `name`, `description`, `icon` (emoji) y `starts_at`.
- **FR-002**: El sistema MUST asignar automáticamente al creador como propietario del evento (a través de `user_id`) y establecer el `status` inicial como `open`.
- **FR-003**: El sistema MUST permitir al propietario del evento actualizar el `name`, `description`, `icon` y `starts_at` SOLO si el `status` del evento es `open`.
- **FR-004**: El sistema MUST permitir al propietario del evento cambiar el `status` entre `open` y `closed`. Cuando se cierra, se MUST registrar la marca de tiempo en `closed_at`.
- **FR-005**: El sistema MUST permitir al propietario del evento eliminar lógicamente el evento SOLO si no hay otros miembros asociados a él en la tabla de miembros del evento con estado `active`.
- **FR-006**: El sistema MUST proporcionar un endpoint para que los usuarios listen sus eventos, devolviendo un resumen que contenga únicamente: `name`, `description`, `icon`, `status` y `starts_at`.
- **FR-007**: El sistema MUST proporcionar un endpoint para ver los detalles del evento por ID, devolviendo todos los campos del evento más el ID y nombre del propietario.
- **FR-008**: El sistema MUST permitir a los usuarios salir (abandonar) de un evento, actualizando su estado a `left` en la tabla `event_members`. Si el usuario es el propietario, MUST transferir primero la propiedad a otro miembro activo.
- **FR-009**: El sistema MUST garantizar que solo los usuarios autenticados puedan realizar operaciones sobre los eventos.
- **FR-010**: El sistema MUST permitir SOLO al propietario solicitar invitaciones. La lógica MUST devolver una invitación existente si está activa, o crear una nueva si no existe o expiró.
- **FR-011**: El sistema MUST generar invitaciones con un `token_hash` de 6 caracteres alfanuméricos y un `expires_at` (basado en una variable de entorno, ej. 10 días por defecto).
- **FR-012**: El sistema MUST permitir a los usuarios unirse a un evento si proveen un `token_hash` válido y no expirado, creándose un registro en `event_members` con estado `active`.
- **FR-013**: El sistema MUST permitir al propietario transferir la propiedad de un evento a otro miembro activo (actualización del `user_id` en el evento).

### Key Entities

- **Event**: Representa una actividad o reunión. Atributos clave: ID, `name`, `description`, `icon` (emoji), `starts_at`, `status` (open/closed), `closed_at`, `user_id` (propietario, UUID). Soporta eliminación lógica.
- **Event Member**: Representa la asociación entre un Usuario y un Evento. Atributos clave: ID, `event_id`, `user_id`, `status` (active, left, removed), `qr_image` (string, null por defecto).
- **Event Invitation**: Representa una invitación para unirse a un evento. Atributos clave: ID, `event_id`, `token_hash` (6 caracteres alfanuméricos), `expires_at`.
- **User**: El creador/propietario de un evento, referenciado a través de una clave foránea UUID.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las solicitudes de creación de eventos con datos válidos por parte de usuarios autenticados son exitosas.
- **SC-002**: El 100% de los intentos de eliminar lógicamente un evento con miembros existentes son bloqueados correctamente.
- **SC-003**: El endpoint de listado de eventos devuelve con éxito solo el payload de datos resumidos para minimizar el uso de ancho de banda.
- **SC-004**: El sistema rastrea con precisión las transiciones de estado y registra la fecha de cierre cuando un evento es cerrado.

## Assumptions

- Los emojis se almacenan como caracteres de cadena estándar o códigos cortos (shortcodes) soportados por la base de datos.
- La tabla de usuarios ya existe y proporciona un UUID confiable para las relaciones de clave foránea.
- "Mis eventos" implica eventos en los que el usuario es el propietario o un miembro.
- La eliminación lógica implica que el registro del evento permanece en la base de datos con una marca de tiempo `deleted_at` o bandera similar, en lugar de ser eliminado físicamente.
- "Salir" de un evento implica actualizar el estado del usuario en la tabla `event_members` a `left`.
