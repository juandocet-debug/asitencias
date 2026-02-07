#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Instalar dependencias de Python (Backend)
pip install -r backend/requirements.txt

# 2. Instalar y Construir Frontend (React)
echo "Construyendo Frontend..."
cd frontend
npm install
npm run build
cd ..

# 3. Recolectar archivos estáticos (incluyendo los del frontend construido)
echo "Recolectando estáticos..."
python backend/manage.py collectstatic --no-input

# 4. Correr migraciones de base de datos
echo "Ejecutando migraciones..."
python backend/manage.py migrate

# 5. Asegurar que exista el admin (comando personalizado)
echo "Creando superusuario..."
python backend/manage.py ensure_admin
