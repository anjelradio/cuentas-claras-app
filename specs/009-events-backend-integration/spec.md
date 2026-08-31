# Feature Specification: events-backend-integration

**Feature Branch**: `009-events-backend-integration`

**Created**: 2026-08-30

**Status**: Draft

**Input**: User description: "Conectar el backend con el frontend para el módulo de eventos..."


## Clarifications

### Session 2026-08-30
- Q: ¿Qué acciones específicas puede realizar un 'organizador' que un 'miembro' estándar no puede? → A: Solo existe Dueño y Miembro. El dueño puede remover miembros o transferir la propiedad (ascender a dueño, perdiendo él su rol de dueño).
- Q: ¿Cómo se debe preservar el código de invitación cuando un usuario no autenticado hace clic en un enlace y es redirigido al flujo de inicio de sesión? → A: Parámetro en la URL (ej. `?redirect=...`).
- Q: ¿Los códigos hexadecimales de invitación generados por el backend caducan automáticamente después de cierto tiempo o permanecen válidos indefinidamente? → A: Caducan tras un tiempo definido (ej. 48 horas).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear y Editar Eventos (Priority: P1)

Como usuario, quiero crear nuevos eventos y editar los existentes para poder organizar gastos compartidos.

**Why this priority**: Es la funcionalidad central para la gestión de eventos. Sin esto, no se pueden crear ni actualizar eventos.

**Independent Test**: Puede probarse llenando el formulario del evento y creando o actualizando exitosamente un evento, verificado mediante la respuesta del backend y la navegación/notificación (toast) en la interfaz.

**Acceptance Scenarios**:

1. **Given** que estoy en la página de crear evento, **When** lleno el formulario (icono, nombre, fecha, descripción opcional) y lo envío, **Then** el evento se crea en el backend y veo un toast de éxito.
2. **Given** que estoy editando un evento existente, **When** envío los cambios, **Then** el evento se actualiza, la información se revalida, y veo un toast de éxito.

---

### User Story 2 - Ver Mis Eventos (Priority: P1)

Como usuario, quiero ver una lista de todos los eventos en los que participo.

**Why this priority**: Los usuarios necesitan una forma de navegar a sus eventos existentes.

**Independent Test**: Puede probarse navegando a `/my-events` y verificando que la lista coincida con la respuesta del endpoint del backend.

**Acceptance Scenarios**:

1. **Given** que tengo sesión iniciada, **When** visito la página de mis eventos, **Then** veo todos mis eventos obtenidos desde el backend.

---

### User Story 3 - Administrar Miembros del Evento (Priority: P1)

Como dueño del evento, quiero ver, remover o ascender a miembros en mi evento.

**Why this priority**: Crítico para la administración de los eventos.

**Independent Test**: Puede probarse visitando la página de miembros de un evento, viendo la lista y realizando una acción como remover a un miembro, lo que resulta en un toast y la revalidación de los datos.

**Acceptance Scenarios**:

1. **Given** que soy miembro de un evento, **When** visito la página de miembros, **Then** veo la lista de todos los miembros (usando el nuevo endpoint del backend).
2. **Given** que soy dueño de un evento, **When** remuevo a un miembro o transfiero la propiedad a otro, **Then** el backend procesa la mutación, se muestra un toast de éxito/error, y los datos se revalidan.

---

### User Story 4 - Invitar y Unirse a Eventos (Priority: P2)

Como usuario, quiero invitar a otras personas mediante enlace/QR/código, y como invitado, quiero unirme a un evento usando estos métodos.

**Why this priority**: Esencial para agregar múltiples personas a un evento.

**Independent Test**: Puede probarse generando una invitación (código/enlace/QR copiado) y luego usando ese código/enlace para unirse al evento como otro usuario.

**Acceptance Scenarios**:

1. **Given** que quiero invitar a alguien, **When** genero una invitación, **Then** el backend proporciona un código hexadecimal y el frontend ofrece un enlace, código QR, o código hexadecimal copiado a mi portapapeles con un toast.
2. **Given** que tengo un código hexadecimal, **When** lo introduzco en el input "Unirse" de la página de inicio, **Then** soy añadido al evento y redirigido a él.
3. **Given** que escaneo un QR o hago clic en un enlace de invitación, **When** tengo sesión iniciada, **Then** me uno al evento y soy redirigido. Si no tengo sesión iniciada, **Then** soy enviado primero al login, luego me uno y soy redirigido.

### Edge Cases

- ¿Qué pasa cuando un usuario intenta unirse a un evento en el que ya está?
- ¿Cómo maneja el sistema un código de invitación expirado o inválido?
- ¿Qué pasa cuando alguien que no es el dueño intenta remover a un miembro?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE conectar el `EventForm` a los endpoints del backend para crear y actualizar eventos.
- **FR-002**: El sistema DEBE obtener y mostrar los eventos del usuario en la página `/my-events` usando el endpoint existente del backend.
- **FR-003**: El backend DEBE proveer un nuevo endpoint para listar los miembros de un evento (devolviendo nombre, email y foto de perfil si existe), validando que el solicitante sea parte del evento.
- **FR-004**: El sistema DEBE permitir a los dueños de los eventos remover miembros o transferir la propiedad a otro miembro (lo que degrada al dueño actual), manejando las respuestas con toasts y detonando la revalidación de datos.
- **FR-005**: El sistema DEBE proveer un mecanismo de invitación donde el backend genere un código hexadecimal, y el frontend lo formatee como un código en texto, un enlace completo, o un código QR.
- **FR-006**: El sistema DEBE copiar el código en texto o enlace al portapapeles y mostrar un toast de éxito. El código QR DEBE mostrarse en un "bottom sheet" con opción de descarga.
- **FR-007**: El sistema DEBE permitir a los usuarios unirse a un evento manualmente mediante la introducción del código hexadecimal en la página de inicio.
- **FR-008**: El sistema DEBE interceptar los enlaces de invitación (o escaneos de QR) y unir automáticamente al usuario si tiene sesión iniciada, o redirigir al login usando un parámetro en la URL (ej. `?redirect=...`) y luego unirse si no tiene sesión iniciada.
- **FR-009**: El sistema DEBE manejar todos los estados de éxito y error de las mutaciones utilizando toasts de Sonner, descartando las respuestas de datos de mutación excepto los códigos de estado.
- **FR-010**: El endpoint de obtención de detalles del evento (`GET /api/events/{event_id}`) DEBE devolver una propiedad `is_owner` (booleano) para que el frontend pueda ocultar o mostrar componentes exclusivos del dueño (ej. Invitar, Editar).
- **FR-011**: Manejo de errores: (1) Si el backend devuelve un error distinto a 404, se mostrará el mensaje del backend en un toast. (2) Si el error es 404, se invocará `notFound()` de Next.js. (3) Si ocurre un error de conexión o error no controlado en el frontend, se hará un `throw new Error(...)` para mostrar la vista de `error.tsx`.

### Key Entities

- **Event**: Contiene icono, nombre, descripción, fecha y miembros.
- **Member**: Usuario que participa en un evento con un rol específico (solo 'dueño' o 'miembro'. Ascender a alguien transfiere la propiedad y degrada al dueño anterior).
- **Invitation**: Un código hexadecimal generado por el backend (que expira después de un tiempo definido, ej. 48 horas), utilizado por el frontend para construir enlaces o códigos QR.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los usuarios pueden crear y editar eventos exitosamente, persistiendo los datos en el backend.
- **SC-002**: La lista de miembros refleja con precisión los datos del backend y respeta los permisos basados en roles para las acciones de administración.
- **SC-003**: El sistema de invitaciones genera códigos/enlaces/QRs válidos que añaden exitosamente a los usuarios al evento.
- **SC-004**: El flujo de "Unirse vía Enlace/QR" redirige sin problemas a los usuarios no autenticados a través del proceso de inicio de sesión y hacia el evento sin perder el contexto de la invitación.
- **SC-005**: Todos los formularios y acciones proporcionan retroalimentación inmediata y clara mediante toasts en caso de éxito o fallo.

## Assumptions

- El backend ya soporta la creación, actualización y listado básico de eventos, requiriendo construir desde cero únicamente el endpoint de miembros.
- La configuración existente de toasts de Sonner del proyecto se utilizará para todas las notificaciones.
- La "generación de código QR" en el frontend utilizará una librería estándar compatible con React.
