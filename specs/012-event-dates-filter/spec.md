# Feature Specification: Fechas y filtro de eventos

**Feature Branch**: `[012-event-dates-filter]`

**Created**: 2026-08-31

**Status**: Draft

**Scope**: Transversal: `app/client/` y `app/server/`

**Input**: User description: "Mejorar el módulo de eventos agregando fecha de fin en creación y edición, filtrado de eventos propios por estado activo y visibilidad completa de las fechas en el detalle."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Definir la duración de un evento (Priority: P1)

Como persona que organiza un evento, quiero indicar su fecha de inicio y su fecha de fin al crearlo o editarlo para comunicar con claridad cuánto dura.

**Why this priority**: La duración completa es información fundamental del evento y debe mantenerse coherente desde el registro hasta su consulta.

**Independent Test**: Puede probarse creando y editando un evento con fechas válidas y consultando después su detalle para verificar que ambas fechas permanecen visibles.

**Acceptance Scenarios**:

1. **Given** una persona autorizada crea un evento, **When** registra una fecha de inicio y una fecha de fin válida, **Then** el evento queda registrado con ambas fechas.
2. **Given** una persona autorizada edita un evento, **When** cambia la fecha de inicio, la fecha de fin o ambas, **Then** los valores actualizados quedan disponibles al volver a consultar el evento.
3. **Given** una persona intenta guardar una fecha de fin anterior a la fecha de inicio, **When** confirma el formulario, **Then** el sistema rechaza el cambio y muestra una indicación clara para corregir la fecha de fin.
4. **Given** la fecha de inicio y la fecha de fin son el mismo día, **When** se guarda el evento, **Then** el sistema acepta el evento como una actividad de un día.

---

### User Story 2 - Consultar todos mis eventos o solo los abiertos (Priority: P1)

Como participante, quiero consultar todos mis eventos o limitar la lista a los que siguen abiertos para encontrar rápidamente los eventos con los que todavía puedo interactuar.

**Why this priority**: Evita ocultar el historial de eventos y permite una vista enfocada cuando la persona solo necesita sus eventos activos.

**Independent Test**: Puede probarse con una persona que participa en eventos abiertos y cerrados, comprobando la lista completa y la lista filtrada.

**Acceptance Scenarios**:

1. **Given** una persona participa en eventos abiertos y cerrados, **When** solicita su lista sin aplicar filtro, **Then** recibe todos sus eventos vigentes, sin incluir eventos ajenos.
2. **Given** una persona participa en eventos abiertos y cerrados, **When** solicita únicamente sus eventos activos, **Then** recibe solo los eventos abiertos en los que participa.
3. **Given** una persona no tiene eventos abiertos, **When** solicita únicamente sus eventos activos, **Then** recibe una lista vacía y comprensible.

---

### User Story 3 - Ver la duración completa de un evento (Priority: P2)

Como miembro de un evento, quiero ver su fecha de inicio y su fecha de fin en el detalle para conocer el período al que corresponde.

**Why this priority**: Completa la información visible del evento y permite que sus miembros interpreten correctamente su duración.

**Independent Test**: Puede probarse consultando el detalle de un evento con fechas registradas y verificando que las dos se muestran sin contradicciones.

**Acceptance Scenarios**:

1. **Given** un miembro autorizado consulta el detalle de un evento, **When** la información se carga correctamente, **Then** recibe la fecha de inicio y la fecha de fin guardadas.
2. **Given** una persona sin acceso al evento intenta consultar su detalle, **When** realiza la solicitud, **Then** conserva el comportamiento de autorización vigente y no recibe información del evento.

### Edge Cases

- La fecha de fin coincide con la fecha de inicio; el evento representa una actividad de un solo día y se admite.
- La fecha de fin es anterior a la fecha de inicio; no se guarda ningún cambio parcial.
- Un evento se cierra o se reabre mientras se consulta la lista; el filtro de activos debe reflejar el estado vigente al momento de la consulta.
- La persona solicita solo eventos activos y no participa en ninguno; se devuelve una lista vacía, no un error.
- La persona intenta editar las fechas de un evento cerrado o sin permisos; se aplican las reglas de autorización y de solo consulta ya vigentes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE solicitar y guardar una fecha de fin junto con la fecha de inicio al crear un evento.
- **FR-002**: El sistema DEBE permitir que una persona autorizada actualice la fecha de inicio, la fecha de fin o ambas al editar un evento, respetando las reglas vigentes de permiso y estado.
- **FR-003**: El sistema NO DEBE aceptar una fecha de fin anterior a la fecha de inicio y DEBE comunicar el error de forma clara y accionable.
- **FR-004**: El sistema DEBE aceptar que las fechas de inicio y fin correspondan al mismo día.
- **FR-005**: La consulta del detalle de un evento DEBE incluir la fecha de inicio y la fecha de fin vigentes.
- **FR-006**: La consulta de los eventos de la persona autenticada DEBE devolver, de forma predeterminada, todos los eventos en los que participa activamente, sin importar si están abiertos o cerrados.
- **FR-007**: La consulta de los eventos de la persona autenticada DEBE permitir solicitar únicamente eventos activos; para esta feature, un evento activo es un evento en estado abierto.
- **FR-008**: Al solicitar únicamente eventos activos, el sistema DEBE excluir los eventos cerrados y los eventos de otras personas.
- **FR-009**: La ausencia de eventos que cumplan el filtro DEBE producir una lista vacía, no un error.
- **FR-010**: Las nuevas fechas y los resultados filtrados DEBEN respetar la autenticación, autorización contextual y las reglas de ciclo de vida de eventos ya vigentes.
- **FR-011**: La incorporación de fecha de fin NO DEBE alterar las reglas existentes para membresías, propiedad, cierre, reapertura, invitaciones, gastos ni QR de cobro.

### Key Entities

- **Evento**: Grupo de gastos compartidos con miembros, un dueño, un estado abierto o cerrado, una fecha de inicio y una fecha de fin. Un evento abierto se considera activo para el filtro de esta feature.
- **Participación en evento**: Relación vigente que determina qué eventos puede consultar una persona y qué operaciones puede realizar sobre ellos.
- **Período del evento**: Intervalo definido por la fecha de inicio y la fecha de fin; puede abarcar un único día, pero no puede terminar antes de empezar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los eventos creados o editados con datos válidos conservan una fecha de inicio y una fecha de fin al volver a consultarse.
- **SC-002**: El 100% de los intentos de guardar una fecha de fin anterior a la fecha de inicio se rechazan sin modificar las fechas previamente guardadas.
- **SC-003**: En pruebas con eventos abiertos y cerrados, el filtro de activos devuelve exclusivamente eventos abiertos de la persona autenticada en el 100% de los casos.
- **SC-004**: El 100% de las consultas de detalle autorizadas muestran ambas fechas del período del evento.
- **SC-005**: Una persona puede distinguir la lista completa de la lista de eventos activos y completar la consulta deseada en menos de 30 segundos en pruebas de usabilidad.

## Assumptions

- Los eventos existentes ya poseen una fecha de inicio; la incorporación de la fecha de fin se resolverá preservando la continuidad de los eventos ya registrados.
- El estado abierto existente equivale al concepto de “activo” solicitado para la lista; el estado cerrado queda excluido al aplicar ese filtro.
- La lista sin filtro conserva el alcance de eventos donde la persona mantiene una participación activa; el comportamiento de participaciones abandonadas o inactivas no cambia.
- Las fechas se capturan y muestran con el formato y la zona horaria que ya utiliza la aplicación para la fecha de inicio.
- La creación, edición, listado y detalle de eventos existentes serán reutilizados y ampliados, sin introducir nuevas funcionalidades de gastos, pagos o invitaciones.

## Out of Scope

- Cerrar automáticamente un evento cuando llegue su fecha de fin.
- Reprogramar eventos recurrentes o administrar múltiples períodos por evento.
- Crear filtros adicionales por rango de fechas, propietario, participantes u otros estados.
- Rediseñar por completo las pantallas de eventos, membresías, gastos, pagos o QR.
- Modificar reglas de autenticación, roles, propiedad o autorización existentes.
