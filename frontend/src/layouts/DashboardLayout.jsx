import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Award, Settings, LogOut, Bell, Search, Menu, User } from 'lucide-react';
import { useState } from 'react';

// Sidebar Item Component
const SidebarItem = ({ icon: Icon, label, to, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-upn-600 text-white shadow-lg shadow-upn-600/30'
                : 'text-slate-500 hover:bg-upn-50 hover:text-upn-700'
            }`
        }
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </NavLink>
);

export default function DashboardLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const handleLogout = () => {
        // Aquí iría la lógica de limpiar tokens, etc.
        navigate('/login');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen bg-slate-50/50">

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden glass"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-72 bg-white border-r border-slate-100 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
                <div className="p-6 text-center">
                    <img
                        src="https://i.ibb.co/C5SB6zj4/Identidad-UPN-25-vertical-azul-fondo-blanco.png"
                        alt="Logo UPN"
                        className="h-24 mx-auto object-contain"
                    />
                </div>

                {/* User Profile Card in Sidebar */}
                <div className="mx-4 mb-6 p-4 bg-upn-50/50 rounded-2xl border border-upn-100">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                alt="User"
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Buen día 👋</p>
                            <h3 className="text-sm font-bold text-slate-800">Prof. Juan David</h3>
                            <p className="text-[10px] text-upn-600 font-semibold bg-upn-100 px-2 py-0.5 rounded-full w-fit mt-1">
                                DOCENTE
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" onClick={() => setIsSidebarOpen(false)} />
                    <SidebarItem icon={BookOpen} label="Clases" to="/classes" onClick={() => setIsSidebarOpen(false)} />
                    <SidebarItem icon={Users} label="Usuarios" to="/users" onClick={() => setIsSidebarOpen(false)} />
                    <SidebarItem icon={Award} label="Insignias" to="/badges" onClick={() => setIsSidebarOpen(false)} />
                </nav>

                <div className="px-4 py-6 border-t border-slate-100 space-y-2">
                    <SidebarItem icon={Settings} label="Configuración" to="/settings" onClick={() => setIsSidebarOpen(false)} />
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-500 w-full transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8 relative z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Search Bar */}
                        <div className="hidden md:flex relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-upn-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar estudiante, clase..."
                                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-300 w-64 lg:w-96 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-upn-600 relative transition-colors shadow-sm">
                            <Bell size={20} />
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center gap-3 pl-4 border-l border-slate-200 focus:outline-none group"
                            >
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-bold text-slate-800 group-hover:text-upn-700 transition-colors">Juan David</p>
                                    <p className="text-xs text-slate-500">Administrador</p>
                                </div>
                                <div className="h-10 w-10 rounded-full p-0.5 bg-gradient-to-br from-upn-500 to-upn-700 cursor-pointer group-hover:scale-105 transition-transform shadow-sm">
                                    <img
                                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover border-2 border-white"
                                    />
                                </div>
                            </button>

                            {/* Profile Dropdown Menu */}
                            {isProfileMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in slide-in-from-top-2">
                                        <div className="px-4 py-3 border-b border-slate-100 mb-1">
                                            <p className="text-sm font-bold text-slate-800">Mi Cuenta</p>
                                        </div>

                                        <button
                                            onClick={() => { setIsProfileMenuOpen(false); navigate('/settings'); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-upn-700 flex items-center gap-3 transition-colors"
                                        >
                                            <User size={18} /> Editar Perfil
                                        </button>

                                        <div className="my-1 border-t border-slate-100"></div>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
                                        >
                                            <LogOut size={18} /> Cerrar Sesión
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
