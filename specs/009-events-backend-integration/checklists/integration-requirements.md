# Integration Requirements Checklist: events-backend-integration

**Purpose**: Validar la completitud y claridad de los requerimientos y el diseño arquitectónico para la conexión frontend-backend, modificaciones del backend y el cumplimiento de la constitución del frontend.
**Created**: 2026-08-30
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)

**Note**: Este checklist personalizado fue generado por el comando `/speckit-checklist` basado en el contexto y requerimientos de la funcionalidad.
**Review Ownership**: Este checklist es un artefacto de revisión de calidad de requerimientos propiedad del revisor. Marca un elemento con `[x]` solo cuando el revisor determine que el criterio de calidad del requerimiento ha sido satisfecho.
**Marker Semantics**: `[x]` significa que el criterio ha sido revisado y satisfecho respecto a la calidad del requerimiento. No significa que el trabajo de implementación esté completo.

## Modificaciones del Backend y Conexión de API

- [x] CHK001 - ¿Están completamente documentados los esquemas de entrada y salida para el nuevo endpoint `GET /api/events/{event_id}/members`? [Completeness, Contracts]
- [x] CHK002 - ¿Está explícitamente definida la regla de autorización para acceder al endpoint de miembros (ej., debe ser miembro del evento)? [Clarity, Contracts]
- [x] CHK003 - ¿Están especificados los formatos de respuesta de errores HTTP (ej. 401, 403, 404, 422) para los endpoints nuevos y existentes del backend? [Gap, Exception Flow]
- [x] CHK004 - ¿Están claramente documentados los requerimientos del cuerpo de la petición (payload) para la mutación de 'transferir propiedad'? [Completeness, Spec §FR-004]
- [x] CHK005 - ¿El modelo de datos define claramente cómo interactúa el estado de `EventMember` con la lógica de dueño (owner) derivada de `Event.user_id`? [Consistency, Data Model]
- [x] CHK006 - ¿Están explícitamente declarados los requerimientos para la generación de invitaciones en el backend (ej. tiempo de vida y formato del token hash)? [Clarity, Spec §FR-005]

## Cumplimiento de la Constitución del Frontend

- [x] CHK007 - ¿Están explícitamente declaradas en el diseño las reglas para centralizar las carpetas `_services` y `_types` para cumplir con la estructura de carpetas del proyecto? [Compliance, Plan]
- [x] CHK008 - ¿Está explícitamente documentado el requerimiento de usar notificaciones (toasts) de Sonner para todos los resultados de mutaciones (éxito/error)? [Completeness, Spec §FR-009]
- [x] CHK009 - ¿Se encuentran capturadas en el plan estructural las instrucciones para eliminar las carpetas ilegales (`_data`, `_tests` en `[eventId]`)? [Compliance, Plan]
- [x] CHK010 - ¿Existe un requerimiento documentado para implementar archivos de límite de Next.js (`loading.tsx`, `error.tsx`) para las nuevas rutas tal como exige la constitución? [Coverage, Constitution §XXVII]
- [x] CHK011 - ¿Están especificados los requerimientos de documentación en línea en español para los nuevos servicios y componentes? [Completeness, Constitution §XXVIII]

## Escenarios de Extremo a Extremo (E2E) y Casos Extremos

- [x] CHK012 - ¿Están definidos los requerimientos para manejar tiempos de espera de red o indisponibilidad del backend durante las llamadas a la API? [Coverage, Exception Flow]
- [x] CHK013 - ¿Está explícitamente especificado el comportamiento esperado en el frontend cuando un token de invitación es inválido o ha expirado? [Edge Case, Spec]
- [x] CHK014 - ¿Detalla la especificación el flujo exacto de redirección (`?redirect=`) y la persistencia de estado después de un inicio de sesión exitoso desde un enlace de invitación? [Clarity, Spec §FR-008]
- [x] CHK015 - ¿Existen requerimientos que definan cómo maneja la interfaz los conflictos de mutaciones concurrentes (ej., intentar remover a un miembro que ya se fue)? [Coverage, Gap]

## Notes

- Marca los elementos con `[x]` solo después de que la revisión confirme que el criterio de calidad del requerimiento está satisfecho
- Deja los elementos desmarcados cuando aún requieran aclaración, corrección o evaluación del revisor
- `/speckit-implement` lee el estado de la casilla de verificación del checklist como una compuerta (gate) y no debe modificar los marcadores
- `checklists/requirements.md` tiene un ciclo de vida integrado y separado, mantenido por `/speckit-specify` y `/speckit-clarify`
