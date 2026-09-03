# Feature Specification: Dashboard y Analítica Visual del Evento

**Feature Branch**: `021-event-analytics-dashboard`

**Created**: 2026-09-03

**Status**: Draft

**Input**: User description: "Módulo de Dashboard y Analítica Visual del Evento. Permitir que los participantes de un evento consulten una vista consolidada de métricas, distribución de gastos y comportamiento financiero del grupo para comprender el estado global y su posición individual."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consulta del Resumen Financiero Global (KPIs del Evento) (Priority: P1)

Como miembro activo de un evento, quiero acceder a un panel de indicadores clave que me muestre de un vistazo cuánto dinero se ha gastado en total, cuántos gastos hay registrados y cuántas liquidaciones están pendientes, para comprender el estado financiero general del grupo sin revisar cada gasto individualmente.

**Why this priority**: Los KPIs globales son el punto de entrada principal del dashboard. Sin ellos, el resto de las métricas carecen de contexto y el usuario no puede orientarse dentro del evento.

**Independent Test**: El usuario abre la vista del dashboard de un evento con al menos un gasto registrado y puede ver el monto total acumulado del evento, el conteo de gastos y el número de liquidaciones pendientes, todos derivados de datos reales de la base de datos.

**Acceptance Scenarios**:

1. **Given** un miembro activo del evento con tres gastos registrados por un total de 450.00 Bs. y dos liquidaciones pendientes, **When** accede al dashboard del evento, **Then** el sistema muestra exactamente 450.00 Bs. como monto total, 3 como conteo de gastos y 2 como liquidaciones pendientes.
2. **Given** un evento sin gastos registrados, **When** el miembro accede al dashboard, **Then** el sistema muestra 0.00 Bs. en monto total, 0 gastos y 0 liquidaciones pendientes con un estado visual de "sin actividad".
3. **Given** un usuario que no pertenece al evento, **When** intenta acceder al dashboard del evento, **Then** el sistema deniega el acceso y retorna una respuesta de no autorizado.

---

### User Story 2 - Consulta del Balance Personal del Usuario (Priority: P1)

Como miembro activo de un evento, quiero ver mi balance financiero personal dentro del evento —cuánto he pagado, cuánto he consumido y si soy deudor, acreedor o estoy en balance neutro— para entender mi posición individual dentro del grupo.

**Why this priority**: El balance personal es la métrica más relevante para el usuario autenticado, ya que afecta directamente sus decisiones sobre pagos y reclamaciones dentro del evento.

**Independent Test**: El usuario abre el dashboard del evento y puede ver su propio balance con montos de lo pagado, lo consumido y la diferencia neta con su estado (deudor / acreedor / neutro), reflejando fielmente los movimientos reales del evento.

**Acceptance Scenarios**:

1. **Given** un miembro que pagó 200.00 Bs. en gastos y su consumo asignado es de 150.00 Bs., **When** consulta el dashboard, **Then** el sistema muestra pagado: 200.00 Bs., consumido: 150.00 Bs. y estado "acreedor" con diferencia de +50.00 Bs.
2. **Given** un miembro cuyo consumo asignado (80.00 Bs.) supera lo que pagó (20.00 Bs.), **When** consulta el dashboard, **Then** el sistema muestra pagado: 20.00 Bs., consumido: 80.00 Bs. y estado "deudor" con diferencia de -60.00 Bs.
3. **Given** un miembro cuyo consumo asignado es exactamente igual a lo que pagó, **When** consulta el dashboard, **Then** el sistema muestra el estado "neutro" y diferencia de 0.00 Bs.
4. **Given** dos miembros del mismo evento, **When** ambos consultan el dashboard simultáneamente, **Then** cada uno ve únicamente su propio balance personal, sin acceder al balance privado del otro.

---

### User Story 3 - Distribución de Gastos por Categoría (Priority: P2)

Como miembro activo de un evento, quiero ver un desglose de todos los gastos del evento agrupados por categoría —con el monto total y el porcentaje que representa cada una— para entender en qué rubros se concentra el gasto grupal.

**Why this priority**: La distribución por categoría convierte datos dispersos en inteligencia financiera accionable, permitiendo al grupo identificar patrones de consumo e informar futuras decisiones de presupuesto.

**Independent Test**: El usuario accede al dashboard y observa una lista o visualización de categorías con su monto acumulado y porcentaje calculado a partir de los gastos reales registrados. La suma de todos los porcentajes es 100% y la suma de todos los montos coincide con el monto total del evento.

**Acceptance Scenarios**:

1. **Given** un evento con 300.00 Bs. en Comida, 100.00 Bs. en Transporte y 100.00 Bs. en Hospedaje (total 500.00 Bs.), **When** el miembro consulta la distribución por categoría, **Then** el sistema muestra Comida: 300.00 Bs. (60%), Transporte: 100.00 Bs. (20%) y Hospedaje: 100.00 Bs. (20%).
2. **Given** un evento donde todos los gastos pertenecen a una única categoría, **When** se consulta la distribución, **Then** esa categoría aparece con el 100% y el monto total del evento.
3. **Given** un gasto eliminado lógicamente (deleted_at no nulo), **When** se calcula la distribución por categoría, **Then** ese gasto se excluye de todos los cálculos y agrupaciones.

---

### User Story 4 - Distribución de Aportes por Pagador (Priority: P2)

Como miembro activo de un evento, quiero ver cuánto capital ha aportado cada miembro del grupo al cubrir gastos, para comprender quién ha cargado con el mayor esfuerzo de financiamiento y facilitar la lectura de la equidad de pagos.

**Why this priority**: Entender quién aportó cuánto capital es esencial para validar la coherencia del evento y para que los miembros con mayor aporte comprendan su posición acreedora.

**Independent Test**: El usuario accede al dashboard y ve una lista de cada miembro junto al monto total que pagó como pagador de gastos, en orden descendente. La suma de todos los aportes coincide con el monto total del evento.

**Acceptance Scenarios**:

1. **Given** un evento donde el miembro A pagó 300.00 Bs. y el miembro B pagó 200.00 Bs., **When** se consulta la distribución por pagador, **Then** el sistema muestra miembro A: 300.00 Bs. (60%) y miembro B: 200.00 Bs. (40%), ordenados de mayor a menor aporte.
2. **Given** un miembro que no ha pagado ningún gasto como pagador (solo participa como beneficiario), **When** se consulta la distribución, **Then** ese miembro aparece con 0.00 Bs. de aporte o se omite de la lista según la regla de presentación.
3. **Given** que todos los miembros pagaron exactamente el mismo monto, **When** se consulta la distribución, **Then** todos aparecen con el mismo porcentaje y monto.

---

### User Story 5 - Evolución Temporal de Gastos (Cronología) (Priority: P3)

Como miembro activo de un evento, quiero ver una representación de cómo evolucionaron los gastos del evento a lo largo del tiempo, agrupados por fecha, para comprender el ritmo de gasto del grupo y detectar periodos de mayor actividad financiera.

**Why this priority**: La cronología de gastos aporta contexto histórico que enriquece el análisis del evento, aunque no es imprescindible para la toma de decisiones financieras inmediatas.

**Independent Test**: El usuario accede al dashboard y ve un listado o visualización de gastos agrupados por fecha, en orden cronológico, con el monto acumulado por día o periodo. El total acumulado coincide con el monto total del evento.

**Acceptance Scenarios**:

1. **Given** un evento con gastos registrados en tres fechas distintas, **When** el miembro consulta la evolución temporal, **Then** el sistema muestra tres puntos o filas con sus respectivas fechas, montos del día y monto acumulado hasta ese punto.
2. **Given** dos gastos registrados en la misma fecha, **When** se genera la cronología, **Then** ambos se agrupan bajo la misma fecha y sus montos se suman en un único registro del día.
3. **Given** un evento sin gastos, **When** se consulta la evolución temporal, **Then** el sistema muestra un estado vacío sin puntos de datos.

---

### Edge Cases

- ¿Qué ocurre si el monto total del evento es 0.00 Bs. al calcular porcentajes? El sistema debe mostrar 0% en todas las categorías y evitar divisiones por cero.
- ¿Qué sucede si un miembro activo fue añadido al evento después de que ya existían gastos? Su balance personal refleja únicamente las cuotas asignadas a él, independientemente del orden de ingreso.
- ¿Qué pasa si la moneda registrada en un gasto difiere de la moneda oficial del evento? El sistema no combina montos de diferentes monedas; aplica la moneda oficial del evento y señala gastos con discrepancia de moneda sin mezclarlos.
- ¿Qué ocurre si el dashboard recibe una solicitud de un usuario eliminado lógicamente o inactivo en el evento? El acceso es denegado con un error de autorización.
- ¿Qué pasa si hay gastos sin categoría asignada? Se agrupan bajo una categoría predeterminada "Otro" para no perder datos en la distribución.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE restringir el acceso al dashboard del evento exclusivamente a miembros activos del evento; cualquier otro usuario DEBE recibir una respuesta de acceso denegado.
- **FR-002**: El sistema DEBE calcular y exponer el monto total acumulado del evento sumando todos los gastos activos (no eliminados lógicamente) registrados en la moneda oficial del evento.
- **FR-003**: El sistema DEBE calcular y exponer el balance personal del usuario autenticado, incluyendo: (1) monto total pagado por el usuario como pagador de gastos del evento; (2) monto total consumido por el usuario, calculado como la suma de sus cuotas asignadas en todos los gastos activos del evento; (3) diferencia neta (pagado − consumido) y estado resultante: acreedor (positivo), deudor (negativo) o neutro (cero).
- **FR-004**: El sistema DEBE calcular y exponer el conteo total de gastos activos registrados en el evento.
- **FR-005**: El sistema DEBE calcular y exponer el conteo de liquidaciones o pagos en estado pendiente de confirmación dentro del evento.
- **FR-006**: El sistema DEBE calcular y exponer la distribución de gastos agrupados por categoría, incluyendo para cada categoría: monto total acumulado y porcentaje sobre el monto total del evento.
- **FR-007**: El sistema DEBE calcular y exponer la distribución de aportes por pagador, indicando para cada miembro el monto total que pagó como pagador de gastos y su porcentaje sobre el monto total del evento.
- **FR-008**: El sistema DEBE calcular y exponer la evolución temporal de gastos, agrupando los gastos activos por fecha de registro y exponiendo para cada fecha el monto acumulado del día y el monto acumulado hasta esa fecha.
- **FR-009**: Todos los cálculos financieros del dashboard DEBEN excluir gastos con deleted_at no nulo (eliminación lógica).
- **FR-010**: Todos los montos monetarios DEBEN calcularse con tipos de precisión decimal fija, sin pérdida de precisión por operaciones de punto flotante binario.
- **FR-011**: La suma de los montos por categoría (FR-006) y la suma de los aportes por pagador (FR-007) DEBEN ser iguales al monto total del evento (FR-002), garantizando coherencia financiera de las métricas.
- **FR-012**: Si el monto total del evento es 0.00, el sistema DEBE devolver 0% para todos los porcentajes sin generar errores aritméticos por división entre cero.

### Key Entities

- **EventDashboardSummary (Resumen del Dashboard del Evento)**:
  - total_spent: Decimal — monto total acumulado de gastos activos del evento.
  - expense_count: Entero — número de gastos activos registrados.
  - pending_settlements_count: Entero — número de liquidaciones o pagos en estado pendiente de confirmación.
  - personal_balance: Objeto con paid, consumed y net_difference (Decimal) y status (acreedor | deudor | neutro).

- **CategoryBreakdown (Distribución por Categoría)**:
  - category: Identificador de la categoría (food, transport, lodging, entertainment, shopping, other).
  - total_amount: Decimal — monto acumulado de la categoría.
  - percentage: Decimal — porcentaje del monto total del evento.

- **PayerContribution (Aporte por Pagador)**:
  - member_id: UUID del miembro.
  - display_name: Nombre visible del miembro.
  - total_paid: Decimal — monto total pagado como pagador de gastos.
  - percentage: Decimal — porcentaje del monto total del evento.

- **DailyExpensePoint (Punto de Evolución Temporal)**:
  - date: Fecha de registro (sin componente horario).
  - daily_total: Decimal — suma de gastos activos en esa fecha.
  - cumulative_total: Decimal — suma acumulada hasta esa fecha inclusive.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un miembro activo del evento puede consultar todos los KPIs del dashboard (monto total, conteo de gastos, balance personal, liquidaciones pendientes) en una sola vista sin necesidad de navegar a pantallas adicionales.
- **SC-002**: La suma de los montos por categoría mostrada al usuario es igual al monto total del evento en el 100% de los casos verificados.
- **SC-003**: La suma de los aportes por pagador mostrada al usuario es igual al monto total del evento en el 100% de los casos verificados.
- **SC-004**: El balance personal del usuario (pagado, consumido, diferencia) refleja con exactitud los movimientos reales confirmados en la base de datos, sin discrepancias observables.
- **SC-005**: El acceso al dashboard por parte de un usuario que no es miembro activo del evento es denegado en el 100% de los intentos, sin exponer ningún dato del evento.
- **SC-006**: Los tiempos de respuesta de las consultas de agregación del dashboard son percibidos como inmediatos por el usuario en condiciones normales de red.

---

## Assumptions

- Se asume que el evento tiene una moneda oficial configurada y que todos los gastos activos del evento están expresados en esa moneda; los gastos con discrepancia de moneda no se mezclan en las agregaciones.
- Se asume que "miembro activo" equivale a un usuario cuya membresía en el evento no ha sido eliminada lógicamente ni está suspendida.
- Se asume que el estado de "liquidación pendiente" corresponde a pagos en estado pending_confirmation dentro del ámbito del evento.
- Se asume que el balance personal se calcula en tiempo real a partir de los datos persistidos, sin caché de larga duración que pueda desincronizarse.
- Se asume que la funcionalidad es exclusivamente de lectura (consulta/analítica); no se realizan mutaciones desde el dashboard.
- El ámbito de implementación de esta funcionalidad es Transversal: requiere cambios tanto en app/client/ (visualización del dashboard) como en app/server/ (endpoints de agregación).
