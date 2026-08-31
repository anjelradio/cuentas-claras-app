# Feature Specification: Ciclo de vida del evento y QR de cobro

**Feature Branch**: `[010-event-lifecycle-qr]`

**Created**: 2026-08-30

**Status**: Draft

**Scope**: Transversal: `app/client/` y `app/server/`

**Input**: User description: "Completar las funcionalidades restantes de eventos: abandonar un evento, impedir que el dueño lo abandone antes de transferir la propiedad, refrescar correctamente los permisos después de transferirla, cerrar y reabrir eventos, y registrar o actualizar el QR personal de cobro mediante almacenamiento externo."

## Clarifications

### Session 2026-08-30

- Q: Cuando un evento esté cerrado, ¿qué acciones deben seguir permitidas además de que el dueño pueda reabrirlo? → A: El evento queda solo para consulta; ninguna persona puede modificarlo y únicamente el dueño actual puede reabrirlo.
- Q: Después de actualizar un QR correctamente, ¿debe eliminarse de Cloudinary la imagen anterior? → A: Sí; debe eliminarse después de que la nueva imagen y su asociación hayan quedado confirmadas.
- Q: Si un miembro abandona un evento, ¿qué debe ocurrir con su QR de cobro almacenado? → A: Debe eliminarse de Cloudinary y desvincularse de la membresía al abandonar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abandonar un evento abierto (Priority: P1)

Como miembro de un evento abierto, quiero abandonarlo desde mi lista de eventos para dejar de participar cuando ya no deseo formar parte del grupo.

**Why this priority**: Completa el control básico de pertenencia y evita que los usuarios dependan del dueño para retirarse.

**Independent Test**: Puede probarse con un miembro regular y un dueño sobre eventos abiertos y cerrados, verificando el diálogo, el resultado de la membresía y la actualización de la lista.

**Acceptance Scenarios**:

1. **Given** un miembro regular visualiza un evento abierto en su lista, **When** selecciona "Abandonar evento" y confirma el diálogo, **Then** deja de ser miembro activo, su QR personal se elimina y desvincula, el evento desaparece de su lista vigente y la vista refleja el cambio sin datos obsoletos.
2. **Given** un miembro regular abre el diálogo pero cancela, **When** vuelve a la lista, **Then** continúa dentro del evento y no se modifica ningún dato.
3. **Given** el dueño de un evento abierto intenta abandonarlo y confirma, **When** el sistema valida su relación actual, **Then** rechaza la operación, mantiene intacto el evento y le informa que primero debe transferir la propiedad.
4. **Given** un evento está cerrado, **When** cualquier miembro consulta su tarjeta, **Then** la acción para abandonarlo no está disponible.
5. **Given** un cliente desactualizado intenta abandonar un evento que ya fue cerrado, **When** se procesa la solicitud, **Then** la operación se rechaza y la membresía permanece intacta.

---

### User Story 2 - Transferir la propiedad sin conservar permisos obsoletos (Priority: P1)

Como dueño de un evento, quiero transferir la propiedad a un miembro activo para dejar de ser el organizador y permitir que la nueva persona administre el evento.

**Why this priority**: Es la condición necesaria para que un dueño pueda retirarse y protege la continuidad administrativa del evento.

**Independent Test**: Puede probarse transfiriendo un evento a otro miembro y comprobando que solo exista un dueño, que el dueño anterior pierda sus controles y que sea enviado a su lista actualizada de eventos.

**Acceptance Scenarios**:

1. **Given** el dueño consulta la lista de miembros, **When** selecciona un miembro activo, confirma la transferencia y la operación termina correctamente, **Then** el miembro elegido se convierte en el único dueño y el dueño anterior pasa a ser miembro regular.
2. **Given** la transferencia fue exitosa, **When** finaliza la confirmación, **Then** el dueño anterior es redirigido a "Mis eventos" y recibe una confirmación comprensible.
3. **Given** el dueño anterior vuelve a abrir el evento o su lista de miembros, **When** se carga la información actual, **Then** ya no ve acciones reservadas al dueño.
4. **Given** el destinatario dejó de ser miembro activo antes de confirmar, **When** se intenta transferir la propiedad, **Then** la operación se rechaza y el dueño actual no cambia.
5. **Given** un miembro que no es dueño intenta transferir la propiedad mediante una solicitud directa, **When** se valida la operación, **Then** se rechaza sin modificar roles ni membresías.

---

### User Story 3 - Cerrar y reabrir un evento (Priority: P2)

Como dueño, quiero cerrar un evento cuando su actividad termina y reabrirlo si el grupo necesita continuar trabajando en él.

**Why this priority**: Permite representar el ciclo real de los eventos y controlar acciones que solo tienen sentido mientras están abiertos.

**Independent Test**: Puede probarse alternando un evento entre abierto y cerrado como dueño, y repitiendo las solicitudes como miembro regular para verificar permisos y estado visible.

**Acceptance Scenarios**:

1. **Given** el dueño está en la página principal de un evento abierto, **When** confirma "Cerrar evento", **Then** el evento pasa a estado cerrado y la acción disponible cambia a "Reabrir evento".
2. **Given** el dueño está en un evento cerrado, **When** confirma "Reabrir evento", **Then** el evento vuelve a estado abierto y las acciones condicionadas por ese estado se actualizan.
3. **Given** un miembro regular consulta el evento, **When** se muestran las acciones, **Then** no ve controles para cerrar ni reabrir.
4. **Given** un miembro regular o un dueño anterior intenta cambiar el estado mediante una solicitud directa, **When** se valida su relación actual, **Then** la operación se rechaza y el estado permanece igual.
5. **Given** el estado cambió en otra sesión, **When** el usuario ejecuta una acción basada en información obsoleta, **Then** recibe un error claro y la vista se actualiza con el estado vigente.
6. **Given** un evento está cerrado, **When** un usuario intenta abandonar, transferir propiedad, editar el evento, gestionar miembros, enviar invitaciones o administrar su QR, **Then** la operación se rechaza y no se modifica ningún dato.

---

### User Story 4 - Registrar y actualizar mi QR de cobro (Priority: P2)

Como miembro activo de un evento abierto, quiero registrar mi QR personal de cobro para que quede asociado a mi participación y pueda reemplazarlo cuando cambie.

**Why this priority**: Facilita futuros pagos entre participantes y completa la información personal necesaria para saldar cuentas.

**Independent Test**: Puede probarse con una membresía sin QR y otra con QR, cargando una imagen válida, reemplazándola y provocando fallos de validación o almacenamiento.

**Acceptance Scenarios**:

1. **Given** el miembro no tiene un QR registrado, **When** selecciona "Registrar QR", **Then** se abre un panel inferior con un área accesible para elegir una imagen y una explicación breve del propósito.
2. **Given** el miembro elige una imagen válida y confirma, **When** la carga termina correctamente, **Then** la imagen queda asociada a su membresía, se muestra una confirmación y el panel presenta el QR almacenado.
3. **Given** el miembro ya tiene un QR, **When** abre la acción, **Then** ve la imagen vigente y una acción "Actualizar QR".
4. **Given** el miembro actualiza su QR con una imagen válida, **When** la sustitución termina correctamente, **Then** la nueva imagen reemplaza la referencia anterior y pasa a ser la única versión activa mostrada.
5. **Given** una carga o actualización falla, **When** termina el intento, **Then** se informa el error, la imagen anterior permanece vigente y el usuario puede volver a intentarlo.
6. **Given** un usuario no pertenece activamente al evento o el evento está cerrado, **When** intenta registrar o actualizar un QR mediante una solicitud directa, **Then** la operación se rechaza sin almacenar ni asociar la imagen.

### Edge Cases

- El dueño intenta abandonar al mismo tiempo que otra sesión transfiere la propiedad; cada operación debe decidirse usando la relación vigente al momento de procesarse.
- El miembro elegido para recibir la propiedad abandona o es removido antes de que se confirme la transferencia.
- Dos solicitudes de transferencia compiten; al finalizar debe existir exactamente un dueño y ninguna actualización parcial.
- Un usuario confirma dos veces abandonar, cerrar, reabrir o transferir debido a latencia; el resultado final debe ser consistente y no duplicar efectos.
- Un evento cambia de abierto a cerrado mientras un miembro mantiene abierta la confirmación para abandonarlo.
- El miembro que abandona tiene gastos, pagos o actividad histórica; pierde acceso como miembro activo, pero los registros históricos necesarios para integridad y auditoría se conservan.
- La imagen seleccionada está vacía, dañada, supera el límite permitido o usa un formato no admitido.
- La carga externa termina, pero falla la asociación con la membresía; el sistema no debe mostrar una referencia que no haya quedado confirmada.
- La sustitución del QR falla después de existir una imagen anterior; la referencia anterior debe mantenerse utilizable.
- El usuario pierde su membresía o sesión mientras el panel de QR está abierto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La lista de eventos DEBE ofrecer "Abandonar evento" únicamente para membresías activas de eventos abiertos.
- **FR-002**: Abandonar un evento DEBE requerir una confirmación explícita que permita cancelar sin producir cambios.
- **FR-003**: El sistema DEBE decidir el permiso para abandonar usando la identidad autenticada, la membresía vigente, la propiedad vigente y el estado actual del evento.
- **FR-004**: Al abandonar correctamente, la membresía del participante DEBE dejar de estar activa sin eliminar físicamente su historial de dominio. Su QR de cobro DEBE dejar de estar disponible y desvincularse de la membresía.
- **FR-005**: El dueño actual NO DEBE poder abandonar el evento mientras conserve la propiedad; el rechazo DEBE indicar que primero debe transferirla y no DEBE producir cambios parciales.
- **FR-006**: Ningún miembro DEBE poder abandonar un evento cerrado, incluso si intenta la operación desde una vista desactualizada o una solicitud directa.
- **FR-007**: El abandono se inicia exclusivamente desde "Mis eventos"; después de completarse correctamente, el usuario DEBE permanecer en esa ruta, la lista visible DEBE actualizarse y no DEBE continuar mostrando el evento como una membresía activa.
- **FR-008**: Solo el dueño actual DEBE poder transferir la propiedad y solo PUEDE transferirla a otro miembro activo del mismo evento.
- **FR-009**: La transferencia DEBE producir exactamente un dueño: el destinatario se convierte en dueño y el dueño anterior pasa a ser miembro regular dentro de una única operación consistente.
- **FR-010**: Una transferencia fallida NO DEBE modificar la propiedad, los permisos ni la membresía de ninguna de las personas involucradas.
- **FR-011**: Después de una transferencia exitosa, el dueño anterior DEBE ser redirigido a "Mis eventos" y toda consulta posterior DEBE reflejar sus permisos actualizados.
- **FR-012**: Solo el dueño actual DEBE ver y poder ejecutar la acción de cerrar o reabrir desde la página principal del evento.
- **FR-013**: Cerrar un evento abierto DEBE registrar su estado como cerrado y dejarlo disponible solo para consulta; mientras esté cerrado, toda mutación DEBE rechazarse —incluidos abandonar, unirse, transferir propiedad, editar o eliminar el evento, remover miembros, generar invitaciones y crear o actualizar QR— salvo que el dueño actual lo reabra. Reabrirlo DEBE devolverlo al estado abierto.
- **FR-014**: Después de cerrar o reabrir, la página principal y la lista de eventos DEBEN reflejar el estado vigente y presentar la siguiente acción válida.
- **FR-015**: Un cambio de estado solicitado por alguien que no sea el dueño actual DEBE rechazarse sin modificar el evento.
- **FR-016**: Todo miembro activo de un evento abierto DEBE poder abrir desde la página principal del evento un panel inferior para consultar y administrar exclusivamente su propio QR de cobro.
- **FR-017**: Cuando no exista QR, el panel DEBE mostrar un área de selección de archivo; cuando exista, DEBE mostrar la imagen vigente y la acción "Actualizar QR".
- **FR-018**: El sistema DEBE aceptar imágenes JPEG, PNG o WebP de hasta 5 MB y DEBE rechazar archivos vacíos, dañados, de otro formato o que excedan ese límite con un mensaje comprensible.
- **FR-019**: Una imagen aceptada DEBE almacenarse de forma duradera y su referencia DEBE quedar asociada únicamente a la membresía autenticada dentro del evento seleccionado.
- **FR-020**: La actualización de un QR DEBE reemplazar la referencia activa anterior solo después de que la nueva imagen y su asociación hayan quedado confirmadas.
- **FR-021**: Si una carga o actualización falla, el sistema DEBE conservar el QR previamente registrado, evitar referencias parciales y permitir un nuevo intento.
- **FR-027**: Después de confirmar una actualización de QR, el sistema DEBE eliminar del almacenamiento externo la imagen anterior. Si esa limpieza falla, NO DEBE revertir la nueva referencia confirmada ni exponer detalles internos; DEBE quedar disponible para un reintento seguro de limpieza.
- **FR-028**: Al abandonar correctamente un evento abierto, el sistema DEBE eliminar del almacenamiento externo el QR personal del miembro y desvincular su referencia de la membresía. Si la limpieza externa falla, NO DEBE volver a activar la membresía ni exponer detalles internos; DEBE quedar disponible para un reintento seguro de limpieza.
- **FR-022**: Las credenciales del servicio de imágenes y los detalles internos de almacenamiento NO DEBEN exponerse al navegador, a mensajes de interfaz ni a respuestas públicas de error.
- **FR-023**: Todas las mutaciones de esta feature DEBEN validar autenticación y autorización contextual en la fuente de verdad del negocio; ocultar controles en la interfaz no sustituye esa validación.
- **FR-024**: Cada operación exitosa DEBE actualizar el estado visible correspondiente; los errores recuperables y éxitos DEBEN comunicarse mediante notificaciones breves, claras y accesibles.
- **FR-025**: Los diálogos y paneles de esta feature DEBEN ser utilizables con teclado, conservar foco visible, restaurar el foco al cerrarse y funcionar sin desbordamiento horizontal en móvil y escritorio.
- **FR-026**: Esta feature NO DEBE modificar gastos, pagos, deudas ni actividad histórica al abandonar, transferir, cerrar, reabrir o cambiar un QR, salvo la relación o estado explícitamente indicado por la operación.

### Key Entities

- **Evento**: Grupo de gastos compartidos con un dueño único, un estado abierto o cerrado y una fecha opcional de cierre. Un evento cerrado es de solo consulta y solo su dueño puede reabrirlo.
- **Membresía de evento**: Relación entre una persona y un evento; identifica si está activa, si corresponde al dueño y la referencia opcional de su QR personal de cobro. Al abandonar se desactiva y conserva para integridad histórica, pero su QR se desvincula y se elimina del almacenamiento externo.
- **QR de cobro**: Imagen personal asociada a una membresía activa de un evento abierto. Tiene una referencia duradera y puede sustituirse; tras confirmar la sustitución se elimina la imagen anterior del almacenamiento externo, pero una actualización fallida no invalida la versión anterior.
- **Transferencia de propiedad**: Cambio atómico de dueño desde la persona propietaria actual hacia otro miembro activo, conservando al dueño anterior como miembro regular.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los miembros regulares que confirman abandonar un evento abierto dejan de verlo como membresía activa tras completarse la operación.
- **SC-002**: El 100% de los intentos del dueño por abandonar antes de transferir la propiedad son rechazados sin cambiar el dueño ni la membresía.
- **SC-003**: En el 100% de las transferencias exitosas existe exactamente un dueño, el dueño anterior pierde sus controles administrativos y llega a "Mis eventos" con información actualizada.
- **SC-004**: El 100% de los intentos de abandonar eventos cerrados o cambiar su estado sin ser dueño son rechazados sin efectos parciales.
- **SC-005**: Después de cerrar o reabrir, el estado y la acción siguiente se muestran actualizados en la página principal y en "Mis eventos" dentro de 2 segundos de completarse la operación, bajo condiciones normales de conexión.
- **SC-006**: Al menos el 95% de las cargas válidas de QR, bajo condiciones normales de conexión, muestran la imagen confirmada dentro de 5 segundos.
- **SC-007**: El 100% de las actualizaciones fallidas de QR conservan visible y utilizable la referencia anterior.
- **SC-008**: El 100% de los controles nuevos se pueden alcanzar y operar con teclado, poseen un nombre accesible y funcionan sin scroll horizontal en los tamaños móvil y escritorio soportados.
- **SC-009**: En pruebas de concurrencia de transferencia, abandono y cambio de estado, ninguna ejecución deja múltiples dueños, membresías parcialmente modificadas ni estados contradictorios.

## Assumptions

- Solo existen dos relaciones contextuales dentro del evento: dueño y miembro; transferir la propiedad convierte al dueño anterior en miembro regular.
- El abandono de un miembro regular está permitido aunque existan registros financieros históricos; esos registros se conservan y quedan fuera del alcance de modificación de esta feature.
- Cerrar un evento lo deja en modo de solo consulta: bloquea toda mutación de eventos, membresías y QR, y solo el dueño actual puede reabrirlo. El acceso de lectura se conserva.
- La visibilidad o uso del QR de otro miembro dentro de futuros flujos de pago queda fuera de alcance; esta feature cubre únicamente registrar, consultar y actualizar el QR propio.
- Cloudinary es el servicio externo seleccionado para alojar las imágenes. La elección de SDK, credenciales y transformaciones se definirá en el plan técnico; las imágenes de QR reemplazadas o desvinculadas al abandonar se eliminan después de confirmar el cambio y los fallos de limpieza se reintentan de forma segura.
- La autenticación, el cliente de comunicación, el módulo de eventos, la lista "Mis eventos", la página principal del evento y la gestión de miembros existentes serán reutilizados.
- El diseño visual existente de "Mis eventos" y Event Home seguirá siendo la referencia; esta feature añade estados y acciones sin rediseñar esas páginas completas.

## Out of Scope

- Liquidar automáticamente deudas o impedir el abandono por saldos pendientes.
- Eliminar o reasignar gastos, pagos, deudas o actividad histórica cuando un miembro abandona.
- Permitir múltiples dueños simultáneos o roles adicionales.
- Transferir la propiedad a una persona que todavía no pertenece activamente al evento.
- Capturar imágenes directamente desde la cámara, recortar el QR o interpretar su contenido.
- Generar un QR de cobro a partir de datos bancarios.
- Mostrar o utilizar el QR personal de otro miembro dentro de un flujo de pago.
