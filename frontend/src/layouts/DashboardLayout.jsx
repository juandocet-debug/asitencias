import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useUser } from '../context/UserContext';
import SidebarNav from '../components/layout/SidebarNav';
import Topbar from '../components/layout/Topbar';
import JoinClassModal from '../components/layout/JoinClassModal';
import MobileBottomNav from '../components/mobile/MobileBottomNav';
import { logoutSession } from '../services/api';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const { user, setUser, loading, activeRole, setActiveRole } = useUser();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [joinModalOpen, setJoinModalOpen] = useState(false);

    const allRoles = (user?.roles?.length > 0 ? user.roles : [user?.role]).filter(Boolean);
    const effectiveRole = activeRole || user?.role;

    const handleLogout = async () => {
        await logoutSession();
        localStorage.removeItem('username');
        if (user?.id) localStorage.removeItem(`active_role_${user.id}`);
        if (setUser) setUser(null);
        navigate('/login');
    };

    const sidebarProps = {
        user,
        effectiveRole,
        allRoles,
        setActiveRole,
        onClose: () => setIsSidebarOpen(false),
        openJoinModal: () => {
            setIsSidebarOpen(false);
            setJoinModalOpen(true);
        },
        handleLogout,
    };

    if (loading) {
        return (
            <div className="grid h-screen w-screen place-items-center bg-[#eef0f8]">
                <div className="flex flex-col items-center gap-4">
                    <div className="grid h-20 w-20 place-items-center rounded-[1.7rem] bg-white shadow-xl">
                        <img src="/este-agon.png" alt="AGON" className="h-12 object-contain animate-pulse" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">Sincronizando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-screen overflow-hidden bg-[#eef0f8]">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(139,109,255,0.22),transparent_28%),radial-gradient(circle_at_90%_0%,rgba(255,198,75,0.22),transparent_24%),radial-gradient(circle_at_80%_85%,rgba(88,200,120,0.16),transparent_25%)]" />

            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#1b1635] shadow-2xl md:flex">
                <SidebarNav {...sidebarProps} />
            </aside>

            {isSidebarOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/45 md:hidden" onClick={() => setIsSidebarOpen(false)} />
                    <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[#1b1635] shadow-2xl md:hidden">
                        <button onClick={() => setIsSidebarOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-white/70">
                            <X className="h-5 w-5" />
                        </button>
                        <SidebarNav {...sidebarProps} />
                    </aside>
                </>
            )}

            <main className="relative z-10 flex h-screen flex-1 flex-col overflow-hidden md:ml-64">
                <Topbar
                    user={user}
                    effectiveRole={effectiveRole}
                    allRoles={allRoles}
                    setActiveRole={setActiveRole}
                    handleLogout={handleLogout}
                    onMenuToggle={() => setIsSidebarOpen(value => !value)}
                />
                <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 md:p-8">
                    <Outlet />
                </div>
            </main>

            <JoinClassModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
            <MobileBottomNav />
        </div>
    );
}

