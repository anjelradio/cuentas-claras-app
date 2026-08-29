# Feature Specification: Base del cliente web

**Feature Branch**: `No creada (no hay hook before_specify configurado)`

**Created**: 2026-08-29

**Status**: Draft

**Input**: Base reutilizable del cliente web con sistema de diseño, componentes
accesibles y límites explícitos de alcance.

## Clarifications

### Session 2026-08-29

- Q: ¿Qué alcance de tema visual debe incluir la base inicial? → A: Tema único.
- Q: ¿Qué dirección cromática debe tener el tema único de la aplicación? → A:
  Los tokens centralizados reciben los valores definitivos de la paleta antes de
  la implementación.
- Q: ¿Cuál es la ubicación definitiva del cliente? → A: `app/client/`, con el
  código fuente bajo `app/client/src/`, incluido `app/client/src/app/`.
- Q: ¿Cómo deben usarse los tokens de fondo, superficie y texto? → A: Cada token
  tiene una finalidad única, se consume mediante variables centralizadas y sus
  colores de texto mantienen contraste accesible sobre sus fondos.
- Q: ¿Cuándo deben definirse la paleta y las fuentes Google? → A: Sus valores
  definitivos deben registrarse antes de la implementación.
- Q: ¿Qué fuente debe considerarse autoritativa para registrar los valores
  definitivos de los tokens y las tres familias Google? → A: Usar la imagen de
  referencia como fuente visual y proponer los valores faltantes para aprobación
  explícita antes de la implementación.
- Q: ¿Qué valores de color deben registrarse como definitivos? → A: Se aprueba
  la paleta propuesta a partir de la imagen de referencia; los 13 valores quedan
  registrados en el contrato de UI y deben usarse sin sustituciones durante la
  implementación.
- Q: ¿Qué familias Google deben asignarse a los roles tipográficos? → A:
  `headline` usa Montserrat Alternates; `body` y `label` usan Montserrat.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Construir interfaces coherentes (Priority: P1)

Como integrante del equipo de producto, quiero contar con una base visual única
para que las futuras funcionalidades mantengan una apariencia coherente y no
redefinan decisiones visuales en cada pantalla.

**Why this priority**: Una base coherente evita divergencias visuales antes de
que se construyan funcionalidades del producto.

**Independent Test**: Se puede verificar creando una composición de muestra que
use titulares, texto, etiquetas, superficies y acciones, y comprobando que todos
sus roles visuales proceden del sistema central.

**Acceptance Scenarios**:

1. **Given** una nueva interfaz, **When** necesita color, tipografía o una
   superficie, **Then** puede usar roles centralizados sin introducir valores
   visuales duplicados.
2. **Given** una tarjeta, diálogo, confirmación o panel lateral, **When** se
   presenta al usuario, **Then** usa el mismo rol de superficie elevada.

---

### User Story 2 - Componer interacciones reutilizables (Priority: P2)

Como integrante del equipo de producto, quiero disponer de controles y
contenedores reutilizables para crear flujos futuros de forma consistente y
rápida.

**Why this priority**: Los flujos posteriores dependen de controles uniformes
para no reconstruir las mismas interacciones.

**Independent Test**: Se puede verificar que cada componente de la colección se
puede presentar y usar de forma aislada con sus estados básicos.

**Acceptance Scenarios**:

1. **Given** un formulario futuro, **When** necesita introducir, seleccionar,
   confirmar u obtener un código de un solo uso, **Then** dispone de controles
   reutilizables para cada interacción.
2. **Given** una vista futura, **When** necesita orientar, cargar, notificar o
   contextualizar al usuario, **Then** dispone de breadcrumbs, etiquetas,
   indicadores de carga, notificaciones y contenedores reutilizables.

---

### User Story 3 - Usar una base accesible (Priority: P3)

Como persona que utiliza la aplicación con teclado o tecnologías de asistencia,
quiero que los controles base comuniquen su propósito y estado para poder usarlos
sin depender solo de la apariencia visual.

**Why this priority**: La accesibilidad incorporada en los componentes base
beneficia a todas las futuras funcionalidades.

**Independent Test**: Se puede verificar navegando cada control interactivo con
teclado y comprobando nombres, foco, etiquetas, estados y mensajes perceptibles.

**Acceptance Scenarios**:

1. **Given** un control interactivo, **When** recibe foco y se activa con el
   teclado, **Then** su propósito y estado permanecen identificables.
2. **Given** un error, confirmación o cambio de estado, **When** se comunica al
   usuario, **Then** incluye una señal comprensible que no depende únicamente
   del color.

### Edge Cases

- Un componente solicitado no tiene información, contenido o acciones para
  mostrar; debe conservar una presentación comprensible y no bloquear la vista.
- Un campo recibe un valor inválido o incompleto; debe poder asociar el problema
  con el control correspondiente y mantener el valor introducido cuando sea
  seguro hacerlo.
- Una notificación se muestra mientras el usuario navega con teclado; no debe
  ocultar el foco ni impedir continuar la interacción.
- Una composición se visualiza en pantallas pequeñas; no debe requerir
  desplazamiento horizontal para acceder a sus acciones principales.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El cliente DEBE proporcionar un sistema de diseño centralizado con
  roles de color primario, secundario, terciario y neutral. Los valores
  definitivos de la paleta DEBEN registrarse antes de iniciar la implementación.
  La paleta aprobada queda definida en `contracts/ui-foundation.md`.
- **FR-002**: El sistema DEBE definir `background` como fondo principal,
  `surface` como fondo de Card, Dialog, AlertDialog y Sheet, y los roles
  `headline`, `body` y `label` para titulares, texto general y etiquetas.
- **FR-003**: El sistema DEBE definir colores semánticos de éxito, información,
  advertencia y error, además de roles tipográficos diferenciados para titulares,
  cuerpo y etiquetas.
- **FR-004**: Todo componente reutilizable DEBE consumir los roles centralizados
  mediante variables del sistema de diseño y no DEBE contener colores hex
  duplicados, valores de color directos ni fuentes duplicadas.
- **FR-005**: La colección reutilizable DEBE incluir botones, tarjetas,
  breadcrumbs, campos de formulario, entradas de texto, selección, checkbox,
  entrada de código de un solo uso, etiquetas, diálogos, confirmaciones, paneles
  laterales, skeletons, spinner y Sonner como único sistema de notificaciones.
- **FR-006**: Los componentes interactivos DEBEN admitir uso con teclado,
  mantener foco visible y ofrecer etiquetas o nombres accesibles.
- **FR-007**: Los componentes DEBEN comunicar estados de error, éxito,
  información y advertencia con señales comprensibles que no dependan únicamente
  del color.
- **FR-008**: La base DEBE permitir que las futuras funcionalidades compongan
  interfaces móviles y de escritorio sin crear una experiencia funcional distinta
  por tamaño de pantalla.
- **FR-009**: El alcance DEBE limitarse al cliente establecido por la
  constitución en `app/client/` y a su código fuente bajo `app/client/src/`.
- **FR-010**: La entrega NO DEBE incluir pantallas del producto, autenticación,
  lógica de gastos, persistencia de datos ni comunicación con servicios externos.
- **FR-011**: La entrega NO DEBE modificar el servidor, la documentación ni
  artefactos fuera del límite del cliente, salvo los artefactos de Spec Kit
  requeridos para esta funcionalidad.
- **FR-012**: El sistema de diseño DEBE ofrecer un único tema fijo para la
  aplicación y NO DEBE incluir variantes de tema ni adaptación automática a la
  preferencia del dispositivo.
- **FR-013**: Los valores definitivos de los tokens de paleta y texto DEBEN
  acordarse antes de la implementación y demostrar contraste accesible sobre los
  fondos donde se usen. Los valores aprobados quedan definidos en
  `contracts/ui-foundation.md`.
- **FR-014**: Los roles `headline`, `body` y `label` DEBEN utilizar variables
  reutilizables asociadas a familias Google definitivas registradas antes de la
  implementación: `headline` con Montserrat Alternates y `body`/`label` con
  Montserrat.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los 15 tipos de componentes solicitados está disponible
  para una composición de muestra y presenta al menos sus estados básicos.
- **SC-002**: El 100% de los componentes reutilizables revisados usa roles
  centralizados para color y tipografía, sin valores visuales duplicados.
- **SC-003**: El 100% de los componentes interactivos puede completarse mediante
  teclado y expone un nombre o etiqueta accesible verificable.
- **SC-004**: En una revisión de composición de muestra, las acciones principales
  permanecen disponibles sin desplazamiento horizontal en un ancho de 320 px.
- **SC-005**: Una persona del equipo puede ensamblar una composición de muestra
  con cinco componentes de la colección en menos de 15 minutos, sin definir
  nuevos roles visuales.

## Assumptions

- Las personas usuarias directas de esta base son integrantes del equipo que
  construirán futuras funcionalidades del cliente.
- La colección se entrega como una base reutilizable, no como pantallas o flujos
  de negocio terminados.
- La aplicación cliente reside en `app/client/` y todo su código fuente en
  `app/client/src/`, incluido el App Router bajo `app/client/src/app/`.
- Las decisiones específicas de implementación se definirán durante la
  planificación, respetando las reglas de frontend de la constitución.
