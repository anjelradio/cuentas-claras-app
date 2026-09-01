# Feature Specification: Módulo de Pagos y Liquidación de Gastos (Efectivo y QR)

**Feature Branch**: `018-payments-module`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Ok, ahora la tarea va a ser implementar el módulo de pagos a nivel backend, un módulo de pagos. Bueno, esto nos va a servir para hacer pagos a gastos, gastos o expenses que nosotros estemos vinculados a ello. O sea, ahí yo como un miembro puede ser que, o sea, pertenezco a un evento y en este evento se realizan gastos y puede ser que yo esté incluido en ese gasto. Tal vez las salimos a comer o qué sé, con un grupo de amigos, es un evento, y estos amigos tal vez uno pagó por todos y luego tenemos que devolverle y puede ser que él me excluya, es decir que tal vez él me invitó yo no pago nada, él me invitó, así que yo no estoy involucrado en ese gasto. O sea, no estoy activo para pagar, pero sí puedo ver el gasto e información, pero si sí me incluyó, entonces yo sí soy activo para pagar. O sea, yo para pagar ese gasto tengo que hacer clic, ir a la pestaña de... o sea, tengo que irme a la página o en la que se muestra el detalle del gasto para yo comprobar y corroborar información como fecha y también la imagen del comprobante de la factura y puedo pagar, hacer clic en el botón de saldar mi deuda porque estoy saldando mi deuda y en base a ello hago clic y lo que pasaría es que me va a pedir dos, me va a dar dos opciones: pagas por QR, que es muy común acá en Bolivia, o quieres pagar en efectivo. Si yo selecciono en efectivo, la app me avisa y me va a decir: OK, seleccionaste efectivo, eso significa que tienes que pagar en efectivo. La persona se le va a notificar a la persona, o sea a la persona que pagó por todos, a lo que es el no sé, como el admin o el owner del gasto, se le va a notificar y la otra persona, o sea al que le llega esa notificación en la app va a confirmar de que realmente esa persona le pagó o va a rechazarlo. Sería algo más o menos así. Si yo selecciono en efectivo, la aplicación va a decir OK, tienes que pagar en efectivo. Tu petición va a quedar, o sea, tú al aceptar esto tu pago va a estar en pendiente confirmación hasta que la otra persona confirma realmente que tú le pagaste en efectivo. Eso sería prácticamente así. Y ahora, si yo selecciono por QR, lo que va a hacer la aplicación es mostrarme el QR al cual yo voy a pagar, o sea el QR de la persona, en este caso de la otra persona que pagó por todos. Si esa persona tiene un QR, la aplicación me va a lanzar el QR. Si no tiene un QR, la aplicación va a decirme que no hay un QR, que hable con la otra persona o que hable con la persona que pagó, diciéndole que registre un QR donde yo le pueda pagar. Pero si hay un QR, la aplicación me va a dar dos opciones: una para descargar el QR y otra para... y nada más. Y luego puedo descargar el QR y otro botón sería uno que diga: Ya pagué. Yo puedo seleccionar esa opción que dice ya pagué, hago clic en el botón de ya pagué y la aplicación lo que va a hacer es ahora demostrarme otra notificación diciéndome se notificará a la persona que pagó o al owner de este gasto que ya pagaste por QR. Ah, perdón, antes de ello, cuando digo ya pagué, entonces la aplicación ahora me va a pedir que yo ingrese la imagen del comprobante, que suba la imagen del comprobante de pago. Lo subo y luego ahora sí le doy en finalizar o continuar confirmar pago y luego me va a hacer una notificación de que se notificará a la persona, que ahora ya mi pago está en pendiente confirmación, se le va a notificar a la persona, a la persona que pagó por todos, que ella ya pague y esa persona lo que va a hacer es puede confirmar o rechazar si es verídico el pago o no. Sería algo más o menos así el método de pago. Así que si yo estoy incluido, entonces voy a poder hacer el pago y si yo soy la persona que creó lo que viene a ser el gasto, no debería de pagar porque yo ya pagué por todos únicamente tienen que devolverme las partes que cada uno me debe. Ya tenemos cierto avance en el backend para lo que es el manejo de gastos. Ahora únicamente queremos hacer justamente el pago, ¿OK? Esto va a ser una implementación a nivel backend/frontend, no se va a hacer un feature completo en esta primera versión. Es que ya prácticamente es para poder pagar. Entonces yo como un miembro que estoy incluido en un gasto tengo que poder pagar por QR o en efectivo. Por QR hay un flujo de comprobación, de enviar un comprobante y eso, y por efectivo solamente es una especie de que yo voy a decir que pago en efectivo. Y ahora yo como una persona que creó el gasto, o sea una persona que yo pagué por todos, a mí tendría que poder llegarme ciertos avisos y poder ver obviamente qué personas están en pendiente, o sea ver todos los pagos que se hicieron a mi gasto, que yo creé, que yo pagué por todos, ver todas las personas que han hecho un pago, que están en pendiente confirmación, que ya fueron confirmadas y personas que no han hecho ningún pago todavía. Después de eso...Tendría que poder verificar. pues yo creo que de las personas que tengo que confirmar, pues poder ver si es por efectivo, que la app me dice ahorita está mal por tipo efectivo, o de acuerdo. Si es coherente, tendría que también yo poder ver el comprobante que adjuntó la persona por que no se va a subir. O sea, ese sirve y ya poder ver la imagen. sería eso, ¿no? y claro, luego que yo pueda rechazar o aceptar."

## Clarifications

### Session 2026-09-01
- Q: ¿Puede un miembro deudor cancelar o reemplazar una declaración de pago que envió por error mientras está pendiente de confirmación? → A: De momento no; la declaración no puede ser cancelada ni revertida por el deudor. Queda en estado `pending_confirmation` y únicamente el pagador puede resolverla confirmando o rechazando el pago.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Declaración de pago de deuda por el deudor (Efectivo y QR) (Priority: P1)

Como miembro participante que tiene una cuota de deuda asignada en un gasto, quiero acceder al detalle del gasto y saldar mi deuda eligiendo entre pago en efectivo o transferencia por QR (con comprobante adjunto), para que el estado de mi cuota pase a pendiente de confirmación ante el pagador.

**Why this priority**: Es el punto de inicio de la liquidación de deudas individuales entre amigos y compañeros de evento.

**Independent Test**:
- Deudor entra al detalle del gasto.
- Si elige efectivo: confirma el mensaje informativo y la cuota pasa a "Pendiente de confirmación".
- Si elige QR: visualiza el QR del pagador (o alerta de no configurado), pulsa "Ya pagué", adjunta la imagen del comprobante de transferencia bancaria y confirma. La cuota pasa a "Pendiente de confirmación" con el comprobante adjunto.

**Acceptance Scenarios**:

1. **Given** un deudor con una cuota pendiente de 90 Bs. en un gasto, **When** pulsa "Saldar mi parte (Bs. 90.00)" y selecciona "Pagar en efectivo", **Then** el sistema registra el pago en estado `pending_confirmation` y actualiza la cuota a `pending_confirmation`.
2. **Given** un pagador con código QR configurado, **When** el deudor selecciona "Pagar con QR", **Then** el sistema muestra la imagen del QR con opción de descarga, y al pulsar "Ya pagué" le exige adjuntar la imagen del comprobante de transferencia antes de registrar la declaración en estado `pending_confirmation`.
3. **Given** un pagador sin código QR configurado, **When** el deudor selecciona "Pagar con QR", **Then** el sistema le advierte que el pagador aún no registró su código QR y le sugiere pagar en efectivo o contactar al pagador.

---

### User Story 2 - Verificación, confirmación y rechazo por el pagador del gasto (Priority: P1)

Como creador/pagador original de un gasto, quiero revisar las declaraciones de pago realizadas por los deudores en la sección de participantes, ver el comprobante de transferencia bancaria si fue por QR o la indicación de efectivo, y confirmar o rechazar cada pago.

**Why this priority**: Solo el acreedor receptor del dinero puede validar que los fondos fueron recibidos física o digitalmente en su cuenta.

**Independent Test**:
- El pagador abre el detalle del gasto.
- En la sección de participantes, hace clic en un miembro con estado "Por verificar".
- Se despliega el Bottom Sheet de verificación con los datos del pago y la imagen del comprobante (si fue por QR).
- Si pulsa "Verificado / Confirmar pago", la cuota y el pago pasan a `confirmed` / `paid`.
- Si pulsa "Rechazar", el pago pasa a `rejected` y la cuota vuelve a `pending` (Sin pagar).

**Acceptance Scenarios**:

1. **Given** un pago por QR en estado pendiente de confirmación, **When** el pagador abre el modal/bottom sheet de verificación, revisa el comprobante y pulsa "Confirmar pago", **Then** el sistema actualiza el estado a `confirmed`, marca la cuota como `paid` y recalcula los balances.
2. **Given** un pago en estado pendiente de confirmación, **When** el pagador pulsa "Rechazar pago", **Then** el sistema actualiza el pago a `rejected` y regresa la cuota a `pending` para que el deudor pueda corregir y volver a declarar.
3. **Given** un usuario que no es el pagador del gasto, **When** visualiza la lista de participantes, **Then** puede ver los estados de todos los miembros pero no puede hacer clic en ellos para confirmar ni rechazar.

---

### User Story 3 - Visualización contextual del detalle del gasto (Priority: P2)

Como usuario que consulta un gasto, quiero que la interfaz adapte sus acciones y botones según si soy el pagador (acciones de gestión) o un deudor (acción de saldar deuda).

**Why this priority**: Proporciona una experiencia intuitiva, clara y libre de errores operativos o accesos no autorizados.

**Independent Test**:
- Iniciar sesión como pagador: la vista muestra "Editar gasto" y "Anular gasto", sin botón de saldar deuda propia.
- Iniciar sesión como deudor: la vista muestra "Saldar mi parte (Bs. X.XX)", sin botones de editar ni anular.
- Iniciar sesión como miembro excluido / no deudor: no muestra botón de saldar deuda ni botones de edición.

**Acceptance Scenarios**:

1. **Given** el creador/pagador del gasto en la pantalla de detalle, **Then** visualiza los botones "Editar gasto" y "Anular gasto", y en la lista de participantes puede hacer clic en las declaraciones de pago.
2. **Given** un deudor con cuota pendiente en la pantalla de detalle, **Then** visualiza el botón "Saldar mi parte" y la lista de participantes en modo solo lectura.

---

### Edge Cases

- **Pago duplicado en proceso**: Si un miembro ya tiene una declaración en estado `pending_confirmation`, no puede enviar una nueva declaración ni cancelarla directamente hasta que el pagador la confirme o rechace.
- **Pagador intentando pagar su propio gasto**: La API y la interfaz bloquean cualquier intento de crear un pago donde el deudor sea el propio pagador.
- **Cuota de 0 Bs. o miembro excluido**: No se puede registrar un pago sobre una cuota inexistente o de monto 0.00 Bs.
- **Rechazo de archivo no válido en comprobante**: Si el archivo de comprobante QR supera 5 MB o no es imagen (JPEG, PNG, WebP), se rechaza de inmediato.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE exponer en la consulta de detalle de un gasto información contextual que permita identificar si el usuario actual es el pagador (`is_payer`), si tiene una cuota activa como deudor (`is_debtor`), y el estado de su cuota (`pending`, `pending_confirmation`, `paid`).
- **FR-002**: Si el usuario es el pagador del gasto, la interfaz DEBE mostrar las opciones de "Editar gasto" y "Anular gasto", y NO DEBE mostrar el botón de saldar deuda.
- **FR-003**: Si el usuario es un deudor con cuota pendiente, la interfaz DEBE mostrar el botón "Saldar mi parte" con el monto exacto adeudado, y NO DEBE mostrar las opciones de editar o anular el gasto.
- **FR-004**: Al hacer clic en "Saldar mi parte", el sistema DEBE desplegar un Bottom Sheet con dos métodos de pago: "Pagar en efectivo" y "Pagar con QR".
- **FR-005**: En la opción de Pago en Efectivo, el sistema DEBE registrar una declaración de pago de tipo `cash` en estado `pending_confirmation`.
- **FR-006**: En la opción de Pago con QR, el sistema DEBE consultar el código QR registrado por el pagador del gasto.
- **FR-007**: Si el pagador no tiene código QR registrado, el sistema DEBE alertar al deudor y sugerirle pagar en efectivo o contactar al pagador.
- **FR-008**: Si el pagador tiene código QR registrado, el sistema DEBE mostrar el código QR con opción de descarga, y al pulsar "Ya pagué", exigir la carga de una imagen de comprobante de transferencia bancaria (JPEG, PNG, WebP, máx 5 MB) almacenada en Cloudinary.
- **FR-009**: Tras subir el comprobante, el sistema DEBE registrar la declaración de pago de tipo `qr` con la URL del comprobante y estado `pending_confirmation`.
- **FR-010**: En la sección de participantes del detalle del gasto, el sistema DEBE listar a todos los participantes mostrando su estado: "Sin pagar", "Por verificar" (pendiente de confirmación) y "Pagado" (confirmado).
- **FR-011**: Si el usuario actual es el pagador del gasto, los ítems de participantes en estado "Por verificar" o "Pagado" DEBEN ser interactivos y abrir un Bottom Sheet con el detalle de la declaración de pago y la imagen del comprobante (si aplica).
- **FR-012**: El pagador DEBE poder "Confirmar pago" (cambiando el estado a `confirmed` y la cuota del deudor a `paid`) o "Rechazar pago" (cambiando el estado a `rejected` y revirtiendo la cuota a `pending`).
- **FR-013**: Si el usuario actual NO es el pagador del gasto, la lista de participantes DEBE ser de solo lectura.
- **FR-014**: El backend DEBE crear la entidad `Payment` con herencia de `BaseModel` (`id`, `created_at`, `updated_at`, `deleted_at`), vinculada al `split_id`, con método de pago (`cash`, `qr`), estado (`pending_confirmation`, `confirmed`, `rejected`), URL y public ID del comprobante, fecha de confirmación y motivo de rechazo opcional.
- **FR-015**: Una vez enviada la declaración de pago por el deudor, esta permanece inmutable en estado `pending_confirmation` y solo puede ser resuelta por el pagador mediante su confirmación o rechazo.
- **FR-016**: Las operaciones de confirmación y rechazo DEBEN ejecutarse dentro de transacciones atómicas y registrar las actividades correspondientes en el log de eventos.

### Key Entities

- **Payment (Declaración de Pago)**:
  - `id`: UUID único (BaseModel).
  - `split_id`: UUID (relación con ExpenseSplit).
  - `payment_method`: `"cash"` | `"qr"`.
  - `status`: `"pending_confirmation"` | `"confirmed"` | `"rejected"`.
  - `proof_image_url`: Texto opcional (URL de Cloudinary).
  - `proof_image_public_id`: Texto opcional (Public ID de Cloudinary).
  - `confirmed_at`: Fecha y hora opcional de confirmación.
  - `rejection_reason`: Texto opcional en caso de rechazo.
- **ExpenseSplit (Participación / Cuota)**:
  - `status`: `"pending"` | `"pending_confirmation"` | `"paid"`.
- **Expense (Gasto)**:
  - Provee `paid_by_member_id` para autorizar las confirmaciones/rechazos del acreedor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los deudores pueden completar la declaración de pago en menos de 20 segundos (efectivo) o 45 segundos (QR con comprobante).
- **SC-002**: El 100% de los pagos confirmados actualizan de forma atómica y sin inconsistencias el estado de la cuota a `paid` y los balances del evento.
- **SC-003**: El 100% de los pagos rechazados rehabilitan la cuota a `pending` permitiendo una nueva declaración sin bloqueos.
- **SC-004**: Los pagadores pueden inspeccionar el comprobante y resolver (confirmar o rechazar) un pago en menos de 10 segundos desde el detalle del gasto.

## Assumptions

- Las transferencias bancarias mediante QR operan con la aplicación externa de banca del usuario y se validan mediante la captura de pantalla del comprobante subido.
- La confirmación o rechazo es potestad exclusiva del miembro que pagó el gasto original.
