# Feature Specification: Dashboard Principal, Liquidación de Deudas y Resumen Estadístico de Eventos

**Feature Branch**: `019-dashboard-debts-insights`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Lo que vamos a hacer en este feature va a ser implementar ciertas mejoras a nivel de interfaz o desarrollo, o sea, interacción, a nivel frontend y a nivel backend con ciertas cosas que falten. Por ejemplo, vamos a partir de la pantalla home. En la pantalla home hay un botón que dice Mis deudas. Tendría que mostrarnos exactamente las deudas que, como yo soy una persona que está en un evento y que yo puedo pagar por otras personas o después puede ser que otra persona pagó por mí, tengo que ver lo que yo debo y lo que me deben. Sería prácticamente eso. Entonces, el flujo sería que yo hago clic a Mis deudas y me tiene que mostrar lo que debo, cuánto es lo que debo, y lo que me deben, cuánto dinero tienen que darme en general. Cuando dice lo que debes, sí tendría que buscar a todos los eventos que yo participo y eventos que estén activos, eventos que participo y que están activos esos eventos. Esos eventos tienen gastos y de buscar y preguntar si en todos esos gastos yo debo. Yo tengo algún gasto, ¿tengo algún pago pendiente de algunos esos gastos? y una sumatoria de todo lo que debo realmente. Lo mismo con lo que me deben. A todos los eventos que participo busco en todos los gastos si yo soy dueño de algún gasto, si yo pagué algún gasto, ver qué cantidad está saldada y qué cantidad no está saldada. Después de ello, cuando hago click a una de las opciones, por ejemplo a lo que yo debo, se muestra todos los gastos. O sea, si tal vez debo generar 50 bolivianos, tal vez son de dos gastos distintos, 25 y 25 tiene que mostrarme, en un ítem de lo que es ese gasto. Y lo mismo cuando se viene a hacer lo otro, de lo que me deben, mostrarme todos los gastos que yo he generado y claramente es mostrarme cuánto es lo que se me debe en total. Sería prácticamente eso de la primera mejora. Ahora otra misma mejora a nivel de lo que es la página de home, hay una sección que dice requiere dotación [requiere atención]. Aquí lo que me va a mostrar es como una especie de notificaciones ítems, digamos un listado de todos los pagos que me hace a mí. Yo como una persona que pague por todos, tienen que todos esos deudores irme pagando, pero ellos me pagan por QR o me pagan por efectivo, pero todo eso pasa por una verificación. Me tiene que aparecer acá en esta sección de requiero verificación. esa persona ya pagó, espero tu confirmación, de que tal vez una persona pagó, me envió su QR, me envió su comprobante, yo tengo que ver si realmente es verídico y lo confirmo, ahí estaría. Pero ya está como tal digamos esa sección que es justamente para esa especie de notificaciones de todos los pagadores que me hacen a mí y que están en modo dependiente confirmación, que tiene un botón de revisar. Al momento de hacer click en revisar tendría que redirigirme a la página de detalles de gastos. Luego estaría en eventos recientes. Eventos recientes muestra todos los eventos a los que yo he asistido y creo que lo que podríamos hacer acá es mostrar todos los eventos, al menos solamente los dos últimos eventos del usuario conectado y acá ver en sí lo que he gastado yo en el evento. OK, el total de lo que yo he gastado. Hay que calcular todos los gastos que yo he hecho, o sea todos los gastos que yo generé de forma que efectivo, lo que sea, pero tengo que calcularlo. hay que tiene que estudiar bien cómo funciona el flujo de los gastos, hay que verlo bien. Y acá en los eventos tiene que mostrarme, consultar la base de datos todos los eventos, los últimos dos y a un lado también información de cuánto yo ya he gastado en este evento, cuánto se gastó de mi parte. y por último también la actividad reciente, otra sección actividad reciente que también tiene que consultarse a la base de datos que son las acciones de cada evento. O sea, yo participo en muchos eventos y estos eventos existe una tabla o un módulo de auditoría que se van grabando todas las actividades como creación, edición, etcétera. Todo eso tiene que estar acá en este home, una consulta pero de los últimos tres, por así decirlo, de las últimas tres, pero de todos los eventos a los cuales yo participo.Tal vez son las mejoras que tendría que hacerse únicamente en la página del home, que sí son más que todo consultas. Podríamos ofrecer más consultas acá. Después de ello, no sé si podríamos centralizar directamente ofrecer un módulo para únicamente esa parte. Pero bueno, hay que resolver, hay que solventar eso. Después tenemos ahora lo que es la página de un gasto, que sería como el detalle de un gasto, perdón, de un evento. El detalle de un evento. El home de un evento es una página que es el event ID, los corchetes, únicamente. y acá hay una sección que dice resumen estadístico. Acá en resumen estadístico actualmente son datos estáticos. Acá lo que se tiene que mostrar es por cada gasto que se hizo, cada gasto tiene una categoría vinculada. Hay que mostrar acá lo que es el gráfico con cuales distributivos para cada categoría y el total, el monto total de todas esas categorías, en sí, cuánto se gastó. Sería prácticamente eso, nada más. Sería eso, a no ser que las especificaciones sean realmente, digamos, bien. Y también en ese mismo home de lo que es el evento hay un botón que dice mis deudas. tendría que mostrar al usuario conectado todas las deudas que tiene, pero únicamente de este evento, nada más. es el sentido ya seleccionado. En el home principal eran las deudas de todos los eventos del usuario, pero acá en el home de un evento específico, al hacer clic en mis deudas, va a poder ver únicamente las deudas ya de este evento, un evento específico, no de todos sus eventos. Sería prácticamente eso. Hay que hacer esas implementaciones a nivel front-end y claramente hay consultas que no están hechas en el backend y por lo tanto hay que hacerlas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consulta Global y Específica de "Mis Deudas" (Lo que debo vs. Lo que me deben) (Priority: P1)

Como usuario participante de uno o más eventos, quiero pulsar el botón "Mis deudas" en la pantalla principal para ver de forma consolidada cuánto dinero debo en total y cuánto dinero me deben, pudiendo desglosar cada saldo en sus gastos individuales para acceder directamente a saldarlos o gestionarlos.

**Why this priority**: Es la necesidad financiera central de los usuarios para tener claridad inmediata de su balance de deudas y acreencias sin tener que revisar evento por evento.

**Independent Test**:
- El usuario pulsa "Mis deudas" en el Home:
  - Visualiza el total consolidado de "Debes" y "Te deben".
  - En la pestaña "Lo que debo", ve cada gasto con cuota pendiente o por verificar, su acreedor, monto y enlace al detalle.
  - En la pestaña "Lo que me deben", ve cada gasto creado/pagado por él con el monto total adeudado por los participantes restantes.
- El usuario entra al Home de un evento específico y pulsa "Mis deudas":
  - Visualiza exactamente los mismos totales y desgloses pero filtrados únicamente para las deudas y acreencias correspondientes a ese evento.

**Acceptance Scenarios**:

1. **Given** un usuario con deudas en dos eventos activos (25 Bs. en Evento A y 25 Bs. en Evento B), **When** pulsa "Mis deudas" en el Home general, **Then** el sistema muestra un total adeudado de 50.00 Bs. y lista ambos gastos con sus respectivos eventos y acreedores.
2. **Given** un usuario que pagó un gasto de 100 Bs. (con devolución pendiente de 60 Bs.), **When** consulta la pestaña "Lo que me deben", **Then** el sistema muestra 60.00 Bs. como monto total por cobrar y el detalle del gasto con los participantes que aún adeudan.
3. **Given** un usuario dentro del Home del Evento A, **When** pulsa "Mis deudas", **Then** el sistema muestra únicamente los 25.00 Bs. correspondientes al Evento A, excluyendo los gastos del Evento B.
4. **Given** un gasto donde una cuota ya fue confirmada como pagada, **Then** no suma en "Lo que debo" ni en "Lo que me deben".

---

### User Story 2 - Notificaciones y Pagos Pendientes de Verificación en "Requiere atención" (Priority: P1)

Como usuario que pagó por otros en un gasto, quiero ver en la sección "Requiere atención" del Home todos los pagos que los deudores han declarado (por efectivo o QR) y están pendientes de mi confirmación, para poder revisarlos rápidamente mediante un acceso directo.

**Why this priority**: Asegura que las declaraciones de pago no queden olvidadas y que el acreedor valide o rechace el dinero recibido de manera oportuna.

**Independent Test**:
- Un deudor declara un pago (efectivo o QR).
- El acreedor entra al Home: la sección "Requiere atención" muestra la notificación con el nombre del deudor, el gasto, el evento, el monto y el botón "Revisar".
- Al pulsar "Revisar", la aplicación navega directamente a la pantalla de detalle del gasto (`/expenses/[expenseId]`) donde el acreedor puede inspeccionar el comprobante y confirmar o rechazar.
- Cuando no hay pagos pendientes de confirmación, la sección muestra un estado vacío informativo.

**Acceptance Scenarios**:

1. **Given** un pago declarado en estado pendiente de confirmación hacia un gasto del usuario, **When** el usuario entra al Home, **Then** la sección "Requiere atención" muestra la tarjeta con deudor, monto, método (efectivo/QR) y botón "Revisar".
2. **Given** el usuario pulsa "Revisar" en una tarjeta de atención, **When** se ejecuta la navegación, **Then** redirige a la página de detalle del gasto correspondiente.
3. **Given** que el usuario confirma o rechaza el pago desde el detalle del gasto, **When** regresa al Home, **Then** esa tarjeta ya no figura en "Requiere atención".

---

### User Story 3 - Resumen Estadístico por Categoría en el Home del Evento (Priority: P2)

Como miembro de un evento, quiero consultar en el Home del evento el resumen estadístico con la distribución de gastos por categoría y el monto total gastado en el evento, para comprender en qué se consumió el presupuesto grupal.

**Why this priority**: Reemplaza las métricas estáticas mockeadas por datos agregados reales y categorizados del evento.

**Independent Test**:
- El usuario entra al Home de un evento con gastos registrados en diferentes categorías (comida, transporte, hospedaje, etc.).
- La tarjeta "Resumen estadístico" muestra el monto total gastado en el evento y los segmentos/porcentajes reales calculados dinámicamente por categoría con sus respectivos colores e íconos.

**Acceptance Scenarios**:

1. **Given** un evento con 300 Bs. en Comida y 100 Bs. en Transporte, **When** el usuario visualiza el "Resumen estadístico", **Then** el sistema muestra un total de 400.00 Bs., 75% en Comida (300 Bs.) y 25% en Transporte (100 Bs.).
2. **Given** un evento sin gastos registrados, **When** se visualiza la sección, **Then** muestra 0.00 Bs. con un estado neutral de sin gastos.

---

### User Story 4 - Visualización de Eventos Recientes con Total Personal Gastado (Priority: P2)

Como usuario autenticado, quiero ver en la pantalla principal los 2 eventos más recientes en los que participo y el monto total que he gastado personalmente en cada uno, para tener un acceso directo y visibilidad de mi consumo.

**Why this priority**: Brinda acceso rápido a los eventos activos del usuario e información financiera personalizada del costo real de su participación.

**Independent Test**:
- El usuario entra al Home: la sección "Eventos recientes" muestra los últimos 2 eventos del usuario con su nombre, ícono, fechas y la etiqueta "Gastaste Bs. X.XX" (calculando su aporte personal en gastos propios + sus cuotas en gastos de terceros).

**Acceptance Scenarios**:

1. **Given** un usuario que pagó un gasto de 100 Bs. (con 40 Bs. de aporte personal propio) y tiene una cuota de 30 Bs. en otro gasto del evento, **When** consulta sus eventos recientes en el Home, **Then** el monto personal gastado en ese evento muestra exactamente 70.00 Bs.
2. **Given** un usuario nuevo sin eventos, **Then** muestra una invitación para crear o unirse a un evento.

---

### User Story 5 - Actividad Reciente Global en el Home (Priority: P3)

Como usuario del sistema, quiero ver en el Home las últimas 3 actividades ocurridas en todos los eventos en los que participo, para estar al tanto de las novedades y cambios sin tener que entrar a cada evento.

**Why this priority**: Mantiene informado al usuario de las acciones grupales recientes (nuevos gastos, pagos declarados, confirmaciones).

**Independent Test**:
- El usuario consulta el Home y ve una lista con las 3 actividades más recientes ordenadas cronológicamente, indicando el actor, la acción, el evento y el tiempo relativo.

**Acceptance Scenarios**:

1. **Given** actividades generadas en Evento 1 y Evento 2, **When** el usuario entra al Home, **Then** el sistema muestra las 3 actividades más recientes a las que el usuario tiene acceso.

---

## Edge Cases

- **Usuario sin eventos o sin deudas**: Si el usuario no tiene deudas pendientes en ningún evento, "Mis deudas" muestra 0.00 Bs. y mensajes explicativos ("Estás al día con todos tus pagos" y "No tienes devoluciones pendientes").
- **Evento cerrado**: Los eventos cerrados se excluyen de los cálculos activos de deudas pendientes si así está determinado por las reglas del negocio, o se muestran con su estado correspondiente.
- **Gastos anulados**: Los gastos marcados como eliminados lógicamente (`deleted_at` no nulo) se excluyen estrictamente de todas las agregaciones y sumatorias.
- **Pagos rechazados**: Una cuota con pago rechazado vuelve a sumar en "Lo que debo" como saldo pendiente de pago.
- **Cuotas en verificación**: Las cuotas con declaración enviada pero aún no confirmada (`pending_confirmation`) se desglosan con su respectivo badge de estado ("Por verificar") dentro del total pendiente de liquidación.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE proveer un resumen consolidado de deudas del usuario que calcule:
  1. `total_i_owe`: Suma total de todas las cuotas de gastos asignadas al usuario que no han sido confirmadas como pagadas en eventos activos.
  2. `total_i_am_owed`: Suma total de los montos que otros participantes adeudan en gastos pagados por el usuario actual.
  3. Desglose detallado de cada gasto adeudado (nombre del gasto, nombre del evento, acreedor, monto, estado de pago).
  4. Desglose detallado de cada gasto por cobrar (nombre del gasto, nombre del evento, total adeudado por terceros, estado).
- **FR-002**: El sistema DEBE permitir filtrar el resumen de deudas (`total_i_owe`, `total_i_am_owed` y desgloses) de forma global (todos los eventos del usuario) o específico por un `event_id`.
- **FR-003**: En la pantalla Home general (`/home`), el botón "Mis deudas" DEBE abrir la vista/sheet con el resumen global de todas las deudas del usuario.
- **FR-004**: En la pantalla Home de un evento (`/(event)/[eventId]`), el botón "Mis deudas" DEBE abrir la vista/sheet con el resumen restringido exclusivamente a las deudas del evento actual.
- **FR-005**: Al hacer clic en un gasto dentro de la lista de deudas, el sistema DEBE redirigir al usuario al detalle del gasto (`/expenses/[expenseId]`).
- **FR-006**: El sistema DEBE listar en la sección "Requiere atención" del Home todos los pagos en estado `pending_confirmation` correspondientes a gastos donde el usuario actual es el pagador/acreedor.
- **FR-007**: Cada tarjeta de "Requiere atención" DEBE mostrar el nombre del deudor, monto, método de pago (`cash` o `qr`), nombre del gasto, nombre del evento y un botón "Revisar" que redirija a `/expenses/[expenseId]`.
- **FR-008**: Si no existen pagos pendientes de confirmación para el usuario, la sección "Requiere atención" DEBE mostrar un estado vacío amigable.
- **FR-009**: El sistema DEBE proveer en el Home los 2 eventos más recientes en los que el usuario es miembro activo, incluyendo el cálculo del gasto personal del usuario en cada evento:
  $$\text{Gasto Personal} = \sum (\text{Aporte personal en gastos pagados por el usuario}) + \sum (\text{Cuotas asignadas al usuario en gastos de terceros})$$
- **FR-010**: El sistema DEBE listar en el Home las 3 actividades más recientes del registro de auditoría (`ActivityLog`) pertenecientes a los eventos en los que el usuario participa.
- **FR-011**: El sistema DEBE proveer en el Home del evento (`/(event)/[eventId]`) el resumen estadístico con:
  1. Monto total gastado en el evento.
  2. Distribución de gastos agrupados por categoría (`food`, `lodging`, `transport`, `shopping`, `entertainment`, `other`), indicando el monto total por categoría, porcentaje y cantidad de gastos.
- **FR-012**: Las consultas agregadas del backend DEBEN garantizar integridad financiera utilizando tipos decimales de precisión fija y excluyendo registros eliminados lógicamente.

---

### Key Entities

- **UserDebtsSummary (Resumen de Deudas)**:
  - `total_i_owe`: Decimal con la suma de deudas del usuario.
  - `total_i_am_owed`: Decimal con la suma de acreencias del usuario.
  - `debts_to_pay`: Lista de cuotas adeudadas con detalle de gasto, evento, acreedor y estado.
  - `debts_to_collect`: Lista de gastos con deudas por cobrar de otros participantes.
- **PendingVerificationPayment (Pago por Verificar)**:
  - `payment_id`: UUID del pago.
  - `expense_id`: UUID del gasto.
  - `expense_name`: Nombre del gasto.
  - `event_id`: UUID del evento.
  - `event_name`: Nombre del evento.
  - `debtor_name`: Nombre del usuario que declara el pago.
  - `amount`: Monto declarado.
  - `payment_method`: `cash` | `qr`.
  - `created_at`: Fecha de la declaración.
- **EventCategoryStats (Estadísticas por Categoría)**:
  - `total_amount`: Monto total acumulado del evento.
  - `categories`: Lista de categorías con su nombre, icono/color, monto acumulado y porcentaje del total.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los usuarios pueden consultar su balance de deudas consolidado ("Lo que debo" y "Lo que me deben") en menos de 2 clics desde la pantalla principal.
- **SC-002**: El 100% de los pagos en estado `pending_confirmation` hacia gastos del usuario aparecen reflejados de inmediato en la sección "Requiere atención".
- **SC-003**: El desglose de gastos por categoría en el Home de evento refleja con 100% de exactitud la suma de los gastos activos registrados.
- **SC-004**: Los tiempos de respuesta para las consultas agregadas del Home y estadísticas de evento son menores a 300 ms en condiciones normales de red.

---

## Assumptions

- Los gastos eliminados lógicamente o cuotas liquidadas (`paid`) no se contabilizan como deudas pendientes.
- El gasto personal de un usuario en un evento contempla su consumo individual, independientemente de quién haya pagado la factura original.
- Las actividades recientes mostradas al usuario en el Home están acotadas estrictamente a los eventos donde el usuario es un miembro activo.
