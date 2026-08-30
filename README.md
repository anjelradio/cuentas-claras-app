# Cuentas Claras 💸

## Equipo 👥

- Integrante 1: __CORRALES FERREL BRAD ALEXANDER
- Integrante 2: __SANDOVAL SANCHEZ GUSTAVO ANTONIO
- Integrante 3: __SANTOS CASTRO ROBERTO ANJEL

## Materia 🎓

**Materia:** __TOPIC.AVANZ.DE PROGRAMAC.(ALGORIT.GENE.)
**Grupo:** __SA

## Resumen 📋

Cuentas Claras es una aplicación web universitaria para organizar y consultar
gastos compartidos de forma clara y segura. El proyecto está dividido en un
cliente Next.js y un servidor FastAPI para facilitar su evolución por módulos.

## Instalación y ejecución 🚀

Las llaves, API keys y demás valores reales de entorno se entregan por un medio
privado. No deben publicarse ni incluirse en commits.

### Frontend — Next.js ⚛️

El frontend utiliza exclusivamente **pnpm**.

```bash
cd app/client
pnpm install
cp .env.example .env.local
pnpm dev
```

Para ejecutar sus pruebas:

```bash
pnpm test
```

Completa `.env.local` con los valores proporcionados antes de iniciar la
aplicación.

### Backend — FastAPI 🐍

```bash
cd app/server
python -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
fastapi dev app/main.py
```

En Windows, activa el entorno con:

```powershell
.\venv\Scripts\Activate.ps1
```

Para ejecutar las pruebas del servidor:

```bash
pytest
```

Completa `.env` con las variables y credenciales proporcionadas por el equipo.
El entorno virtual y los archivos `.env` locales están excluidos de Git.
