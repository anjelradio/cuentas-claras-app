# Tasks: Centro de Notificaciones y Acciones Pendientes

**Input**: Documentos de diseño desde `specs/023-notifications-center/`: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/notifications-api.md`, `quickstart.md`.

**Prerequisites**: `plan.md` (completado), `spec.md` (completado), `data-model.md` (completado), `contracts/` (completado).

**Organization**: Tareas estructuradas por fases técnicas y prioridades de historias de usuario, diseñadas para ejecución secuencial e incremental.

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Ejecutable en paralelo (archivos separados, sin dependencias bloqueantes).
- **[Story]**: Historia de usuario asociada (`[US1]`, `[US2]`, `[US3]`).
- Rutas de archivo explícitas en cada tarea.

---

## Phase 1: Setup y Migración de Base de Datos (Tabla Pivote de Lectura)

**Objetivo**: Establecer la infraestructura de persistencia ligera creando únicamente la tabla pivote `activity_read_receipt` sin duplicar la tabla de actividades.

- [x] T001 Crear el modelo SQLModel `ActivityReadReceipt` en `app/server/app/modules/activity/models/activity_read_receipt.py` con campos `id: UUID` (PK), `user_id: str` (Index), `activity_id: UUID` (FK a `activitylog.id`, Index), `read_at: datetime`, e índice y restricción única `(user_id, activity_id)`
- [x] T002 Registrar la exportación del modelo `ActivityReadReceipt` en `app/server/app/db/models.py` para su detección automática en Alembic
- [x] T003 Generar y aplicar la migración versionada de Alembic en `app/server/alembic/versions/` para crear la tabla `activity_read_receipt` con sus índices y foreign keys

**Verificación de Phase 1**: La migración corre limpiamente con `alembic upgrade head` y la tabla `activity_read_receipt` existe en la base de datos con la restricción única esperada.

---

## Phase 2: Modelo, DTOs y Repositorio de Notificaciones (Foundational)

**Objetivo**: Implementar las consultas de lectura optimizadas sobre `activitylog` con `LEFT JOIN` a `activity_read_receipt`, garantizando aislamiento por usuario y exclusión de auto-acciones.

- [x] T004 [P] Definir los esquemas Pydantic `NotificationRead`, `NotificationListResponse`, `UnreadCountResponse` y `BatchReadResponse` en `app/server/app/modules/activity/schemas/notification_schemas.py`
- [x] T005 Implementar `NotificationRepository` en `app/server/app/modules/activity/repositories/notification_repository.py` con los métodos: `get_user_notifications(user_id, limit, offset, unread_only)` con `LEFT JOIN` para calcular `is_read`, `get_unread_count(user_id)` con subquery `NOT EXISTS`, `mark_as_read(user_id, activity_id)` idempotente, y `mark_all_as_read(user_id)` mediante `INSERT INTO ... SELECT ... ON CONFLICT DO NOTHING`
- [x] T006 [P] Diseñar y ejecutar suite de pruebas unitarias para `NotificationRepository` en `app/server/tests/unit/test_notification_repository.py` validando los 4 métodos de consulta y persistencia

**Verificación de Phase 2**: `pytest tests/unit/test_notification_repository.py` pasa exitosamente verificando el filtrado por membresía de evento, la exclusión de auto-acciones y el cálculo correcto de `is_read`.

---

## Phase 3: Servicio de Notificaciones y Endpoints en FastAPI (US1, US2, US3)

**Goal**: Exponer la API REST completa para consultar el centro de notificaciones, obtener el conteo de no leídas, marcar notificaciones individuales y marcar todas en lote.

**Independent Test**: Mediante `curl` o clientes HTTP, un usuario autenticado puede consultar `/api/notifications/unread-count`, listar sus alertas con títulos legibles y enlaces contextuales, y actualizar el estado de lectura recibiendo confirmaciones inmediatas.

- [x] T007 [US1] Implementar `NotificationService` en `app/server/app/modules/activity/services/notification_service.py` para coordinar consultas con el repositorio, enriquecer actividades con títulos legibles según `action_type`, generar deep links contextuales (`target_path`) y gestionar estados de lectura
- [x] T008 [P] [US1] Configurar la factory dependency `get_notification_service(session: SessionDep) -> NotificationService` en `app/server/app/modules/activity/dependencies.py`
- [x] T009 [US1] Implementar el router `app/server/app/modules/activity/routers/notification_router.py` con los endpoints `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/{activity_id}/read`, y `POST /api/notifications/mark-all-read`
- [x] T010 [US1] Registrar `notification_router` en `app/server/app/main.py` bajo el prefijo `/api/notifications` con protección de autenticación Bearer JWT
- [x] T011 [P] [US1] Diseñar y ejecutar pruebas unitarias para `NotificationService` en `app/server/tests/unit/test_notification_service.py`
- [x] T012 [P] [US1] Diseñar y ejecutar pruebas de integración HTTP en `app/server/tests/api/test_notification_router.py` verificando respuestas 200, aislamiento entre usuarios, 401 sin token y 404 para actividades inexistentes

**Verificación de Phase 3**: La suite de integración y unitaria pasa al 100% en backend (`pytest tests/unit/test_notification_service.py tests/api/test_notification_router.py`).

---

## Phase 4: Frontend — Cliente HTTP y Componentes de Notificaciones en Next.js (US1, US2, US3)

**Goal**: Permitir al usuario visualizar el badge de no leídas en la barra superior, desplegar el popover de alertas con deep links y gestionar la lectura individual o masiva desde la interfaz web.

**Independent Test**: En el navegador, el usuario observa el número de alertas no leídas sobre la campana; al hacer clic, se abre el popover con las alertas; al hacer clic en "Marcar todas como leídas", el contador pasa a cero; al hacer clic en una alerta, navega directamente al evento/gasto.

- [x] T013 [P] [US1] Definir tipos e interfaces TypeScript `NotificationItem`, `NotificationListResponse`, `UnreadCountResponse`, `BatchReadResponse` en `app/client/src/features/notifications/types/notification.ts`
- [x] T014 [US1] Implementar el servicio cliente `notification-api.ts` en `app/client/src/features/notifications/services/notification-api.ts` con funciones `getNotifications`, `getUnreadCount`, `markNotificationAsRead`, y `markAllNotificationsAsRead` autenticadas con JWT de Better Auth
- [x] T015 [US1] Implementar el componente `NotificationsBell` en `app/client/src/features/notifications/components/notifications-bell.tsx` con ícono de campana de `lucide-react`, badge numérico reactivo y sondeo periódico o al enfocar
- [x] T016 [US2] [US3] Implementar el componente `NotificationsPopover` en `app/client/src/features/notifications/components/notifications-popover.tsx` con listado cronológico de alertas, diferenciación visual leída/no leída, estado vacío, botón "Marcar todas como leídas" y enlaces contextuales a eventos y gastos
- [x] T017 [US1] Integrar `NotificationsBell` en la barra superior de navegación en `app/client/src/components/layout/dashboard-header.tsx` (o archivo de cabecera principal)
- [x] T018 [P] [US1] Crear pruebas unitarias con Vitest para `notification-api.ts` en `app/client/src/features/notifications/services/notification-api.test.ts`
- [x] T019 [P] [US1] Crear pruebas de componentes con Vitest y Testing Library para `NotificationsBell` en `app/client/src/features/notifications/components/notifications-bell.test.tsx`

**Verificación de Phase 4**: `npm run typecheck` sin errores de compilación y `npx vitest run src/features/notifications` con todas las pruebas aprobadas.

---

## Phase 5: Validación Transversal y Cierre

**Objetivo**: Verificar seguridad, casos límite, resiliencia y conformidad con las directrices de `spec.md` y `plan.md`.

- [x] T020 Validar que todas las consultas en `app/server/app/modules/activity/repositories/notification_repository.py` utilicen `text().bindparams()` o constructores seguros de SQLAlchemy/SQLModel para prevenir inyección SQL
- [x] T021 Validar el aislamiento estricto por usuario mediante prueba específica que confirme que un usuario nunca recibe ni puede alterar alertas de eventos donde no es miembro activo
- [x] T022 Validar la resiliencia ante deep links con recursos eliminados: verificar que la navegación contextual maneje de forma elegante recursos no encontrados sin romper la aplicación
- [x] T023 Ejecutar la verificación integral de tipos (`npm run typecheck` en `app/client`) y las suites de pruebas completas en backend (`pytest`) y frontend (`npm test`)

**Verificación de Phase 5**: Todas las compuertas de calidad pasan limpias y todos los criterios de aceptación de FR-001 a FR-012 y SC-001 a SC-005 están satisfechos.

---

## Dependencies & Execution Order

```
Phase 1 (Setup / Migración)
   │
   ▼
Phase 2 (Modelo, DTOs y Repositorio)
   │
   ▼
Phase 3 (Servicio y Endpoints FastAPI)
   │
   ▼
Phase 4 (Cliente HTTP y Componentes UI Next.js)
   │
   ▼
Phase 5 (Validación Transversal y Cierre)
```

### Oportunidades de Ejecución Paralela [P]
- **T004 y T006** pueden desarrollarse en paralelo con la implementación del repositorio una vez definida la firma.
- **T008, T011 y T012** pueden desarrollarse en paralelo tras definir la interfaz de `NotificationService`.
- **T013, T018 y T019** pueden correr en paralelo con el desarrollo visual de componentes en frontend.

---

## Implementation Strategy: MVP First

1. **Incremento 1 (MVP - Backend y Conteo)**:
   - Completar Phase 1, Phase 2 y Phase 3.
   - Probar que el backend expone el conteo y listado de notificaciones para miembros activos.
2. **Incremento 2 (Frontend y Navegación)**:
   - Completar Phase 4 (Campana + Popover + Deep Links).
   - El usuario ya puede interactuar con el centro de notificaciones en el navegador.
3. **Incremento 3 (Validación Final y Cierre)**:
   - Completar Phase 5 (Seguridad, aislamiento y pruebas completas).
