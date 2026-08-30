---
description: "Tareas de implementación de la fundación del backend"
---

# Tareas: Fundación del backend

**Input**: Documentos de diseño de `/specs/004-backend-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/backend-foundation.md y quickstart.md.

**Scope**: Todas las tareas de código, dependencias y configuración modifican exclusivamente `app/server`. No se modifica `app/client`, `docs`, Better Auth ni se crean módulos de negocio o migraciones.

**Ámbito de implementación**: Backend: `app/server/`

**Tests**: Se incluyen porque FR-012 y la constitución requieren pruebas automatizadas de health, errores y seguridad JWT/JWKS.

## Dependencias y orden

- **Setup (Fase 1)** no tiene dependencias.
- **Fundacional (Fase 2)** depende de Setup y bloquea las historias.
- **US1 (Fase 3)** depende de la configuración fundacional, incluida la instalación de SQLModel y la estructura Alembic/BaseModel.
- **US2 (Fase 4)** depende de la configuración fundacional y no expone una ruta protegida.
- **US3 (Fase 5)** depende de que US1 haya creado la aplicación para registrar los handlers.
- **Polish (Fase 6)** depende de todas las historias.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Crear el proyecto Python aislado y sus archivos de configuración locales.

- [X] T001 Crear `app/server/pyproject.toml`, `app/server/.gitignore` y `app/server/.env.example` con FastAPI, SQLModel como capa principal de modelado, SQLAlchemy, Alembic, `psycopg`, PyJWT criptográfico, Pydantic Settings, herramientas de prueba/calidad y las variables `APP_ENV`, `APP_NAME`, `DATABASE_URL`, `CORS_ORIGINS`, `AUTH_JWKS_URL`, `AUTH_JWT_ISSUER` y `AUTH_JWT_AUDIENCE` sin secretos.
- [X] T002 Crear y activar el entorno con `python -m venv venv` e instalar explícitamente SQLModel junto con el proyecto mediante `python -m pip install -e ".[dev]"` desde `app/server/`, dejando `app/server/venv/` ignorado por Git.
- [X] T003 Crear la estructura vacía de paquetes `app/server/app/`, `app/server/app/api/`, `app/server/app/core/`, `app/server/app/db/`, `app/server/app/modules/`, `app/server/app/schemas/` y `app/server/tests/`, incluidos sus `__init__.py` y `app/server/app/modules/.gitkeep`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Preparar configuración tipada y fixtures compartidos antes de exponer capacidades.

**⚠️ CRITICAL**: No comenzar una historia antes de terminar esta fase.

- [X] T004 Implementar configuración tipada, carga de `.env` y análisis seguro de `CORS_ORIGINS` en `app/server/app/core/config.py`, rechazando el origen comodín y conservando `AUTH_JWT_AUDIENCE` opcional.
- [X] T005 Crear fixtures de aplicación, configuración aislada y JWKS simulado para pruebas en `app/server/tests/conftest.py`.
- [X] T006 [P] Definir `BaseModel` abstracto basado en SQLModel en `app/server/app/db/base.py` con `id` UUID, `created_at`, `updated_at` y `deleted_at`, y crear el registro central `app/server/app/db/models.py` para importar modelos persistentes futuros y exponer `SQLModel.metadata` a Alembic.
- [X] T007 Inicializar Alembic con `alembic init --template pyproject alembic` dentro de `app/server/` y ajustar `app/server/alembic.ini`, `app/server/alembic/env.py` y `app/server/pyproject.toml` para cargar `DATABASE_URL`, importar el registro ya creado `app.db.models` y usar `SQLModel.metadata`, sin incluir secretos ni una URL fija.

**Checkpoint**: La fundación puede construir configuración por entorno y las historias tienen fixtures reproducibles.

---

## Phase 3: User Story 1 - Disponer de un servidor inicial operativo (Priority: P1) 🎯 MVP

**Goal**: Ofrecer un servidor FastAPI arrancable con healthcheck público, contrato estable y CORS explícito.

**Independent Test**: Con configuración local válida, `GET /api/v1/health` devuelve el contrato 200 y un origen no permitido no recibe autorización CORS.

### Tests for User Story 1

- [X] T008 [P] [US1] Escribir pruebas de contrato para healthcheck público, ejecución local sin dependencias externas bajo el objetivo de 200 ms y política CORS de lista permitida en `app/server/tests/contract/test_health.py`.

### Implementation for User Story 1

- [X] T009 [P] [US1] Definir el contrato Pydantic de disponibilidad en `app/server/app/schemas/health.py`, separado de los modelos SQLModel de persistencia.
- [X] T010 [US1] Implementar el router público `GET /api/v1/health` conforme a `contracts/backend-foundation.md` en `app/server/app/api/health.py`.
- [X] T011 [US1] Crear la aplicación FastAPI, registrar CORS explícito y montar el router de health en `app/server/app/main.py`.

**Checkpoint**: US1 es demostrable sin autenticación, base de datos ni módulos de negocio.

---

## Phase 4: User Story 2 - Proteger la identidad de quien consume el servidor (Priority: P1)

**Goal**: Dejar un verificador interno reutilizable que convierta solo un JWT validado en contexto de identidad.

**Independent Test**: Las pruebas unitarias aceptan únicamente una credencial JWKS válida y rechazan credenciales ausentes, vencidas, manipuladas, con emisor/audiencia no permitidos o sin `sub`.

### Tests for User Story 2

- [X] T012 [P] [US2] Escribir pruebas unitarias de JWT/JWKS válido, ausente, vencido, alterado, emisor/audiencia incorrectos, `sub` ausente, JWKS no disponible y `kid` desconocido o rotado; verificar caché, una actualización controlada de JWKS y rechazo seguro en `app/server/tests/unit/test_security.py`.

### Implementation for User Story 2

- [X] T013 [US2] Implementar `IdentityContext`, extracción Bearer y verificación JWKS con algoritmos permitidos, `kid`, `exp`, `iss`, `aud` opcional y mapeo exclusivo `sub → user_id` en `app/server/app/core/security.py`; reutilizar JWKS en caché y actualizarlo una vez ante un `kid` no encontrado antes de rechazar de forma segura.

**Checkpoint**: US2 valida internamente la frontera de identidad sin crear endpoint protegido, sesiones locales ni roles.

---

## Phase 5: User Story 3 - Recibir errores seguros y coherentes (Priority: P2)

**Goal**: Hacer que la aplicación devuelva un contrato uniforme y seguro ante errores controlados e inesperados.

**Independent Test**: Una excepción de autenticación, validación o infraestructura produce `code`, `message` y `details` permitidos, sin trazas, secretos, SQL ni tokens.

### Tests for User Story 3

- [X] T014 [P] [US3] Escribir pruebas de contrato para errores de autenticación, validación e infraestructura sin filtraciones en `app/server/tests/contract/test_errors.py`.

### Implementation for User Story 3

- [X] T015 [P] [US3] Definir el schema Pydantic `ErrorRead` y las excepciones tipadas de aplicación en `app/server/app/schemas/errors.py` y `app/server/app/core/errors.py`.
- [X] T016 [US3] Implementar handlers globales para excepciones de aplicación, `RequestValidationError` y fallos inesperados en `app/server/app/core/exception_handlers.py`.
- [X] T017 [US3] Registrar los handlers centralizados en `app/server/app/main.py` sin alterar el contrato del healthcheck.

**Checkpoint**: US1 y US3 comparten una aplicación que nunca expone detalles internos en errores públicos.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirmar calidad, límites y la guía de validación de la fundación.

- [X] T018 [P] Revisar `app/server/app/` y `app/server/tests/` para documentación breve en español, anotaciones de tipos y ausencia de módulos, persistencia, migraciones de dominio, sesiones o roles fuera de alcance.
- [X] T019 Ejecutar `pytest`, `ruff check .`, `ruff format --check .` y `mypy app` desde `app/server/`, corrigiendo errores dentro de `app/server/`.
- [X] T020 Ejecutar los escenarios de `specs/004-backend-foundation/quickstart.md` desde `app/server/`, comprobando healthcheck y documentación OpenAPI sin utilizar credenciales, base de datos o un endpoint protegido.

---

## Oportunidades de paralelización

- T001 y T003 pueden realizarse en paralelo; T002 necesita que exista `pyproject.toml`.
- T004, T005 y T006 pueden repartirse tras T001–T003 cuando sus archivos no entren en conflicto; T007 depende de que T006 haya creado el registro de modelos.
- Tras T004–T007, T008 y T012 pueden escribirse en paralelo porque afectan archivos de prueba distintos.
- T009 y T015 afectan archivos distintos; T015 se integra en `main.py` después de T011.
- T014 y T015 pueden realizarse en paralelo tras completar US1.
- T018 puede ejecutarse en paralelo con la preparación de T020 una vez finalizadas las historias.

## Estrategia de implementación

### MVP (US1)

1. Completar Setup y Foundation.
2. Completar US1: aplicación arrancable, CORS explícito y healthcheck público.
3. Ejecutar su prueba de contrato y detenerse para validar la base mínima.

### Entrega incremental

1. Añadir US2 para preparar la validación interna de identidad JWT/JWKS sin ampliar la API.
2. Añadir US3 para centralizar el contrato de errores de las rutas presentes y futuras.
3. Ejecutar la fase Polish y los escenarios de quickstart.

## Notas

- `[P]` identifica tareas que pueden realizarse en paralelo en archivos distintos.
- `[USn]` vincula una tarea de historia con la specification.
- Todas las tareas empiezan sin marcar y tienen una ruta concreta.
- SQLModel se instala desde el inicio como dependencia principal de modelado; Pydantic se reserva para configuración y contratos HTTP. Alembic queda inicializado y conectado al metadata de SQLModel, sin crear tablas ni revisiones de dominio en esta feature.

## Phase 7: Convergence

- [X] T021 CRITICAL Configurar `updated_at` para que se actualice automáticamente al modificar futuros modelos persistentes derivados de `BaseModel`, y probar el contrato en `app/server/app/db/base.py` y `app/server/tests/unit/test_base_model.py` (Constitution IX, contradicts).
- [X] T022 Unificar `HTTPException`, incluido el 404, con `ErrorRead` mediante handlers centrales y pruebas de contrato en `app/server/app/core/exception_handlers.py`, `app/server/app/main.py` y `app/server/tests/contract/test_errors.py` (Constitution XV y contracts/backend-foundation.md, partial).
- [X] T023 Añadir pruebas de rechazo para audiencia configurada no coincidente y cabecera Bearer ausente en `app/server/tests/unit/test_security.py` (FR-005, FR-009 y FR-012, partial).
