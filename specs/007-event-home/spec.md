# Feature Specification: Home de evento

**Feature Branch**: `007-event-home`

**Created**: 2026-08-30

**Status**: Draft

**Ámbito de implementación**: Frontend: `app/client/`

**Input**: User description: "Implementar una página de home específica para un evento, con datos estáticos y fidelidad al diseño definitivo de `design/event-home.html`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar el resumen de un evento (Priority: P1)

Como persona que ya está dentro de Cuentas Claras, quiero abrir la ruta de un
evento para consultar de un vistazo su información y el estado de sus cuentas.

**Why this priority**: La página de evento es el punto de entrada para entender
qué evento se está consultando y qué acciones están disponibles. Sin este
resumen no existe una experiencia útil aunque todavía no haya datos reales.

**Independent Test**: Navegar a la ruta dinámica con cualquier identificador no
vacío y comprobar que se muestra una home completa con la información estática
del evento, sin depender de API ni persistencia.

**Acceptance Scenarios**:

1. **Given** una persona autenticada en la aplicación, **When** navega a la
   ruta dinámica del evento con un identificador no vacío, **Then** se muestra
   la home del evento con nombre, descripción, fecha, resumen monetario,
   gastos recientes y actividad reciente.
2. **Given** la home del evento renderizada, **When** la persona actualiza la
   página o cambia el identificador por otro valor no vacío, **Then** la vista
   sigue renderizando la misma fixture estática y conserva la jerarquía visual;
   el identificador queda preparado para conectarse a datos reales en una
   specification futura.

### User Story 2 - Explorar las acciones y el estado del evento (Priority: P1)

Como participante de un evento, quiero identificar las acciones principales y
consultar sus indicadores para saber cómo continuar con mis gastos y deudas.

**Why this priority**: Las acciones son el puente entre el resumen visual y las
futuras funcionalidades de cuentas claras; deben ser reconocibles aunque sus
operaciones reales todavía no estén conectadas.

**Independent Test**: Verificar en móvil y escritorio que cada acción visible
puede enfocarse con teclado, tiene nombre comprensible y presenta el estado
estático o la superposición indicada al activarla.

**Acceptance Scenarios**:

1. **Given** la home del evento, **When** la persona revisa la sección de
   acciones, **Then** identifica `Invitar personas`, `Registrar gasto`, `Mis
   deudas`, `Ver miembros` y `Registrar QR`, además de la opción de editar el
   evento, sin que ninguna acción se presente como completada si no existe
   persistencia.
2. **Given** la sección de resumen, **When** la persona revisa sus datos,
   **Then** distingue el total del evento, la distribución por categorías,
   los gastos recientes y la actividad reciente mediante texto, iconografía y
   señales de estado que no dependan únicamente del color.

### User Story 3 - Usar los flujos visuales de la guía (Priority: P2)

Como participante, quiero abrir y cerrar los diálogos y paneles que muestra la
guía de diseño para entender el flujo previsto de la aplicación, aunque en
esta primera versión sus datos sean estáticos.

**Why this priority**: La guía `design/event-home.html` define estados
interactivos además de la vista principal. Reproducirlos ahora evita que la
base visual pierda contexto cuando se conecten las operaciones reales.

**Independent Test**: Activar cada control de la vista y comprobar que su
diálogo o panel aparece, puede cerrarse mediante el botón de cierre, el fondo,
la tecla Escape y el flujo de teclado, sin navegación accidental ni pérdida de
la posición de la página.

**Acceptance Scenarios**:

1. **Given** la home del evento, **When** la persona activa `Invitar personas`,
   **Then** se abre un panel con las opciones visuales de invitación definidas
   por la guía y puede cerrarlo sin modificar datos.
2. **Given** la home del evento, **When** la persona activa `Registrar gasto`,
   **Then** se abre el panel de selección de registro manual o desde imagen,
   claramente marcado como flujo visual sin persistencia.
3. **Given** la home del evento, **When** la persona activa `Mis deudas`,
   **Then** se abre el panel con la lista estática de deudas de referencia y
   puede cerrarlo de forma accesible.
4. **Given** cualquiera de los diálogos o paneles abiertos, **When** la persona
   pulsa Escape, el botón de cierre o el fondo, **Then** la superposición se
   cierra y el foco vuelve al control que la abrió cuando sea posible.
5. **Given** la guía incluye los flujos de unirse, crear y seleccionar evento,
   **When** la persona activa sus controles disponibles en la experiencia,
   **Then** se presentan como diálogos o paneles estáticos coherentes con la
   misma jerarquía visual, sin crear eventos ni enviar invitaciones.

### Edge Cases

- Un identificador de evento vacío no coincide con la ruta dinámica; debe
  conservarse el comportamiento de ruta no encontrada del App Router existente.
- Un identificador con caracteres codificados o longitud inusual debe resolverse
  como segmento de ruta sin romper el layout ni provocar desbordamiento; no se
  debe interpretar como datos confiables del evento.
- La ausencia de datos reales no debe mostrar una pantalla de error engañosa:
  esta feature usa una fixture estática explícita. Los controles cuya operación
  requiera backend deben permanecer como affordances visuales o indicar que se
  habilitarán posteriormente, sin afirmar éxito.
- En viewport móvil, las tarjetas, estadísticas y paneles deben reorganizarse
  sin scroll horizontal, contenido cortado ni acciones disponibles únicamente
  mediante hover.
- Al abrir una superposición, el foco y el cierre deben seguir siendo utilizables
  con teclado y lector de pantalla; al cerrarla no debe quedar el documento
  bloqueado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El frontend DEBE añadir una ruta dinámica para la home de evento
  bajo `app/client/src/app/(event)/[event-id]/page.tsx`, respetando el grupo de
  rutas existente y recibiendo el identificador desde el path.
- **FR-002**: Para cualquier identificador no vacío, la ruta DEBE renderizar una
  fixture estática de evento sin llamadas a API, autenticación adicional,
  persistencia ni dependencia de `app/server`.
- **FR-003**: La vista DEBE mostrar, como mínimo, encabezado del evento,
  descripción, fecha, acciones principales, total monetario, distribución por
  categorías, gastos recientes y actividad reciente, conservando la jerarquía
  y el orden de lectura de `design/event-home.html`.
- **FR-004**: Las acciones visibles DEBEN incluir `Invitar personas`,
  `Registrar gasto`, `Mis deudas`, `Ver miembros`, `Registrar QR` y `Editar
  evento`, con nombres, estados y affordances comprensibles sin depender de
  datos dinámicos.
- **FR-005**: La interfaz DEBE reproducir los flujos visuales definidos en la
  guía para invitar personas, registrar gasto, consultar deudas, crear evento,
  unirse a evento y seleccionar evento, usando diálogos o paneles que se abran
  y cierren sin mutar datos.
- **FR-006**: Todo control interactivo DEBE tener nombre accesible, foco visible,
  orden de tabulación comprensible y cierre por teclado; los controles basados
  únicamente en iconos DEBEN incluir una etiqueta accesible.
- **FR-007**: La implementación DEBE ser mobile-first y responsive, mantener
  acciones principales identificables en móvil y escritorio y evitar
  desbordamiento horizontal.
- **FR-008**: La implementación DEBE adaptar la referencia Stitch a componentes
  React del proyecto, Tailwind CSS, shadcn/ui y los tokens semánticos existentes;
  no DEBE copiar HTML, scripts, estilos duplicados ni la librería de iconos de
  la referencia. Los iconos equivalentes DEBEN usar `lucide-react` conforme a
  la constitución.
- **FR-009**: Los datos, textos y estados estáticos DEBEN estar definidos de
  forma reutilizable dentro de la frontera de la funcionalidad, de modo que una
  futura integración pueda sustituir la fixture por un contrato validado sin
  cambiar la composición visual.
- **FR-010**: Esta feature NO DEBE modificar `app/server`, `docs`,
  `design/event-home.html` ni archivos fuera de `app/client`.
- **FR-011**: Esta feature NO DEBE implementar lógica de negocio, creación o
  edición real de eventos, invitaciones, gastos, deudas, miembros, pagos,
  códigos QR, persistencia ni servicios de API.

### Key Entities

- **EventView**: Representación estática del evento consultado, con
  identificador de ruta, nombre, descripción, fecha, imagen o icono y datos
  resumidos para la presentación.
- **ExpenseSummary**: Datos de presentación de total, categorías y gastos
  recientes; no representa una entidad persistida ni permite mutaciones.
- **ActivityItem**: Registro estático de una actividad reciente de participantes,
  usado únicamente para comunicar el estado visual del evento.
- **EventOverlayState**: Estado de presentación que identifica el diálogo o
  panel abierto (invitación, gasto, deudas, creación, unión o selección) y su
  control de cierre.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las navegaciones a la ruta dinámica con un
  identificador no vacío muestran la home de evento estática sin solicitar
  datos al backend.
- **SC-002**: En una revisión visual, el 100% de las secciones y acciones
  principales definidas en `design/event-home.html` están representadas en la
  vista inicial o en su diálogo/panel correspondiente.
- **SC-003**: El 100% de los flujos de superposición definidos en la guía se
  pueden abrir y cerrar con mouse, teclado y botón de cierre sin dejar el foco
  atrapado ni bloquear la página.
- **SC-004**: La vista no presenta scroll horizontal ni contenido cortado en
  los tamaños móvil y escritorio establecidos por las pruebas responsive.
- **SC-005**: Todos los controles interactivos y botones de solo icono pasan una
  comprobación de nombre accesible, foco visible, contraste y navegación por
  teclado.
- **SC-006**: Una actualización de página o el uso de otro identificador no
  vacío produce una salida visual consistente y no crea, modifica ni elimina
  datos.

## Assumptions

- La persona que accede a esta ruta ya pasó por el control de sesión existente;
  esta feature no cambia las reglas de autenticación ni autorización.
- El grupo de rutas actual es `app/client/src/app/(event)/`; al ser un grupo
  entre paréntesis no añade un segmento visible a la URL. El segmento dinámico
  se representará con `[event-id]`, siguiendo la convención constitucional.
- Los datos definitivos del evento y la correspondencia entre identificador y
  recurso se definirán en una specification futura que conecte el frontend con
  el backend.
- `design/event-home.html` es una referencia visual y funcional definitiva para
  esta pantalla, pero sus scripts, estilos directos, valores repetidos y
  Phosphor Icons no se trasladan literalmente a producción.
- Los controles sin operación real pueden mostrar un estado estático o una
  indicación breve de disponibilidad futura, pero no deben simular una
  mutación exitosa ni exponer errores de backend inexistentes.
