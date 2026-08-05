// components/reports/AttendanceSummaryBar.jsx
// Barra horizontal con las métricas clave del grupo: asistencia promedio,
// total fallas, retardos, alertas y sesiones.

import React from 'react';
import {
    Users, Calendar, CheckCircle, Clock, XCircle,
    AlertTriangle, TrendingUp, TrendingDown
} from 'lucide-react';

function Metric({ icon, value, label, valueClass = 'text-slate-800', bgClass = 'bg-slate-100' }) {
    return (
        <div className="min-w-[8.5rem] rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-slate-100">
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-2xl ${bgClass}`}>
                {icon}
            </div>
            <div>
                <p className={`text-xl font-black ${valueClass}`}>{value}</p>
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
            </div>
        </div>
    );
}

export default function AttendanceSummaryBar({ stats, globalStats, studentReport }) {
    const totalAbsent = studentReport.reduce((sum, s) => sum + s.absent, 0);
    const totalLate = studentReport.reduce((sum, s) => sum + s.late, 0);
    const alertCount = stats?.alert_count || 0;
    const avgRate = globalStats.avgRate;

    const trendLabel = avgRate >= 80 ? 'Buen rendimiento' : avgRate >= 60 ? 'Requiere atención' : 'Crítico';
    const trendClass = avgRate >= 80 ? 'bg-emerald-100 text-emerald-700'
        : avgRate >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';

    return (
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-3 shadow-[0_18px_50px_rgba(50,58,90,0.10)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-3 overflow-x-auto pb-1">
                    <Metric icon={<Users size={16} className="text-[#7657f6]" />} bgClass="bg-[#f0edff]" value={stats?.total_students || 0} label="Estudiantes" />
                    <Metric icon={<CheckCircle size={16} className="text-emerald-600" />} bgClass="bg-emerald-100" value={`${avgRate}%`} label="Asistencia Prom." valueClass="text-emerald-600" />
                    <Metric icon={<XCircle size={16} className="text-red-600" />} bgClass="bg-red-100" value={totalAbsent} label="Total Fallas" valueClass="text-red-600" />
                    <Metric icon={<Clock size={16} className="text-amber-600" />} bgClass="bg-amber-100" value={totalLate} label="Total Retardos" valueClass="text-amber-600" />
                    <Metric
                        icon={<AlertTriangle size={16} className={alertCount > 0 ? 'text-red-600' : 'text-slate-400'} />}
                        bgClass={alertCount > 0 ? 'bg-red-100' : 'bg-slate-100'}
                        value={alertCount}
                        label="En Riesgo"
                        valueClass={alertCount > 0 ? 'text-red-600' : 'text-slate-400'}
                    />
                    <Metric icon={<Calendar size={16} className="text-slate-600" />} bgClass="bg-slate-100" value={stats?.total_sessions || 0} label="Sesiones" />
                </div>

                {/* Badge de tendencia */}
                <div className={`flex items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-black ${trendClass}`}>
                    {avgRate >= 80 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {trendLabel}
                </div>
            </div>
        </div>
    );
}


