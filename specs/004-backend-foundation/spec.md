# Feature Specification: Fundación del backend

**Feature Branch**: `No creada (no hay hook before_specify configurado)`

**Created**: 2026-08-29

**Status**: Draft

**Ámbito de implementación**: Backend: `app/server/`

**Input**: Inicializar el servidor de Cuentas Claras como una base funcional,
segura y modular para capacidades futuras, incluida la comprobación de identidad
procedente del cliente.

## Clarifications

### Session 2026-08-29

- Q: ¿La fundación debe exponer un endpoint protegido mínimo que devuelva la identidad validada, además del endpoint público de estado? → A: No exponer endpoint protegido todavía; comprobar la autenticación solo con pruebas internas.
- Q: ¿Cómo debe controlar el servidor los orígenes web autorizados para las futuras solicitudes desde el cliente? → A: Permitir únicamente una lista explícita y configurable de orígenes autorizados.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Disponer de un servidor inicial operativo (Priority: P1)

Como integrante del equipo, quiero iniciar el servidor y comprobar de forma
segura que está disponible, para poder desarrollar capacidades de negocio sobre
una base estable.

**Why this priority**: Sin una base que pueda arrancarse y diagnosticarse, los
módulos futuros no pueden construirse ni validarse de manera confiable.

**Independent Test**: Al iniciar el servidor en un entorno local, una solicitud
de estado devuelve una confirmación pública de disponibilidad sin revelar
configuración interna.

**Acceptance Scenarios**:

1. **Given** una configuración local válida, **When** el equipo inicia el
   servidor, **Then** el servicio queda disponible y expone una comprobación de
   estado pública.
2. **Given** una persona consulta la comprobación de estado, **When** el
   servidor está disponible, **Then** recibe una respuesta breve y estable sin
   secretos, trazas ni detalles de infraestructura.

---

### User Story 2 - Proteger la identidad de quien consume el servidor (Priority: P1)

Como persona con una sesión válida en la aplicación web, quiero que el servidor
reconozca mi identidad únicamente a partir de una credencial firmada y válida,
para que nadie pueda suplantarme al consumir futuras capacidades protegidas.

**Why this priority**: La identidad confiable es el límite de seguridad común
para todos los módulos futuros.

**Independent Test**: Las pruebas internas demuestran que una credencial válida
produce un contexto de identidad y que las credenciales ausentes, vencidas,
manipuladas o emitidas para otro destino son rechazadas de manera uniforme.

**Acceptance Scenarios**:

1. **Given** una credencial vigente y verificable evaluada por el verificador
   interno, **When** el servidor la procesa, **Then** obtiene la identidad
   estable del actor y la deja disponible para futuros routers protegidos.
2. **Given** una credencial ausente, con formato inválido, vencida, alterada o
   no destinada al servidor, **When** el verificador interno la procesa,
   **Then** la rechaza sin exponer el motivo interno de la validación.
3. **Given** una credencial válida, **When** el verificador construye el
   contexto de identidad, **Then** utiliza exclusivamente el claim validado
   `sub` y no admite identificadores alternativos.

---

### User Story 3 - Recibir errores seguros y coherentes (Priority: P2)

Como consumidor de la aplicación, quiero recibir errores predecibles y
comprensibles cuando algo falla, para saber si debo corregir la solicitud,
volver a autenticarme o intentar más tarde sin recibir datos sensibles.

**Why this priority**: Un contrato uniforme evita que cada futura capacidad
exponga detalles internos o cree respuestas incompatibles.

**Independent Test**: Los errores de autenticación, validación y fallos no
esperados producen el mismo formato público, con códigos estables y sin trazas
ni secretos.

**Acceptance Scenarios**:

1. **Given** una solicitud inválida, **When** el servidor la rechaza, **Then**
   recibe un código estable, un mensaje seguro y solo detalles permitidos.
2. **Given** un fallo inesperado de infraestructura, **When** el servidor
   responde, **Then** conserva un formato seguro y no expone trazas, secretos,
   consultas ni credenciales.

### Edge Cases

- La clave pública necesaria para verificar una credencial no está disponible o
  se rota; la solicitud protegida se rechaza de forma segura y no se acepta una
  credencial no verificada.
- La audiencia de una credencial no está configurada para el entorno; el
  servidor no exige una audiencia inexistente, pero sí valida cualquier
  audiencia que esté configurada.
- Una persona presenta una credencial con formato correcto pero firma, emisor,
  vigencia o identificador de clave inválidos; no recibe detalles que faciliten
  un ataque.
- Un módulo futuro lanza una excepción de dominio no prevista; la respuesta
  pública conserva el contrato común y el detalle interno no llega al cliente.
- Un navegador envía una solicitud desde un origen que no está autorizado para
  su entorno; el servidor no lo habilita mediante un comodín global.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE inicializar el proyecto de servidor únicamente
  dentro de `app/server/`, sin modificar el cliente ni crear proyectos de
  servidor alternativos.
- **FR-002**: El sistema DEBE poder iniciarse con la configuración mínima de
  desarrollo y ofrecer una comprobación pública de disponibilidad que no
  requiera autenticación.
- **FR-003**: El sistema DEBE proporcionar una base modular vacía que permita
  que futuras capacidades separen sus interfaces, casos de uso, persistencia,
  modelos y contratos sin incluir todavía ninguna capacidad de negocio.
- **FR-004**: El sistema DEBE aceptar una identidad para operaciones protegidas
  solo cuando provenga de una credencial firmada y validada criptográficamente
  contra las claves públicas publicadas por el proveedor de identidad.
- **FR-005**: Antes de aceptar una credencial protegida, el sistema DEBE validar
  su firma, vigencia, emisor, identificador de clave y audiencia cuando esta se
  encuentre configurada.
- **FR-006**: La correspondencia de identidad DEBE ser explícita: el claim
  validado `sub` representa el identificador global interno de Better Auth y es
  la única identidad del actor disponible para las futuras operaciones de
  dominio.
- **FR-007**: El sistema NO DEBE descifrar una credencial ni confiar en una
  simple lectura de su contenido; tampoco DEBE aceptar identidad, permisos o
  decisiones de autorización aportadas por el cliente fuera de una credencial
  validada.
- **FR-008**: El sistema NO DEBE administrar contraseñas, sesiones, registro,
  recuperación de credenciales ni proveedores sociales; esas responsabilidades
  permanecen en Better Auth del cliente.
- **FR-009**: El sistema DEBE rechazar de forma segura las solicitudes
  protegidas sin credencial, con credencial malformada, vencida, alterada, de
  emisor no confiable, de audiencia no permitida o cuya clave pública no pueda
  verificarse.
- **FR-010**: El sistema DEBE gestionar centralmente las excepciones de
  autenticación, autorización, validación, dominio e infraestructura y producir
  un contrato público uniforme con código estable, mensaje seguro y detalles
  opcionales permitidos.
- **FR-011**: Las respuestas de error NO DEBEN exponer trazas, SQL,
  credenciales, secretos, tokens, claves públicas sensibles ni detalles internos
  de infraestructura.
- **FR-012**: La fundación DEBE incluir pruebas automatizadas de la disponibilidad
  pública, el contrato centralizado de errores y la aceptación/rechazo de
  credenciales válidas, ausentes, vencidas y manipuladas.
- **FR-013**: Esta feature NO DEBE incluir módulos de negocio, endpoints de
  gastos, eventos, pagos, miembros, balances, roles globales, un endpoint
  protegido de diagnóstico, persistencia de dominio ni migraciones de datos.
- **FR-014**: El sistema DEBE permitir solicitudes web futuras solo desde una
  lista explícita de orígenes autorizados y configurable por entorno; no DEBE
  autorizar todos los orígenes mediante un comodín global.

### Key Entities *(include if feature involves data)*

- **Contexto de identidad**: representación transitoria de la persona que
  realiza una solicitud protegida, obtenida solo después de validar su
  credencial.
- **Error público**: respuesta consistente que comunica un código estable,
  mensaje seguro y detalles permitidos sin exponer información interna.
- **Clave pública de verificación**: material publicado por el proveedor de
  identidad que permite comprobar la firma de las credenciales sin compartir
  secretos con el servidor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El equipo puede iniciar el servidor y obtener una comprobación de
  disponibilidad en menos de cinco minutos siguiendo las instrucciones del
  proyecto.
- **SC-002**: El 100% de las pruebas de credenciales válidas, ausentes,
  vencidas y manipuladas produce el resultado de acceso esperado.
- **SC-003**: El 100% de los errores públicos probados conserva el mismo formato
  y no contiene secretos, tokens, trazas, consultas ni credenciales.
- **SC-004**: El 100% de las pruebas internas del verificador construye el
  contexto de identidad exclusivamente a partir del claim validado `sub`, sin
  aceptar identificadores alternativos procedentes de datos externos. Esta
  fundación no expone todavía rutas protegidas.
- **SC-005**: La fundación entrega cero capacidades de negocio y deja una ruta
  clara para añadir un módulo futuro sin reorganizar el código base.

## Assumptions

- Better Auth continúa siendo la fuente única de verdad para la identidad global
  y publica claves públicas para verificar las credenciales que emite.
- La credencial del cliente es un JWT firmado, no cifrado; el servidor la
  verifica criptográficamente y no necesita ni debe conocer una clave privada
  del proveedor de identidad.
- La audiencia puede estar vacía en entornos de prueba; si está configurada en
  un entorno, debe validarse de forma exacta.
- La configuración de URLs, emisor y audiencia por entorno se proporcionará
  mediante variables de entorno sin incluir valores reales en el repositorio.
- Los orígenes web autorizados se configurarán por entorno y la lista incluirá
  solo los dominios del cliente que correspondan a cada despliegue.
- La base de datos y las migraciones de los futuros módulos no forman parte de
  esta fundación inicial.
