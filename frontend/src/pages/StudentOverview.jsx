/* eslint-disable */
// pages/StudentOverview.jsx
// Vista de super admin: asistencia de un estudiante en TODOS sus cursos.
// Accesible desde Users.jsx → botón "Ver asistencia" en cada fila.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, BookOpen, AlertTriangle, CheckCircle,
    TrendingUp, TrendingDown, Calendar, Loader2
} from 'lucide-react';
import api from '../services/api';
import { getMediaUrl, formatDate } from '../utils/dateUtils';

const COLOR_MAP = {
    blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
    violet: { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600' },
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
    rose: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600' },
    cyan: { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-600' },
};

function RateRing({ rate }) {
    const color = rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600';
    const bg = rate >= 80 ? 'bg-emerald-50' : rate >= 60 ? 'bg-amber-50' : 'bg-red-50';
    return (
        <div className={`w-16 h-16 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className={`text-lg font-bold ${color}`}>{rate}%</span>
        </div>
    );
}

export default function StudentOverview() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/academic/courses/student-overview/${studentId}/`)
            .then(res => setData(res.data))
            .catch(err => console.error('Error cargando overview:', err))
            .finally(() => setLoading(false));
    }, [studentId]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-upn-600" />
        </div>
    );

    if (!data) return (
        <div className="text-center py-20 text-slate-400">
            No se encontró información para este estudiante.
        </div>
    );

    const { student, courses, total_courses, global_rate } = data;
    const alertCourses = courses.filter(c => c.in_alert);

    return (
        <div className="space-y-8 pb-20">
            {/* Encabezado */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/users')} className="p-2.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors text-slate-500">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-lg flex-shrink-0">
                        {student.photo
                            ? <img src={getMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
                            : <span>{student.first_name?.[0]}{student.last_name?.[0]}</span>
                        }
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{student.first_name} {student.last_name}</h2>
                        <p className="text-slate-500">Doc: {student.document_number} · {student.email}</p>
                    </div>
                </div>
            </div>

            {/* Resumen global */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl"><BookOpen size={22} className="text-blue-600" /></div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800">{total_courses}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase">Clases activas</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${global_rate >= 80 ? 'bg-emerald-100' : global_rate >= 60 ? 'bg-amber-100' : 'bg-red-100'}`}>
                        {global_rate >= 70 ? <TrendingUp size={22} className={global_rate >= 80 ? 'text-emerald-600' : 'text-amber-600'} /> : <TrendingDown size={22} className="text-red-600" />}
                    </div>
                    <div>
                        <p className={`text-2xl font-bold ${global_rate >= 80 ? 'text-emerald-600' : global_rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{global_rate}%</p>
                        <p className="text-xs text-slate-500 font-medium uppercase">Asistencia global</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${alertCourses.length > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                        {alertCourses.length > 0
                            ? <AlertTriangle size={22} className="text-red-600" />
                            : <CheckCircle size={22} className="text-emerald-600" />}
                    </div>
                    <div>
                        <p className={`text-2xl font-bold ${alertCourses.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{alertCourses.length}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase">Clases en alerta</p>
                    </div>
                </div>
            </div>

            {/* Tarjetas por clase */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Detalle por Clase</h3>
                {courses.length === 0
                    ? <div className="text-center py-16 bg-slate-50 rounded-2xl text-slate-400">No está matriculado en ninguna clase</div>
                    : <div className="space-y-4">
                        {courses.map(course => {
                            const colors = COLOR_MAP[course.course_color] || COLOR_MAP.blue;
                            return (
                                <div key={course.course_id} className={`bg-white rounded-2xl border ${course.in_alert ? 'border-red-200' : 'border-slate-200'} overflow-hidden`}>
                                    {/* Banda de color */}
                                    <div className={`h-1.5 ${colors.bg}`} />
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <RateRing rate={course.attendance_rate} />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-slate-800">{course.course_name}</h4>
                                                        {course.in_alert && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-200">
                                                                <AlertTriangle size={10} /> En alerta
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">Prof: {course.teacher_name} · {course.year}-{course.period}</p>

                                                    {/* Métricas */}
                                                    <div className="flex gap-4 mt-3 flex-wrap">
                                                        {[
                                                            { label: 'Presentes', value: course.present, color: 'text-emerald-600' },
                                                            { label: 'Tardanzas', value: course.late, color: 'text-amber-600' },
                                                            { label: 'Fallas', value: course.absent, color: 'text-red-600' },
                                                            { label: 'Excusadas', value: course.excused, color: 'text-blue-600' },
                                                            { label: 'Sesiones', value: course.total_sessions, color: 'text-slate-600' },
                                                        ].map(({ label, value, color }) => (
                                                            <div key={label} className="text-center">
                                                                <p className={`text-lg font-bold ${color}`}>{value}</p>
                                                                <p className="text-[10px] text-slate-400 uppercase">{label}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Fechas de fallas */}
                                                    {course.absent_dates.length > 0 && (
                                                        <div className="mt-3">
                                                            <p className="text-[11px] font-bold text-red-600 mb-1">Fechas de fallas:</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {course.absent_dates.map((d, i) => (
                                                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-medium rounded-md border border-red-100">
                                                                        <Calendar size={9} /> {formatDate(d)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Enlace al reporte completo */}
                                            <button
                                                onClick={() => navigate(`/classes/${course.course_id}/reports`)}
                                                className="text-xs text-upn-600 hover:text-upn-800 font-semibold flex-shrink-0"
                                            >
                                                Ver reporte →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                }
            </div>
        </div>
    );
}
