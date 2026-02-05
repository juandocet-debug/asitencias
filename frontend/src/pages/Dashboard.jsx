import React from 'react';
import { Users, Calendar, CheckCircle, AlertCircle, ArrowUpRight } from 'lucide-react';

const StatCard = ({ title, value, label, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-hover hover:shadow-md">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800 mb-2">{value}</h3>
                {trend && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                        <ArrowUpRight size={14} /> +{trend}%
                    </div>
                )}
            </div>
            <div className={`p-4 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Estudiantes"
                    value="150"
                    icon={Users}
                    color="bg-blue-500 shadow-blue-500/30"
                    trend="11"
                />
                <StatCard
                    title="Asistencias hoy"
                    value="45"
                    icon={CheckCircle}
                    color="bg-violet-500 shadow-violet-500/30"
                    trend="5"
                />
                <StatCard
                    title="Retardos"
                    value="12"
                    icon={Calendar}
                    color="bg-orange-500 shadow-orange-500/30"
                />
                <StatCard
                    title="Alertas"
                    value="3"
                    icon={AlertCircle}
                    color="bg-red-500 shadow-red-500/30"
                />
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Clases de Hoy</h3>
                    <button className="text-primary-600 text-sm font-medium hover:text-primary-700">Ver todo</button>
                </div>
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Materia</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Horario</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Grupo</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                            <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[
                            { materia: "Matemáticas I", horario: "08:00 - 10:00", grupo: "A-101", estado: "En curso" },
                            { materia: "Física II", horario: "10:00 - 12:00", grupo: "B-202", estado: "Pendiente" },
                            { materia: "Programación Web", horario: "14:00 - 16:00", grupo: "Lab-3", estado: "Finalizado" },
                        ].map((clase, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-800">{clase.materia}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{clase.horario}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                                        {clase.grupo}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${clase.estado === 'En curso' ? 'bg-emerald-100 text-emerald-700' :
                                            clase.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {clase.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                                        Registrar Asistencia
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
