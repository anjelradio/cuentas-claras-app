# Feature Specification: Rediseño de Autenticación (Stitch)

**Feature Branch**: `No branch`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "vamos a cambiar el diseño totalmente de todas las páginas y rutas de auth. Actualmente hay cosas funcionales, lo único que vamos a hacer es únicamente cambiar el diseño de cómo se ve. Y para ello vamos a guiarnos o basarnos con diseños de Stitch que están en una carpeta llamada design en la raíz del proyecto."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegación y experiencia visual de acceso (Priority: P1)

Como persona usuaria, quiero interactuar con formularios de autenticación (registro, inicio de sesión, recuperación, etc.) que presenten el nuevo diseño basado en "Stitch" para tener una experiencia visual renovada y consistente, sin perder ninguna funcionalidad existente.

**Why this priority**: La experiencia de usuario y el rediseño son el núcleo de este requerimiento, afectando directamente la primera impresión del producto.

**Independent Test**: Se puede probar abriendo cada una de las rutas de `/auth` y comparando el renderizado visual (disposición, colores, tipografía, componentes) contra los diseños de referencia, asegurando al mismo tiempo que los flujos funcionales (login, registro) siguen funcionando.

**Acceptance Scenarios**:

1. **Given** una persona visita cualquier ruta bajo `/auth`, **When** la página carga, **Then** el diseño visual coincide con las referencias de la carpeta `design` (Stitch theme).
2. **Given** un formulario de autenticación con el nuevo diseño, **When** la persona interactúa con él (errores de validación, estados de carga, envío), **Then** los estados interactivos reflejan el nuevo sistema de diseño y la funcionalidad original se mantiene intacta.
3. **Given** el rediseño aplicado, **When** la persona navega usando teclado o lectores de pantalla, **Then** los atributos de accesibilidad originales se mantienen presentes y funcionales.

### Edge Cases

- ¿Qué sucede si los diseños no especifican estados de error o de carga para ciertos componentes? (El sistema aplicará un estado de diseño genérico coherente con el estilo "Stitch").
- ¿Qué sucede si un texto largo o traducido rompe el diseño propuesto? (El diseño debe ser responsivo y adaptable a diferentes contenidos).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE aplicar el nuevo diseño "Stitch" a las páginas de Login, Registro, Verificación de Correo, y Recuperación/Restablecimiento de Contraseña.
- **FR-002**: El rediseño DEBE preservar intactas todas las funcionalidades y flujos existentes (Better Auth, validaciones Zod, redirecciones, manejo de sesiones).
- **FR-003**: El rediseño DEBE preservar la accesibilidad previamente garantizada (atributos `aria-invalid`, foco de teclado, toasts de Sonner seguros).
- **FR-004**: Los recursos de diseño a aplicar DEBEN basarse en los archivos de la carpeta `design/` (o `design/auth`), los cuales serán provistos por el usuario antes de iniciar la implementación.
- **FR-005**: La implementación visual DEBE utilizar Tailwind CSS y los componentes de UI existentes, adaptándolos a las especificaciones de Stitch.

### Key Entities

- **Componentes de Auth**: Formularios y tarjetas de interfaz de usuario en `app/client/src/app/auth/components`.
- **Layouts de Auth**: Envolturas de diseño específicas para las rutas de acceso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las pantallas bajo `/auth` coinciden visualmente con las maquetas de "Stitch" provistas.
- **SC-002**: Ninguna de las pruebas funcionales existentes (tests de interacción y flujos) requiere modificación lógica profunda (solo ajustes de selectores si cambian componentes de UI).
- **SC-003**: El rediseño mantiene la responsividad (100% visible sin cortes en móviles y escritorio).

## Assumptions

- Las referencias visuales "Stitch" son compatibles con la estructura general de Next.js y Tailwind CSS.
- El rediseño no altera el dominio, los esquemas de base de datos ni los controladores del lado del servidor.
- Se usarán los componentes de Shadcn/UI (si corresponde) ajustando sus estilos base para que coincidan con "Stitch".
