/* eslint-disable */
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { useUser } from './context/UserContext';
import api from './services/api';

// ── Keep-alive inteligente para Render (plan gratuito) ───────────────────────
// SOLO pinga si la pestaña está visible y activa.
const PING_INTERVAL_MS = 12 * 60 * 1000; // 12 minutos — Render duerme a los 15 min de inactividad

function useServerKeepAlive() {
  useEffect(() => {
    let interval = null;

    const doPing = () => {
      if (document.visibilityState === 'visible') {
        api.get('/ping/').catch(() => { }); // silencioso si falla
      }
    };

    const startPing = () => {
      doPing();
      interval = setInterval(doPing, PING_INTERVAL_MS);
    };

    const stopPing = () => {
      if (interval) { clearInterval(interval); interval = null; }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') startPing();
      else stopPing();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    if (document.visibilityState === 'visible') startPing();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stopPing();
    };
  }, []);
}


// ──────────────────────────────────────────────
// Carga diferida (lazy) de todas las páginas
// ──────────────────────────────────────────────
const Login = lazy(() => import('./pages/Login'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Classes = lazy(() => import('./pages/Classes'));
const ClassDetails = lazy(() => import('./pages/ClassDetails'));
const ClassReports = lazy(() => import('./pages/ClassReports'));
const RegisterStudent = lazy(() => import('./pages/RegisterStudent'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const UsersPage = lazy(() => import('./pages/Users'));
const Profile = lazy(() => import('./pages/Profile'));
const MyAbsences = lazy(() => import('./pages/MyAbsences'));
const TeacherReviews = lazy(() => import('./pages/TeacherReviews'));
const ToolsPage = lazy(() => import('./pages/Tools'));
const PracticasPage = lazy(() => import('./pages/Practicas'));
const PracticaDetalle = lazy(() => import('./pages/PracticaDetalle'));
const MisPracticas = lazy(() => import('./pages/MisPracticas'));

// ── Spinner global de carga lazy ─────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-upn-600"></div>
    <p className="text-slate-400 text-sm font-medium">Cargando...</p>
  </div>
);

// ── Ruta protegida ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();
  const token = localStorage.getItem('access_token');

  if (loading) return <PageLoader />;
  if (!user && !token) return <Navigate to="/login" replace />;
  return children;
};

// ── Ruta raíz ────────────────────────────────────────────────────────────────
const RootRedirect = () => {
  const { user, loading } = useUser();
  const token = localStorage.getItem('access_token');

  if (loading) return <PageLoader />;
  if (user || token) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

// ── Rutas protegidas con activeRole como key ─────────────────────────────────
// Cuando el usuario cambia de rol, activeRole cambia → React re-monta
// el Dashboard completamente → el contenido se actualiza al nuevo rol.
const ProtectedRoutes = () => {
  const { activeRole } = useUser();
  return (
    <Routes>
      {/* key={activeRole} en Dashboard fuerza re-montaje al cambiar rol */}
      <Route path="/dashboard" element={<Dashboard key={activeRole} />} />
      <Route path="/classes" element={<Classes />} />
      <Route path="/classes/:id" element={<ClassDetails />} />
      <Route path="/classes/:id/reports" element={<ClassReports />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/tools" element={<ToolsPage />} />
      <Route path="/my-absences" element={<MyAbsences />} />
      <Route path="/reviews" element={<TeacherReviews />} />
      <Route path="/coordinator/practicas" element={<PracticasPage />} />
      <Route path="/coordinator/practicas/:id" element={<PracticaDetalle />} />
      <Route path="/mis-practicas" element={<MisPracticas />} />
      <Route path="/coordinator/programa" element={<div className="p-8"><h2 className="text-2xl font-bold text-slate-800 mb-2">Coordinación de Programa</h2><p className="text-slate-500">Módulo en construcción.</p></div>} />
      <Route path="/coordinator/investigacion" element={<div className="p-8"><h2 className="text-2xl font-bold text-slate-800 mb-2">Coordinación de Investigación</h2><p className="text-slate-500">Módulo en construcción.</p></div>} />
      <Route path="/coordinator/extension" element={<div className="p-8"><h2 className="text-2xl font-bold text-slate-800 mb-2">Coordinación de Extensión</h2><p className="text-slate-500">Módulo en construcción.</p></div>} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/badges" element={<div className="p-4">Módulo de Insignias: En Construcción</div>} />
      <Route path="/settings" element={<div className="p-4">Configuración: En Construcción</div>} />
    </Routes>
  );
};

// ── App principal ─────────────────────────────────────────────────────────────
function App() {
  useServerKeepAlive();
  return (
    <UserProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Ruta raíz */}
            <Route path="/" element={<RootRedirect />} />

            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterStudent />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Rutas protegidas — dentro del layout del dashboard */}
            <Route
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <DashboardLayout />
                  </Suspense>
                </ProtectedRoute>
              }
            >
              {/* Las rutas hijas se renderizan via ProtectedRoutes que usa activeRole */}
              <Route path="/*" element={<ProtectedRoutes />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
