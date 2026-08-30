# Guía de validación: Fundación del backend

## Preparación local

1. Abrir una terminal en `app/server`.
2. Crear el entorno virtual: `python -m venv venv`.
3. Activarlo en Bash/Zsh: `source venv/bin/activate`.
4. Instalar el proyecto y sus herramientas de desarrollo: `python -m pip install -e ".[dev]"`.
5. Copiar `.env.example` a `.env` y completar valores locales no secretos.
6. Configurar `DATABASE_URL` con la conexión PostgreSQL de Neon y conservarla
   solo en `.env`.

`venv/` y `.env` permanecen locales y no se versionan.

## Arranque y comprobación

1. Con el entorno activado, ejecutar `fastapi dev app/main.py`.
2. Consultar `http://127.0.0.1:8000/api/v1/health`.
3. Confirmar una respuesta 200 con el contrato de disponibilidad de [backend-foundation.md](./contracts/backend-foundation.md).
4. Consultar `http://127.0.0.1:8000/docs` y confirmar que solo aparece la ruta de estado de esta fundación.
5. Ejecutar `alembic current` para comprobar que Alembic puede cargar la
   configuración, el registro de modelos y la conexión de Neon. No generar ni
   aplicar una revisión hasta que exista un modelo de dominio registrado.

## Validación automatizada

Con el entorno activado, ejecutar:

```text
pytest
ruff check .
ruff format --check .
mypy app
```

Las pruebas deben cubrir el healthcheck, el contrato uniforme de errores y la verificación interna de JWT válidos, ausentes, vencidos y manipulados usando JWKS simulado. No requieren una base de datos, credenciales reales ni un endpoint protegido público.
