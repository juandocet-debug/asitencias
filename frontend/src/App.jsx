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

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


export default App;

