// components/users/UserFilterBar.jsx
// Barra de búsqueda + filtros de rol con contador.

import React from 'react';
import { Search, User, GraduationCap, BookOpen, Briefcase, Shield } from 'lucide-react';

const FILTERS = [
    { key: 'ALL', label: 'Todos', statKey: 'total', icon: <User size={13} />, active: 'bg-slate-700 text-white', plain: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
    { key: 'STUDENT', label: 'Estudiantes', statKey: 'students', icon: <GraduationCap size={13} />, active: 'bg-blue-600 text-white', plain: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { key: 'TEACHER', label: 'Docentes', statKey: 'teachers', icon: <BookOpen size={13} />, active: 'bg-purple-600 text-white', plain: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
    { key: 'COORDINATOR', label: 'Coordinadores', statKey: 'coordinators', icon: <Briefcase size={13} />, active: 'bg-amber-600 text-white', plain: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
    { key: 'ADMIN', label: 'Admins', statKey: 'admins', icon: <Shield size={13} />, active: 'bg-upn-600 text-white', plain: 'bg-upn-50 text-upn-700 hover:bg-upn-100' },
];

export default function UserFilterBar({ searchTerm, onSearch, activeRole, onRoleChange, stats, resultCount }) {
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center">
            {/* Buscador */}
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, documento o correo..."
                    value={searchTerm}
                    onChange={e => onSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100"
                />
            </div>

            {/* Filtros de rol */}
            <div className="flex gap-1.5 flex-wrap">
                {FILTERS.map(({ key, label, statKey, icon, active, plain }) => (
                    <button
                        key={key}
                        onClick={() => onRoleChange(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeRole === key ? active : plain}`}
                    >
                        {icon} {label}
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeRole === key ? 'bg-white/20' : 'bg-slate-200/60'}`}>
                            {stats[statKey]}
                        </span>
                    </button>
                ))}
            </div>

            {activeRole !== 'ALL' && (
                <span className="text-xs text-slate-400">Mostrando {resultCount} resultado(s)</span>
            )}
        </div>
    );
}
