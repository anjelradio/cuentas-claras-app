# Feature Specification: Gestión de Gastos y Comprobantes

**Feature Branch**: `[015-expenses-management]`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Crear la especificación funcional formal para el módulo de Gastos y Comprobantes de Cuentas Claras, reemplazando las interfaces demo actuales por una funcionalidad real con persistencia, API y reglas de negocio. HU-17 a HU-21, HU-26 a HU-28."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar gasto manual con división equitativa o exacta y categorización (Priority: P1) 🎯 MVP

Como miembro activo de un evento, quiero registrar un nuevo gasto especificando concepto, monto, fecha, categoría, pagador y participantes (dividiéndolo de forma equitativa o por montos exactos), para que quede registrado en el evento y se asignen las cuotas correspondientes con exactitud monetaria.

**Why this priority**: Es la funcionalidad central del módulo; sin el registro de gastos y cálculo de participaciones no puede existir historial ni balances.

**Independent Test**: Un miembro activo ingresa a un evento abierto, registra un gasto seleccionando pagador y participantes bajo división equitativa o exacta, y comprueba que el gasto queda registrado y las cuotas de cada participante suman exactamente el total.

**Acceptance Scenarios**:

1. **Given** un evento abierto con miembros activos, **When** un miembro activo registra un gasto con nombre, monto positivo, fecha, categoría y pagador válido del evento, seleccionando división equitativa entre participantes válidos, **Then** el sistema registra el gasto, calcula las cuotas dividiendo el total en unidades monetarias mínimas (centavos), asigna los centavos residuales de forma determinista y registra el evento de actividad correspondiente.
2. **Given** un miembro activo registrando un gasto, **When** selecciona división por montos exactos e introduce cuotas cuya suma coincide exactamente con el monto total del gasto, **Then** el sistema registra el gasto y persiste las participaciones individuales con los montos indicados.
3. **Given** un miembro activo registrando un gasto con división por montos exactos, **When** la suma de los montos asignados a los participantes es diferente al monto total del gasto (por exceso o defecto), **Then** el sistema rechaza la operación, indica la diferencia exacta y no registra el gasto.
4. **Given** un miembro activo completando el registro, **When** ingresa un monto igual o menor a cero, omite el nombre, no selecciona participantes o intenta incluir miembros que no pertenecen al evento, **Then** el sistema rechaza la solicitud mostrando un error explicativo.
5. **Given** un evento en estado cerrado, **When** cualquier usuario intenta registrar un gasto, **Then** el sistema deniega la operación indicando que el evento no admite modificaciones.
6. **Given** un usuario que no es miembro activo del evento, **When** intenta registrar un gasto, **Then** el sistema deniega el acceso por falta de permisos.

---

### User Story 2 - Adjuntar y gestionar comprobantes de gasto (Priority: P1)

Como miembro activo de un evento, quiero adjuntar un comprobante digital (imagen de factura o recibo) al crear o editar un gasto, así como visualizarlo, reemplazarlo o eliminarlo, para respaldar documentalmente el gasto ante los demás participantes.

**Why this priority**: Permite la transparencia y validación del gasto entre los participantes del grupo.

**Independent Test**: Adjuntar una imagen válida durante el registro o edición de un gasto, verificar su disponibilidad en el detalle, reemplazarla por otra o eliminarla, asegurando que se apliquen los límites de formato y tamaño.

**Acceptance Scenarios**:

1. **Given** un miembro activo registrando o editando un gasto en un evento abierto, **When** adjunta un archivo en formato JPEG, PNG o WebP con tamaño igual o menor a 5 MB, **Then** el sistema asocia el comprobante al gasto y lo deja disponible para consulta.
2. **Given** un usuario intentando adjuntar un comprobante, **When** el archivo supera los 5 MB o tiene un formato no admitido, **Then** el sistema rechaza la carga con un mensaje explicativo y mantiene intacto el estado del gasto.
3. **Given** un gasto que ya posee un comprobante asociado, **When** el usuario autorizado solicita reemplazarlo por una nueva imagen válida, **Then** el sistema actualiza la referencia al nuevo comprobante y retira la referencia anterior de forma consistente.
4. **Given** un gasto con comprobante, **When** el usuario autorizado solicita eliminar el comprobante, **Then** el comprobante se desvincula del gasto sin afectar los datos financieros del mismo.
5. **Given** una falla durante el almacenamiento o procesamiento del comprobante, **When** se intenta guardar el gasto, **Then** la operación completa se cancela atómicamente evitando gastos con referencias rotas o inconsistentes.

---

### User Story 3 - Consultar listado y detalle de gastos con filtros (Priority: P1)

Como miembro activo de un evento, quiero consultar el listado de gastos activos del evento aplicando filtros y acceder al detalle completo de cada gasto, para conocer quién pagó, cuánto le corresponde a cada miembro y revisar los comprobantes asociados.

**Why this priority**: Es esencial para que los participantes visualicen el estado de las cuentas compartidas y naveguen por la información financiera del evento.

**Independent Test**: Acceder a la vista de gastos del evento, alternar entre "Mis gastos", "Gastos de otros" y "Todos", verificar que los resultados coincidan con las membresías reales y abrir el detalle para comprobar el desglose de cuotas y comprobante.

**Acceptance Scenarios**:

1. **Given** un miembro activo dentro de un evento con gastos registrados, **When** consulta el listado con el filtro "Todos", **Then** visualiza todos los gastos activos del evento ordenados cronológicamente, mostrando concepto, categoría, monto total y pagador.
2. **Given** un miembro activo consultando el listado, **When** selecciona el filtro "Mis gastos", **Then** el sistema muestra exclusivamente aquellos gastos donde el usuario autenticado es el pagador o participa en el consumo de la cuota.
3. **Given** un miembro activo consultando el listado, **When** selecciona el filtro "Gastos de otros", **Then** el sistema muestra los gastos del evento donde el usuario autenticado no es el pagador ni participa en la división.
4. **Given** un listado filtrado sin registros coincidentes, **When** el usuario visualiza la sección, **Then** el sistema muestra un estado vacío comprensible con opción de restablecer los filtros.
5. **Given** un gasto activo existente, **When** un miembro activo abre su detalle, **Then** el sistema muestra nombre, descripción opcional, categoría, monto total, fecha, nombre del pagador, nombre del creador, desglose de participantes con sus montos asignados y el comprobante visual cuando exista.
6. **Given** un usuario que no pertenece al evento o un identificador de gasto inexistente/eliminado, **When** intenta consultar el detalle o listado, **Then** el sistema rechaza la consulta sin revelar información privada.

---

### User Story 4 - Editar un gasto existente (Priority: P2)

Como creador de un gasto o propietario del evento, quiero editar los datos de un gasto registrado (concepto, monto, categoría, pagador, participantes o comprobante), para corregir equivocaciones o actualizar información mientras el evento permanezca abierto.

**Why this priority**: Permite subsanar errores humanos de captura y mantener la integridad financiera del grupo.

**Independent Test**: Modificar monto, participantes y categoría de un gasto existente siendo el creador o propietario del evento, y verificar que las cuotas se recalculen y se registre la actividad de edición.

**Acceptance Scenarios**:

1. **Given** un gasto en un evento abierto, **When** el miembro que creó el gasto o el propietario del evento modifica sus campos (concepto, descripción, fecha, categoría, pagador o participantes) y envía datos válidos, **Then** el sistema actualiza el gasto, recalcula y valida las participaciones asegurando que la suma coincida con el nuevo monto, y registra la actividad de modificación.
2. **Given** un gasto existente, **When** un miembro que no es el creador del gasto ni el propietario del evento intenta editarlo, **Then** el sistema rechaza la operación por falta de autorización.
3. **Given** un gasto en un evento cerrado, **When** el creador o propietario intenta editarlo, **Then** el sistema rechaza la operación debido al estado cerrado del evento.
4. **Given** una solicitud de edición con división exacta, **When** la suma de las nuevas cuotas no coincide con el nuevo monto total, **Then** el sistema rechaza la actualización y conserva el estado previo del gasto sin modificaciones parciales.

---

### User Story 5 - Eliminar gasto con anulación lógica y trazabilidad (Priority: P2)

Como creador de un gasto o propietario del evento, quiero eliminar un gasto erróneo mediante una confirmación explícita, para que deje de contabilizarse en las cuentas del evento manteniendo la trazabilidad histórica de auditoría.

**Why this priority**: Permite remover gastos duplicados o inválidos sin perder el historial de actividad ni comprometer la auditoría.

**Independent Test**: Solicitar la anulación de un gasto confirmando el diálogo, verificar que desaparece de los listados activos y consultas funcionales de Expenses, y comprobar que queda registrada la actividad de eliminación en la bitácora del evento mientras se preserva su registro para trazabilidad.

**Acceptance Scenarios**:

1. **Given** un gasto activo en un evento abierto, **When** el creador del gasto o el propietario del evento solicita su eliminación y confirma la acción, **Then** el sistema realiza una anulación lógica (marcando fecha de eliminación), lo excluye de consultas normales y listados, conserva el registro para trazabilidad y registra el evento de actividad indicando quién lo eliminó.
2. **Given** un gasto existente, **When** un usuario que no es el creador ni el propietario del evento intenta eliminarlo, **Then** el sistema deniega la acción por falta de permisos.
3. **Given** un evento cerrado, **When** se intenta eliminar un gasto, **Then** el sistema deniega la operación indicando que el evento está cerrado.
4. **Given** un gasto previamente eliminado, **When** cualquier usuario intenta consultarlo o modificarlo mediante su identificador, **Then** el sistema responde que el recurso no está disponible.

---

### Edge Cases

- **Monto cero o negativo**: El sistema rechaza cualquier gasto con monto menor o igual a 0.
- **División equitativa con residuo de centavos**: Cuando el total no se divide exactamente entre los $N$ participantes (ej. 100.00 entre 3), se calculan cuotas base enteras en centavos ($33.33$) y el remanente ($0.01$) se asigna de manera determinista siguiendo el ordenamiento natural y estable de los identificadores de los participantes, garantizando que la suma sea exactamente $100.00$.
- **División exacta con descuadre**: Si la suma de montos ingresados por el usuario difiere del total del gasto por cualquier fracción (ej. 99.99 vs 100.00), el sistema impide guardar y reporta el monto faltante o sobrante.
- **Gasto sin participantes**: Toda división exige al menos 1 participante seleccionado.
- **Inclusión del pagador**: El pagador puede formar parte de la división de consumo o estar completamente excluido (ej. pagó por otros sin consumir).
- **Participantes repetidos**: La lista de participantes de un gasto no admite miembros duplicados.
- **Validación de pertenencia al evento**: El pagador y todos los participantes deben ser miembros activos del mismo evento al momento de crear o editar el gasto. Cualquier miembro perteneciente a otro evento es rechazado de inmediato.
- **Miembros que abandonaron el evento posteriormente**: Si un miembro pasa a estado inactivo o abandona el evento tras haber participado en un gasto, los gastos históricos ya registrados conservan su registro y participación intactos.
- **Comprobante inválido o excedido**: Archivos mayores a 5 MB o formatos distintos de JPEG, PNG y WebP son rechazados antes de completar la persistencia del gasto.
- **Fallo atómico durante la creación/edición**: Si ocurre un error en la persistencia de cuotas, almacenamiento de comprobante o registro de actividad, la operación se revierte en su totalidad.
- **Acceso concurrente o no autorizado**: La identidad del usuario se valida criptográficamente en cada solicitud a partir de la sesión autenticada; no se aceptan identificadores de actor provistos en el cuerpo de la petición.

---

## Traceability

Mapeo explícito entre las Historias de Usuario del alcance, los Escenarios de Usuario y los Requisitos Funcionales:

| Historia de Usuario | Escenarios de Usuario | Requisitos Funcionales |
|---|---|---|
| **HU-17 Registrar gasto manual** | User Story 1 | FR-001, FR-002, FR-003 |
| **HU-18 Dividir gasto equitativamente** | User Story 1 | FR-005, FR-007 |
| **HU-19 Dividir gasto por montos exactos** | User Story 1 | FR-006, FR-007 |
| **HU-20 Categorizar gasto** | User Story 1 | FR-004 |
| **HU-21 Adjuntar comprobante de gasto** | User Story 2 | FR-008, FR-009, FR-010 |
| **HU-26 Consultar detalle e historial** | User Story 3 | FR-011, FR-012, FR-013, FR-014, FR-019 |
| **HU-27 Editar gasto** | User Story 4 | FR-015, FR-016, FR-019 |
| **HU-28 Eliminar gasto** | User Story 5 | FR-017, FR-018, FR-019 |

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir a un miembro activo de un evento registrar un gasto manual cuando el evento se encuentre en estado abierto.
- **FR-002**: El registro de gasto DEBE requerir obligatoriamente: nombre del concepto, monto total (mayor a cero), fecha del gasto, categoría, miembro pagador, modalidad de división y al menos un participante. La descripción DEBE ser opcional.
- **FR-003**: El miembro pagador y todos los participantes seleccionados DEBEN ser miembros activos pertenecientes al mismo evento del gasto.
- **FR-004**: El sistema DEBE soportar las siguientes categorías de gasto: Comida, Hospedaje, Transporte, Compras, Entretenimiento y Otra.
- **FR-005**: El sistema DEBE soportar la modalidad de división equitativa, calculando cuotas individuales en unidades monetarias mínimas (centavos) y distribuyendo los centavos residuales de forma determinista y reproducible según el ordenamiento estable de los participantes.
- **FR-006**: El sistema DEBE soportar la modalidad de división por montos exactos, exigiendo que ningún monto asignado sea negativo y que la suma de todos los montos asignados coincida de forma exacta con el monto total del gasto.
- **FR-007**: El sistema DEBE asegurar como invariante financiera que la suma de las cuotas de participación (`ExpenseSplit`) sea estrictamente igual al monto total del gasto (`Expense`), sin tolerancias ni errores de aproximación decimal.
- **FR-008**: El sistema DEBE permitir adjuntar opcionalmente un único comprobante digital por gasto, admitiendo únicamente formatos JPEG, PNG y WebP con tamaño máximo de 5 MB.
- **FR-009**: El sistema DEBE soportar el ciclo de vida completo del comprobante: adjuntar en creación o edición, visualizar en detalle, reemplazar por uno nuevo y eliminarlo de forma independiente.
- **FR-010**: El sistema DEBE garantizar la atomicidad transaccional en la creación y edición de gastos: si falla el registro del gasto, la generación de participaciones, la carga del comprobante o la bitácora, ningún cambio parcial debe quedar persistido.
- **FR-011**: El sistema DEBE permitir a cualquier miembro activo del evento consultar el listado de gastos activos del evento ordenados por fecha.
- **FR-012**: El listado de gastos DEBE proveer los siguientes filtros de visualización:
  - **Mis gastos**: Gastos donde el usuario autenticado figura como pagador o como participante asignado.
  - **Gastos de otros**: Gastos donde el usuario autenticado no es el pagador ni forma parte de los participantes.
  - **Todos**: La totalidad de gastos activos pertenecientes al evento.
- **FR-013**: El sistema DEBE mostrar estados vacíos comprensibles cuando no existan gastos registrados en el evento o en el filtro seleccionado.
- **FR-014**: El sistema DEBE permitir a los miembros activos consultar el detalle completo de un gasto activo, incluyendo concepto, descripción, fecha, categoría, monto total, pagador, creador, desglose de cuotas por participante y comprobante cuando exista.
- **FR-015**: El sistema DEBE permitir la edición de un gasto existente exclusivamente al miembro que lo creó o al propietario del evento, siempre que el evento permanezca abierto.
- **FR-016**: La edición de un gasto DEBE permitir modificar concepto, descripción, fecha, categoría, pagador, monto total, modalidad de división, participantes y comprobante, revalidando todas las reglas de integridad y recalculando participaciones.
- **FR-017**: El sistema DEBE permitir la eliminación de un gasto exclusivamente a su creador o al propietario del evento, siempre que el evento se encuentre abierto y mediante confirmación explícita del usuario.
- **FR-018**: La eliminación de un gasto DEBE ser lógica (soft-delete), excluyéndolo de listados y consultas normales, pero preservando el registro histórico para auditoría y trazabilidad.
- **FR-019**: El sistema DEBE registrar una entrada de auditoría en la bitácora de actividad del evento ante cada creación (`expense_created`), modificación (`expense_updated`) y eliminación (`expense_deleted`), identificando actor, acción, gasto y fecha/hora.
- **FR-020**: El sistema DEBE obtener la identidad del actor que realiza cualquier operación directamente de la sesión autenticada validada, rechazando identidades suministradas en el cuerpo de la petición.
- **FR-021**: El sistema DEBE impedir cualquier operación de creación, edición o eliminación de gastos si el evento se encuentra en estado cerrado.
- **FR-022**: El sistema DEBE impedir el acceso a listados, detalles o mutaciones de gastos a usuarios que no sean miembros activos del evento correspondiente.
- **FR-023**: Las interfaces de usuario existentes de gastos (formulario, listados, tarjetas y modales de detalle) DEBEN preservarse en su composición visual, sustituyendo las fuentes de datos estáticas por la integración funcional real.

---

### Key Entities

- **Gasto (Expense)**: Entidad que representa un desembolso económico dentro de un evento. Posee identificador único, referencia al evento, miembro creador, miembro pagador, nombre/concepto, descripción opcional, monto total, categoría, modalidad de división, fecha del gasto, referencia a comprobante opcional, marcas temporales y estado de eliminación lógica.
- **Participación de Gasto (ExpenseSplit)**: Entidad que define la cuota económica asignada a un miembro participante dentro de un gasto específico. Posee identificador único, referencia al gasto, referencia al miembro participante y monto asignado.
- **Categoría de Gasto (ExpenseCategory)**: Clasificación temática del gasto (`food`, `lodging`, `transport`, `shopping`, `entertainment`, `other`).
- **Modalidad de División (ExpenseSplitType)**: Estrategia de reparto del gasto (`equal` para equitativa, `exact` para montos específicos).
- **Comprobante (ExpenseReceipt)**: Recurso documental digital opcional asociado directamente a un gasto (`Expense`) para respaldar su origen (ubicación de acceso seguro, identificador de recurso y tipo de archivo). Esta especificación no exige que constituya una entidad persistente independiente.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los gastos creados con división equitativa o exacta cumple la invariante de que la suma de sus participaciones (`ExpenseSplit`) es exactamente idéntica al monto total del gasto, con 0 errores de descuadre por redondeo.
- **SC-002**: El 100% de los intentos de crear o editar gastos con divisiones exactas no coincidentes o montos inválidos es rechazado antes de su persistencia.
- **SC-003**: Los miembros activos pueden registrar un gasto completo (con o sin comprobante) en menos de 45 segundos a través de la interfaz.
- **SC-004**: Los filtros de gastos ("Mis gastos", "Gastos de otros", "Todos") reflejan con 100% de precisión la membresía del usuario autenticado frente a los datos reales del evento.
- **SC-005**: El 100% de las operaciones de creación, edición y eliminación genera la traza correspondiente en la bitácora de actividad del evento.
- **SC-006**: El 100% de los intentos de manipulación de gastos por usuarios no miembros o en eventos cerrados es bloqueado por las políticas de autorización del sistema.

---

## Assumptions

- La autenticación del usuario es provista mediante el sistema de sesiones y tokens validado por el backend en cada petición.
- El contexto del evento (`eventId`) y las membresías activas (`EventMember`) están previamente establecidos y disponibles para asociar los gastos.
- Las interfaces de usuario de gastos implementadas en la feature de interfaces (`011-expenses-interfaces`) constituyen la base visual y no requieren cambios estructurales de diseño.
- La gestión de pagos, balances globales deudores/acreedores y propuestas de liquidación financiera se implementarán en módulos posteriores y no condicionan la creación de participaciones de gastos.
- El almacenamiento de comprobantes opera en la infraestructura del servidor/nube configurada para el proyecto.

---

## Out of Scope

- Reconocimiento Óptico de Caracteres (OCR) o extracción asistida por Inteligencia Artificial sobre facturas o comprobantes.
- Detección inteligente de posibles gastos duplicados (HU-25).
- Desglose y asignación por productos o ítems individuales de una factura.
- Registro, confirmación o conciliación de pagos entre miembros.
- Balances netos, simplificación de deudas o liquidaciones entre participantes.
- Notificaciones externas (mensajería, correo electrónico o WhatsApp).
