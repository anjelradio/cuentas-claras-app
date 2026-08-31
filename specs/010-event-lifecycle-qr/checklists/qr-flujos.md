# Checklist de requisitos: ciclo de QR, permisos y flujos

**Purpose**: Revisar la claridad, completitud y consistencia de los requisitos de ciclo de vida del QR, autorización contextual y resultado posterior a cada mutación de eventos.
**Created**: 2026-08-30
**Feature**: [spec.md](../spec.md)

**Note**: Esta checklist personalizada es un artefacto de revisión de calidad de requisitos, no una lista de pruebas de implementación.
**Review Ownership**: La checklist pertenece a quien revisa los requisitos. Marque `[x]` solo cuando el criterio de calidad esté satisfecho.
**Marker Semantics**: `[x]` indica que el requisito está bien definido; no indica que la implementación esté completada.

## Completitud del ciclo de vida del QR

- [x] CHK001 ¿Están definidos los requisitos para ausencia de QR, creación inicial, consulta de QR existente y sustitución, sin dejar estados intermedios sin propietario? [Completitud, Spec §User Story 4, FR-016–FR-021]
- [x] CHK002 ¿Se especifica qué referencia de QR puede considerarse activa y qué datos se conservan para eliminar de forma segura el activo reemplazado? [Claridad, Spec §Key Entities, FR-020, FR-027]
- [x] CHK003 ¿Están diferenciadas las consecuencias de que falle la validación del archivo, la carga externa, la asociación persistente y la limpieza del activo previo? [Cobertura, Spec §Edge Cases, FR-018, FR-021, FR-027]
- [x] CHK004 ¿Se define el destino del QR y de su referencia cuando una membresía pasa a `left`, sin confundirlo con la conservación del historial financiero? [Consistencia, Spec §User Story 1, FR-004, FR-026, FR-028]
- [x] CHK005 ¿Se documenta un límite verificable para tipo, tamaño, contenido vacío y archivo dañado, así como el mensaje seguro aplicable a cada rechazo? [Completitud, Spec §FR-018]
- [x] CHK006 ¿Están especificados los criterios para reintentar una limpieza externa pendiente, incluido qué información de diagnóstico puede persistirse sin revelar secretos? [Gap, Spec §FR-027, FR-028, Plan §Backend]

## Permisos y estados del evento

- [x] CHK007 ¿La specification distingue claramente permisos de lectura de permisos de mutación para dueño, miembro activo y miembro inactivo? [Claridad, Spec §FR-003, FR-012, FR-016, Assumptions]
- [x] CHK008 ¿Los requisitos de evento cerrado son consistentes para abandono, transferencia, edición, invitaciones, gestión de miembros y QR? [Consistencia, Spec §User Story 3, FR-006, FR-013]
- [x] CHK009 ¿Se especifica de manera inequívoca que la consulta del QR propio continúa permitida en un evento cerrado, pero su creación o actualización no? [Claridad, Spec §Clarifications, FR-013, FR-016, Contract §GET/PUT my-qr]
- [x] CHK010 ¿Están definidos los resultados cuando la membresía, el dueño o el estado cambian entre la apertura de una interfaz y la solicitud de mutación? [Cobertura, Spec §Edge Cases, FR-003, FR-023]
- [x] CHK011 ¿Los requisitos indican la fuente de verdad para identidad, propiedad y membresía, sin basarse en controles ocultos en la interfaz? [Seguridad, Spec §FR-023, Plan §Constitution Check]
- [x] CHK012 ¿Se aclara el criterio de autorización para un dueño anterior que intenta administrar un evento después de transferir la propiedad? [Completitud, Spec §User Story 2, FR-009–FR-011]

## Resultados posteriores a mutaciones

- [x] CHK013 ¿Se especifica el destino posterior al abandono para todos los puntos desde los que pudiera iniciarse, además de la actualización de “Mis eventos”? [Gap, Spec §User Story 1, FR-007]
- [x] CHK014 ¿Está definido que una transferencia exitosa dirige al dueño anterior a “Mis eventos” y que los errores no cambian su ubicación ni permisos visibles? [Claridad, Spec §User Story 2, FR-010–FR-011]
- [x] CHK015 ¿Se documenta el estado visible posterior a cerrar y reabrir, incluida la acción administrativa siguiente y el tratamiento de datos desactualizados? [Completitud, Spec §User Story 3, FR-014]
- [x] CHK016 ¿Se especifica de forma consistente qué ocurre después de crear o actualizar QR: mensaje, cierre del panel, recarga de datos y preservación del QR anterior ante error? [Consistencia, Spec §User Story 4, FR-021, FR-024, Plan §Frontend]
- [x] CHK017 ¿Están diferenciados los mensajes de éxito, rechazo de permiso y fallo recuperable de infraestructura sin exponer información de almacenamiento? [Completitud, Spec §FR-022, FR-024]
- [x] CHK018 ¿Los requisitos definen cuándo debe invalidarse o refrescarse información visible después de abandono, transferencia, cambio de estado y QR, sin depender de estado local obsoleto? [Cobertura, Spec §FR-007, FR-011, FR-014, FR-024]

## Recuperación, consistencia y seguridad

- [x] CHK019 ¿Los requisitos describen una estrategia coherente para mantener el QR nuevo confirmado si falla la eliminación del anterior? [Consistencia, Spec §FR-020–FR-021, FR-027]
- [x] CHK020 ¿Está definido el comportamiento requerido cuando la carga externa termina pero la persistencia falla, incluida la compensación del activo nuevo? [Cobertura, Spec §Edge Cases, FR-021, Plan §Backend]
- [x] CHK021 ¿Se especifica cómo se preserva la integridad si se repiten solicitudes de abandono, transferencia, cierre/reapertura o actualización de QR? [Cobertura, Spec §Edge Cases, SC-009]
- [x] CHK022 ¿Los requisitos prohíben que tokens, credenciales, identificadores internos de Cloudinary o respuestas del proveedor aparezcan en mensajes públicos? [Seguridad, Spec §FR-022, Contract §ErrorRead]
- [x] CHK023 ¿Se documentan responsabilidades y límites entre el almacenamiento externo, la base de datos y el mecanismo de limpieza reintentable? [Dependencia, Spec §Assumptions, Plan §Backend, Data Model §QrAssetCleanup]

## Calidad de aceptación y accesibilidad

- [x] CHK024 ¿Los criterios de éxito de QR distinguen tiempo de confirmación de carga y recuperación de errores, con métricas objetivamente evaluables? [Medibilidad, Spec §SC-006–SC-007]
- [x] CHK025 ¿Los requisitos de AlertDialog y Sheet incluyen foco, teclado, cancelación y mensajes accesibles para los flujos de abandono y QR? [Cobertura, Spec §FR-002, FR-025]
- [x] CHK026 ¿La referencia visual de “Mis eventos” se relaciona con requisitos suficientes sobre disponibilidad del control de abandono en eventos abiertos y ausencia en cerrados? [Completitud, Spec §FR-001, Assumptions, Plan §Frontend]
- [x] CHK027 ¿Se especifican criterios claros para que el QR previo siga siendo utilizable ante fallos y deje de ser visible al abandonar? [Consistencia, Spec §User Story 4, FR-021, FR-028]

## Notes

- Marque `[x]` únicamente después de aprobar la calidad de redacción del requisito correspondiente.
- Mantenga sin marcar los ítems que requieran aclaración, corrección o decisión de producto.
- `$speckit-implement` puede leer el estado de esta checklist, pero no debe modificar sus marcadores.
- `checklists/requirements.md` mantiene un ciclo separado gestionado por `$speckit-specify` y `$speckit-clarify`.
- Añada hallazgos o enlaces junto al ítem pertinente.
