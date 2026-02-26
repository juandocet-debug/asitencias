---
description: Contexto del ecosistema UPN-CIAR — cómo retomar cualquier conversación sobre Agon o Ilinyx
---

# Contexto del Ecosistema UPN-CIAR

## PASO 1 — Leer el documento maestro del ecosistema

Antes de hacer cualquier cosa, leer:
```
C:\Users\JUAN DAVID\Desktop\Upn\CIAR\ECOSISTEMA.md
```

Este archivo contiene:
- Descripción de AGON e ILINYX
- Integración entre sistemas (JWT compartido)
- Variables de entorno
- Comandos para arrancar en local
- Estado del proyecto

## PASO 2 — Identificar en qué sistema estamos trabajando

### Si es AGON (asistencia):
- Directorio: `C:\Users\JUAN DAVID\Desktop\Upn\CIAR\asistencia\`
- Backend Django en `backend/` → puerto 8000
- Frontend React en `frontend/` → puerto 5173
- Color: Azul UPN

### Si es ILINYX:
- Directorio: `C:\Users\JUAN DAVID\Desktop\Upn\CIAR\ilinyx\`
- Backend Django en `backend/` → puerto 8001
- Frontend React en `frontend/` → puerto 5174
- Color: Lila/Violeta
- Leer también: `C:\Users\JUAN DAVID\Desktop\Upn\CIAR\ilinyx\README.md`

## PASO 3 — Verificar estado del proyecto

Para ILINYX, verificar qué ya está hecho:
- [x] Modelos Django: `Acta`, `Documento`, `Grupo`
- [x] APIs REST CRUD completas
- [x] Frontend: Login, Dashboard, Actas, Grupos
- [ ] npm install + pip install + migraciones (locales)
- [ ] Repo GitHub + deploy Render

## PASO 4 — Contexto de decisiones de diseño tomadas

- **Ilinyx NO tiene auth propia** — usa JWT de Agon
- **advisor_id** en Actas y Grupos apunta a usuarios TEACHER de Agon (no FK real)
- **advisor_name** se cachea para no depender de Agon en lecturas
- Documento base → autocompleta la fecha del acta (lógica de Recreeo)
- Cloudinary para PDF + 2 fotos de evidencia por acta

## PASO 5 — Arrancar entorno local (si es necesario)

// turbo
```powershell
# Backend ILINYX
cd "C:\Users\JUAN DAVID\Desktop\Upn\CIAR\ilinyx\backend"
python manage.py runserver 8001
```

// turbo
```powershell
# Frontend ILINYX
cd "C:\Users\JUAN DAVID\Desktop\Upn\CIAR\ilinyx\frontend"
npm run dev
```
