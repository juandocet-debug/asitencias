// components/attendance/StudentAttendanceCard.jsx
// Tarjeta visual de un estudiante en el modal de asistencia.
// Clic → cicla PRESENT → ABSENT → LATE (modo manual) o toggle ABSENT/autoStatus (modo auto).

import React from 'react';

export const statusConfig = {
    PRESENT: {
        bg: 'bg-gradient-to-br from-emerald-50 to-green-100',
        border: 'border-emerald-300',
        text: 'text-emerald-800',
        badge: 'bg-emerald-500 text-white',
        label: 'Presente',
        icon: '✓',
    },
    ABSENT: {
        bg: 'bg-gradient-to-br from-red-50 to-rose-100',
        border: 'border-red-300',
        text: 'text-red-800',
        badge: 'bg-red-500 text-white',
        label: 'Ausente',
        icon: '✗',
    },
    LATE: {
        bg: 'bg-gradient-to-br from-amber-50 to-yellow-100',
        border: 'border-amber-300',
        text: 'text-amber-800',
        badge: 'bg-amber-500 text-white',
        label: 'Tarde',
        icon: '⏱',
    },
};

export default function StudentAttendanceCard({ student, status, onToggle, getMediaUrl }) {
    const conf = statusConfig[status] || statusConfig.PRESENT;
    return (
        <div
            onClick={() => onToggle(student.id)}
            className={`relative p-3 sm:p-4 rounded-2xl border-2 cursor-pointer select-none
                transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
                active:scale-[0.97] active:shadow-sm ${conf.bg} ${conf.border} ${conf.text}`}
        >
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                    {student.photo
                        ? <img src={getMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
                        : <span className="text-sm sm:text-base font-black opacity-60">{student.first_name?.[0]}{student.last_name?.[0]}</span>
                    }
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate leading-tight">{student.first_name} {student.last_name}</h4>
                    <p className="text-[11px] opacity-60 font-mono">{student.document_number}</p>
                </div>
                {/* Badge */}
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 shadow-sm ${conf.badge}`}>
                    {conf.icon}
                </div>
            </div>
        </div>
    );
}
