/* eslint-disable */
// layouts/DashboardLayout.jsx
// Orquestador principal: sidebar + topbar + contenido + modal unirse a clase.
// Lógica de navegación  → SidebarNav.jsx
// Topbar                → Topbar.jsx
// Modal unirse a clase  → JoinClassModal.jsx
// Constantes y ítems    → sidebarConfig.jsx

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import SidebarNav from '../components/layout/SidebarNav';
import Topbar from '../components/layout/Topbar';
import JoinClassModal from '../components/layout/JoinClassModal';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const { user, setUser, loading, activeRole, setActiveRole } = useUser();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [joinModalOpen, setJoinModalOpen] = useState(false);

    // Derivar roles y rol efectivo
    const allRoles = (user?.roles?.length > 0 ? user.roles : [user?.role]).filter(Boolean);
    const effectiveRole = activeRole || user?.role;

    // Guard: sin token → login
    useEffect(() => {
        if (!localStorage.getItem('access_token')) navigate('/login');
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');
        if (user?.id) localStorage.removeItem(`active_role_${user.id}`);
        if (setUser) setUser(null);
        navigate('/login');
    };

    const openJoinModal = () => {
        setIsSidebarOpen(false);
        setJoinModalOpen(true);
    };

    // ── Loading screen ────────────────────────────────
    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-5">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-upn-200 border-t-upn-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img src="/upn-logo.png" className="h-8 w-8 object-contain" alt="UPN" />
                    </div>
                </div>
                <img src="/este-agon.png" alt="AGON" className="h-16 object-contain animate-pulse" />
                <p className="text-slate-500 font-medium text-sm">Sincronizando perfil...</p>
            </div>
        );
    }

    // Props compartidas para el sidebar
    const sidebarProps = {
        user, effectiveRole, allRoles, setActiveRole,
        onClose: () => setIsSidebarOpen(false),
        openJoinModal,
        handleLogout,
    };

    return (
        <div className="flex h-screen bg-slate-50/50">

            {/* ── Sidebar Desktop ── */}
            <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 left-0 z-40 bg-upn-900 shadow-2xl">
                <SidebarNav {...sidebarProps} />
            </aside>

            {/* ── Sidebar Mobile (drawer) ── */}
            {isSidebarOpen && (<>
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
                <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-upn-900 shadow-2xl md:hidden transition-transform duration-300">
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute top-4 right-4 text-upn-300 hover:text-white p-1"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <SidebarNav {...sidebarProps} />
                </aside>
            </>)}

            {/* ── Main Content ── */}
            <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
                <Topbar
                    user={user}
                    effectiveRole={effectiveRole}
                    allRoles={allRoles}
                    setActiveRole={setActiveRole}
                    handleLogout={handleLogout}
                    onMenuToggle={() => setIsSidebarOpen(s => !s)}
                />
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <Outlet />
                </div>
            </main>

            {/* ── Modal Unirse a Clase ── */}
            <JoinClassModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
        </div>
    );
}
