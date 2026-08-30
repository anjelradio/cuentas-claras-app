# Investigación: Fundación del backend

## 1. Inicialización de FastAPI

**Decisión**: Crear un proyecto instalable con `pyproject.toml` en `app/server`, usar `python -m venv venv` como entorno local y declarar el entrypoint `app.main:app` para ejecutar el servidor de desarrollo mediante la CLI de FastAPI.

**Motivo**: Aísla dependencias por proyecto, permite una instalación repetible y mantiene el entrypoint explícito para herramientas y pruebas.

**Alternativas consideradas**:

- Instalar paquetes globalmente: descartado porque rompe el aislamiento.
- Crear otro proyecto fuera de `app/server`: descartado por la constitución.

**Referencia**: [FastAPI First Steps](https://fastapi.tiangolo.com/tutorial/first-steps/).

## 2. Configuración por entorno

**Decisión**: Cargar la configuración mediante Pydantic Settings desde variables de entorno, con `.env.example` sin secretos. Incluir `APP_ENV`, `APP_NAME`, `DATABASE_URL` reservado, `CORS_ORIGINS`, `AUTH_JWKS_URL`, `AUTH_JWT_ISSUER` y `AUTH_JWT_AUDIENCE` opcional.

**Motivo**: Mantiene secretos y direcciones dependientes del entorno fuera del repositorio y conserva un contrato claro para el primer módulo de persistencia.

**Alternativas consideradas**:

- Valores en código: descartados porque no son seguros ni desplegables.
- Configuración de base de datos activa: descartada porque no existe aún un módulo que la use.

**Referencia**: [FastAPI Settings and Environment Variables](https://fastapi.tiangolo.com/advanced/settings/).

## 3. Verificación de JWT con JWKS

**Decisión**: Usar PyJWT con soporte criptográfico y un cliente JWKS para obtener la clave por `kid`. Permitir exclusivamente `EdDSA`, verificar `exp`, `iss` y, cuando se defina, `aud`. Construir un `IdentityContext` solo desde `sub` tras verificar el token.

**Motivo**: Better Auth publica JWT firmados con claves JWKS y su algoritmo predeterminado es Ed25519. Restringir el algoritmo evita aceptar un encabezado que intente cambiarlo; validar `sub` después de la firma mantiene la identidad fuera del control del cliente.

**Alternativas consideradas**:

- Decodificar el JWT sin verificarlo: descartado por inseguro y prohibido por la constitución.
- Compartir la clave privada o secreto de Better Auth: descartado; el backend solo necesita claves públicas JWKS.
- Crear un endpoint protegido de demostración: descartado por la clarificación; se cubrirá mediante pruebas internas hasta el primer módulo de negocio.

**Referencias**: [Better Auth JWT](https://better-auth.com/docs/plugins/jwt), [PyJWT usage](https://pyjwt.readthedocs.io/en/stable/usage.html).

## 4. CORS

**Decisión**: Instalar el middleware CORS con una lista explícita de orígenes desde `CORS_ORIGINS`; no usar `*` ni permitir credenciales para cualquier origen.

**Motivo**: El cliente Next.js y el backend tendrán orígenes distintos en desarrollo y posiblemente producción. Una lista explícita limita el acceso a los dominios aprobados.

**Alternativas consideradas**:

- Permitir todos los orígenes: descartado por la clarificación y por seguridad.
- Posponer CORS: descartado porque forma parte de la frontera de integración cliente-servidor.

**Referencia**: [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/).

## 5. Alembic, SQLModel y Neon

**Decisión**: Instalar SQLModel, SQLAlchemy, Alembic y el driver PostgreSQL. SQLModel es la abstracción principal para `BaseModel` y los futuros modelos persistentes; los schemas HTTP se mantienen como contratos Pydantic separados.
Inicializar Alembic con `alembic init --template pyproject alembic` dentro de
`app/server`. Personalizar `alembic/env.py` para obtener `DATABASE_URL` desde
la configuración Pydantic, importar `app.db.models` y establecer el metadata de
SQLModel como `target_metadata`.

**Motivo**: El entorno de Alembic se inicializa una sola vez y se conserva junto
al proyecto. Importar el registro canónico antes de fijar el metadata asegura
que los modelos de módulos futuros participen en la autogeneración. Usar
`DATABASE_URL` evita almacenar la URL de Neon en archivos versionados.

**Alternativas consideradas**:

- Usar `create_all`: descartado por la constitución; no crea migraciones
  revisables.
- Poner la URL de Neon en `alembic.ini`: descartado porque expondría o duplicaría
  configuración de entorno.
- Definir modelos dentro del registro central: descartado; cada módulo es
  propietario de sus propios modelos.

**Referencias**: [Alembic Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html), [Alembic Autogenerate](https://alembic.sqlalchemy.org/en/latest/autogenerate.html), [SQLModel](https://sqlmodel.tiangolo.com/tutorial/create-db-and-table/).

## 6. Contrato único de excepciones

**Decisión**: Definir excepciones de aplicación tipadas y handlers globales para autenticación, autorización, validación e infraestructura. Todos responderán `code`, `message` y `details` opcionales seguros; los errores no previstos usan un código genérico sin detalles internos.

**Motivo**: Los routers futuros no construirán formatos ni filtrarán errores de infraestructura. El frontend podrá normalizar fallos mediante un contrato estable.

**Alternativas consideradas**:

- `try/except` con respuestas propias por router: descartado porque viola la constitución y duplica el contrato.
- Devolver trazas en desarrollo: descartado en respuestas públicas; se pueden registrar internamente sin enviar secretos al cliente.

**Referencia**: [FastAPI Handling Errors](https://fastapi.tiangolo.com/tutorial/handling-errors/).
