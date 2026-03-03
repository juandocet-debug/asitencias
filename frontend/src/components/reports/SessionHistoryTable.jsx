// components/reports/SessionHistoryTable.jsx
// Tabla de historial de sesiones de clase con estadísticas de asistencia por fecha.

import React from 'react';
import { Calendar } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import EmptyState from '../ui/EmptyState';

function AttendanceBar({ rate }) {
    const color = rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500';
    const textColor = rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600';
    return (
        <div className="flex items-center justify-center gap-2">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
            </div>
            <span className={`text-xs font-semibold ${textColor}`}>{rate}%</span>
        </div>
    );
}

const BADGE = 'inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-full text-xs font-semibold';

export default function SessionHistoryTable({ history }) {
    if (!history.length) {
        return <EmptyState icon={<Calendar size={48} />} message="No hay sesiones registradas aún" />;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-100">
                        {['Fecha', 'Tema', 'Presentes', 'Tardanzas', 'Faltas', 'Asistencia'].map((h, i) => (
                            <th key={i} className={`${i <= 1 ? 'text-left' : 'text-center'} px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide`}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {history.map((session, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4"><span className="font-medium text-slate-800">{formatDate(session.date)}</span></td>
                            <td className="px-4 py-4 text-slate-600">{session.topic || <span className="text-slate-400">—</span>}</td>
                            <td className="px-4 py-4 text-center"><span className={`${BADGE} bg-emerald-50 text-emerald-700`}>{session.present}</span></td>
                            <td className="px-4 py-4 text-center"><span className={`${BADGE} bg-amber-50 text-amber-700`}>{session.late}</span></td>
                            <td className="px-4 py-4 text-center"><span className={`${BADGE} bg-red-50 text-red-700`}>{session.absent}</span></td>
                            <td className="px-4 py-4"><AttendanceBar rate={session.attendance_rate} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
