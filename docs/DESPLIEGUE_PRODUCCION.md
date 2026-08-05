# Despliegue de AGON en Railway y Vercel

## Regla de corte

El primer despliegue debe ser de staging. Produccion solo se conecta despues de
respaldar PostgreSQL, restaurar ese respaldo en staging y ejecutar las pruebas
funcionales contra la copia.

## Railway: backend

Crear un servicio desde este repositorio usando la rama aprobada. Railway lee
`railway.json` y `nixpacks.toml` desde la raiz. Configurar:

- `DJANGO_SETTINGS_MODULE=config.settings.production`
- `SECRET_KEY`: valor aleatorio largo.
- `DATABASE_URL`: referencia privada al PostgreSQL de Railway o la URL de la
  base existente durante la primera migracion.
- `ALLOWED_HOSTS`: dominio publico del backend.
- `CORS_ALLOWED_ORIGINS`: dominio exacto del frontend Vercel.
- `CSRF_TRUSTED_ORIGINS`: dominio exacto del frontend Vercel.
- `FRONTEND_URL`: dominio exacto del frontend.
- `ILINYX_API_KEY`: clave aleatoria compartida con ILINYX.
- Variables SMTP y Cloudinary documentadas en `backend/.env.example`.

El predeploy ejecuta exclusivamente migraciones Django. El servicio inicia con
Gunicorn y Railway consulta `/api/health/`, que verifica la base de datos.
Los refresh tokens se entregan exclusivamente mediante cookie `HttpOnly`,
`Secure` y `SameSite=None`; nunca deben copiarse a almacenamiento del navegador.

## Vercel: frontend

Crear un proyecto con `frontend` como Root Directory y configurar:

- Framework: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- `VITE_API_URL=https://<dominio-backend>/api`.

Para produccion movil, usar dominios del mismo sitio (por ejemplo,
`agon.institucion.edu.co` y `api-agon.institucion.edu.co`). Los dominios
gratuitos `vercel.app` y `railway.app` sirven para staging, pero algunos
navegadores iOS bloquean cookies entre sitios diferentes.

React Router 7.18.2 mantiene un aviso npm de severidad alta exclusivo de RSC
Mode. Este frontend es una SPA Vite y no habilita RSC ni acciones de servidor;
se conserva la version mas reciente disponible y se debe reevaluar el aviso
cuando exista una version corregida instalable.

`frontend/vercel.json` conserva las rutas SPA, agrega cabeceras de seguridad y
cachea solamente los assets con hash.

## Validacion previa

1. Ejecutar backend tests y `manage.py check --deploy`.
2. Ejecutar `npm run lint` y `npm run build`.
3. Confirmar `/api/health/` con estado 200.
4. Probar login, cursos, llamado, edicion, eliminacion y excusas.
5. Probar integracion ILINYX con la clave de staging.
6. Comparar conteos de tablas y archivos con el baseline.

## Reversion

Conservar el servicio anterior activo durante el corte. Si falla una prueba de
humo, restaurar el dominio al servicio anterior. Una migracion de datos solo se
revierte mediante su procedimiento ensayado; nunca se editan migraciones ya
aplicadas ni se ejecuta SQL improvisado en produccion.
