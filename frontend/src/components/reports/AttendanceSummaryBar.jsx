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
        <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${bgClass} rounded-lg flex items-center justify-center`}>
                {icon}
            </div>
            <div>
                <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
                <p className="text-[10px] text-slate-500 uppercase font-medium">{label}</p>
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
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6 flex-wrap">
                    <Metric icon={<Users size={16} className="text-blue-600" />} bgClass="bg-blue-100" value={stats?.total_students || 0} label="Estudiantes" />
                    <div className="h-8 w-px bg-slate-200" />
                    <Metric icon={<CheckCircle size={16} className="text-emerald-600" />} bgClass="bg-emerald-100" value={`${avgRate}%`} label="Asistencia Prom." valueClass="text-emerald-600" />
                    <div className="h-8 w-px bg-slate-200" />
                    <Metric icon={<XCircle size={16} className="text-red-600" />} bgClass="bg-red-100" value={totalAbsent} label="Total Fallas" valueClass="text-red-600" />
                    <div className="h-8 w-px bg-slate-200" />
                    <Metric icon={<Clock size={16} className="text-amber-600" />} bgClass="bg-amber-100" value={totalLate} label="Total Retardos" valueClass="text-amber-600" />
                    <div className="h-8 w-px bg-slate-200" />
                    <Metric
                        icon={<AlertTriangle size={16} className={alertCount > 0 ? 'text-red-600' : 'text-slate-400'} />}
                        bgClass={alertCount > 0 ? 'bg-red-100' : 'bg-slate-100'}
                        value={alertCount}
                        label="En Riesgo"
                        valueClass={alertCount > 0 ? 'text-red-600' : 'text-slate-400'}
                    />
                    <div className="h-8 w-px bg-slate-200" />
                    <Metric icon={<Calendar size={16} className="text-slate-600" />} bgClass="bg-slate-100" value={stats?.total_sessions || 0} label="Sesiones" />
                </div>

                {/* Badge de tendencia */}
                <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${trendClass}`}>
                    {avgRate >= 80 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {trendLabel}
                </div>
            </div>
        </div>
    );
}
