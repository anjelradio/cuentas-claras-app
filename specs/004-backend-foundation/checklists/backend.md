# Checklist técnica mínima: Fundación del backend

**Purpose**: Revisar que los requisitos y el plan describan con suficiente precisión una fundación de backend funcional, segura y mantenible.

**Created**: 2026-08-29

**Feature**: [spec.md](../spec.md)

**Note**: Esta checklist valida la calidad de los requisitos, no la implementación.

**Review Ownership**: Es un artefacto de revisión. Marcar `[x]` solo cuando la persona revisora determine que el criterio de calidad de requisitos está satisfecho.

**Marker Semantics**: `[x]` no significa que el código esté implementado ni que una prueba haya pasado.

## Completitud de la fundación

- [x] CHK001 ¿Están definidos el directorio exclusivo del servidor, el entorno virtual y el mecanismo de instalación sin crear un proyecto alternativo? [Completeness, Spec §FR-001, Plan §Contexto técnico]
- [x] CHK002 ¿Está especificado el único endpoint público inicial, incluyendo su versión de ruta, su respuesta y la ausencia de autenticación? [Completeness, Spec §FR-002, Contract §GET /api/v1/health]
- [x] CHK003 ¿Está delimitado que `modules/` queda vacío y que los primeros módulos de negocio, persistencia y migraciones no forman parte de esta entrega? [Scope, Spec §FR-003, §FR-013]
- [x] CHK004 ¿Están documentadas todas las variables de entorno necesarias, con finalidad, obligatoriedad y valores de ejemplo no sensibles? [Completeness, Assumptions, Plan §Contexto técnico]

## Claridad de seguridad e integración

- [x] CHK005 ¿Se distingue explícitamente entre verificar un JWT firmado y descifrarlo, evitando que la redacción permita una validación insegura? [Clarity, Spec §FR-004, §FR-007]
- [x] CHK006 ¿Están definidos de forma inequívoca los claims que deben validarse y el comportamiento cuando la audiencia no está configurada? [Clarity, Spec §FR-005, Assumptions]
- [x] CHK007 ¿Está documentado que `sub` validado corresponde a Better Auth `user.id` y que ninguna identidad aportada por el cliente puede sustituirlo? [Traceability, Spec §FR-006, Plan §Correspondencia de identidad]
- [x] CHK008 ¿Están definidos los requisitos para fallo de JWKS, rotación de `kid`, JWT alterado, vencido y ausente sin revelar detalles de verificación? [Coverage, Spec §Edge Cases, §FR-009]
- [x] CHK009 ¿La lista de orígenes permitidos está definida como configurable por entorno y es consistente con la prohibición de un comodín global? [Consistency, Spec §FR-014, Clarifications]

## Contrato de errores y calidad

- [x] CHK010 ¿El contrato público define campos obligatorios, detalles permitidos y códigos para autenticación, validación e infraestructura? [Completeness, Spec §FR-010, Contract §Contrato de error uniforme]
- [x] CHK011 ¿Está especificado de manera consistente qué información no puede aparecer en ningún error público, incluidos secretos, tokens, SQL y trazas? [Consistency, Spec §FR-011, Contract §Contrato de error uniforme]
- [x] CHK012 ¿Los requisitos distinguen los errores controlados de los inesperados y definen el comportamiento seguro de ambos? [Coverage, User Story 3, Spec §FR-010]
- [x] CHK013 ¿Están definidos los criterios de pruebas automatizadas para salud, contrato de errores y credenciales válidas, ausentes, vencidas y manipuladas? [Measurability, Spec §FR-012, §SC-002]

## Coherencia y preparación de entrega

- [x] CHK014 ¿La estructura prevista respeta Router → Service → Repository → Base de datos para futuros módulos sin introducir capas sin uso en la fundación? [Consistency, Plan §Estructura del proyecto, Constitution §V]
- [x] CHK015 ¿Los objetivos de disponibilidad y rendimiento están cuantificados y delimitados a lo que la fundación puede medir sin dependencias externas? [Measurability, Spec §SC-001, Plan §Objetivos de rendimiento]
- [x] CHK016 ¿La guía de arranque enumera los prerrequisitos, la activación de `venv`, las comprobaciones de calidad y los resultados esperados sin requerir secretos reales? [Completeness, Quickstart §Preparación local, §Validación automatizada]

## Notes

- Marcar ítems `[x]` solo después de la revisión de requisitos.
- Dejar ítems sin marcar cuando requieran aclaración, corrección o una decisión de la persona revisora.
- `$speckit-implement` lee el estado de las checklists como compuerta y no debe modificar sus marcadores.
- `checklists/requirements.md` tiene un ciclo de vida separado, mantenido por `$speckit-specify` y `$speckit-clarify`.
