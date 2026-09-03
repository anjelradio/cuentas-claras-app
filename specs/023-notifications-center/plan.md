# Implementation Plan: Centro de Notificaciones y Acciones Pendientes

**Branch**: `023-notifications-center` | **Date**: 2026-09-03 | **Spec**: [`specs/023-notifications-center/spec.md`](spec.md)

**Input**: Especificación funcional y reglas de negocio de `specs/023-notifications-center/spec.md`.

---

## Summary

Implementar el Centro de Notificaciones y Acciones Pendientes mediante una **arquitectura ligera**: en lugar de crear una tabla completa y redundante de notificaciones, se reutiliza la tabla existente `activitylog` (`Registros_Actividad`) como la fuente única de eventos del sistema, modelando únicamente una tabla pivote `activity_read_receipt` (`Lecturas_Actividad`) para el seguimiento de lectura individual por usuario. 

El backend expone endpoints autenticados para consultar alertas pendientes, obtener el conteo de no leídas, marcar notificaciones individuales y marcar todas en lote. El frontend incorpora un componente de campana interactivo con badge reactivo y un panel desplegable con enlaces contextuales directos (deep links) a eventos, gastos y liquidaciones.

---

## Technical Context

- **Lenguaje y Entorno (Backend)**: Python 3.11+, FastAPI 0.141+, SQLModel 0.0.42+, SQLAlchemy 2.0.
- **Lenguaje y Entorno (Frontend)**: TypeScript 5.9+, Next.js 16.3+ (App Router), React 19, Tailwind CSS v4, `@base-ui/react`, `lucide-react`, `sonner`.
- **Base de Datos y Persistencia**: PostgreSQL con migraciones versionadas mediante Alembic.
- **Autenticación**: Better Auth con tokens JWT Bearer validados mediante JWKS en `app.core.security`.
- **Pruebas**: Pytest en backend (`app/server/tests/`), Vitest y Testing Library en frontend (`app/client/src/`).

---

## Constitution Check

*Evaluación de compuertas según `.specify/memory/constitution.md`:*

| Principio | Estado | Justificación técnica |
|---|---|---|
| **I. Monorepo y responsabilidades** | ✅ PASS | Todo el código se ubicará estrictamente dentro de `app/client/` y `app/server/`. |
| **III. Integridad financiera y balances** | ✅ PASS | Las notificaciones son puramente informativas y de navegación contextual; ninguna notificación muta balances ni ejecuta transacciones por sí misma (FR-012). |
| **VIII. Repository Pattern** | ✅ PASS | Toda interacción con la base de datos se encapsula en `NotificationRepository`; el service y router no ejecutan SQL directo. |
| **IX. BaseModel y Alembic** | ✅ PASS | `ActivityReadReceipt` hereda de `app.db.base.BaseModel`, se registra en `app.db.models` y cuenta con su migración formal en `alembic/versions/`. |
| **XIV. Aislamiento y Autorización** | ✅ PASS | Cada usuario solo consulta actividades de eventos donde es miembro activo (`eventmember.status = 'ACTIVE'`) y nunca accede a registros ajenos (FR-001). |
| **XV. Manejo centralizado de errores** | ✅ PASS | Se utilizan las excepciones canónicas `NotFoundError`, `ForbiddenError` y `ValidationError`. |

---

## Project Structure

```text
specs/023-notifications-center/
├── spec.md              # Especificación de requerimientos y casos de uso
├── plan.md              # Este plan de implementación arquitectónica
├── research.md          # Decisiones de diseño y alternativas consideradas
├── data-model.md        # Esquema relacional, DTOs y mapeos de eventos
├── quickstart.md        # Guía paso a paso para validación de extremo a extremo
├── checklists/
│   └── requirements.md  # Checklist de calidad de la especificación
└── contracts/
    └── notifications-api.md # Contratos HTTP OpenAPI de los endpoints

app/server/
├── alembic/versions/
│   └── <rev>_add_activity_read_receipts.py # Migración DDL
├── app/
│   ├── db/models.py                        # Registro de ActivityReadReceipt
│   └── modules/
│       └── activity/                       # Expansión del módulo de actividad
│           ├── models/
│           │   ├── activity.py             # ActivityLog existente
│           │   └── activity_read_receipt.py # Modelo pivote de lectura
│           ├── repositories/
│           │   └── notification_repository.py # Queries con LEFT JOIN y subqueries
│           ├── services/
│           │   └── notification_service.py # Lógica de filtrado, conteo y mapeo
│           ├── schemas/
│           │   └── notification_schemas.py # Schemas Pydantic / DTOs
│           ├── dependencies.py             # Dependency factory get_notification_service
│           └── routers/
│               └── notification_router.py  # Endpoints /api/notifications
└── tests/
    ├── unit/
    │   └── test_notification_service.py   # Pruebas unitarias de dominio
    └── api/
        └── test_notification_router.py    # Pruebas de integración HTTP

app/client/
├── src/
│   ├── features/
│   │   └── notifications/
│   │       ├── services/
│   │       │   └── notification-api.ts     # Cliente HTTP con JWT
│   │       ├── components/
│   │       │   ├── notifications-bell.tsx  # Campana con badge e indicador
│   │       │   └── notifications-popover.tsx # Lista desplegable con deep links
│   │       └── types/
│   │           └── notification.ts         # Tipos e interfaces TypeScript
│   └── components/
│       └── layout/
│           └── top-navigation.tsx          # Integración de la campana en la barra superior
```

---

## Arquitectura y Flujo de Datos

```
[Cliente Web (Next.js)]
   │
   ├── Poll/Fetch (GET /api/notifications/unread-count)
   ├── Clic en campana (GET /api/notifications?limit=20)
   ├── Clic en "Marcar leída" (PATCH /api/notifications/{id}/read)
   └── Clic en "Marcar todas" (POST /api/notifications/mark-all-read)
         │
         ▼
[NotificationRouter (FastAPI)]
   │
   ▼
[NotificationService]
   │
   ├── Valida identidad del usuario autenticado
   ├── Consulta actividades elegibles mediante NotificationRepository
   ├── Mapea action_type a título amigable, ícono y target_path
   └── Retorna agregado tipado con unread_count
         │
         ▼
[NotificationRepository]
   │
   ├── SELECT a.*, (arr.id IS NOT NULL) AS is_read
   │   FROM activitylog a
   │   JOIN eventmember em ON em.event_id = a.event_id
   │   LEFT JOIN activity_read_receipt arr 
   │     ON arr.activity_id = a.id AND arr.user_id = :user_id
   │   WHERE em.user_id = :user_id AND em.status = 'ACTIVE'
   │     AND a.actor_id != :user_id
   │     AND (a.target_id = :user_id OR a.target_id IS NULL)
   │   ORDER BY a.created_at DESC;
   │
   └── INSERT INTO activity_read_receipt ... ON CONFLICT DO NOTHING
```

---

## Queries SQL y Reglas de Dominio

### 1. Obtención de Notificaciones con Estado de Lectura
```sql
SELECT 
    a.id,
    a.event_id,
    a.actor_id,
    a.actor_name,
    a.target_id,
    a.target_name,
    a.action_type,
    a.description,
    a.created_at,
    (arr.id IS NOT NULL) AS is_read,
    arr.read_at
FROM activitylog a
JOIN eventmember em 
    ON em.event_id = a.event_id 
   AND em.user_id = :user_id 
   AND UPPER(em.status) = 'ACTIVE'
   AND em.deleted_at IS NULL
LEFT JOIN activity_read_receipt arr 
    ON arr.activity_id = a.id 
   AND arr.user_id = :user_id
WHERE a.actor_id != :user_id
  AND (a.target_id = :user_id OR a.target_id IS NULL)
ORDER BY a.created_at DESC
LIMIT :limit OFFSET :offset;
```

### 2. Conteo Eficiente de No Leídas
```sql
SELECT COUNT(a.id) AS unread_count
FROM activitylog a
JOIN eventmember em 
    ON em.event_id = a.event_id 
   AND em.user_id = :user_id 
   AND UPPER(em.status) = 'ACTIVE'
   AND em.deleted_at IS NULL
WHERE a.actor_id != :user_id
  AND (a.target_id = :user_id OR a.target_id IS NULL)
  AND NOT EXISTS (
      SELECT 1 FROM activity_read_receipt arr 
      WHERE arr.activity_id = a.id AND arr.user_id = :user_id
  );
```

### 3. Marcado Masivo en Lote
```sql
INSERT INTO activity_read_receipt (id, user_id, activity_id, read_at)
SELECT gen_random_uuid(), :user_id, a.id, NOW()
FROM activitylog a
JOIN eventmember em 
    ON em.event_id = a.event_id 
   AND em.user_id = :user_id 
   AND UPPER(em.status) = 'ACTIVE'
   AND em.deleted_at IS NULL
WHERE a.actor_id != :user_id
  AND (a.target_id = :user_id OR a.target_id IS NULL)
  AND NOT EXISTS (
      SELECT 1 FROM activity_read_receipt arr 
      WHERE arr.activity_id = a.id AND arr.user_id = :user_id
  )
ON CONFLICT (user_id, activity_id) DO NOTHING;
```

---

## Estrategia de Entrega por Fases

1. **Fase 1 (Modelo y Migración DDL)**:
   - Crear modelo `ActivityReadReceipt` en `activity_read_receipt.py`.
   - Registrar en `app.db.models`.
   - Generar y aplicar migración de Alembic para la tabla `activity_read_receipt`.
2. **Fase 2 (Repositorio y Servicios Backend)**:
   - Crear `NotificationRepository` con queries SQL seguras (`text()`, bindings explícitos).
   - Crear `NotificationService` con mapeo de deep links, títulos y formateo de alertas.
   - Implementar dependency factory `get_notification_service`.
3. **Fase 3 (Endpoints HTTP y Pruebas Backend)**:
   - Crear `notification_router.py` con los 4 endpoints.
   - Registrar router en `app.main.py`.
   - Implementar suite de pruebas unitarias y de integración con Pytest.
4. **Fase 4 (Frontend: Cliente y Componente de Campana)**:
   - Crear cliente HTTP `notification-api.ts` con manejo de Bearer JWT.
   - Crear componentes UI `NotificationsBell` y `NotificationsPopover` con selector de lectura y navegación contextual.
   - Integrar la campana en la barra de navegación del dashboard.
5. **Fase 5 (Validación y Polish)**:
   - Verificar casos límite: usuario sin eventos, navegación a recursos eliminados, idempotencia de lectura masiva.
   - Ejecución completa de suites de pruebas frontend y backend.
