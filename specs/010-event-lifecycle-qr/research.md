# Research: ciclo de vida del evento y QR de cobro

## Decisión: reutilizar y corregir la API de eventos existente

- **Decisión**: Mantener `POST /api/events/{event_id}/leave`, `POST /api/events/{event_id}/transfer-ownership` y `PATCH /api/events/{event_id}`. El PATCH recibe `{ "status": "closed" }` o `{ "status": "open" }` para cerrar o reabrir. Añadir únicamente `GET` y `PUT /api/events/{event_id}/my-qr`.
- **Rationale**: La auditoría encontró los tres endpoints y los modelos `Event.status`, `Event.closed_at` y `EventMember.qr_image`. Reutilizarlos reduce superficie pública y conserva los clientes existentes.
- **Alternatives considered**: Endpoints separados para cerrar/reabrir o una API paralela de ciclo de vida. Se descartan porque duplicarían un update ya tipado y autorizado.

## Decisión: todos los cambios se autorizan y bloquean por estado en backend

- **Decisión**: El backend consulta la membresía activa, el dueño actual y el estado vigente del evento en cada mutación. `CLOSED` deniega abandonar, transferencia, edición, invitaciones, gestión de miembros y QR; solo el dueño vigente puede reabrir mediante PATCH.
- **Rationale**: La interfaz puede estar desactualizada y no es una fuente de autorización. La regla cumple FR-006, FR-013 y FR-023.
- **Alternatives considered**: Ocultar solo acciones del frontend o permitir acciones que ya tengan endpoint. Se descartan porque una petición directa o una pestaña anterior evadiría la regla.

## Decisión: Cloudinary se usa solo desde el backend con SDK Python

- **Decisión**: Añadir el paquete `cloudinary`; el router recibe `UploadFile` multipart y un adaptador de `modules/events/integrations/` llama `cloudinary.uploader.upload` y `destroy`. Las credenciales viven exclusivamente en `app/server/.env` y se documentan vacías en `.env.example`.
- **Rationale**: La carga firmada por servidor evita exponer `API_SECRET`. El SDK devuelve `secure_url` y `public_id`, datos necesarios para lectura y limpieza.
- **Alternatives considered**: Upload unsigned/directo desde navegador, una URL de Cloudinary en el cliente o solo almacenar URL. Se descartan porque expondrían capacidad de subida o impedirían eliminar de forma fiable el activo anterior.
- **Fuentes**: [Cloudinary Python quick start](https://cloudinary.com/documentation/python_quickstart), [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference), [FastAPI request files](https://fastapi.tiangolo.com/tutorial/request-files/).

## Decisión: validar antes de cargar y persistir identificador de destrucción

- **Decisión**: Aceptar solo JPEG, PNG y WebP de hasta 5 MiB. Validar tamaño real, tipo MIME permitido y decodificación de imagen antes de subir. Añadir `qr_image_public_id` a la membresía junto con `qr_image` (URL segura).
- **Rationale**: El nombre o MIME del navegador no es confiable. El `public_id`, no la URL, es la referencia soportada por Cloudinary para `destroy`.
- **Alternatives considered**: Validar solo en cliente, confiar en la extensión, o persistir solo URL. Se descartan por seguridad y porque impedirían cumplir FR-018, FR-020 y FR-028.

## Decisión: usar compensación y cola persistente de limpieza

- **Decisión**: En una actualización se sube el archivo nuevo, se confirma en una transacción el nuevo URL/public ID y se registra un trabajo de limpieza para el activo anterior. En abandono, la misma transacción marca `LEFT`, desvincula QR y registra limpieza. El trabajo conserva estado reintentable; un fallo externo no revierte la BD ya confirmada.
- **Rationale**: PostgreSQL y Cloudinary no comparten transacción. La cola evita perder una eliminación pendiente y cumple FR-027/FR-028 sin reactivar membresías ni borrar la referencia nueva.
- **Alternatives considered**: Eliminar antes de persistir, revertir datos tras un error de Cloudinary o ignorar fallos de limpieza. Se descartan por pérdida de QR activo, estados parciales o activos huérfanos.

## Decisión: revalidar en lugar de mantener permisos locales

- **Decisión**: Tras abandonar, cerrar/reabrir o cargar QR, usar `router.refresh()`; tras transferir propiedad, navegar a `/my-events`. La carga inicial de Event Home solicita detalle y QR propio en paralelo. `EventApi` consume el envelope `ErrorRead.message` para Sonner.
- **Rationale**: El backend recalcula permisos a partir de la relación vigente. La redirección tras transferencia elimina controles de dueño obsoletos; la carga paralela evita un round-trip secuencial.
- **Alternatives considered**: Actualización optimista de roles/estado o retener la lista de miembros tras transferir. Se descartan porque son vulnerables a concurrencia y contradicen FR-011/FR-024.

## Decisión: AlertDialog y Sheet existentes

- **Decisión**: Usar `AlertDialog` para abandonar y para cerrar/reabrir si se confirma la acción; usar `Sheet` inferior existente para QR, con selector de archivo accesible e imagen actual.
- **Rationale**: Los componentes ya integran foco, Escape, restauración de foco y semántica accesible. La referencia visual de “Mis eventos” define el botón de abandono para eventos abiertos.
- **Alternatives considered**: `window.confirm`, modales a medida o una nueva biblioteca de UI. Se descartan por inconsistencia, accesibilidad y por las reglas de shadcn/ui del proyecto.
