# Autenticación y correo Checklist: Autenticación de usuarios

**Purpose**: Revisar la completitud, claridad y consistencia de los requisitos de autenticación, Brevo, JWT opcional y manejo de errores del cliente.
**Created**: 2026-08-29
**Feature**: [spec.md](../spec.md) y [plan.md](../plan.md)

**Note**: Esta checklist personalizada fue generada por `/speckit-checklist` a partir del contexto de la feature.
**Review Ownership**: Esta checklist es un artefacto de revisión de calidad de requisitos propiedad del revisor. Marcar `[x]` solo cuando el revisor determine que el criterio de calidad está satisfecho.
**Marker Semantics**: `[x]` significa que el criterio fue revisado y satisfecho para la calidad de los requisitos. No significa que la implementación esté completa.

## Completitud de requisitos

- [x] CHK001 ¿Están documentados todos los resultados de registro por correo, incluido el estado no verificado y el destino de revisión del correo? [Completeness, Spec §User Story 1, §FR-003]
- [x] CHK002 ¿Está documentado el flujo completo de registro e inicio de sesión con Google como único proveedor social? [Completeness, Spec §FR-002, §FR-006]
- [x] CHK003 ¿Están descritos los enlaces de verificación y recuperación, su uso único y sus expiraciones? [Completeness, Spec §FR-004, §FR-009, §FR-010]
- [x] CHK004 ¿Están definidos los requisitos para Brevo, incluyendo API key, remitente y nombre del remitente? [Completeness, Plan §Contexto técnico, Data Model §Variables de entorno]
- [x] CHK005 ¿Está descrito el reenvío del enlace de verificación cuando una cuenta no verificada intenta iniciar sesión? [Completeness, Plan §Contratos de rutas y flujos]
- [x] CHK006 ¿Está especificado Sonner como canal único para errores de validación, Better Auth, OAuth y Brevo? [Completeness, Plan §Restricciones, Contracts §Contrato de interfaz]
- [x] CHK007 ¿Está explícitamente acotado que esta feature solo modifica `app/client` y no `app/server`? [Completeness, Plan §Restricciones]

## Claridad y precisión

- [x] CHK008 ¿La regla de contraseña —mínimo de 12 caracteres, una letra y un número— está expresada de forma inequívoca para registro y recuperación? [Clarity, Spec §FR-001, Plan §Research 5]
- [x] CHK009 ¿Está claro qué significa «correo verificado» para permitir acceso por contraseña y qué acción puede realizar la persona cuando no lo está? [Clarity, Spec §FR-005, Contracts §Acciones visibles]
- [x] CHK010 ¿La duración de una hora para enlaces de verificación y recuperación está identificada como una decisión medible y consistente? [Clarity, Plan §Research 5, Contracts §Acciones visibles]
- [x] CHK011 ¿Está claro que el JWT tiene una duración de 15 minutos y que su audiencia puede ser vacía o nula en pruebas? [Clarity, Plan §Research 3, Data Model §Variables de entorno]
- [x] CHK012 ¿Está definido el comportamiento cuando `AUTH_JWT_AUDIENCE` no tiene valor, incluyendo que no se debe exigir `aud`? [Clarity, Data Model §Contrato de identidad para integración futura]
- [x] CHK013 ¿Está claro que Brevo usa la API key y no una credencial SMTP? [Clarity, Plan §Research 4]
- [x] CHK014 ¿Está definido qué respuesta pública recibe una solicitud de recuperación, sin importar si el correo existe? [Clarity, Spec §FR-008, Contracts §Acciones visibles]

## Consistencia entre artefactos

- [x] CHK015 ¿Son consistentes las redirecciones de éxito hacia Home para Google y verificación, y hacia Login después de recuperar la contraseña? [Consistency, Spec §FR-004, §FR-006, §FR-010, Contracts §Rutas de interfaz]
- [x] CHK016 ¿Coinciden la especificación y el plan en que el registro por correo no crea una sesión utilizable antes de la verificación? [Consistency, Spec §FR-003, Plan §Research 5]
- [x] CHK017 ¿Son consistentes los requisitos de no vincular automáticamente una cuenta Google con una cuenta existente por coincidencia de correo? [Consistency, Spec §Edge Cases, Contracts §Acciones visibles]
- [] CHK018 ¿El alcance sin MFA, roles, passkeys, SMS ni proveedores sociales adicionales aparece igual en los artefactos? [Consistency, Spec §FR-016, Plan §Alcance]
- [x] CHK019 ¿El requisito de no tocar `app/server` concuerda con las referencias al consumo futuro de JWT/JWKS y evita convertirlo en trabajo de esta feature? [Consistency, Plan §Restricciones, Data Model §Contrato futuro]

## Calidad de criterios de aceptación

- [x] CHK020 ¿Puede determinarse objetivamente cuándo un enlace se considera inválido, expirado o ya utilizado y que no modifica la cuenta? [Measurability, Spec §SC-002, §FR-004, §FR-010]
- [x] CHK021 ¿Puede determinarse objetivamente que los mensajes de recuperación para correos registrados y no registrados son idénticos? [Measurability, Spec §SC-003]
- [x] CHK022 ¿Los criterios de accesibilidad especifican teclado y comunicación de errores sin depender solo del color? [Completeness, Spec §SC-004]
- [x] CHK023 ¿Los criterios miden la ausencia de contraseñas, tokens e identificadores internos en mensajes y registros, y limitan los enlaces seguros exclusivamente al correo transaccional destinado al usuario? [Measurability, Spec §SC-005, §FR-012]
- [x] CHK024 ¿Está definido cómo se evalúa que una persona no verificada no puede recibir contenido protegido? [Measurability, Spec §SC-006, Contracts §Rutas de interfaz]

## Cobertura de escenarios y errores

- [x] CHK025 ¿Están cubiertos los errores de credenciales incorrectas, correo existente, contraseña inválida, correo no verificado y OAuth fallido? [Coverage, Spec §FR-011]
- [ ] CHK026 ¿Están cubiertos los fallos de entrega de Brevo sin revelar la existencia de la cuenta, el token, el enlace fuera del correo destinatario ni detalles internos? [Coverage, Assumption, Plan §Data Model Envío de correo]
- [x] CHK027 ¿Está definido el siguiente paso para un enlace de verificación o recuperación expirado, inválido o reutilizado? [Coverage, Spec §Edge Cases, Contracts §Acciones visibles]
- [x] CHK028 ¿Está definido el comportamiento ante solicitudes repetidas de recuperación y reenvíos repetidos de verificación frente al abuso? [Coverage, Spec §Edge Cases]
- [x] CHK029 ¿Está cubierto el cierre de sesión cuando la revocación falla, sin presentar una salida falsa? [Coverage, Contracts §Acciones visibles]
- [x] CHK030 ¿Está documentado el estado de carga, bloqueo contra envíos duplicados y recuperación de cada formulario de autenticación? [Gap, Coverage]

## Seguridad, dependencias y límites

- [x] CHK031 ¿Está especificado que Better Auth es la fuente única de verdad para cuentas, sesiones, contraseñas, recuperación y verificación? [Security, Spec §FR-013, §FR-015, Constitution §XIII]
- [x] CHK032 ¿Está claro que la sesión web y el JWT de servicio son credenciales separadas y que el JWT no se persiste en el navegador? [Security, Spec §FR-014, Data Model §Contrato futuro]
- [x] CHK033 ¿Están identificadas las dependencias operativas de Brevo —cuenta, API key y remitente verificado— y su responsable de configuración? [Dependency, Plan §Research 4, Quickstart §Preparación local]
- [x] CHK034 ¿Está explícito que la migración del esquema estándar de Better Auth/Neon es responsabilidad externa y no una modificación de tablas propia? [Dependency, Plan §Contexto técnico, Quickstart §Preparación local]
- [x] CHK035 ¿Está definido el alcance del contrato JWT/JWKS futuro sin exigir cambios en `app/server` durante esta feature? [Boundary, Plan §Correspondencia futura de identidad]

## Notas

- Marcar `[x]` solo después de revisar que el requisito está completo, claro y consistente.
- Mantener sin marcar los elementos que aún requieran aclaración, corrección o decisión del revisor.
- `/speckit-implement` puede leer el estado de esta checklist como compuerta, pero no debe modificar sus marcadores.
- `checklists/requirements.md` mantiene su ciclo de vida independiente mediante `/speckit-specify` y `/speckit-clarify`.
- Los elementos marcados `[Gap]` señalan dimensiones que podrían requerir una aclaración adicional antes de generar tareas.
