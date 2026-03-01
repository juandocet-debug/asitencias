#!/usr/bin/env bash
# Exit on error
set -o errexit

# ─── Backend-only build ───────────────────────────────────────────────────────
# El frontend se despliega como servicio separado en Render.
# Este script SOLO construye el backend Django para ahorrar minutos de pipeline.

# 1. Instalar dependencias Python
echo "Instalando dependencias Python..."
pip install -r backend/requirements.txt

# 2. Recolectar archivos estáticos de Django (sin frontend)
echo "Recolectando estáticos..."
python backend/manage.py collectstatic --no-input

# 3. Correr migraciones
echo "Ejecutando migraciones..."
python backend/manage.py migrate

# 4. Asegurar superusuario
echo "Verificando superusuario..."
python backend/manage.py ensure_admin
