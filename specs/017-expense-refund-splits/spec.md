# Feature Specification: División de Gastos con Exclusión del Pagador y Cálculo de Devolución

**Feature Branch**: `017-expense-refund-splits`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Ok, hay que editar el backend de lo que son los expenses, o sea, los gastos en sí. Cuando yo registro un gasto es porque yo lo pagué, ¿ok? Entonces se tiene que hacer la división entre las demás personas, pero no conmigo. O sea, actualmente existen dos tablas: una que es el split, o sea, la división, y luego está el expense directamente, si no me equivoco. Entonces yo cuando somos cuatro personas, debería crearse. Si lo divido, obviamente, o sea, a ver, yo no cuento. Soy yo y otras tres personas más. Si todas las tres personas están incluidas, entonces se generan tres splits. Si el pago era 200 bolivianos, se generan tres splits de cada uno 50 bolivianos. Y lo que tienen que pagarme, o sea, el gasto que se hizo fueron 200 bolivianos y el gasto que me van a devolver o el dinero que me van a devolver son 150 bolivianos. Sería algo más o menos así. Así que creo que estaría bien lo que viene a ser una parte que de alguna manera en la tabla, en el modelo, si no existe, lo que es el pago, el monto total, el monto y la devolución. Quiero llegar a eso: el monto y la devolución. ¿Ok? Sería algo más o menos así. Ahora puede que haya también eso cuando sea equitativo el monto o el pago o el gasto equitativo, pero creo que actualmente igual yo puedo hacer que cuando registro un gasto puedo dividirlo en diferentes cantidades. Ahí sí podría registrarme a mí mismo o como tal no, tampoco registrarme a mí mismo, yo no contaría. Puede ser que tal vez yo haya gastado 200 bolivianos. Entonces yo voy a ajustar únicamente los gastos de las otras personas. Es decir, la persona 2 va a pagar 50 bolivianos, la persona 3 va a pagar 100 bolivianos, algo así, y así, y la otra persona va a pagar 0 bolivianos o algo así. y obviamente yo no cuento en sí. La persona que genera el gasto es como que él nunca cuenta, por así decirlo. Así que creo que nunca se generaría un split del mismo. Puede ser que otro ejemplo, que yo haya gastado o haya pagado 200 bolivianos. Voy a generar el gasto de manera equitativa. por tanto, se genera el gasto. El monto total es de 200 bolivianos, pero la devolución o el retorno en total va a ser 250, porque todo fue equitativo, se hizo eso de equitativo, y luego se generan los tres splits de las otras personas, pero yo no. Yo no, el split se genera de las otras tres personas, o sea, de todas las personas que no fueron excluidas, y cada uno su split es de 50 bolivianos, algo más o menos así. Ahora sí, el mismo caso, pero que yo haya elegido la opción de que quiero que sea tal vez lo que viene a ser... tal vez quiero que sea, no lo sé, gastos de diferentes tamaños, es decir, que yo elija la opción de montos exactos. Yo tampoco cuento allí. O sea, no debería de contar yo. Por ejemplo, fueron 200 bolivianos. Entonces yo voy a poner que la persona 1, o sea, todos menos yo, la persona 1 va a pagar 200 bolivianos, es el total que yo gasté. y digamos que yo únicamente voy a pagar 30 bolivianos. Yo únicamente pago 30 bolivianos. Entonces lo que pasaría allí es que luego lo tengo que poner manualmente. Si yo pago 30, entonces la persona 1 va a pagar esto, tal vez 50 bolivianos; la persona 2 va a pagar otros 50 bolivianos, ya van 100; y la persona 3 va a pagar 70 bolivianos. Entonces la persona 1, 2, digamos que va a pagar 50; la persona 3 va a pagar 70 bolivianos. Ahí ya se hacen 170 bolivianos. Por ende, lo que sobró yo lo voy a pagar, o sea 30. Eso sería como ya a nivel de montos exactos, pero no se generaría un split mío y lo que yo pagué son 200 y lo que se me va a devolver va a ser 170. Quiero llegar a esa configuración o esa personalización tanto a nivel backend como frontend"

## Clarifications

### Session 2026-09-01
- Q: ¿Cómo debe registrar el sistema a un miembro al que se le asigna una cuota de 0.00 Bs. en la división por montos exactos? → A: No generar registro de `split` en la base de datos para miembros con cuota 0.00 Bs. (solo se generan para cuotas con montos mayores a 0).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro de gasto equitativo con exclusión del pagador y cálculo de devolución (Priority: P1)

Como usuario que realiza y paga un gasto para el grupo dentro de un evento, quiero que al seleccionar una división equitativa entre los participantes, el sistema genere divisiones únicamente para las otras personas que me deben dinero y calcule claramente el monto total que se me debe devolver, sin generar una deuda hacia mí mismo.

**Why this priority**: Es el flujo fundamental de contabilidad compartida de la aplicación. Al pagar un gasto, el pagador no se debe dinero a sí mismo; el sistema debe reflejar con exactitud la deuda real de los terceros y el total a recuperar.

**Independent Test**: Puede probarse registrando un gasto de 200 Bs. en un evento con 4 participantes (el pagador y 3 miembros). Al confirmar la división equitativa:
- Se crean exactamente 3 registros de deuda (splits) de 50 Bs. cada uno para los otros 3 miembros.
- No se genera registro de deuda para el pagador.
- El gasto refleja: Monto total pagado = 200 Bs., Monto a devolver (devolución) = 150 Bs., Aporte propio absorbido = 50 Bs.

**Acceptance Scenarios**:

1. **Given** un evento activo con 4 miembros donde el usuario A paga 200 Bs. de forma equitativa incluyendo a los otros 3 miembros, **When** el usuario confirma el registro del gasto, **Then** el sistema registra el gasto con monto total 200 Bs., monto de devolución 150 Bs. y genera exactamente 3 participaciones de 50 Bs. cada una para los miembros B, C y D.
2. **Given** un gasto equitativo donde el pagador excluye a 1 de los 3 miembros restantes (quedando 3 consumidores en total: pagador + 2 miembros), **When** se procesa el gasto de 200 Bs., **Then** el sistema calcula la cuota individual en 66.67 Bs. (con distribución exacta de centavos), asigna 2 participaciones a los miembros no excluidos por un total de 133.33 Bs. a devolver, y deja el aporte del pagador en 66.67 Bs.

---

### User Story 2 - Registro de gasto con montos exactos para otros miembros (Priority: P1)

Como pagador de un gasto con consumos diferenciados, quiero asignar manualmente los montos exactos que cada uno de los demás miembros debe pagar, viendo en tiempo real cuánto recuperaré y cuánto dinero aporto yo personalmente, sin que se cree una cuota para mí.

**Why this priority**: Permite registrar compras donde no todos consumieron lo mismo (por ejemplo, pedidos con diferentes platos o artículos). Es crítico para la flexibilidad financiera del usuario.

**Independent Test**: Puede probarse creando un gasto de 200 Bs. e ingresando montos exactos: Miembro B = 50 Bs., Miembro C = 50 Bs., Miembro D = 70 Bs. Al guardar:
- Se generan 3 participaciones individuales (50 Bs., 50 Bs., 70 Bs.).
- El monto a devolver se establece en 170 Bs.
- El aporte absorbido por el pagador se calcula automáticamente en 30 Bs. (200 - 170).

**Acceptance Scenarios**:

1. **Given** un gasto de 200 Bs., **When** el pagador asigna cuotas de 50 Bs. al Miembro B, 50 Bs. al Miembro C y 70 Bs. al Miembro D, **Then** el sistema valida que la suma a devolver (170 Bs.) no exceda el total (200 Bs.), registra 3 participaciones para dichos miembros y calcula el aporte del pagador en 30 Bs.
2. **Given** un formulario de asignación exacta, **When** el pagador ingresa montos cuya suma total supere el monto del gasto (por ejemplo, 220 Bs. para un gasto de 200 Bs.), **Then** el sistema bloquea el guardado e indica que el monto a devolver no puede exceder el total pagado.
3. **Given** un gasto exacto de 200 Bs. donde al Miembro B se le asigna 50 Bs. y al Miembro C se le asigna 0.00 Bs., **When** se confirma el gasto, **Then** el sistema genera únicamente 1 participación para el Miembro B (por 50 Bs.) y ninguna para el Miembro C.

---

### User Story 3 - Visualización clara del monto total, devolución y cuotas (Priority: P2)

Como miembro del evento, quiero ver en la lista y detalle de gastos el monto total pagado, el monto total a devolver al pagador y el desglose de quién debe cuánto, para tener transparencia total de las cuentas.

**Why this priority**: Brinda claridad y confianza a todos los integrantes del evento sobre cuánto dinero costó la actividad y cuánto dinero está pendiente de reembolso.

**Independent Test**: Puede probarse consultando el detalle de un gasto registrado. Debe mostrar:
- Monto total pagado.
- Quién realizó el pago.
- Monto total a devolver al pagador.
- Lista detallada de deudores con sus montos individuales y estados.

**Acceptance Scenarios**:

1. **Given** un gasto con monto total 200 Bs. y devolución de 150 Bs., **When** cualquier miembro del evento visualiza el detalle del gasto, **Then** la pantalla muestra explícitamente el total pagado (200 Bs.), la devolución esperada (150 Bs.) y las 3 cuotas pendientes de 50 Bs. de los demás participantes.
2. **Given** el listado general de gastos, **When** el usuario consulta sus gastos, **Then** los elementos resumen presentan el monto del gasto y las referencias de cobro o deuda claras.

---

### User Story 4 - Edición y recálculo consistente de devoluciones (Priority: P2)

Como organizador o creador de un gasto, quiero poder editar el monto, categoría o participantes del gasto y que las cuotas y el monto de devolución se recalculen de forma atómica y consistente.

**Why this priority**: Evita inconsistencias o deudas residuales huérfanas al corregir errores en gastos previamente registrados.

**Independent Test**: Modificar un gasto de 200 Bs. a 120 Bs. en modo equitativo entre 4 personas. Las 3 cuotas deben actualizarse a 30 Bs. cada una y la devolución a 90 Bs.

**Acceptance Scenarios**:

1. **Given** un gasto existente de 200 Bs. con 3 cuotas de 50 Bs., **When** el creador actualiza el monto total a 120 Bs. manteniendo los mismos participantes, **Then** el sistema actualiza las 3 cuotas a 30 Bs. cada una y el total de devolución a 90 Bs.

---

### Edge Cases

- **Gasto 100% personal o sin otros participantes**: Si el pagador no selecciona a ningún otro miembro para compartir el gasto, el monto total es pagado íntegramente por él, se generan 0 participaciones (splits) y el monto a devolver es 0.00 Bs.
- **Cuota de 0 Bs. en montos exactos**: Si a un miembro se le asigna 0.00 Bs. en el reparto exacto, el sistema no genera un registro de `split` en la base de datos para ese miembro.
- **División con decimales inexactos (centavos)**: Al dividir montos como 100 Bs. entre 3 personas (pagador + 2 miembros), la cuota teórica es 33.333... Bs. El sistema debe asignar 33.33 Bs. a cada participante con una regla determinista de redondeo, asegurando que la suma de las partes más el aporte del pagador coincida exactamente con el total del gasto.
- **Exclusión total de participantes**: No se permite confirmar un reparto donde todos los miembros queden excluidos si el usuario intentó marcar participantes sin asignar montos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE considerar al usuario que registra el gasto como el pagador exclusivo de dicho gasto.
- **FR-002**: El sistema NUNCA DEBE generar un registro de división o deuda (`split`) para el miembro que realizó el pago.
- **FR-003**: En la división equitativa (`split_type: equal`), el sistema DEBE calcular la cuota por persona dividiendo el monto total entre el total de consumidores (el pagador más los otros miembros seleccionados).
- **FR-004**: En la división equitativa, el sistema DEBE generar registros de división (`splits`) únicamente para los miembros seleccionados distintos del pagador.
- **FR-005**: El sistema DEBE almacenar y exponer en el gasto el monto total pagado (`amount` o `total_amount`) y el monto total a devolver (`total_refund` o `refund_amount`), donde el monto a devolver corresponde a la suma exacta de las cuotas de los demás miembros.
- **FR-006**: En la división por montos exactos (`split_type: exact`), el pagador DEBE poder definir el monto que corresponde pagar a cada uno de los otros miembros del evento.
- **FR-007**: En la división por montos exactos, el sistema SOLO DEBE generar registros de división (`splits`) para aquellos miembros cuya cuota asignada sea estrictamente mayor a cero (`amount > 0.00`), omitiendo a los miembros con cuota de 0.00 Bs.
- **FR-008**: En la división por montos exactos, la suma de las cuotas asignadas a los otros miembros (monto de devolución) NO DEBE exceder el monto total pagado (`0 <= total_refund <= total_amount`).
- **FR-009**: La diferencia entre el monto total pagado y el monto a devolver (`total_amount - total_refund`) DEBE considerarse como el aporte personal asumido directamente por el pagador.
- **FR-010**: El sistema DEBE asegurar que toda distribución monetaria conserve exactamente el total original y asigne cualquier residuo de centavos de manera determinista.
- **FR-011**: En la interfaz de selección de participantes, el sistema DEBE mostrar claramente la fila del pagador como "Este eres tú", indicando su aporte absorbido sin requerir que ingrese una cuota para sí mismo.
- **FR-012**: En la interfaz de participantes, el sistema DEBE mostrar un resumen en tiempo real con: Monto total del gasto, Monto a recuperar/devolver, y Aporte personal.
- **FR-013**: Las operaciones de balance y liquidación de deudas del evento DEBEN calcular los saldos pendientes utilizando únicamente los registros de deuda (`splits`) generados para los miembros deudores hacia el pagador.

### Key Entities

- **Expense (Gasto)**: Representa el desembolso económico realizado por un miembro para el evento. Contiene: identificador único, identificador del evento, identificador del miembro pagador, nombre, descripción opcional, categoría, fecha del gasto, monto total pagado (`amount`), monto total a devolver (`total_refund`), tipo de división (`equal` o `exact`), comprobante digital (opcional) y estado.
- **ExpenseSplit (Participación / Cuota de Deuda)**: Representa la deuda individual que un miembro participante tiene con el pagador del gasto. Contiene: identificador único, identificador del gasto, identificador del miembro deudor, monto adeudado (`amount`) y estado de pago (`pending`, `paid`, `cancelled`). El pagador no tiene registro en esta entidad.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los gastos registrados generan cero registros de división (`splits`) asociados al propio miembro pagador.
- **SC-002**: En el 100% de los gastos registrados, la suma de las participaciones (`splits`) creadas coincide exactamente con el valor del campo de devolución (`total_refund`).
- **SC-003**: En el 100% de los casos, la suma de la devolución (`total_refund`) más el aporte personal del pagador es exactamente igual al monto total del gasto (`total_amount`).
- **SC-004**: Los usuarios pueden completar la asignación y verificación de cuotas y devolución en menos de 10 segundos desde el formulario de participantes.

## Assumptions

- El usuario que registra el gasto es siempre el miembro que desembolsó los fondos inicialmente.
- Si en un evento solo hay 1 miembro (o nadie más participa del gasto), el pagador absorbe el 100% del gasto y la devolución es 0.00 Bs.
- Las deudas del evento se concilian entre los miembros deudores y el miembro pagador a través de las cuotas activas.
