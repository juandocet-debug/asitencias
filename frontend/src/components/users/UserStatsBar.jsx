// components/users/UserStatsBar.jsx
// Barra con 5 tarjetas de estadísticas: total, estudiantes, docentes, coordinadores, admins.

import React from 'react';
import { User, GraduationCap, BookOpen, Briefcase, Shield } from 'lucide-react';

const CARDS = [
    { key: 'total', label: 'Total', icon: <User size={20} className="text-slate-600" />, bg: 'bg-slate-100', text: 'text-slate-800' },
    { key: 'students', label: 'Estudiantes', icon: <GraduationCap size={20} className="text-blue-600" />, bg: 'bg-blue-100', text: 'text-blue-600' },
    { key: 'teachers', label: 'Docentes', icon: <BookOpen size={20} className="text-purple-600" />, bg: 'bg-purple-100', text: 'text-purple-600' },
    { key: 'coordinators', label: 'Coordinadores', icon: <Briefcase size={20} className="text-amber-600" />, bg: 'bg-amber-100', text: 'text-amber-600' },
    { key: 'admins', label: 'Admins', icon: <Shield size={20} className="text-upn-600" />, bg: 'bg-upn-100', text: 'text-upn-600' },
];

export default function UserStatsBar({ stats }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CARDS.map(({ key, label, icon, bg, text }) => (
                <div key={key} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                    <div className={`p-3 ${bg} rounded-xl`}>{icon}</div>
                    <div>
                        <p className={`text-2xl font-bold ${text}`}>{stats[key]}</p>
                        <p className="text-xs text-slate-500 font-medium">{label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
