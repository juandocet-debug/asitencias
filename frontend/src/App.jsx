
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { useUser } from './context/UserContext';
import { clearClientSession } from './services/api';



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
const MissionsPage = lazy(() => import('./pages/Missions'));
const PracticasPage = lazy(() => import('./pages/Practicas'));
const PracticaDetalle = lazy(() => import('./pages/PracticaDetalle'));
const MisPracticas = lazy(() => import('./pages/MisPracticas'));
const StudentOverview = lazy(() => import('./pages/StudentOverview'));
const CompleteStudentProfile = lazy(() => import('./pages/CompleteStudentProfile'));

// ── Spinner global de carga lazy ─────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-upn-600"></div>
    <p className="text-slate-400 text-sm font-medium">Cargando...</p>
    <EmergencyLogout />
  </div>
);

const EmergencyLogout = () => (
  <button
    type="button"
    onClick={() => {
      clearClientSession();
      window.location.assign('/login');
    }}
    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500 shadow-sm hover:text-red-500"
  >
    Cerrar sesión y volver al login
  </button>
);

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('AppErrorBoundary capturó un error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-[#09051e] px-6 text-center text-white">
        <div className="max-w-sm rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ccff00]">AGON</p>
          <h1 className="mt-2 text-2xl font-black">Sesión atascada</h1>
          <p className="mt-2 text-sm text-slate-300">Limpia la sesión local y vuelve a iniciar sin pantalla blanca.</p>
          <div className="mt-5 flex justify-center"><EmergencyLogout /></div>
        </div>
      </div>
    );
  }
}

// ── Ruta protegida ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.requires_onboarding && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }
  return children;
};

// ── Ruta raíz ────────────────────────────────────────────────────────────────
const RootRedirect = () => {
  const { user, loading } = useUser();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

// ── Rutas protegidas con activeRole como key ─────────────────────────────────
// Cuando el usuario cambia de rol, activeRole cambia → React re-monta
// el Dashboard completamente → el contenido se actualiza al nuevo rol.
const ProtectedRoutes = () => {
  const { user, activeRole } = useUser();
  const role = activeRole || user?.role;
  const isAdmin = role === 'ADMIN';
  const canSeeStudentReports = ['ADMIN', 'TEACHER', 'COORDINATOR'].includes(role);
  const canManageMissions = ['ADMIN', 'TEACHER'].includes(role);
  return (
    <Routes>
      {/* key={activeRole} en Dashboard fuerza re-montaje al cambiar rol */}
      <Route path="/dashboard" element={<Dashboard key={activeRole} />} />
      <Route path="/classes" element={<Classes />} />
      <Route path="/classes/:id" element={<ClassDetails />} />
      <Route path="/classes/:id/reports" element={<ClassReports />} />
      <Route path="/users" element={isAdmin ? <UsersPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/students/:studentId" element={canSeeStudentReports ? <StudentOverview /> : <Navigate to="/dashboard" replace />} />
      <Route path="/tools" element={<ToolsPage />} />
      <Route path="/missions" element={canManageMissions ? <MissionsPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/my-absences" element={<MyAbsences />} />
      <Route path="/reviews" element={<TeacherReviews />} />
      <Route path="/coordinator/practicas" element={<PracticasPage />} />
      <Route path="/coordinator/practicas/:id" element={<PracticaDetalle />} />
      <Route path="/mis-practicas" element={<MisPracticas />} />
      <Route path="/coordinator/programa" element={<div className="p-8"><h2 className="text-2xl font-bold text-slate-800 mb-2">Coordinación de Programa</h2><p className="text-slate-500">Módulo en construcción.</p></div>} />
      <Route path="/coordinator/investigacion" element={<div className="p-8"><h2 className="text-2xl font-bold text-slate-800 mb-2">Coordinación de Investigación</h2><p className="text-slate-500">Módulo en construcción.</p></div>} />
      <Route path="/coordinator/extension" element={<div className="p-8"><h2 className="text-2xl font-bold text-slate-800 mb-2">Coordinación de Extensión</h2><p className="text-slate-500">Módulo en construcción.</p></div>} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/complete-profile" element={<CompleteStudentProfile />} />
      <Route path="/badges" element={<div className="p-4">Módulo de Insignias: En Construcción</div>} />
      <Route path="/settings" element={<div className="p-4">Configuración: En Construcción</div>} />
    </Routes>
  );
};

// ── App principal ─────────────────────────────────────────────────────────────
function App() {
  return (
    <AppErrorBoundary>
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
    </AppErrorBoundary>
  );
}

export default App;
