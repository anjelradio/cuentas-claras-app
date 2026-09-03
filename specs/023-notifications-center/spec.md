# Feature Specification: Centro de Notificaciones y Acciones Pendientes

**Feature Branch**: `023-notifications-center`

**Created**: 2026-09-03

**Status**: Draft

**Input**: User description: "Permitir que el usuario consulte en un centro unificado los avisos y alertas del sistema que requieren su atención o confirman cambios relevantes dentro de sus eventos, ofreciendo accesos directos al contexto relevante y permitiendo marcar notificaciones como leídas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consulta del Centro de Notificaciones y Contador de No Leídas (Priority: P1)

Como usuario participante de uno o más eventos,
quiero ver un indicador de alertas no leídas en la barra de navegación y acceder a un listado cronológico de mis notificaciones,
para estar al tanto de los gastos, pagos y cambios que me involucran sin tener que revisar cada evento individualmente.

**Why this priority**: Es la funcionalidad esencial (MVP) que otorga visibilidad al usuario sobre la actividad que requiere su atención o afecta sus balances.

**Independent Test**: Puede probarse de forma independiente registrando un gasto que involucre al usuario; al iniciar sesión, el usuario observa el contador de alertas pendientes en la campana de navegación y al abrir el centro de notificaciones visualiza la alerta con fecha relativa y descripción clara.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado con 2 notificaciones no leídas, **When** carga cualquier pantalla del dashboard, **Then** el ícono de campana en la barra superior muestra un badge numérico con el valor "2".
2. **Given** un usuario que hace clic en el ícono de campana o navega a la sección de notificaciones, **When** se despliega el centro de notificaciones, **Then** visualiza sus notificaciones ordenadas cronológicamente (las más recientes primero), distinguiendo visualmente las no leídas de las leídas.
3. **Given** un usuario que no tiene ninguna notificación registrada, **When** accede al centro de notificaciones, **Then** observa un estado vacío informativo que indica que no cuenta con alertas pendientes.

---

### User Story 2 - Gestión del Estado de Lectura (Individual y en Lote) (Priority: P2)

Como usuario con notificaciones pendientes,
quiero poder marcar una notificación específica o todas las notificaciones como leídas,
para mantener mi bandeja organizada y despejar el contador de alertas pendientes.

**Why this priority**: Permite al usuario controlar su carga de atención y gestionar el ciclo de vida de sus avisos una vez que han sido revisados.

**Independent Test**: Puede probarse marcando una notificación individual y verificando que su estilo visual cambia a leída y el contador se reduce en 1; luego haciendo clic en "Marcar todas como leídas" y verificando que el contador pasa a cero.

**Acceptance Scenarios**:

1. **Given** una notificación no leída en el listado, **When** el usuario interactúa con la opción de marcar como leída, **Then** la notificación pasa a estado leído, su estilo visual cambia y el contador global de no leídas se reduce inmediatamente en 1.
2. **Given** múltiples notificaciones en estado no leído, **When** el usuario hace clic en el botón "Marcar todas como leídas", **Then** todas sus notificaciones pasan a estado leído y el badge numérico del contador desaparece o muestra cero.
3. **Given** un usuario que intenta marcar como leída una notificación que ya estaba leída, **When** se envía la solicitud, **Then** la operación es idempotente y confirma el estado sin generar error.

---

### User Story 3 - Navegación Contextual mediante Deep Links (Priority: P3)

Como usuario que recibe una notificación sobre un gasto o liquidación,
quiero hacer clic en la alerta y ser redirigido directamente al recurso correspondiente dentro de la aplicación,
para tomar acción o revisar el detalle sin buscar manualmente el evento o gasto.

**Why this priority**: Cierra el ciclo de interacción productiva, permitiendo que la notificación sea un atajo directo a la resolución de pagos y revisión de gastos.

**Independent Test**: Puede probarse haciendo clic en una notificación sobre un pago pendiente de confirmación; la aplicación navega directamente a la pantalla del evento o liquidación relevante.

**Acceptance Scenarios**:

1. **Given** una notificación sobre un nuevo gasto en el que participa el usuario, **When** el usuario hace clic en la notificación, **Then** es redirigido directamente al detalle del gasto dentro del evento correspondiente.
2. **Given** una notificación al acreedor sobre un pago registrado pendiente de validación, **When** el acreedor hace clic en la notificación, **Then** es redirigido a la sección de deudas/liquidaciones del evento para confirmar o rechazar el pago.
3. **Given** una notificación cuyo recurso asociado (gasto o evento) fue eliminado posteriormente, **When** el usuario hace clic en ella, **Then** la aplicación navega al contexto principal disponible y presenta un mensaje explicativo no intrusivo indicando que el recurso ya no está disponible.

---

### Edge Cases

- **Usuario intentando consultar o alterar notificaciones de otro usuario**: El sistema rechaza cualquier solicitud sobre notificaciones que no pertenezcan al identificador del usuario autenticado (`403 Forbidden` / `404 Not Found`), garantizando estricta privacidad.
- **Concurrencia entre pestañas o dispositivos**: Si el usuario marca notificaciones como leídas en un dispositivo y consulta en otro, la lectura se sincroniza y no se duplican conteos ni se generan estados inconsistentes.
- **Volumen alto de notificaciones**: Si un usuario tiene decenas de notificaciones acumuladas, el centro de notificaciones soporta paginación o límite de carga inicial para asegurar tiempos de respuesta instantáneos.
- **Recursos eliminados lógicamente**: Las notificaciones históricas preservan su texto descriptivo aunque el gasto o evento origen haya sido marcado con `deleted_at`, asegurando que el historial del usuario no se corrompa ni produzca errores de renderizado.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE garantizar aislamiento estricto por usuario: cada usuario únicamente puede visualizar, consultar el contador y modificar el estado de sus propias notificaciones.
- **FR-002**: El sistema DEBE generar automáticamente una notificación para cada participante incluido en una división al momento de crearse un nuevo gasto en un evento.
- **FR-003**: El sistema DEBE generar una notificación dirigida al acreedor cuando un participante declara o registra un pago hacia él, indicando que el pago está pendiente de confirmación.
- **FR-004**: El sistema DEBE generar una notificación dirigida al deudor cuando el acreedor confirma o rechaza un pago emitido por dicho deudor.
- **FR-005**: El sistema DEBE generar una notificación a los participantes afectados cuando un gasto en el que participaban sea modificado o eliminado lógicamente.
- **FR-006**: El sistema DEBE generar una notificación cuando un usuario es incorporado a un evento o cuando se le transfiere la propiedad del mismo.
- **FR-007**: Cada notificación DEBE almacenar su destinatario (`user_id`), tipo de evento (`type`), título, mensaje descriptivo, identificador del evento de origen, enlace o identificador de recurso destino (`target_url` / `resource_id`), estado de lectura (`is_read`) y fecha de creación (`created_at`).
- **FR-008**: El sistema DEBE proveer un endpoint eficiente que retorne el conteo exacto de notificaciones no leídas (`unread_count`) del usuario autenticado para alimentar el badge en la interfaz.
- **FR-009**: El sistema DEBE permitir marcar una notificación individual como leída mediante su identificador único, validando que pertenezca al usuario solicitante.
- **FR-010**: El sistema DEBE permitir marcar en lote todas las notificaciones no leídas del usuario autenticado como leídas en una única operación atómica.
- **FR-011**: Cada notificación DEBE proveer un enlace o ruta de navegación contextual que permita al usuario saltar directamente al recurso correspondiente (evento, gasto o liquidación).
- **FR-012**: Las notificaciones DEBEN ser estrictamente informativas y de navegación; ninguna notificación DEBE ejecutar transferencias, liquidaciones ni mutaciones financieras por el mero hecho de ser leída o consultada.

---

### Key Entities *(include if feature involves data)*

- **Notification (Notificación)**:
  - `id`: Identificador único universal (UUID).
  - `user_id`: Identificador del usuario destinatario (Better Auth / UserProxy).
  - `event_id`: Identificador del evento relacionado (opcional o de contexto).
  - `type`: Tipo de evento categorizado (ej. `EXPENSE_CREATED`, `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_REJECTED`, `EXPENSE_UPDATED`, `EXPENSE_DELETED`, `MEMBER_INVITED`, `ROLE_TRANSFERRED`).
  - `title`: Título breve del aviso (ej. "Nuevo gasto registrado").
  - `message`: Contenido explicativo del aviso (ej. "María López registró 'Almuerzo' por Bs. 150.00. Tu parte es Bs. 50.00").
  - `target_path`: Ruta interna de navegación contextual hacia el recurso (ej. `/events/{eventId}`, `/expenses/{expenseId}`, `/events/{eventId}/debts`).
  - `is_read`: Indicador booleano de estado de lectura (`false` por defecto).
  - `read_at`: Fecha y hora opcional en la que el usuario marcó la notificación como leída.
  - `created_at`: Fecha y hora de emisión del aviso.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El centro de notificaciones y el contador de no leídas cargan y se presentan al usuario en menos de 1 segundo en condiciones normales de red.
- **SC-002**: 100% de aislamiento de datos: ninguna consulta ni endpoint expone o permite modificar notificaciones pertenecientes a otro usuario (0 incidentes de fuga de datos o acceso cruzado).
- **SC-003**: La operación de marcar una notificación individual o todas como leídas actualiza el estado y el contador visual de forma inmediata en la interfaz.
- **SC-004**: Al menos el 95% de las notificaciones que cuentan con recurso activo dirigen al usuario al contexto relevante con un único clic desde la campana o centro de alertas.
- **SC-005**: La generación de notificaciones durante la creación de gastos o pagos no incrementa la latencia de las operaciones principales en más de 100 milisegundos.

---

## Assumptions

- Se reutiliza la infraestructura de autenticación existente basada en Better Auth y tokens JWT Bearer validados mediante JWKS en el backend de FastAPI.
- El módulo de notificaciones opera de manera síncrona/transaccional dentro de la base de datos PostgreSQL/SQLModel del sistema, registrando las filas de alertas en los mismos casos de uso o servicios de dominio que disparan los eventos correspondientes (gastos, pagos, membresías).
- En esta versión inicial (v1), las notificaciones se consultan vía HTTP (polling o revalidación al navegar) en la UI web mediante la campana y la vista centralizada; notificaciones push externas (Web Push / SMS / Email) quedan fuera del alcance de esta spec o se integrarán en extensiones futuras.
- Los textos de las notificaciones se generan en idioma español de acuerdo con las convenciones lingüísticas de la aplicación.
