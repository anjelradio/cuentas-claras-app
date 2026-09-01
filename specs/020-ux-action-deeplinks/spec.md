# Feature Specification: Deep-linking de Acciones y Apertura Automática de Modales en Gastos y Deudas

**Feature Branch**: `020-ux-action-deeplinks`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Vamos a hacer una mejora a nivel UX, experiencia del usuario... partiendo del home... sección con cosas importantes para el usuario que tiene que revisar (pagos pendientes de confirmación)... tienen un botón que dice revisar... me gustaría que al hacer clic a revisar me redirija a la pantalla del detalle del gasto y automáticamente se me abra el bottom sheet con la información de la persona que pagó y lo que adjuntó... Y lo mismo a nivel de deudas en el home: cuando hago clic a mis deudas -> lo que debo -> selecciono un gasto que debo, me lleva al detalle del gasto y automáticamente se me abra el bottom sheet de saldar deuda para pagarlo... lo que me deben se queda tal cual llevando al detalle... Y en el home del evento, el botón mis deudas busca únicamente respecto a ese evento con el mismo flujo de auto-apertura al hacer clic en lo que debo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apertura Automática de Verificación de Pago desde "Requiere atención" (Priority: P1) 🎯 MVP

Como usuario acreedor que pagó por otros en un gasto, quiero que al pulsar el botón "Revisar" en una tarjeta de "Requiere atención" del Home, la aplicación me redirija directamente al detalle del gasto y abra de forma automática el modal/bottom sheet de verificación de pago con el comprobante y datos del deudor ya seleccionados, para confirmar o rechazar el pago en un solo paso sin tener que buscar manualmente al participante en la lista.

**Why this priority**: Elimina fricción crítica en la conciliación de pagos pendientes; el acreedor no necesita desplazarse por la pantalla ni buscar entre participantes quién declaró el pago.

**Independent Test**:
- Existe un pago declarado en estado `pending_confirmation` para un gasto del usuario.
- El usuario pulsa "Revisar" en la tarjeta de "Requiere atención" del Home.
- La pantalla navega a `/expenses/[expenseId]?action=verify&splitId=[splitId]`.
- La página de detalle del gasto detecta los parámetros y despliega de inmediato el modal/bottom sheet de confirmación de pago del deudor correspondiente mostrando método, comprobante y botones "Confirmar pago" y "Rechazar".

**Acceptance Scenarios**:

1. **Given** una notificación de pago pendiente de verificación de "Juan" en el Home, **When** el usuario pulsa "Revisar", **Then** el navegador carga la página del gasto y abre inmediatamente el modal de verificación enfocado en el pago de Juan.
2. **Given** que el usuario confirma o rechaza el pago desde el modal abierto automáticamente, **When** finaliza la acción, **Then** el modal se cierra, la lista de participantes se actualiza y la notificación en el Home desaparece.
3. **Given** un enlace de revisión cuyo split o pago ya fue resuelto previamente, **When** la página carga, **Then** la página de detalle se muestra normalmente y no genera error ni abre un modal inválido.

---

### User Story 2 - Apertura Automática del Modal "Saldar mi deuda" desde "Mis Deudas" (Priority: P1)

Como usuario que consulta "Mis deudas" (en el Home general o en el Home del evento), quiero que al hacer clic en un gasto que adeudo en la lista "Lo que debes", el sistema me redirija a la pantalla de detalle del gasto y abra automáticamente el bottom sheet de "Saldar mi deuda", para seleccionar el método de pago (QR o Efectivo) y registrar mi comprobante sin tener que presionar manualmente el botón de acción dentro del detalle.

**Why this priority**: Agiliza el proceso de pago directo para el deudor; al hacer clic en lo que debe, entra directamente en el flujo de declaración de pago.

**Independent Test**:
- El usuario abre "Mis deudas" en el Home (o en un evento) y selecciona "Lo que debes".
- Pulsa sobre un gasto que adeuda.
- El navegador carga la página del gasto con el parámetro de saldar deuda (`?action=pay`).
- El bottom sheet de "Saldar mi deuda" se abre automáticamente con las opciones QR y Efectivo listas para ser utilizadas por el deudor.

**Acceptance Scenarios**:

1. **Given** un gasto listado en "Lo que debes", **When** el usuario hace clic sobre el ítem, **Then** navega al detalle del gasto y el bottom sheet "Saldar deuda" se abre automáticamente en primer plano.
2. **Given** que el usuario declara el pago (sube comprobante QR o declara en efectivo), **When** se envía exitosamente, **Then** el modal avanza al estado de confirmación / cierre y el gasto refleja el estado `pending_confirmation`.
3. **Given** un usuario que ya no tiene saldo adeudado en ese gasto (porque ya pagó o fue confirmado), **When** accede con el parámetro de pago, **Then** el modal no se abre o muestra que la deuda ya está saldada.

---

### User Story 3 - Navegación Estándar para "Lo que me deben" (Priority: P2)

Como usuario que consulta los gastos en "Lo que te deben", quiero hacer clic sobre un gasto por cobrar para abrir la pantalla de detalle del gasto en su vista general y revisar el estado consolidado de todos los participantes sin forzar la apertura de modales de pago.

**Why this priority**: En este escenario el usuario es el creador/acreedor del gasto y necesita ver la vista general del gasto (quiénes pagaron y quiénes faltan).

**Independent Test**:
- El usuario abre "Mis deudas" -> "Lo que te deben" y pulsa sobre un gasto.
- El sistema navega a `/expenses/[expenseId]` sin parámetros de auto-apertura y muestra la página de detalle normal.

**Acceptance Scenarios**:

1. **Given** un gasto listado en "Lo que te deben", **When** el usuario hace clic sobre él, **Then** navega a la URL limpia `/expenses/[expenseId]` y muestra el desglose estándar del gasto.

---

### User Story 4 - Consulta Contextual de Deudas en el Home del Evento (Priority: P2)

Como participante dentro de la pantalla de inicio de un evento (`/(event)/[eventId]`), quiero pulsar el botón "Mis deudas" para ver exclusivamente los saldos adeudados y por cobrar de ese evento, manteniendo la capacidad de auto-apertura del modal de pago al seleccionar un gasto que adeudo.

**Why this priority**: Asegura paridad funcional y consistencia entre el Home global y la vista contextual del evento.

**Independent Test**:
- El usuario abre "Mis deudas" dentro de un evento específico y verifica que solo figuren los gastos de ese evento.
- Al pulsar un gasto que debe, se ejecuta la auto-apertura del modal de saldar deuda.

**Acceptance Scenarios**:

1. **Given** el usuario en la página `/[eventId]`, **When** abre "Mis deudas" y selecciona un gasto adeudado de ese evento, **Then** se abre el detalle del gasto con el bottom sheet de pago abierto automáticamente.

---

## Edge Cases

- **Parámetros inválidos o inexistentes**: Si la URL contiene `?action=verify&splitId=...` con un `splitId` que no existe o que no pertenece a ese gasto, el sistema ignora el parámetro silenciosamente y muestra el detalle del gasto normalmente sin romper la interfaz.
- **Acceso no autorizado a la verificación**: Si un usuario que no es el creador/pagador del gasto accede con `?action=verify`, el modal de verificación no debe abrirse ni mostrar datos privados del comprobante.
- **Cierre del modal y limpieza de URL**: Al cerrar el modal/bottom sheet abierto automáticamente, la interfaz puede limpiar suavemente el query param de la URL (usando `window.history.replaceState` o router replace) para evitar que al refrescar la página se vuelva a abrir inesperadamente.
- **Carga inicial asíncrona**: Si el detalle del gasto se carga con estados de carga (skeletons), el modal/sheet debe abrirse de forma limpia tan pronto los datos del gasto estén disponibles, sin parpadeos o bloqueos.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El botón "Revisar" en las tarjetas de la sección "Requiere tu atención" DEBE redirigir a `/expenses/[expenseId]?action=verify&splitId=[splitId]` (incluyendo el identificador del split/participante a verificar).
- **FR-002**: La página de detalle del gasto (`/expenses/[expenseId]`) DEBE leer los query parameters `action` y `splitId` al montarse.
- **FR-003**: Cuando `action=verify` y se proporcione un `splitId` válido en un gasto pagado por el usuario actual, el sistema DEBE abrir automáticamente el modal/bottom sheet de verificación de pago correspondiente a ese participante.
- **FR-004**: Los ítems de la pestaña "Lo que debes" dentro del sheet "Mis deudas" (tanto en el Home principal como en el Home del evento) DEBEN redirigir a `/expenses/[expenseId]?action=pay`.
- **FR-005**: Cuando `action=pay` en un gasto donde el usuario conectado tiene una cuota pendiente de pago, la página de detalle del gasto DEBE abrir automáticamente el modal/bottom sheet de "Saldar mi deuda".
- **FR-006**: Los ítems de la pestaña "Lo que te deben" en "Mis deudas" DEBEN redirigir a la URL base `/expenses/[expenseId]` sin activar auto-aperturas de modales de pago.
- **FR-007**: El botón "Mis deudas" en el Home del evento (`/(event)/[eventId]`) DEBE filtrar las deudas exclusivamente para ese evento y preservar la navegación con auto-apertura al hacer clic en gastos adeudados.
- **FR-008**: Al cerrar el modal o completar la acción (confirmar pago, rechazar pago, o declarar pago), el sistema DEBE actualizar el estado visual de la página de forma reactiva y limpiar el query param de acción de la URL.

---

### Key Entities

- **ExpenseActionNavigation (Navegación con Acción en Gasto)**:
  - `expense_id`: Identificador del gasto de destino.
  - `action`: Tipo de acción contextual a activar (`"verify"` | `"pay"`).
  - `split_id`: Identificador opcional del split del participante para acciones de verificación.
- **PaymentVerificationContext**:
  - `split_id`: Identificador del split del participante que declaró el pago.
  - `payment_method`: `"cash"` | `"qr"`.
  - `proof_image_url`: Comprobante adjunto.
  - `status`: Estado del pago (`"pending_confirmation"`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El tiempo y número de clics requeridos para que un acreedor revise y confirme un pago declarado se reduce de 3 clics (Revisar -> Scroll -> Clic en participante) a 1 solo clic desde el Home.
- **SC-002**: El tiempo y número de clics requeridos para que un deudor inicie el pago de su deuda desde "Mis deudas" se reduce de 2 clics (Clic en deuda -> Clic en saldar deuda) a 1 solo clic.
- **SC-003**: El 100% de las navegaciones con deep-link de acción abren el modal correcto en menos de 500 ms tras completarse la carga de datos del gasto.
- **SC-004**: Cero errores de ejecución o excepciones en consola cuando se accede a un gasto con parámetros de acción inválidos o ya resueltos.

---

## Assumptions

- Los componentes de detalle de gasto ya cuentan con los modales/bottom sheets de "Saldar deuda" y "Verificar pago de participante", por lo que esta mejora orquesta su activación mediante estado y query parameters.
- La limpieza del query param en la URL tras abrir o cerrar el modal asegura que las recargas de página posteriores no reabran repetidamente el modal si el usuario navega internamente.
