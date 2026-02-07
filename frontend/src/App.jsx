import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import ClassDetails from './pages/ClassDetails';
import ClassReports from './pages/ClassReports';
import RegisterStudent from './pages/RegisterStudent';
import UsersPage from './pages/Users';
import Profile from './pages/Profile';
import { UserProvider } from './context/UserContext';

import { useUser } from './context/UserContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();
  const token = localStorage.getItem('access_token');

  if (loading) {
    // Spinner de carga mientras verificamos sesión
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-upn-600"></div>
      </div>
    );
  }

  // Si no hay usuario cargado O no hay token, redirigir
  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterStudent />} />

          {/* Protected Routes */}
          <Route element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/classes/:id" element={<ClassDetails />} />
            <Route path="/classes/:id/reports" element={<ClassReports />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/badges" element={<div className="p-4">Módulo de Insignias: En Construcción</div>} />
            <Route path="/settings" element={<div className="p-4">Configuración: En Construcción</div>} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}


export default App;
