# Feature Specification: Interfaces de gastos

**Feature Branch**: `[011-expenses-interfaces]`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Implementar únicamente las interfaces de Expenses: registrar un gasto, listar los pagos de un evento y consultar el detalle de un gasto, usando datos estáticos y diseños Stitch como referencia."

**Scope**: Exclusivamente interfaz frontend; sin lógica de negocio, persistencia ni integración API.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar un gasto (Priority: P1)

Como participante de un evento, quiero abrir un formulario para registrar un gasto y revisar sus datos antes de enviarlo.

**Why this priority**: Es el punto de entrada principal para capturar gastos y permite validar la base visual del módulo.

**Independent Test**: Abrir la acción de registrar gasto, completar los campos mostrados y verificar estados visuales de formulario sin enviar datos reales.

**Acceptance Scenarios**:

1. **Given** un usuario está dentro de un evento, **When** selecciona registrar gasto, **Then** se muestra el formulario con la estructura, jerarquía y contenido visual definidos por Stitch.
2. **Given** el formulario está visible, **When** el usuario escribe, selecciona o modifica un campo, **Then** el valor se refleja y los estados de foco, etiqueta y validación visual son comprensibles.
3. **Given** el usuario revisa el formulario, **When** intenta continuar con campos incompletos o inválidos, **Then** se muestran estados de error accesibles sin realizar ninguna operación persistente.
4. **Given** el usuario cancela, **When** activa la acción de volver o cerrar, **Then** sale del formulario sin modificar datos.

### User Story 2 - Consultar gastos del evento (Priority: P1)

Como participante de un evento, quiero consultar un listado resumido de sus gastos y filtrar cuáles visualizar.

**Why this priority**: Ofrece una vista rápida de la actividad financiera del evento y conecta los gastos con su detalle.

**Independent Test**: Abrir la lista con datos estáticos, cambiar entre “Mis gastos”, “Gastos de otros” y “Todos” y comprobar que la selección y el listado cambian visualmente.

**Acceptance Scenarios**:

1. **Given** existen gastos de ejemplo, **When** el usuario abre la lista del evento, **Then** cada elemento muestra icono, nombre, categoría, importe y estado de forma legible.
2. **Given** la lista está visible, **When** el usuario selecciona “Mis gastos”, “Gastos de otros” o “Todos”, **Then** el filtro activo queda claramente indicado y se muestra el conjunto estático correspondiente.
3. **Given** no hay elementos para el filtro seleccionado, **When** el usuario consulta la lista, **Then** se muestra un estado vacío comprensible y una acción para volver a consultar otro filtro.
4. **Given** un elemento de gasto está visible, **When** el usuario lo selecciona, **Then** navega al detalle usando el identificador del gasto en la ruta.

### User Story 3 - Consultar el detalle de un gasto (Priority: P2)

Como participante de un evento, quiero ver el detalle de un gasto para saber quién pagó, quién participa y cuál es mi situación.

**Why this priority**: Permite validar la vista que posteriormente soportará saldar la parte propia y revisar participantes.

**Independent Test**: Abrir una ruta de detalle con un identificador estático y verificar resumen, participantes, estado de pago y acciones disponibles sin ejecutar transacciones reales.

**Acceptance Scenarios**:

1. **Given** un gasto válido está seleccionado, **When** se abre su detalle, **Then** se muestran descripción, categoría, importe, fecha, persona pagadora y participantes según el diseño Stitch.
2. **Given** el usuario consulta participantes, **When** revisa el estado de cada persona, **Then** distingue visualmente quién pagó, quién debe y cuál es su propio estado.
3. **Given** el usuario aún tiene una parte pendiente, **When** visualiza las acciones del detalle, **Then** aparece una acción de saldar su parte como interfaz no persistente.
4. **Given** el identificador no corresponde a un gasto de ejemplo, **When** se abre la ruta, **Then** se muestra la página de no encontrado existente, manteniendo el encabezado global.

### Edge Cases

- El formulario debe conservar etiquetas, foco visible y mensajes legibles cuando un campo contiene un valor largo.
- El importe debe mostrar un formato monetario consistente y no desbordar en pantallas pequeñas.
- La lista debe mostrar correctamente filtros y estado vacío en móvil y escritorio.
- El detalle debe conservar su jerarquía cuando no exista imagen, nota o participante opcional.
- Las acciones de enviar, saldar o modificar deben indicar que son demostrativas y no deben llamar a servicios externos.
- Las rutas deben manejar identificadores ausentes o no reconocidos con la página de no encontrado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La aplicación DEBE incluir una interfaz de registrar gasto accesible desde el contexto de un evento.
- **FR-002**: El formulario DEBE mostrar campos para la información esencial del gasto, incluyendo concepto, categoría, importe, fecha, pagador y comprobante cuando aplique.
- **FR-003**: El formulario DEBE proporcionar estados visuales de foco, valor inválido, valor requerido, carga demostrativa y cancelación sin persistir información.
- **FR-004**: La aplicación DEBE incluir una página de listado de gastos asociada a un evento.
- **FR-005**: Cada elemento del listado DEBE mostrar como mínimo icono, nombre o concepto, categoría, importe y estado.
- **FR-006**: El listado DEBE permitir alternar entre los filtros “Mis gastos”, “Gastos de otros” y “Todos”, mostrando un indicador claro del filtro activo.
- **FR-007**: La aplicación DEBE incluir estados de listado con resultados y sin resultados, manteniendo navegación y accesibilidad.
- **FR-008**: Cada gasto del listado DEBE enlazar a una página de detalle mediante el identificador incluido en la ruta.
- **FR-009**: La página de detalle DEBE mostrar el resumen del gasto, participantes, pagador, importes individuales y estados de pago con datos estáticos.
- **FR-010**: La página de detalle DEBE mostrar una acción visual para saldar la parte propia cuando el estado está pendiente; dicha acción NO DEBE ejecutar una transacción en esta feature.
- **FR-011**: Las interfaces DEBEN reutilizar los componentes públicos y tokens del sistema de diseño existentes, sin duplicar colores ni tipografías.
- **FR-012**: Todos los iconos DEBEN implementarse con `lucide-react`.
- **FR-013**: Las pantallas DEBEN ser fieles a los HTML de Stitch correspondientes a Expenses, manteniendo composición, espaciado, colores, tipografía y estados responsivos.
- **FR-014**: Las pantallas DEBEN funcionar con teclado, foco visible, nombres accesibles y sin desplazamiento horizontal en móvil y escritorio.
- **FR-015**: Los datos mostrados DEBEN ser estáticos y locales a la interfaz; esta feature NO DEBE modificar backend, persistencia, contratos de API ni lógica financiera.
- **FR-016**: Las acciones no persistentes DEBEN comunicar mediante una notificación o estado visual claro que la operación aún no está conectada a datos reales.
- **FR-017**: Un identificador de gasto inexistente DEBE mostrar la página de no encontrado existente en lugar de una vista parcialmente vacía.

### Key Entities

- **Gasto**: Registro visual de un desembolso con concepto, categoría, importe, fecha, pagador, comprobante opcional y estado.
- **Participante del gasto**: Persona asociada al gasto, con importe correspondiente y estado pagado o pendiente.
- **Filtro de gastos**: Selección de alcance que distingue gastos propios, de otros participantes o de todo el evento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los flujos principales (abrir registro, consultar lista, aplicar cada filtro y abrir detalle) puede recorrerse con datos estáticos sin errores bloqueantes.
- **SC-002**: Al menos el 95% de usuarios de prueba identifica correctamente el filtro activo y el estado de pago de un elemento en menos de 10 segundos.
- **SC-003**: El 100% de campos interactivos tiene etiqueta o nombre accesible, foco visible y operación completa mediante teclado.
- **SC-004**: Las tres pantallas se adaptan a móvil y escritorio sin desplazamiento horizontal ni pérdida de información esencial.
- **SC-005**: El 100% de las acciones demostrativas evita llamadas de red, persistencia o cambios en gastos reales.
- **SC-006**: La estructura visual implementada coincide con los diseños Stitch de referencia en las secciones principales, validada mediante revisión visual.

## Assumptions

- Los diseños HTML de Stitch para Expenses estarán disponibles antes de implementar y serán la referencia visual prioritaria.
- La navegación se realiza dentro de un evento existente y utiliza identificadores estáticos durante esta primera versión.
- La autenticación, API, persistencia, inteligencia artificial para prellenado y reglas financieras se implementarán en features posteriores.
- Las acciones “registrar”, “saldar” y similares son demostrativas y no deben sugerir que el cambio se guardó realmente.
- Se reutilizarán los componentes de interfaz y las páginas de error/no encontrado ya existentes en el cliente.

## Out of Scope

- Integración con API o backend, consultas reales y persistencia.
- Prellenado mediante inteligencia artificial, extracción de datos de comprobantes o carga real de imágenes.
- Cálculo de saldos, división automática, liquidación, edición o eliminación de gastos.
- Notificaciones financieras, pagos, reembolsos o actualización en tiempo real.
- Nuevas reglas de autenticación, permisos o membresías de eventos.
