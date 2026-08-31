# Implementation Plan: Fechas y filtro de eventos

**Branch**: `[012-event-dates-filter]` | **Date**: 2026-08-31 | **Spec**: [spec.md](./spec.md)

**Input**: Ampliar Events con fecha de fin, filtrado opcional de eventos abiertos, detalle de fechas y selección de eventos abiertos reales al registrar un gasto desde Home.

## Summary

La feature ampliará el recurso Event existente, sin crear rutas paralelas. En el backend, `ends_at` se incorporará al modelo, schemas de creación/lectura/actualización, reglas de validación de período y una migración Alembic que preserve los eventos existentes. El listado conservará su comportamiento predeterminado —eventos donde la identidad posee una membresía activa— y añadirá un filtro opcional `active_only` para incluir únicamente eventos abiertos, junto con `member_count` para que el Home pueda mostrar la cantidad de miembros sin solicitudes adicionales por cada tarjeta.

En el frontend, el formulario compartido de creación/edición mantendrá su card, selector de emoji y estilo de inputs; añadirá los dos campos de fecha y validación orientada a UX. Los contratos Zod, tipos y clientes de Event incorporarán la fecha final, el filtro y el conteo. Event Home presentará las dos fechas en español con un formateador reutilizable. Home obtendrá solo eventos abiertos desde el servidor y se los proporcionará al Sheet existente de “Registrar gasto”, que mostrará emoji, nombre y miembros antes de continuar con su flujo actual de comprobante.

## Technical Context

**Language/Version**: Python 3.14 (entorno actual; FastAPI/SQLModel) y TypeScript 5 / React 19 / Next.js 16 App Router.

**Primary Dependencies**: FastAPI, SQLModel, SQLAlchemy, Alembic y Pydantic en backend; Next.js, Better Auth, Zod, shadcn/ui, Tailwind CSS, Sonner y lucide-react en frontend. No se agregan dependencias.

**Storage**: Neon PostgreSQL mediante SQLModel/SQLAlchemy; evolución versionada mediante Alembic.

**Testing**: `pytest` con HTTPX/ASGI para contratos y pruebas unitarias de servicio/repositorio; Vitest + Testing Library en frontend; `ruff check`, `mypy`, `pnpm lint`, `pnpm typecheck` y `pnpm test`.

**Target Platform**: Navegadores modernos en móvil y escritorio; servidor Linux con PostgreSQL/Neon.

**Project Type**: Aplicación web cliente-servidor en monorepo.

**Performance Goals**: El listado filtrado y el detalle deben estar disponibles en menos de 2 s bajo conexión normal; el selector de evento del Home no debe emitir una solicitud por cada evento para conocer su número de miembros.

**Constraints**: JWT y autorización contextual se validan en backend; Router → Service → Repository; Alembic es el único mecanismo de evolución de esquema; solo eliminación lógica; el filtro mantiene las restricciones de membresía activa y eventos no eliminados; el frontend usa tokens/componentes existentes y lucide-react para iconos.

**Scale/Scope**: Una columna nueva en Event, un filtro booleano opcional, un agregado por resumen de evento y cambios localizados en `app/server/app/modules/events/` y `app/client/src/`; sin cambios de gastos, pagos, membresías, QR ni reglas de ciclo de vida.

## Constitution Check

| Gate | Estado antes de diseño | Evidencia y decisión |
|---|---|---|
| Ubicación y responsabilidades | PASS | La UI, validación de experiencia y consumo de API permanecen en `app/client/`; reglas de fechas, autorización, persistencia y consulta quedan en `app/server/`. |
| Arquitectura backend modular | PASS | Todos los cambios de negocio pertenecen a `modules/events`; router recibe query/cuerpo, service aplica invariantes y repository consulta/persiste. |
| Autenticación y autorización | PASS | La lista y detalle conservan identidad JWT y validación de membresía activa; el filtro del cliente nunca amplía acceso. |
| Persistencia, Alembic y eliminación lógica | PASS | `Event` ya está registrado en `app/db/models.py`; se añadirá una nueva revisión Alembic a partir del head vigente, sin `create_all` ni eliminación física. |
| Integridad y transacciones | PASS | Crear y editar validan el período antes de persistir; actualizar no deja una combinación de fechas inválida. |
| Frontend, accesibilidad y diseño | PASS | Se preserva el patrón del EventForm, labels accesibles, tokens existentes, shadcn/ui y Sonner; no se añaden iconos ajenos a Lucide. |
| Calidad | PASS | Se planifican pruebas de regresión de fechas, filtrado, autorización y selector Home, además de lint, tipado y suites existentes. |

**Resultado inicial**: PASS. No se requieren excepciones arquitectónicas ni nuevas capas.

## Research and Design Decisions

Las decisiones verificadas se registran en [research.md](./research.md). El contrato incremental se encuentra en [events-dates-filter.openapi.yaml](./contracts/events-dates-filter.openapi.yaml), y las entidades, migración y reglas en [data-model.md](./data-model.md).

### Backend

1. Extender el modelo `Event` con `ends_at` y mantenerlo en el `EventBase` compartido, de modo que creación, lectura resumida, lectura completa y detalle expongan el mismo período. `EventUpdateRequest` lo declarará opcional, como corresponde a una actualización parcial.
2. Validar en `EventService` el período efectivo tanto al crear como al actualizar: la fecha final puede coincidir con la de inicio, pero nunca puede ser anterior. En una actualización parcial se comparan los valores nuevos con los valores ya persistidos antes de llamar al repository.
3. Crear una revisión Alembic posterior a `b1f2c3d4e5f6`: añadir primero `event.ends_at` de forma temporalmente nullable, completar los registros existentes con su `starts_at` y finalmente imponer no nulidad. Así todo evento histórico queda como evento de un día y las nuevas escrituras requieren fecha final.
4. Ampliar `GET /api/events` con `active_only: bool = false`. El router pasa el valor al service y este al repository; sin filtro se mantienen los eventos abiertos y cerrados de membresías activas. Con el filtro, el repository añade solamente estado `open`, sin incluir eventos eliminados ni de otras personas.
5. Hacer que cada resumen devuelva `member_count`, calculado exclusivamente sobre miembros activos dentro de la misma consulta de listado. El agregado será responsabilidad del repository y no se harán llamadas de miembros por evento desde el navegador.
6. Mantener `GET /api/events/{event_id}` protegido por membresía activa; al heredar la lectura de Event, devolverá `starts_at` y `ends_at` de forma coherente.
7. Añadir pruebas de service/repositorio/contrato para creación, PATCH parcial, migración de estado histórico, default de lista, `active_only=true`, conteo de miembros y autorización de detalle.

### Frontend

1. Extender schemas Zod, tipos y payloads de Event con `ends_at` y `member_count`. Añadir a los clientes de navegador y servidor una opción tipada `activeOnly`; sin la opción deben conservar exactamente `GET /events`.
2. Mantener el EventForm compartido para crear y editar. Reemplazar el único estado de fecha por inicio y fin, precargar ambos al editar y enviar los dos valores normalizados. Conservar la card, el selector de emojis y los inputs centrados. Como el texto interno de un input `date` es nativo, añadir leyendas visibles y centradas “Fecha de inicio” y “Fecha de fin” antes de los campos, además de labels asociados para lectores de pantalla.
3. Bloquear el envío en cliente si falta alguna fecha o si la fecha de fin antecede a la de inicio; mostrar el toast claro y mantener la validación equivalente del backend como fuente de verdad.
4. Crear una utilidad local de Events que formatee fechas con `Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })`. Event Home la usará para mostrar inicio y fin de manera humana y sin desfases de día derivados de la zona horaria. Las pantallas adicionales podrán reutilizarla sin duplicar formato.
5. En Home, obtener eventos abiertos en el Server Component mediante el cliente de servidor y pasar `activeEvents` al `AddExpenseSheet`. El Sheet sustituirá el evento estático por una lista accesible de los eventos recibidos con emoji, nombre y cantidad de miembros; al elegir uno conservará el flujo actual hacia la carga de comprobante, asociado al evento elegido para el siguiente paso. Si no existen eventos abiertos, presentará un estado vacío y no ofrecerá una selección inválida.
6. Las respuestas del backend se validarán en Zod antes de renderizar. Las fallas conservan el manejo de errores/toasts de interfaz vigente y no exponen detalles internos.

## Project Structure

### Documentation (this feature)

```text
specs/012-event-dates-filter/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── events-dates-filter.openapi.yaml
```

### Source Code (repository root)

```text
app/
├── client/
│   └── src/
│       └── app/
│           ├── (event)/
│           │   ├── _components/event-form.tsx
│           │   ├── _lib/format-event-date.ts
│           │   ├── _schemas/event-api-schemas.ts
│           │   ├── _services/event-api.ts
│           │   ├── _services/server-event-api.ts
│           │   ├── _types/event.ts
│           │   └── [eventId]/page.tsx
│           └── home/
│               ├── page.tsx
│               └── _components/add-expense-sheet.tsx
└── server/
    ├── alembic/versions/
    ├── app/db/models.py
    ├── app/modules/events/
    │   ├── models/event.py
    │   ├── repositories/event_repository.py
    │   ├── routers/event_router.py
    │   ├── schemas/event_schemas.py
    │   └── services/event_service.py
    └── tests/
        ├── contract/
        └── unit/
```

**Structure Decision**: Feature transversal dentro de los dos proyectos obligatorios del monorepo. No se crean proyectos, paquetes compartidos ni rutas de API alternativas; el agregado de miembros se conserva como responsabilidad del repository de Events.

## Complexity Tracking

No hay violaciones de la constitución que requieran justificación.

## Constitution Check (post-design)

**PASS**. El diseño conserva la separación frontend/backend, el módulo Events y la dirección Router → Service → Repository. La migración se realiza con Alembic sobre el modelo ya registrado, la consulta mantiene eliminación lógica y autorización contextual, y las interfaces usan los componentes, tokens, accesibilidad y biblioteca de iconos establecidos.
