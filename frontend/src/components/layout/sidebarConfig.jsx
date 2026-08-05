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
    ADMIN: { label: 'Administrador', short: 'Admin', icon: Shield, activeBg: 'bg-[#7657f6]' },
    TEACHER: { label: 'Docente', short: 'Docente', icon: BookOpen, activeBg: 'bg-[#7657f6]' },
    COORDINATOR: { label: 'Coordinador', short: 'Coord.', icon: Briefcase, activeBg: 'bg-[#7657f6]' },
    STUDENT: { label: 'Estudiante', short: 'Est.', icon: GraduationCap, activeBg: 'bg-[#7657f6]' },
    PRACTICE_TEACHER: { label: 'Prof. Práctica', short: 'P.Práct.', icon: ClipboardList, activeBg: 'bg-[#7657f6]' },
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
                ? 'bg-gradient-to-r from-[#8b6dff] to-[#7657f6] text-white shadow-lg shadow-violet-950/30'
                : 'text-violet-100/80 hover:bg-white/10 hover:text-white'}`
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
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group w-full text-violet-100/80 hover:bg-white/10 hover:text-white"
            >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="ml-4 pl-4 border-l border-violet-400/20 mt-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
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
                ? 'bg-[#7657f6]/85 text-white'
                : 'text-violet-200/75 hover:bg-white/10 hover:text-white'}`
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
            <p className="text-[10px] font-bold text-violet-300/70 uppercase tracking-widest mb-2 px-1">Vista activa</p>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all
                    bg-gradient-to-r from-[#2a2147] to-[#201936] border-violet-400/25
                    hover:border-violet-300/60 hover:shadow-lg hover:shadow-violet-950/40 group"
            >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b6dff] to-[#7657f6] flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <ActiveIcon size={17} className="text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-black text-white truncate leading-tight">{activeMeta.label}</p>
                    <p className="text-[10px] text-violet-200/75 font-medium flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Activo ahora
                    </p>
                </div>
                <ChevronDown size={15} className={`text-violet-200/75 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-3 right-3 mt-2 bg-[#0a1220] border border-violet-400/25 rounded-2xl overflow-hidden shadow-2xl z-50">
                    <div className="px-3 py-2 border-b border-white/10">
                        <p className="text-[10px] font-bold text-violet-400/60 uppercase tracking-wider">Cambiar vista</p>
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
                                    ${isActive ? 'bg-[#7657f6]/90 text-white' : 'text-violet-100/80 hover:bg-white/10 hover:text-white'}`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                                    ${isActive ? 'bg-white/20 shadow-sm' : 'bg-white/10'}`}>
                                    <IconComp size={15} />
                                </div>
                                <span className="text-sm font-bold flex-1">{meta.label}</span>
                                {isActive
                                    ? <Check size={14} className="text-emerald-300 flex-shrink-0" />
                                    : <ChevronDown size={12} className="text-violet-400/60 flex-shrink-0 -rotate-90" />
                                }
                            </button>
                        );
                    })}
                </div>
            )}
            <div className="mt-4 border-t border-white/10" />
        </div>
    );
};




















