/* eslint-disable */
// components/layout/Topbar.jsx
// Barra superior: búsqueda, notificaciones, perfil del usuario, cambio rápido de rol.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, Bell, User, LogOut } from 'lucide-react';
import { ROLE_META } from './sidebarConfig';

export default function Topbar({ user, effectiveRole, allRoles, setActiveRole, handleLogout, onMenuToggle }) {
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const getAllRolesLabel = () => {
        if (!allRoles.length) return 'Sin rol';
        if (allRoles.length === 1) return ROLE_META[allRoles[0]]?.label || allRoles[0];
        return allRoles.map(r => ROLE_META[r]?.short || r).join(' · ');
    };

    return (
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8 relative z-20">
            <div className="flex items-center gap-4">
                {/* Hamburger móvil */}
                <button onClick={onMenuToggle} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden">
                    <Menu size={24} />
                </button>

                {/* Barra de búsqueda desktop */}
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
                {/* Badge rol activo (solo con multi-rol) */}
                {allRoles.length > 1 && effectiveRole && ROLE_META[effectiveRole] && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold bg-upn-50 text-upn-700 border-upn-200">
                        {React.createElement(ROLE_META[effectiveRole].icon, { size: 12 })}
                        {ROLE_META[effectiveRole].short}
                    </div>
                )}

                {/* Notificaciones */}
                <button className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-upn-600 relative transition-colors shadow-sm">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                </button>

                {/* Perfil + dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="flex items-center gap-3 pl-4 border-l border-slate-200 focus:outline-none group"
                    >
                        <div className="text-right mr-3 hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 group-hover:text-upn-700 transition-colors">
                                {user ? `${user.first_name} ${user.last_name}` : 'Cargando...'}
                            </p>
                            <p className="text-xs text-slate-500">{getAllRolesLabel()}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                            {user?.photo
                                ? <img src={user.photo} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-white" />
                                : <User className="text-slate-400" size={20} />
                            }
                        </div>
                    </button>

                    {/* Dropdown menú */}
                    {isProfileMenuOpen && (<>
                        <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)} />
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-3 border-b border-slate-100 mb-1">
                                <p className="text-sm font-bold text-slate-800">Mi Cuenta</p>
                                {allRoles.length > 1 && (
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Activo como: <span className="text-upn-600 font-semibold">{ROLE_META[effectiveRole]?.label}</span>
                                    </p>
                                )}
                            </div>

                            {/* Cambio rápido de rol */}
                            {allRoles.length > 1 && (
                                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cambiar vista</p>
                                    <div className="flex flex-wrap gap-1">
                                        {allRoles.map(role => {
                                            const meta = ROLE_META[role] || { label: role, short: role, icon: User };
                                            const IconComp = meta.icon;
                                            const isActive = effectiveRole === role;
                                            return (
                                                <button
                                                    key={role}
                                                    onClick={() => { setActiveRole(role); setIsProfileMenuOpen(false); }}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${isActive
                                                        ? 'bg-upn-600 text-white border-upn-600'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-upn-50 hover:text-upn-700 hover:border-upn-300'
                                                        }`}
                                                >
                                                    <IconComp size={11} />{meta.short}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => { setIsProfileMenuOpen(false); navigate('/profile'); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-upn-700 flex items-center gap-3 transition-colors"
                            >
                                <User size={18} /> Editar Perfil
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
                            >
                                <LogOut size={18} /> Cerrar Sesión
                            </button>
                        </div>
                    </>)}
                </div>
            </div>
        </header>
    );
}
