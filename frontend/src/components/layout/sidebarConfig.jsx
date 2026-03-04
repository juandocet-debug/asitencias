/* eslint-disable */
// components/layout/sidebarConfig.jsx
// Constantes y componentes primitivos del sidebar — sin estado externo.

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    BookOpen, Shield, Briefcase, GraduationCap, ClipboardList,
    ChevronRight, ChevronDown, User, Check
} from 'lucide-react';

// ─────────────────────────────────────────────────────
// Metadatos de roles
// ─────────────────────────────────────────────────────
export const ROLE_META = {
    ADMIN: { label: 'Administrador', short: 'Admin', icon: Shield, activeBg: 'bg-upn-600' },
    TEACHER: { label: 'Docente', short: 'Docente', icon: BookOpen, activeBg: 'bg-upn-600' },
    COORDINATOR: { label: 'Coordinador', short: 'Coord.', icon: Briefcase, activeBg: 'bg-upn-600' },
    STUDENT: { label: 'Estudiante', short: 'Est.', icon: GraduationCap, activeBg: 'bg-upn-600' },
    PRACTICE_TEACHER: { label: 'Prof. Práctica', short: 'P.Práct.', icon: ClipboardList, activeBg: 'bg-upn-600' },
};

// ─────────────────────────────────────────────────────
// Ítem de navegación normal
// ─────────────────────────────────────────────────────
export const SidebarItem = ({ icon: Icon, label, to, onClick, subtitle }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
            ${isActive
                ? 'bg-upn-600 text-white shadow-lg shadow-upn-900/30'
                : 'text-upn-200 hover:bg-upn-800/60 hover:text-white'}`
        }
    >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex flex-col flex-1">
            <span>{label}</span>
            {subtitle && <span className="text-[10px] opacity-70 font-normal leading-none mt-0.5">{subtitle}</span>}
        </div>
        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </NavLink>
);

// ─────────────────────────────────────────────────────
// Sección colapsable con sub-ítems
// ─────────────────────────────────────────────────────
export const SidebarSection = ({ icon: Icon, label, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group w-full text-upn-200 hover:bg-upn-800/60 hover:text-white"
            >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="ml-4 pl-4 border-l border-upn-700/40 mt-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────
// Sub-ítem dentro de una sección colapsable
// ─────────────────────────────────────────────────────
export const SidebarSubItem = ({ label, to, onClick, icon: Icon }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all
            ${isActive
                ? 'bg-upn-600/80 text-white'
                : 'text-upn-300 hover:bg-upn-800/60 hover:text-white'}`
        }
    >
        {Icon && <Icon size={13} className="flex-shrink-0 opacity-75" />}
        {label}
    </NavLink>
);

// ─────────────────────────────────────────────────────
// Role Switcher — dropdown con icono por rol
// ─────────────────────────────────────────────────────
export const RoleSwitcher = ({ user, activeRole, setActiveRole, onAfterSwitch }) => {
    const [open, setOpen] = useState(false);
    const allRoles = (user?.roles?.length > 0 ? user.roles : [user?.role]).filter(Boolean);
    if (allRoles.length <= 1) return null;

    const activeMeta = ROLE_META[activeRole] || { label: activeRole, icon: User };
    const ActiveIcon = activeMeta.icon;

    const select = (role) => {
        setActiveRole(role);
        setOpen(false);
        if (onAfterSwitch) onAfterSwitch();
    };

    return (
        <div className="px-3 pb-4 relative">
            <p className="text-[10px] font-bold text-upn-400 uppercase tracking-widest mb-2 px-1">Vista activa</p>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all
                    bg-gradient-to-r from-upn-700/80 to-upn-800/60 border-upn-600/50
                    hover:border-upn-400 hover:shadow-lg hover:shadow-upn-900/40 group"
            >
                <div className="w-9 h-9 rounded-xl bg-upn-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <ActiveIcon size={17} className="text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-black text-white truncate leading-tight">{activeMeta.label}</p>
                    <p className="text-[10px] text-upn-300 font-medium flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Activo ahora
                    </p>
                </div>
                <ChevronDown size={15} className={`text-upn-300 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-3 right-3 mt-2 bg-[#0a1220] border border-upn-700/80 rounded-2xl overflow-hidden shadow-2xl z-50">
                    <div className="px-3 py-2 border-b border-upn-800/60">
                        <p className="text-[10px] font-bold text-upn-500 uppercase tracking-wider">Cambiar vista</p>
                    </div>
                    {allRoles.map(role => {
                        const meta = ROLE_META[role] || { label: role, icon: User };
                        const IconComp = meta.icon;
                        const isActive = role === activeRole;
                        return (
                            <button
                                key={role}
                                onClick={() => select(role)}
                                className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-all
                                    ${isActive ? 'bg-upn-600/90 text-white' : 'text-upn-200 hover:bg-upn-800/80 hover:text-white'}`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                                    ${isActive ? 'bg-white/20 shadow-sm' : 'bg-upn-700/50'}`}>
                                    <IconComp size={15} />
                                </div>
                                <span className="text-sm font-bold flex-1">{meta.label}</span>
                                {isActive
                                    ? <Check size={14} className="text-emerald-300 flex-shrink-0" />
                                    : <ChevronDown size={12} className="text-upn-500 flex-shrink-0 -rotate-90" />
                                }
                            </button>
                        );
                    })}
                </div>
            )}
            <div className="mt-4 border-t border-upn-800/40" />
        </div>
    );
};
