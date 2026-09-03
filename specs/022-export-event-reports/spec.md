# Feature Specification: Exportación y Resumen Portable del Evento

**Feature Branch**: `022-export-event-reports`

**Created**: 2026-09-03

**Status**: Draft

**Input**: User description: "Módulo de Exportación y Resumen Portable del Evento. Permitir que un miembro autorizado de un evento descargue un reporte consolidado con la información financiera y operativa del evento para su consulta externa y respaldo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Descarga del Reporte en Formato CSV (Priority: P1)

Como miembro activo de un evento, quiero descargar un archivo CSV que contenga la lista completa de gastos del evento —con fecha, descripción, pagador, categoría, monto y método de división— para importar los datos a una hoja de cálculo y analizarlos externamente.

**Why this priority**: El CSV es el formato portable más universal para datos tabulares. Permite al usuario procesar, filtrar y compartir la información financiera del evento en cualquier herramienta externa (Excel, Google Sheets, etc.) sin depender de la aplicación. Es la forma más rápida de entregar valor exportable.

**Independent Test**: El usuario miembro activo de un evento con al menos un gasto registrado solicita la descarga del reporte CSV. El archivo descargado contiene una fila de encabezados y una fila por cada gasto activo del evento, con todos los campos correctos. Los montos en el archivo coinciden exactamente con los mostrados en la interfaz.

**Acceptance Scenarios**:

1. **Given** un miembro activo del evento con cinco gastos registrados, **When** solicita la descarga del reporte CSV, **Then** el sistema genera y entrega un archivo CSV con cinco filas de datos más la fila de encabezados, con campos de fecha, descripción, pagador, categoría, monto y método de división.
2. **Given** un evento con gastos de múltiples categorías y pagadores distintos, **When** el miembro descarga el CSV, **Then** cada fila refleja correctamente la información del gasto correspondiente y los montos son exactamente iguales a los registrados en la base de datos.
3. **Given** un gasto eliminado lógicamente del evento, **When** el miembro descarga el CSV, **Then** ese gasto no aparece en el archivo exportado.
4. **Given** un usuario que no es miembro activo del evento, **When** intenta solicitar la descarga del reporte CSV, **Then** el sistema deniega el acceso y el archivo no se genera.

---

### User Story 2 - Descarga del Reporte en Formato PDF (Priority: P1)

Como miembro activo de un evento, quiero descargar un archivo PDF con un resumen visualmente estructurado del evento —incluyendo el encabezado del evento, los balances individuales de cada participante y el historial de gastos— para compartirlo como documento de respaldo legible por cualquier persona sin requerir software especializado.

**Why this priority**: El PDF es el formato preferido para documentos de respaldo formal porque preserva el diseño, es universalmente legible sin instalación de software adicional y es adecuado para ser archivado o enviado como comprobante financiero entre participantes.

**Independent Test**: El usuario miembro activo solicita la descarga del reporte PDF. El archivo descargado es un PDF válido que contiene el nombre y moneda del evento, la lista de participantes con sus balances netos individuales, y el historial de gastos activos. Los totales en el PDF coinciden exactamente con los mostrados en la interfaz del evento.

**Acceptance Scenarios**:

1. **Given** un miembro activo del evento, **When** solicita el reporte en PDF, **Then** el sistema genera y entrega un archivo PDF que contiene: nombre del evento, moneda base, creador, fecha de creación, estado del evento, lista de participantes con sus balances netos y el historial de gastos activos.
2. **Given** un evento con tres participantes cuyos balances netos son distintos (uno acreedor, uno deudor, uno neutro), **When** se descarga el PDF, **Then** el documento muestra correctamente el balance neto de cada participante, coherente con las cifras del sistema.
3. **Given** un usuario que no es miembro activo del evento, **When** intenta solicitar la descarga del PDF, **Then** el sistema deniega el acceso y no se entrega ningún archivo.
4. **Given** un evento sin gastos registrados, **When** un miembro activo solicita el reporte en PDF, **Then** el sistema genera el PDF con el encabezado del evento y los participantes, indicando que no hay gastos registrados, sin generar errores.

---

### User Story 3 - Inclusión del Estado de Liquidaciones en el Reporte (Priority: P2)

Como miembro activo de un evento, quiero que el reporte exportado incluya el estado de las liquidaciones entre participantes —qué deudas están saldadas y cuáles permanecen pendientes— para tener una imagen completa del estado financiero del grupo al momento de la exportación.

**Why this priority**: Los balances individuales y el historial de gastos son incompletos sin el estado de las deudas. Incluir el estado de liquidaciones convierte el reporte en un documento financiero autosuficiente, útil para cierres de eventos o auditorías informales.

**Independent Test**: El usuario descarga el reporte (CSV o PDF) de un evento con al menos una liquidación saldada y una pendiente. El reporte incluye una sección o columna de liquidaciones donde ambos estados son visibles y coinciden con los registros reales del sistema.

**Acceptance Scenarios**:

1. **Given** un evento con dos pagos entre participantes —uno confirmado y otro pendiente de confirmación—, **When** el miembro descarga el reporte, **Then** el reporte distingue claramente cuál está saldado y cuál permanece pendiente, con los montos y participantes involucrados.
2. **Given** un evento donde todas las deudas han sido saldadas, **When** el miembro descarga el reporte, **Then** el reporte indica que no hay liquidaciones pendientes y todas las deudas figuran como saldadas.
3. **Given** un evento sin pagos registrados, **When** se descarga el reporte, **Then** la sección de liquidaciones indica que no hay movimientos de pago registrados, sin producir errores.

---

### Edge Cases

- ¿Qué ocurre si el evento tiene cientos de gastos y participantes? El sistema debe generar el reporte sin degradar la experiencia del usuario ni generar errores por volumen; los reportes grandes deben completarse dentro de un tiempo razonable percibido como aceptable.
- ¿Qué pasa si el nombre del evento contiene caracteres especiales (tildes, símbolos)? El archivo exportado debe utilizar una codificación que preserve correctamente todos los caracteres, sin corrupción de texto.
- ¿Qué ocurre si un miembro fue removido del evento después de haber generado gastos? Sus gastos históricos activos se incluyen en el reporte porque ya forman parte de la historia financiera del evento; el reporte refleja el estado de los datos al momento de la exportación.
- ¿Qué pasa si el evento tiene moneda base no ASCII (p. ej. "Bs.")? El reporte debe representar la moneda textualmente sin alterarla.
- ¿Qué ocurre si dos miembros solicitan la exportación simultáneamente? Cada solicitud se procesa de forma independiente y cada usuario recibe su propio archivo; no hay conflictos por concurrencia.
- ¿Qué sucede si el reporte solicitado corresponde a un evento eliminado lógicamente? El acceso se deniega con un error de recurso no encontrado.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE restringir la generación y descarga de reportes exclusivamente a miembros activos del evento; cualquier solicitud de un usuario no miembro activo DEBE ser rechazada con un error de acceso denegado.
- **FR-002**: El sistema DEBE soportar la exportación del reporte en formato CSV con codificación UTF-8, conteniendo una fila de encabezados y una fila por cada gasto activo (no eliminado lógicamente) del evento.
- **FR-003**: El sistema DEBE soportar la exportación del reporte en formato PDF con diseño estructurado y legible, conteniendo al menos: encabezado del evento, lista de participantes con balances netos y el historial de gastos activos.
- **FR-004**: El reporte en cualquier formato DEBE incluir para cada gasto activo: fecha del gasto, descripción, nombre del pagador, categoría, monto total y método de división aplicado.
- **FR-005**: El reporte DEBE incluir el resumen del evento: nombre del evento, moneda base, nombre del creador, fecha de creación y estado actual del evento.
- **FR-006**: El reporte DEBE incluir la lista de participantes activos del evento con su balance neto individual (monto pagado, monto consumido y diferencia neta), calculado usando el mismo motor de cálculo que el resto del sistema.
- **FR-007**: El reporte DEBE incluir el estado de las liquidaciones entre participantes, indicando para cada pago si está saldado o pendiente de confirmación, junto con los participantes involucrados y el monto.
- **FR-008**: Las cifras financieras del reporte DEBEN coincidir exactamente con los datos calculados y mostrados por el sistema en la interfaz de usuario; ninguna cifra puede derivarse de un motor de cálculo alternativo o independiente.
- **FR-009**: El reporte DEBE excluir todos los gastos con eliminación lógica activa (gastos con fecha de borrado registrada), independientemente del formato solicitado.
- **FR-010**: El reporte NO DEBE exponer datos privados ajenos al evento, incluyendo: tokens de autenticación, credenciales, identificadores internos del sistema de autenticación, ni información personal de usuarios no relacionada con su participación en el evento.
- **FR-011**: El sistema DEBE entregar el archivo generado como una descarga directa con el tipo de contenido y las cabeceras de disposición apropiadas para el formato solicitado.
- **FR-012**: El nombre del archivo descargado DEBE ser descriptivo e incluir el nombre del evento y el formato, para facilitar su identificación sin necesidad de abrirlo.

### Key Entities

- **EventReport (Reporte del Evento)**:
  - Encabezado del evento: nombre, moneda base, creador, fecha de creación, estado.
  - Lista de participantes: nombre visible, monto total pagado, monto total consumido, balance neto y estado (acreedor / deudor / neutro).
  - Historial de gastos: fecha, descripción, pagador, categoría, monto, método de división.
  - Estado de liquidaciones: participante pagador, participante receptor, monto, estado (saldado / pendiente).

- **ExportFormat (Formato de Exportación)**:
  - Identificador del formato solicitado: `csv` o `pdf`.
  - Determina la estructura, codificación y cabeceras de entrega del archivo generado.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un miembro activo del evento puede iniciar la descarga de un reporte en formato CSV o PDF desde la interfaz del evento en un único paso, sin necesidad de navegar a páginas adicionales ni completar formularios extensos.
- **SC-002**: El archivo descargado contiene todos los campos requeridos (encabezado del evento, participantes con balances, historial de gastos y estado de liquidaciones) en el 100% de los reportes generados para eventos con datos.
- **SC-003**: Las cifras financieras del reporte son idénticas a las mostradas en la interfaz del evento en el 100% de los casos verificados, sin discrepancias de redondeo ni cálculo.
- **SC-004**: El acceso a la generación del reporte es denegado en el 100% de los intentos de usuarios que no son miembros activos del evento, sin entregar ningún dato del evento.
- **SC-005**: Los archivos exportados se perciben como entregados de forma inmediata para eventos con volumen normal de gastos (hasta 200 gastos y 20 participantes) desde la perspectiva del usuario.
- **SC-006**: El nombre del archivo descargado es descriptivo e identifica el evento y el formato sin necesidad de abrirlo.

---

## Assumptions

- Se asume que la generación del reporte es una operación síncrona percibida como instantánea para el volumen normal de datos de un evento (hasta 200 gastos y 20 participantes). La generación asíncrona con notificación posterior queda fuera del alcance de esta versión.
- Se asume que el balance neto de cada participante en el reporte se calcula reutilizando el mismo motor financiero del sistema (motor de paridad cero), sin introducir un cálculo alternativo.
- Se asume que "miembro activo" equivale a un participante cuya membresía en el evento no ha sido eliminada lógicamente ni está suspendida.
- Se asume que el PDF tiene un diseño estructurado y funcional (legible y bien organizado) pero no necesariamente una presentación gráfica elaborada con logotipos ni estilos de marca avanzados; el foco es la información completa y la legibilidad.
- Se asume que el CSV utiliza coma (`,`) como delimitador y UTF-8 como codificación, con BOM opcional para compatibilidad con Microsoft Excel.
- Se asume que la funcionalidad es exclusivamente de lectura y generación; no realiza mutaciones sobre los datos del evento.
- El ámbito de implementación de esta funcionalidad es transversal: requiere cambios en `app/server/` (generación del archivo y endpoint de descarga) y en `app/client/` (botón de descarga e integración del flujo de descarga).
- Se asume que los nombres de archivo siguen el patrón `{nombre-del-evento}-reporte.{csv|pdf}`, normalizando caracteres especiales para compatibilidad con sistemas de archivos.
