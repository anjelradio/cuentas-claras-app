# Feature Specification: event-pages

**Feature Branch**: `[008-event-pages]`

**Created**: 2026-08-30

**Status**: Draft

**Input**: User description: "implementar más páginas en nuestro proyecto del frontend... my-events y members"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver Mis Eventos (Priority: P1)

Como usuario, quiero ver una lista de todos los eventos en los que participo (abiertos o cerrados) para poder revisarlos, abandonarlos o ingresar a sus detalles.

**Why this priority**: Es la vista principal para que los usuarios puedan interactuar con su historial de grupos y navegar a ellos.

**Independent Test**: Can be fully tested by navigating to `/my-events` (or `/(event)/my-events`) and verifying the events list renders properly based on the user's data.

**Acceptance Scenarios**:

1. **Given** el usuario autenticado tiene eventos activos y pasados, **When** navega a la página de "Mis Eventos", **Then** el sistema muestra una lista de eventos (mostrando icono, título, descripción, gasto total y estado).
2. **Given** el usuario quiere abandonar un evento activo, **When** hace clic en "Abandonar" y confirma en el diálogo, **Then** el usuario es removido del evento y este desaparece de su lista.

---

### User Story 2 - Ver y Administrar Miembros del Evento (Priority: P1)

Como organizador o participante de un evento, quiero ver a todos los miembros actuales del evento, poder invitar a nuevos y (si soy organizador) gestionar sus permisos o removerlos.

**Why this priority**: La gestión de miembros es crítica para que el evento funcione (agregar amigos, delegar organización, limpiar lista).

**Independent Test**: Can be fully tested by navigating to `/(event)/[eventId]/members`, viewing the list of users, and opening the invitation modal.

**Acceptance Scenarios**:

1. **Given** el usuario está en la página de miembros, **When** visualiza la pantalla, **Then** ve una lista de todos los participantes con sus respectivos roles (Organizador, Miembro).
2. **Given** un organizador en la página de miembros, **When** hace clic en invitar, **Then** se abre un Bottom Sheet/Modal ("Invitar personas") con opciones para generar código, QR o link.
3. **Given** un organizador en la página de miembros, **When** hace clic en eliminar a un miembro, **Then** se muestra un Alert Dialog de confirmación y, al confirmar, el miembro es removido.
4. **Given** un organizador en la página de miembros, **When** hace clic en ascender a un miembro a organizador, **Then** se muestra un Alert Dialog de confirmación y, al confirmar, el miembro obtiene rol de organizador.

### Edge Cases

- What happens when el usuario no tiene ningún evento creado o en el cual participa? Mostrar un estado "Empty" adecuado invitándolo a crear o unirse a uno.
- How does system handle cuando un usuario intenta eliminar o ascender a alguien pero no tiene permisos de organizador? Las acciones de administración no deben renderizarse o deben mostrar un estado bloqueado/deshabilitado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST proveer una página `/(event)/my-events` que liste los eventos del usuario autenticado.
- **FR-002**: Cada tarjeta de evento MUST mostrar el icono, título, descripción corta, monto de gasto total, estado (Abierto/Cerrado) y un botón para abandonar (solo si es permitido).
- **FR-003**: El sistema MUST proveer una página `/(event)/[eventId]/members` para listar los participantes del evento `eventId`.
- **FR-004**: La interfaz de invitar personas MUST usar un componente Sheet o Dialog de shadcn/ui.
- **FR-005**: Las acciones destructivas (Abandonar evento, Remover miembro, Ascender miembro) MUST estar protegidas por un Alert Dialog de confirmación nativo de shadcn/ui.
- **FR-006**: Si el diseño requiere un color fuera de la paleta estándar, se MUST utilizar clases utilitarias de Tailwind CSS (ej. `bg-[#181b27]`).

### Key Entities *(include if feature involves data)*

- **Evento (Event)**: Contiene atributos como nombre, descripción, estado (abierto/cerrado), gasto total, y lista de participantes.
- **Participante (EventMember)**: Contiene información del usuario, su rol en el evento (organizador, participante) y su fecha de ingreso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Las rutas `my-events` y `[eventId]/members` cargan exitosamente sin errores de routing.
- **SC-002**: Las pantallas replican el diseño HTML proporcionado en `design/event/my-events.html` y `design/event/members.html`, logrando un emparejamiento visual del 100%.
- **SC-003**: Todos los componentes interactivos (Modals de invitación, Alert Dialogs de confirmación) funcionan correctamente sin desbordamientos de pantalla en desktop o mobile.
- **SC-004**: Los colores y estilos mantienen los definidos por Tailwind y el design system.

## Assumptions

- Se asumirá que los datos mostrados inicialmente en las páginas pueden ser mockeados o conectados a servicios existentes si están disponibles, ya que la petición es de "implementación de frontend".
- El Header de la aplicación y layouts existentes (`(event)/layout.tsx`) servirán como envoltura para estas páginas sin requerir modificaciones mayores.
