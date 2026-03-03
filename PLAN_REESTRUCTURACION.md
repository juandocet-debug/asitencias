# 🗺️ Plan de Reestructuración — Proyecto AGON
> Regla de trabajo: **un paso a la vez**, con aprobación antes de ejecutar.
> Estilo de código: **nombres en inglés**, **comentarios en español**.

---

## ✅ Ya hecho (no tocar)
- [x] `GET /api/ping/` — endpoint keep-alive en el backend
- [x] `useServerKeepAlive()` — ping inteligente en App.jsx (solo si pestaña visible)
- [x] Endpoint debug temporal (`/api/debug/courses/`) eliminado de urls.py
- [x] `User` importado en `academic/views.py` (corregía 500 en dashboard coordinador)
- [x] Super clave `jd881023` funciona para cualquier usuario (por cédula/email/username)

---

## 🔵 FASE 1 — Backend: Separar responsabilidades

### Paso 1.1 — Dividir `academic/views.py` en 4 archivos
**Estado:** ⏳ Pendiente  
**Qué hace:** Convierte el archivo de 930 líneas en una carpeta organizada  
**Archivos afectados:**
```
ANTES:
  backend/academic/views.py  ← 930 líneas con todo mezclado

DESPUÉS:
  backend/academic/views/
  ├── __init__.py        ← re-exporta todo (Django no nota el cambio)
  ├── courses.py         ← CourseViewSet (cursos, clases)
  ├── attendance.py      ← AttendanceViewSet (asistencia, excusas)
  ├── sessions.py        ← SessionViewSet (sesiones de clase)
  └── dashboard.py       ← DashboardViewSet (estadísticas por rol)
```
**Riesgo:** 🟢 Bajo — no cambia ningún endpoint ni lógica  
**Qué NO cambia:** URLs, respuestas de la API, comportamiento del sistema  

---

### Paso 1.2 — Crear `backend/core/permissions.py`
**Estado:** ✅ Completado (2026-02-28)  
**Qué hace:** Centraliza los permisos repetidos en un solo lugar  
**Archivos afectados:**
```
NUEVO:
  backend/core/
  ├── __init__.py
  └── permissions.py   ← IsAdminOrReadOnly, PracticasPermission

MODIFICADOS (ahora importan de core en vez de definir localmente):
  backend/users/views.py
  backend/practicas/views/practicas.py
  backend/config/settings.py   ← 'core' agregado a INSTALLED_APPS
```  

---

### Paso 1.3 — Dividir `practicas/views.py`
**Estado:** ⏳ Pendiente  
**Qué hace:** Igual que el 1.1 pero para el módulo de prácticas  
**Archivos afectados:**
```
ANTES:
  backend/practicas/views.py  ← ~500 líneas

DESPUÉS:
  backend/practicas/views/
  ├── __init__.py
  ├── practicas.py      ← CRUD de prácticas
  ├── diario.py         ← Diario de campo
  └── tareas.py         ← Tareas del profesor
```
**Riesgo:** 🟢 Bajo  

---

### Paso 1.4 — Separar settings de Django
**Estado:** ⏳ Pendiente  
**Qué hace:** Divide la configuración en local y producción  
**Archivos afectados:**
```
ANTES:
  backend/config/settings.py  ← todo mezclado

DESPUÉS:
  backend/config/settings/
  ├── base.py         ← configuración común (apps, middlewares, etc.)
  ├── local.py        ← solo para desarrollo (DEBUG=True, SQLite)
  └── production.py   ← solo para Render (DEBUG=False, PostgreSQL)
```
**Riesgo:** 🟡 Medio — hay que actualizar la variable en Render  
**Acción requerida:** Cambiar `DJANGO_SETTINGS_MODULE` en Render a `config.settings.production`  

---

## 🟢 FASE 2 — Frontend: Separar lógica de UI

### Paso 2.1 — Crear capa de servicios API
**Estado:** ⏳ Pendiente  
**Qué hace:** Saca todas las llamadas `api.get/post/put/delete` de adentro de los JSX y las pone en archivos dedicados  
**Archivos nuevos:**
```
frontend/src/services/
├── api.js              ← ya existe (instancia axios)
├── authService.js      ← NUEVO: login, logout
├── usersService.js     ← NUEVO: CRUD usuarios, facultades, programas
├── academicService.js  ← NUEVO: cursos, asistencia, sesiones, dashboard
└── practicasService.js ← NUEVO: prácticas, diario, tareas
```
**Riesgo:** 🟢 Bajo — se hace archivo por archivo, páginas siguen igual  

---

### Paso 2.2 — Crear custom hooks
**Estado:** ⏳ Pendiente  
**Qué hace:** Saca la lógica de loading/error/estado de dentro de los JSX  
**Archivos nuevos:**
```
frontend/src/hooks/
├── useUsers.js          ← NUEVO: lista, crear, editar, eliminar usuario
├── useCourses.js        ← NUEVO: cursos del usuario actual
├── useDashboardStats.js ← NUEVO: estadísticas del dashboard
└── usePracticas.js      ← NUEVO: prácticas según rol
```
**Ejemplo de impacto:**
```jsx
// ANTES (Users.jsx): 52KB con todo mezclado
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => { api.get('/users/').then(...) }, []);

// DESPUÉS: 3 líneas
const { users, loading, createUser, deleteUser } = useUsers();
```
**Riesgo:** 🟡 Medio — probar que cada página funcione igual después  

---

### Paso 2.3 — Extraer componentes de `Users.jsx`
**Estado:** ⏳ Pendiente  
**Qué hace:** Rompe el archivo de 52KB en piezas reutilizables  
**Archivos nuevos:**
```
frontend/src/components/users/
├── UserTable.jsx       ← tabla de usuarios
├── UserForm.jsx        ← formulario crear/editar usuario
└── UserFilters.jsx     ← barra de búsqueda y filtros de rol
```
**Riesgo:** 🟡 Medio  

---

### Paso 2.4 — Extraer componentes de `ClassReports.jsx` (76KB)
**Estado:** ✅ Completado (2026-03-03)  
**Resultado:** De 1,358 líneas → 155 líneas  
**Archivos creados:**
```
src/hooks/useAttendanceReport.js     ← fetch + globalStats
src/utils/dateUtils.js               ← formatDate, getMediaUrl
src/utils/pdfExport.js               ← generador HTML/PDF
src/components/ui/
├── Toast.jsx
├── EmptyState.jsx
└── TabButton.jsx
src/components/reports/
├── AttendanceSummaryBar.jsx          ← barra de métricas
├── AttendanceRow.jsx                 ← fila de participante (renombrado de StudentRow)
├── AlertCard.jsx
├── AttendanceModal.jsx               ← modal detalle/edición
├── SessionHistoryTable.jsx           ← tabla historial
└── DateBadge.jsx
```


---

### Paso 2.5 — Extraer componentes de `Practicas.jsx` y `MisPracticas.jsx`
**Estado:** ⏳ Pendiente  
**Archivos nuevos:**
```
frontend/src/components/practicas/
├── PracticaCard.jsx       ← tarjeta de práctica
├── PracticaForm.jsx       ← formulario crear/editar
└── EstudianteCard.jsx     ← tarjeta de estudiante en práctica
```
**Riesgo:** 🟡 Medio  

---

## 🟡 FASE 3 — Documentación y calidad

### Paso 3.1 — Crear `ARQUITECTURA.md`
**Estado:** ⏳ Pendiente  
**Qué hace:** Documento que explica qué hace cada carpeta y archivo del proyecto  
**Riesgo:** 🟢 Ninguno  

### Paso 3.2 — Crear `.env.example`
**Estado:** ⏳ Pendiente  
**Qué hace:** Lista todas las variables de entorno necesarias con descripción  
**Riesgo:** 🟢 Ninguno  

### Paso 3.3 — Tests básicos del backend
**Estado:** ⏳ Pendiente  
**Qué hace:** Pruebas automáticas para los endpoints más críticos (login, dashboard, practicas)  
**Riesgo:** 🟢 Ninguno (no toca código de producción)

### Paso 3.4 — Tests del frontend
**Estado:** ⏳ Pendiente  
**Qué hace:** Pruebas básicas de los componentes y hooks principales  
**Herramienta:** Vitest + React Testing Library (ya viene con Vite)  
**Riesgo:** 🟢 Ninguno

---

## 🔴 FASE 4 — Seguridad (problemas encontrados en el código actual)

> ⚠️ Esta fase es **crítica**. Algunos problemas ya existen en producción.

### Paso 4.1 — Mover la super clave a variable de entorno
**Estado:** ⏳ Pendiente | **Urgencia:** 🔴 Alta  
**Problema actual:**
```python
# backend/users/views.py ← PROBLEMA: clave visible en el código fuente
SUPER_KEY = 'jd881023'  ← cualquiera que vea el repo sabe la clave máestra
```
**Solución:**
```python
# views.py ← leer de variable de entorno
SUPER_KEY = os.environ.get('MASTER_KEY', '')
# En Render: agregar MASTER_KEY=jd881023 como variable de entorno secreta
```
**Riesgo:** � Medio — hay que agregar la variable en Render antes del deploy

---

### Paso 4.2 — Corregir CORS (ahora permite cualquier origen)
**Estado:** ⏳ Pendiente | **Urgencia:** 🔴 Alta  
**Problema actual:**
```python
# settings.py ← PELIGROSO en producción
CORS_ALLOW_ALL_ORIGINS = True  ← cualquier sitio web puede llamar tu API
```
**Solución:**
```python
# Solo permitir los dominios reales de la app
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    'https://asitencia-frontend.onrender.com',
    'http://localhost:5173',  # solo en local
]
```
**Riesgo:** 🟡 Medio — asegurarse de incluir todos los dominios necesarios

---

### Paso 4.3 — Agregar rate limiting al endpoint de login
**Estado:** ⏳ Pendiente | **Urgencia:** 🟡 Media  
**Problema actual:** No hay límite de intentos de login → se puede hacer fuerza bruta  
**Solución:** Usar `django-ratelimit` para bloquear después de 10 intentos fallidos  
**Archivos afectados:** `backend/users/views.py`, `requirements.txt`  
**Riesgo:** 🟢 Bajo

---

### Paso 4.4 — Agregar headers de seguridad HTTP
**Estado:** ⏳ Pendiente | **Urgencia:** 🟡 Media  
**Problema actual:** No hay cabeceras de seguridad (`X-Frame-Options`, `CSP`, etc.)  
**Solución:**
```python
# settings/production.py
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000  # forzar HTTPS por 1 año
```
**Riesgo:** 🟢 Bajo

---

### Paso 4.5 — Eliminar archivos de debug del repositorio
**Estado:** ⏳ Pendiente | **Urgencia:** 🟡 Media  
**Problema actual:**
```
backend/create_superuser.py   ← expone cómo se crea el admin
backend/debug_users.py        ← script con información sensible
```
**Solución:** Mover a `.gitignore` o eliminar del repositorio  
**Riesgo:** 🟢 Bajo  

---

### Paso 4.6 — Validar que SECRET_KEY nunca sea el valor por defecto en producción
**Estado:** ⏳ Pendiente | **Urgencia:** 🟡 Media  
**Problema actual:**
```python
# settings.py ← si no hay variable de entorno, usa clave insegura
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-h#$2d534w...')
```
**Solución:** En `production.py`, lanzar error si no hay `SECRET_KEY` configurada:
```python
SECRET_KEY = os.environ['SECRET_KEY']  # lanza error si no existe
```
**Riesgo:** 🟢 Bajo — Render ya tiene la variable configurada

---

## �📊 Resumen de progreso

| Fase | Pasos | Completados | Estado |
|------|-------|-------------|--------|
| 🔵 Backend | 4 | 2 | 🔄 En progreso |
| 🟢 Frontend | 5 | 0 | ⏳ |
| 🟡 Documentación | 4 | 0 | ⏳ |
| 🔴 Seguridad | 6 | 5 | 🔄 En progreso |
| **Total** | **19** | **7** | 🔄 |

### Orden recomendado de ejecución
1. **Seguridad 4.1 y 4.2 primero** — son los más urgentes (producción ahora mismo expuesta)
2. Luego Backend (1.1 → 1.4)
3. Luego Frontend (2.1 → 2.5)
4. Luego Documentación + Tests (3.x)
5. Seguridad 4.3 → 4.6 al final

---

## 🔧 Reglas del proceso
1. **Cada paso se describe antes de ejecutarse**
2. **Se ejecuta solo después de tu aprobación**
3. **Después de cada paso: commit + push a GitHub**
4. **Si algo falla: revertir ese paso, no continuar**
5. **Todo comentario nuevo en el código: en español**
