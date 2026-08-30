# Feature Specification: Autenticación de usuarios

**Feature Branch**: `No creada (no hay hook before_specify configurado)`

**Created**: 2026-08-29

**Status**: Draft

**Input**: Sistema de autenticación para registro, inicio y cierre de sesión,
Google, verificación de correo y recuperación segura de contraseña.

## Clarifications

### Session 2026-08-29

- Q: ¿Cómo debe verificarse el correo tras un registro con correo y contraseña? → A: Con un enlace de un solo uso y con expiración; el registro con correo dirige a una pantalla para revisar el correo, la verificación dirige a Home y Google dirige a Home directamente.
- Q: ¿A dónde debe redirigirse a una persona después de restablecer correctamente su contraseña? → A: Al inicio de sesión, con una confirmación de que la contraseña fue actualizada.
- Q: ¿Puede el enlace seguro aparecer en un correo? → A: Sí. El enlace de verificación o recuperación debe aparecer únicamente en el correo transaccional destinado a la persona correspondiente; nunca debe exponerse en logs, toasts, errores ni correos ajenos al flujo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear y verificar una cuenta (Priority: P1)

Como persona nueva, quiero registrarme con mis datos o con Google para obtener
una cuenta protegida y saber si debo verificar mi correo antes de usarla.

**Why this priority**: La creación de una identidad verificada es la base para
todo acceso posterior a la aplicación.

**Independent Test**: Una persona puede crear una cuenta con nombre, correo y
contraseña válidos, recibe la indicación de verificación y puede completar la
verificación con un enlace vigente de un solo uso.

**Acceptance Scenarios**:

1. **Given** una persona sin cuenta, **When** envía nombre, correo y contraseña
   válidos, **Then** se crea su cuenta, se envía un enlace de verificación a su
   correo y se le redirige a una pantalla para revisar ese correo, sin acceso a
   Home hasta verificarlo.
2. **Given** una persona que se registra con Google, **When** termina el proceso
   de Google correctamente, **Then** obtiene una cuenta asociada a esa identidad
   y se le redirige directamente a Home, sin una verificación de correo
   adicional.
3. **Given** una persona con un enlace de verificación vigente, **When** lo usa,
   **Then** su correo queda verificado, el enlace no vuelve a ser válido y se le
   redirige a Home.
4. **Given** una persona que intenta registrarse con un correo ya usado, **When**
   envía el registro, **Then** recibe un mensaje claro que le permite entender
   que debe iniciar sesión o recuperar el acceso sin exponer información
   adicional de otras cuentas.

---

### User Story 2 - Iniciar y cerrar sesión (Priority: P1)

Como persona con una cuenta, quiero iniciar sesión con mi correo y contraseña o
con Google, y cerrarla cuando termine, para controlar mi acceso a la aplicación.

**Why this priority**: El acceso seguro y su cierre explícito son necesarios
para usar cualquier funcionalidad protegida.

**Independent Test**: Una persona con una cuenta verificada puede iniciar sesión
con ambos métodos admitidos, acceder al estado autenticado y cerrarlo.

**Acceptance Scenarios**:

1. **Given** credenciales correctas de una cuenta verificada, **When** la
   persona inicia sesión, **Then** entra a un estado autenticado.
2. **Given** una cuenta no verificada, **When** intenta iniciar sesión, **Then**
   se le explica claramente que debe verificar su correo, se le dirige a la
   pantalla para revisar su correo y no obtiene acceso a contenido protegido.
3. **Given** credenciales incorrectas, **When** la persona intenta iniciar
   sesión, **Then** recibe un mensaje comprensible sin revelar qué dato fue
   incorrecto.
4. **Given** una sesión activa, **When** la persona cierra sesión, **Then** deja
   de acceder al estado autenticado y al contenido protegido.

---

### User Story 3 - Recuperar una contraseña (Priority: P1)

Como persona que olvidó su contraseña, quiero solicitar un enlace seguro y
establecer una nueva contraseña para recuperar mi cuenta sin divulgar si un
correo está registrado.

**Why this priority**: La recuperación permite restablecer el acceso sin
intervención manual ni exposición de la existencia de cuentas.

**Independent Test**: La solicitud para una dirección registrada y otra no
registrada produce la misma respuesta pública; con un enlace vigente se puede
definir una contraseña válida una sola vez.

**Acceptance Scenarios**:

1. **Given** una persona solicita recuperar la contraseña, **When** envía una
   dirección de correo, **Then** recibe la misma confirmación pública tanto si
   el correo está registrado como si no lo está.
2. **Given** una dirección registrada, **When** se procesa una solicitud de
   recuperación, **Then** se envía un correo con un enlace seguro de un solo uso
   y expiración definida.
3. **Given** un enlace de recuperación vigente, **When** la persona define una
   contraseña que cumple las reglas visibles, **Then** su contraseña se
   actualiza, el enlace deja de ser válido y se le redirige a inicio de sesión
   con una confirmación clara, sin iniciar sesión automáticamente.
4. **Given** un enlace de recuperación inválido, expirado o ya utilizado, **When**
   la persona intenta usarlo, **Then** recibe un mensaje claro y no se modifica
   su contraseña.

---

### User Story 4 - Recibir orientación ante errores (Priority: P2)

Como persona usuaria, quiero mensajes claros y seguros en los flujos de acceso
para corregir problemas sin revelar información sensible.

**Why this priority**: Los errores de autenticación son frecuentes y deben
orientar a la persona sin facilitar abuso de cuentas.

**Independent Test**: Cada error definido se presenta con una explicación útil,
un siguiente paso seguro y sin mostrar contraseñas, enlaces secretos ni datos
internos.

**Acceptance Scenarios**:

1. **Given** un formulario con datos inválidos, **When** se rechaza, **Then** la
   persona identifica el campo o condición que debe corregir y conserva los
   valores no sensibles que sea seguro conservar.
2. **Given** un correo no verificado, **When** el acceso queda bloqueado, **Then**
   se explica el motivo y se indica cómo continuar con la verificación.

### Edge Cases

- Un enlace de verificación o recuperación llega después de expirar; no puede
  cambiar el estado de la cuenta y comunica que debe solicitarse uno nuevo.
- Una persona intenta reutilizar un enlace de verificación o recuperación; el
  sistema no repite la acción ni revela información adicional.
- Una persona solicita repetidamente la recuperación; las respuestas públicas
  preservan la privacidad y el servicio aplica protección frente a abuso.
- Una contraseña no cumple las reglas; no se guarda, se informa la regla
  incumplida y no se borra la información de recuperación necesaria para volver
  a intentar de forma segura.
- Una cuenta existente se intenta vincular automáticamente a una identidad de
  Google con el mismo correo; no se vincula sin una comprobación explícita de
  control de ambas identidades.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir el registro con nombre, correo y
  contraseña, validando que el nombre no sea vacío, el correo tenga formato
  válido y la contraseña tenga al menos 12 caracteres, una letra y un número.
- **FR-002**: El sistema DEBE permitir registro e inicio de sesión mediante
  Google como único proveedor externo incluido en esta feature.
- **FR-003**: Tras cada registro con correo y contraseña, el sistema DEBE enviar
  un enlace de verificación y redirigir a una pantalla para revisar el correo;
  la cuenta permanece no verificada y sin acceso a Home hasta completar la
  verificación.
- **FR-004**: El sistema DEBE permitir verificar un correo mediante un enlace
  seguro, de un solo uso y con expiración definida; al usarlo correctamente, el
  correo debe marcarse como verificado y la persona debe ser redirigida a Home.
- **FR-005**: El sistema DEBE permitir iniciar sesión con correo y contraseña
  únicamente cuando las credenciales sean válidas y el correo esté verificado.
- **FR-006**: El sistema DEBE permitir iniciar sesión con Google y redirigir a
  Home al completarse correctamente, sin requerir verificación de correo
  adicional.
- **FR-007**: El sistema DEBE permitir cerrar sesión y revocar el acceso a
  contenido protegido en el dispositivo actual.
- **FR-008**: El sistema DEBE aceptar solicitudes de recuperación de contraseña
  y devolver la misma confirmación pública para correos registrados y no
  registrados.
- **FR-009**: Para un correo registrado, el sistema DEBE enviar un enlace de
  recuperación seguro, de un solo uso y con expiración definida.
- **FR-010**: El sistema DEBE permitir establecer una contraseña nueva solo con
  un enlace de recuperación vigente y una contraseña que cumpla las reglas de
  FR-001; al completarse, el enlace no puede volver a utilizarse y la persona
  DEBE ser redirigida a inicio de sesión con una confirmación, sin crear una
  sesión automáticamente.
- **FR-011**: El sistema DEBE mostrar mensajes comprensibles y seguros para
  credenciales incorrectas, correo ya registrado, enlace de recuperación
  inválido o expirado, contraseña inválida y correo no verificado.
- **FR-012**: El sistema NO DEBE mostrar, registrar ni almacenar contraseñas en
  texto plano ni incluir datos internos en mensajes visibles o correos. Los
  enlaces seguros de verificación y recuperación DEBEN incluirse únicamente en
  los correos transaccionales destinados a la persona correspondiente y NO
  DEBEN aparecer en logs, toasts, errores ni correos no destinados a ese flujo.
- **FR-013**: La validación de identidad, contraseñas, enlaces y expiraciones
  DEBE realizarse en el límite de seguridad responsable; en esta feature,
  Better Auth constituye ese límite para el cliente. La validación backend y la
  autorización contextual pertenecen a una feature futura y la interfaz solo
  puede reflejar resultados seguros.
- **FR-014**: Las sesiones web y las credenciales destinadas a servicios
  protegidos DEBEN mantenerse separadas; la interfaz no puede persistir ni usar
  información de identidad no validada para decidir autorizaciones.
- **FR-015**: La feature DEBE respetar la separación existente entre cliente y
  servidor: la interfaz presenta y recoge datos, mientras la identidad, sesiones
  y verificación de credenciales permanecen centralizadas en Better Auth. La
  validación backend y las decisiones de autorización contextual se definirán en
  una specification futura; esta feature no modifica `app/server`.
- **FR-016**: Esta feature NO DEBE incluir autenticación multifactor, roles o
  permisos globales, proveedores de inicio de sesión distintos de Google,
  passkeys ni recuperación mediante SMS.

### Key Entities *(include if feature involves data)*

- **Cuenta de usuario**: identidad global asociada a nombre, correo, estado de
  verificación y métodos de acceso permitidos.
- **Sesión**: estado temporal que representa acceso autenticado en un dispositivo
  o navegador.
- **Identidad de Google**: identidad externa vinculada de manera comprobada a
  una cuenta de usuario.
- **Enlace de verificación**: credencial temporal de un solo uso que confirma el
  control de una dirección de correo.
- **Enlace de recuperación**: credencial temporal de un solo uso que permite
  establecer una contraseña nueva.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona con datos válidos puede completar el registro, llegar
  a la pantalla para revisar su correo y, al verificarlo, alcanzar Home en menos
  de 3 minutos, sin asistencia.
- **SC-002**: El 100% de los intentos con enlaces de verificación o recuperación
  expirados, reutilizados o inválidos no cambia el estado de una cuenta.
- **SC-003**: El 100% de las solicitudes de recuperación para correos registrados
  y no registrados devuelve el mismo mensaje público y no confirma la existencia
  de una cuenta.
- **SC-004**: El 100% de los flujos admitidos de registro, inicio de sesión,
  verificación, recuperación y cierre de sesión puede completarse mediante
  teclado y comunica errores sin depender solo del color.
- **SC-005**: En pruebas de mensajes visibles, logs y correos no destinados al
  flujo, el 100% evita mostrar contraseñas, tokens, enlaces seguros,
  identificadores internos o detalles de infraestructura; los correos
  transaccionales destinados al usuario sí contienen el enlace seguro necesario.
- **SC-006**: Una persona con correo no verificado recibe una explicación, es
  dirigida a revisar su correo y no puede acceder a contenido protegido hasta
  verificarlo.

## Assumptions

- La aplicación admite una única clase global de usuario y no incorpora roles ni
  permisos en esta feature.
- Las reglas de contraseña de FR-001 se muestran antes de enviar el formulario.
- Las expiraciones exactas de los enlaces se definen en la planificación de
  seguridad y se comunican de forma clara cuando un enlace deja de ser válido.
- Si un correo ya pertenece a una cuenta, una identidad de Google con el mismo
  correo no se vincula automáticamente; se requiere una comprobación explícita
  del control de ambas identidades.
- La entrega de correos depende de una configuración operativa válida; el sistema
  comunica fallos de forma segura sin exponer datos de la cuenta.
