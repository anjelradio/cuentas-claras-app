# Feature: Home Page Redesign (Stitch Aesthetic)

**Ámbito de implementación**: Frontend (`app/client/`)

## Executive Summary

El objetivo de esta característica es rediseñar por completo la página de inicio (Home) de la aplicación, incluyendo el componente de encabezado (Header) y el contenido principal, para alinear su estética visual con el diseño "Stitch". Se utilizará como referencia principal el diseño estático provisto (`design/home.html`). El esfuerzo se centra exclusivamente en la interfaz de usuario (UI) visual y en la creación de componentes reutilizables, sin agregar nueva lógica de negocio ni dependencias del servidor.

## Clarifications

### Session 2026-08-30
- Q: ¿Se deben implementar los modales y bottom sheets interactivos ("Unirse", "Mis Deudas", "Registrar Gasto") presentes en el diseño como parte de este rediseño? → A: Sí, implementar todos los flujos interactivos visuales.

## User Scenarios & Testing

### User Story 1 - Exploración visual de la página de inicio
Como usuario de Cuentas Claras, quiero acceder a la página de inicio y visualizar una interfaz moderna, limpia y fiel al nuevo diseño, para tener una experiencia coherente, atractiva y profesional.

**Why this priority**: La página de inicio es la primera impresión de la aplicación después de la autenticación. Su rediseño establece el lenguaje visual base que consumirán el resto de las pantallas.

**Independent Test**: La página carga correctamente en todas las resoluciones mostrando el nuevo esquema de colores, fondos translúcidos y tipografías sin romper la disposición de los elementos.

**Acceptance Scenarios**:
1. **Given** un dispositivo de escritorio, **When** el usuario visita la página de inicio, **Then** visualiza el encabezado rediseñado y el nuevo contenido principal distribuidos de acuerdo al diseño de referencia.
2. **Given** un dispositivo móvil, **When** el usuario visita la página de inicio, **Then** la interfaz se adapta responsivamente sin desbordamientos horizontales ni textos cortados.
3. **Given** los diferentes bloques visuales (tarjetas, botones, indicadores), **When** se renderizan en la pantalla, **Then** utilizan los estilos globales definidos para el nuevo tema visual (colores base, tipografía).

### User Story 2 - Interacción visual con acciones rápidas
Como usuario de Cuentas Claras, quiero poder abrir e interactuar visualmente con los flujos secundarios (Unirse, Registrar Gasto, Mis Deudas) desde la página de inicio, para visualizar el comportamiento de las ventanas modales y las hojas desplegables (bottom sheets).

**Why this priority**: Los menús interactivos y overlays son componentes clave en la interfaz, y establecer su comportamiento visual correctamente es necesario para no bloquear la posterior integración de negocio.

**Independent Test**: Se pueden abrir y cerrar los modales y bottom sheets, incluyendo flujos de múltiples pasos (ej. paso 1 a paso 2 en Mis Deudas), sin errores de renderizado.

**Acceptance Scenarios**:
1. **Given** la página de inicio cargada, **When** el usuario presiona acciones secundarias como "Registrar Gasto" o "Mis Deudas", **Then** se despliegan visualmente los bottom sheets correspondientes definidos en el diseño.
2. **Given** un flujo de múltiples pasos desplegado en un bottom sheet, **When** el usuario avanza al siguiente paso, **Then** el contenido del contenedor se actualiza simulando la navegación de interfaz (con datos estáticos).

### Edge Cases
- Dispositivos con pantallas inusualmente estrechas (menores a 320px). La interfaz debe usar anchos fluidos para no romperse.
- Ausencia temporal de datos reales. Los componentes deben usar datos estáticos o de relleno que respeten la estructura visual sin mostrar errores ni espacios vacíos incongruentes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE aplicar el nuevo diseño estético al componente de encabezado (Header) existente.
- **FR-002**: El sistema DEBE reemplazar el contenido actual de la página de inicio con una nueva estructura visual y componentes basados en el diseño de referencia provisto, INCLUYENDO la implementación interactiva visual de todos los modales y bottom sheets ("Unirse", "Mis Deudas", "Registrar Gasto") con sus múltiples pasos.
- **FR-003**: El sistema DEBE abstraer elementos visuales repetitivos del diseño de referencia (como tarjetas de resumen, listas, contenedores de estado o envoltorios de overlay) en bloques de interfaz reutilizables.
- **FR-004**: Los nuevos bloques visuales DEBEN implementarse respetando estrictamente las variables de diseño (colores, fuentes, sombras) establecidas en la configuración global de la aplicación.
- **FR-005**: La interfaz DEBE ser completamente responsiva, garantizando usabilidad y consistencia visual en entornos móviles y de escritorio.
- **FR-006**: Esta característica NO DEBE incluir integración con servicios de backend, persistencia de datos ni manejo de estado complejo; solo debe implementar interfaz visual y datos estáticos de demostración.
- **FR-007**: El desarrollo DEBE realizarse exclusivamente dentro del directorio del frontend (`app/client/`), acatando el principio de aislamiento de las aplicaciones de la constitución.

### Key Entities *(include if feature involves data)*
*(No aplica, característica puramente de UI estática)*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los elementos visuales definidos en el diseño de referencia están replicados funcionalmente en la interfaz interactiva.
- **SC-002**: El 100% de las pruebas visuales manuales en anchos de pantalla móviles (ej. 375px) y de escritorio (ej. 1024px) aprueban sin cortes ni desbordes.
- **SC-003**: Cero (0) nuevas llamadas a red o estado global complejo introducido en este rediseño.
- **SC-004**: Los bloques visuales reutilizables creados pueden ser instanciados en cualquier parte de la aplicación de cliente sin dependencias que los rompan.

## Assumptions

- El archivo de diseño de referencia contiene todos los estados visuales (o la mayoría) requeridos para el layout principal y el encabezado.
- El sistema actual ya posee una infraestructura base de estilos globales y variables introducidas en iteraciones pasadas, las cuales pueden aprovecharse aquí.
- Los datos mostrados en esta iteración serán estáticos o incrustados directamente en la presentación, ya que la conexión real de datos será abordada en futuras especificaciones.
