# Plan de implementación: Fundación del backend

**Rama**: `004-backend-foundation` | **Fecha**: 2026-08-29 | **Specification**: [spec.md](./spec.md)

**Ámbito de implementación**: Backend: `app/server/`

## Resumen

Inicializar `app/server` como un monolito modular de FastAPI sin módulos de negocio. La fundación expondrá únicamente un estado público, configuración segura por entorno, CORS de lista permitida, validación interna de JWT firmados por Better Auth mediante JWKS, Alembic inicializado para PostgreSQL/Neon y un contrato centralizado de errores. No creará una ruta protegida de diagnóstico ni tablas de dominio.

## Contexto técnico

**Lenguaje/versión**: Python 3.12+, aislado en `app/server/venv` mediante `python -m venv venv`.

**Dependencias principales**: FastAPI con sus dependencias estándar para el servidor de desarrollo, Pydantic Settings, SQLModel, SQLAlchemy, Alembic, `psycopg` para PostgreSQL/Neon, PyJWT con soporte criptográfico, pytest y HTTPX, Ruff y mypy. SQLModel debe instalarse explícitamente y es la abstracción principal para los modelos persistentes y `BaseModel`.

**Modelado**: SQLModel será la capa principal para definir `BaseModel` y los futuros modelos persistentes, aprovechando su metadata para Alembic. Los schemas públicos de entrada y salida HTTP permanecerán como contratos Pydantic separados de los modelos de persistencia, conforme a la constitución.

**Almacenamiento**: PostgreSQL administrado por Neon, configurado mediante `DATABASE_URL`. Se inicializa el entorno Alembic y su conexión, pero no se crean modelos de dominio, tablas ni revisiones de migración en esta feature. El `BaseModel` abstracto de SQLModel declara los campos compartidos para futuros modelos persistentes.

**Pruebas**: pytest para contratos HTTP, handlers de excepciones y unidad de verificación de credenciales, con JWKS simulado localmente.

**Plataforma destino**: Servicio web ASGI en Linux, consumido desde el cliente Next.js.

**Tipo de proyecto**: Backend web monolítico modular en el monorepo.

**Objetivos de rendimiento**: La ruta de estado debe completar en menos de 200 ms en desarrollo local sin dependencias externas. Las claves JWKS se reutilizan en caché y, ante un `kid` no encontrado, se actualizan una vez antes de rechazar la credencial de forma segura.

**Restricciones**:

- La implementación modifica exclusivamente `app/server`; no modifica `app/client`, `docs` ni la configuración de Better Auth.
- El entorno se crea y activa desde `app/server` con `python -m venv venv`.
- Se usa `pyproject.toml` como fuente de dependencias y configuración; el entorno virtual y `.env` no se versionan.
- Alembic se instala e inicializa inmediatamente mediante su template `pyproject` en `app/server/alembic/`. Su `env.py` carga `DATABASE_URL` desde la configuración de la aplicación, importa el registro canónico `app/db/models.py` y usa el metadata de SQLModel como objetivo de autogeneración.
- `app/server/app/db/base.py` define el `BaseModel` abstracto con `id` UUID, `created_at`, `updated_at` y `deleted_at` de tipo fecha/hora. La eliminación física está prohibida; futuros repositories deberán aplicar eliminación lógica y excluir por defecto registros con `deleted_at` no nulo.
- Better Auth sigue siendo la fuente de verdad de sesiones e identidad. El backend verifica JWT firmados por su JWKS; no descifra tokens ni administra usuarios, contraseñas o sesiones.
- Solo se permite CORS para `CORS_ORIGINS` explícitos. No se usa `*` ni credenciales con origen comodín.
- No se crea un endpoint protegido en esta fundación; la verificación JWT se cubre mediante pruebas internas y se reutilizará como dependencia de los routers futuros.

**Alcance**: Configuración, aplicación FastAPI, healthcheck, contrato de error, verificador de identidad reutilizable, SQLModel/Alembic preparado para Neon, `BaseModel`, registro central vacío de modelos, estructura vacía de módulos y pruebas. Quedan fuera los módulos de negocio, tablas de dominio, revisiones de migración, WebSockets, roles globales y endpoints protegidos públicos.

## Verificación de la constitución

| Regla | Decisión del plan | Estado |
|---|---|---|
| I. Ubicación y responsabilidades | Todo el código del servidor reside en `app/server`; cliente sin cambios. | Cumple |
| II. Simplicidad | No se añade base de datos, módulo ficticio ni endpoint de identidad antes de necesitarlos. | Cumple |
| IV–XII. Arquitectura backend | Se crea la frontera común, `modules/` vacía, BaseModel, registro central y Alembic; futuros módulos seguirán Router → Service → Repository → DB. | Cumple |
| XIII. Better Auth y JWT | PyJWT valida firma JWKS, `exp`, `iss`, `kid` y `aud` cuando se configure; `sub` validado es Better Auth `user.id`. | Cumple |
| XIV. Autorización | No se incorporan roles ni permisos globales. | Cumple |
| XV. Excepciones | Handlers centrales devuelven `code`, `message` y `details` permitidos sin secretos. | Cumple |
| XVII. Pruebas backend | Se planifican pruebas de health, errores y JWT válido/ausente/expirado/manipulado. | Cumple |

**Correspondencia de identidad**: cuando la dependencia de autenticación de un router futuro acepte un JWT, usará el claim `sub` ya validado como el identificador global interno de Better Auth (`user.id`). Nunca tomará identidad del body, query o headers alternativos. El `aud` se verifica solo si `AUTH_JWT_AUDIENCE` tiene un valor; vacío significa que no se exige audiencia.

**Revisión posterior a Phase 1**: El diseño no introduce excepciones a la constitución ni complejidad adicional.

## Estructura del proyecto

### Artefactos de esta feature

```text
specs/004-backend-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── backend-foundation.md
```

### Código previsto

```text
app/server/
├── .env.example
├── .gitignore
├── pyproject.toml
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── health.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── errors.py
│   │   ├── exception_handlers.py
│   │   └── security.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── models.py
│   ├── modules/
│   │   └── .gitkeep
│   └── schemas/
│       ├── __init__.py
│       ├── errors.py
│       └── health.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── contract/
    │   ├── test_health.py
    │   └── test_errors.py
    └── unit/
        └── test_security.py
```

**Decisión de estructura**: `core/` contiene solo infraestructura transversal; `api/health.py` es la única ruta de la fundación. `db/base.py` contiene únicamente el `BaseModel` abstracto basado en SQLModel y `db/models.py` importa los modelos persistentes de módulos para Alembic, sin definir modelos ni reglas de negocio. `modules/` se mantiene vacía: cada capacidad futura se creará como `modules/<capacidad>/` con sus routers, schemas, services, repositories y models. Los schemas HTTP de esos módulos serán contratos Pydantic separados. El verificador JWT permanece en `core/security.py` hasta que un módulo lo consuma como dependencia pública.

## Entrega por fases

### Fase 0 — decisiones comprobadas

Consultar [research.md](./research.md) para las decisiones de FastAPI, ajustes, JWKS/JWT, CORS, Alembic, SQLModel y manejo de errores antes de instalar paquetes.

### Fase 1 — contratos y diseño

Aplicar [data-model.md](./data-model.md), [backend-foundation.md](./contracts/backend-foundation.md) y [quickstart.md](./quickstart.md). Estos artefactos definen el único endpoint público, el contrato persistente base y las pruebas internas de seguridad.

### Fase 2 — implementación posterior

`speckit-tasks` generará tareas para crear y activar `venv`, instalar explícitamente SQLModel junto con el proyecto dentro de `app/server`, inicializar y configurar Alembic, construir el `BaseModel` basado en SQLModel, levantar la fundación y ejecutar la calidad. No generará módulos de negocio, tablas de dominio, revisiones de migración ni cambios en el cliente.

## Complejidad

No hay violaciones de la constitución que requieran justificación.
