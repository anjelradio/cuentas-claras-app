#!/bin/bash
# Script de inicio seguro para Azure App Service Linux

# Agregar librerías preinstaladas al PYTHONPATH
if [ -d "/home/site/wwwroot/.python_packages/lib/site-packages" ]; then
    export PYTHONPATH="/home/site/wwwroot/.python_packages/lib/site-packages:$PYTHONPATH"
fi

# Si Azure creó el entorno virtual nativo antenv, activarlo
if [ -f "/home/site/wwwroot/antenv/bin/activate" ]; then
    source /home/site/wwwroot/antenv/bin/activate
fi

# Iniciar Uvicorn en el puerto 8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
