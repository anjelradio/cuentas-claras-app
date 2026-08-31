# Implementation Plan: Ciclo de vida del evento y QR de cobro

**Branch**: `[010-event-lifecycle-qr]` | **Date**: 2026-08-30 | **Spec**: [spec.md](./spec.md)

**Input**: Completar el abandono de eventos, la transferencia de propiedad, el cierre/reapertura y el QR personal de cobro, reutilizando la UI de referencia de `design/event/my-events.html` y los componentes shadcn/ui existentes.

## Summary

Completar el ciclo de vida de eventos en los dos proyectos del monorepo. El backend reutilizará los endpoints existentes de abandono, transferencia y actualización de evento, endurecerá su autorización contextual y añadirá el recurso de QR propio. El QR se recibirá como `multipart/form-data`, se validará y almacenará exclusivamente mediante el SDK de Cloudinary en el backend; el navegador nunca recibe credenciales de almacenamiento. El frontend incorporará el diálogo de abandono de la referencia visual, redirecciones y revalidación posteriores a mutaciones, el control de cerrar/reabrir exclusivo del dueño y un Sheet accesible para registrar o actualizar el QR.

La auditoría inicial determinó que `POST /api/events/{event_id}/leave`, `POST /api/events/{event_id}/transfer-ownership` y `PATCH /api/events/{event_id}` ya existen. El primero debe rechazar eventos cerrados y limpiar el QR; la transferencia y las demás mutaciones deben rechazar eventos cerrados. No existe aún un contrato ni integración para QR.

## Technical Context

**Language/Version**: Python 3.12+ (FastAPI/SQLModel) y TypeScript 5 / React 19 / Next.js 16 App Router.

**Primary Dependencies**: FastAPI, SQLModel, SQLAlchemy, Alembic, PyJWT/JWKS; Next.js, Better Auth, shadcn/ui, Tailwind CSS, Sonner, lucide-react; añadir `cloudinary` (SDK Python) al backend.

**Storage**: Neon PostgreSQL mediante SQLModel/SQLAlchemy y Alembic; Cloudinary para una imagen QR activa por membresía. Se persistirán URL segura y `public_id` de Cloudinary para permitir reemplazo y eliminación seguros.

**Testing**: `pytest` + HTTPX/ASGI para contratos, unitarias de services/repositorios e integración con Cloudinary simulada; Vitest + Testing Library para flujos de interfaz; `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pytest`, `ruff check` y `mypy`.

**Target Platform**: Navegadores modernos en móvil y escritorio; servidor Linux con Python 3.12 y PostgreSQL/Neon.

**Project Type**: Aplicación web cliente-servidor en monorepo.

**Performance Goals**: Refrescar estado de evento y lista dentro de 2 s en condiciones normales; mostrar un QR confirmado dentro de 5 s para cargas válidas de hasta 5 MiB.

**Constraints**: JWT emitido por Better Auth y validado contra JWKS; autorización contextual en backend; evento cerrado es solo lectura excepto su reapertura por el dueño; JPEG/PNG/WebP hasta 5 MiB; sin secretos en cliente; errores públicos sin detalles de Cloudinary; eliminación lógica para dominio; operaciones de varias filas atómicas.

**Scale/Scope**: Una imagen QR activa por membresía; una feature transversal limitada a `app/client/` y `app/server/`, sin modificar gastos, pagos, deudas ni actividad histórica.

## Constitution Check

| Gate | Estado antes de diseño | Evidencia y decisión |
|---|---|---|
| Ubicación y responsabilidades | PASS | El alcance especifica `app/client/` para UI/API client y `app/server/` para reglas, persistencia, archivos y API. |
| Arquitectura backend modular | PASS con remediación | Los cambios se mantienen en `modules/events`. Las rutas afectadas dejarán router → service → repository; Cloudinary se ubica en `modules/events/integrations/` por ser una integración concreta. |
| Autenticación y autorización | PASS | El backend obtiene identidad del JWT/JWKS y calcula dueño, membresía y estado desde PostgreSQL; el cliente solo oculta controles para UX. |
| Persistencia, Alembic y eliminación lógica | PASS | Se añadirá una migración Alembic para metadatos de QR; abandonar conserva la membresía/historial y desvincula el QR. |
| Integridad y transacciones | PASS | Transferencia y cambios de membresía/QR se coordinan en transacciones de BD. La limpieza externa se desacopla en trabajo persistente y reintentable para no revertir un cambio ya confirmado. |
| Frontend y diseño | PASS | Next.js App Router, shadcn/ui, tokens existentes, Sonner y lucide-react; el diálogo de abandono seguirá `design/event/my-events.html`. |
| Accesibilidad y calidad | PASS | AlertDialog/Sheet existentes, foco y teclado; pruebas permitidas/denegadas, errores y estados obsoletos. |

**Resultado inicial**: PASS. La refactorización se limita a los flujos de eventos que esta feature toca; no se introduce una capa genérica ni una nueva aplicación.

## Research and Design Decisions

Las decisiones verificadas se documentan en [research.md](./research.md). Los contratos de la API están en [contracts/events-lifecycle.openapi.yaml](./contracts/events-lifecycle.openapi.yaml), y las entidades/transiciones en [data-model.md](./data-model.md).

### Backend

1. Auditar y conservar los endpoints existentes: `leave`, `transfer-ownership` y `PATCH` de evento. Corregir sus brechas antes de exponer UI nueva.
2. Centralizar en servicios de eventos las reglas: membresía activa, dueño vigente y evento `OPEN`. Un evento `CLOSED` deniega abandonar, transferir, editar, remover miembros, generar invitaciones y QR; solo el dueño puede aplicar `PATCH {"status":"open"}`.
3. Introducir un puerto/adaptador concreto de Cloudinary bajo el módulo de eventos. El router recibe `UploadFile`; el service valida y coordina el caso de uso; el repositorio persiste, sin que router o service ejecuten SQL directo.
4. Añadir `qr_image_public_id` a `EventMember` además de `qr_image`, mediante Alembic. La URL segura es la referencia de lectura y el `public_id` es el identificador opaco usado para eliminar el activo.
5. Para una actualización: validar → subir activo nuevo con `public_id` nuevo → transacción que sustituye URL/`public_id` → encolar limpieza del activo anterior → responder. Si falla la BD, compensar destruyendo el activo recién subido. Si falla la limpieza antigua, conservar QR nuevo y reintentar sin exponer el detalle.
6. Para abandono: validar estado/rol → transacción que cambia membresía a `LEFT`, desvincula QR y registra limpieza → procesar el trabajo de eliminación. Un fallo de limpieza no reactiva la membresía ni muestra el activo. Cada trabajo se intenta una vez al confirmarse el caso de uso y nuevamente durante el arranque de la aplicación; permanece `pending` hasta que Cloudinary confirme la eliminación.
7. Añadir configuración tipada y variables de ejemplo: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` y `CLOUDINARY_QR_FOLDER`. El archivo real `.env` permanece local e ignorado.

### Frontend

1. Crear schemas Zod en `_schemas/` para respuestas de evento, operación y QR; inferir los tipos desde esos schemas. Extender `EventApi` con abandono, actualización de estado y lectura/carga del QR propio validando toda respuesta externa. La carga usa `FormData` y no fija `Content-Type` manualmente; el cliente convierte el envelope público `{ code, message }` del backend en mensajes de toast.
2. En “Mis eventos”, conservar la tarjeta navegable y añadir el control “Abandonar” solo para eventos abiertos. El click no debe navegar; abre un AlertDialog similar a la referencia. Éxito: toast y `router.refresh()`. Rechazo del dueño: toast con el mensaje del backend y sin cambio local optimista.
3. Tras transferir propiedad en miembros, mostrar éxito y navegar a `/my-events`; no conservar la vista de miembros con permisos obsoletos. Los errores vuelven a obtener/refrescar datos cuando sea necesario.
4. En Event Home, el dueño ve junto a “Editar evento” el control “Cerrar evento” o “Reabrir evento”. La mutación usa PATCH, muestra toast y refresca para recalcular permisos/acciones. Las acciones mutables se ocultan/deshabilitan cuando `status` es `closed`.
5. Cargar en paralelo el detalle del evento y `GET /my-qr` con `Promise.all` donde se resuelve la vista de Event Home. El Sheet de QR muestra placeholder de archivo cuando falta QR, o imagen confirmada y “Actualizar QR” cuando existe. Éxito: toast, cerrar Sheet y `router.refresh()`; fallo: toast y conservar vista del QR anterior.

## Project Structure

### Documentation (this feature)

```text
specs/010-event-lifecycle-qr/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── events-lifecycle.openapi.yaml
```

### Source Code (repository root)

```text
app/
├── client/
│   └── src/
│       ├── app/(event)/
│       │   ├── _services/
│       │   ├── _schemas/
│       │   ├── _types/
│       │   ├── my-events/
│       │   └── [eventId]/
│       │       ├── _components/
│       │       └── members/
│       └── components/
│           ├── custom/
│           └── ui/
└── server/
    ├── app/
    │   ├── core/
    │   └── modules/events/
    │       ├── integrations/
    │       ├── models/
    │       ├── repositories/
    │       ├── routers/
    │       ├── schemas/
    │       └── services/
    ├── alembic/versions/
    └── tests/
```

**Structure Decision**: Feature transversal dentro de los dos proyectos obligatorios. No se crean paquetes compartidos ni directorios `frontend/`/`backend/` alternativos.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Integración `modules/events/integrations/cloudinary.py` | Cloudinary es una dependencia externa concreta que no pertenece a router, service ni repository. | Llamar al SDK desde router/service rompería responsabilidades, dificultaría simulación de pruebas y podría filtrar secretos. |
| Trabajo persistente de limpieza de QR | La BD y Cloudinary no comparten transacción; el spec exige no revertir cambios confirmados y reintentar fallos. | Eliminar sin reintento crea activos huérfanos; revertir la membresía o el QR nuevo viola FR-027/FR-028. |

## Constitution Check (post-design)

**PASS**. Los contratos definen JWT, autorización contextual, transacciones y errores seguros. El diseño usa modelos SQLModel migrados por Alembic, no elimina físicamente entidades de dominio, limita Cloudinary al backend y preserva los componentes/tokens de frontend.
