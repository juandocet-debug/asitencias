/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, BookOpen, Calendar, Activity, AlertTriangle, TrendingUp,
    TrendingDown, Server, Database, Cpu, Shield, RefreshCw, CheckCircle,
    XCircle, Clock, ArrowUpRight, ArrowDownRight, GraduationCap, Award,
    BarChart2, Globe, Zap, ChevronRight
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#0EA5E9'];

// ─── KPI Card clickeable y animado ───────────────────────────────────────────
function KpiCard({ title, value, subtitle, icon: Icon, color, trend, trendValue, delay = 0, onClick }) {
    const [displayed, setDisplayed] = useState(0);
    const numericValue = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
    const suffix = String(value).includes('%') ? '%' : '';

    useEffect(() => {
        let start = null;
        const duration = 900;
        const timeoutId = setTimeout(() => {
            const step = (timestamp) => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setDisplayed(Math.floor(eased * numericValue));
                if (progress < 1) requestAnimationFrame(step);
                else setDisplayed(numericValue);
            };
            requestAnimationFrame(step);
        }, delay);
        return () => clearTimeout(timeoutId);
    }, [numericValue, delay]);

    const isPositive = trend === 'up';
    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    const isClickable = Boolean(onClick);

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm transition-all duration-300 group relative overflow-hidden
                ${isClickable
                    ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:ring-2 hover:ring-blue-200 active:scale-[0.98]'
                    : 'hover:shadow-md'
                }`}
        >
            {/* Fondo decorativo */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6 ${color}`} />

            <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                    <Icon size={22} className={`${color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex items-center gap-1">
                    {trendValue !== undefined && (
                        <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                            }`}>
                            <TrendIcon size={12} />
                            {trendValue}%
                        </span>
                    )}
                    {isClickable && (
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    )}
                </div>
            </div>

            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-800 tabular-nums">
                {numericValue % 1 !== 0 ? numericValue.toFixed(1) : displayed}{suffix}
            </h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}

            {isClickable && (
                <p className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 mt-2 font-semibold transition-opacity">
                    Ver detalle →
                </p>
            )}
        </div>
    );
}

// ─── Tarjeta contenedora de gráfica ──────────────────────────────────────────
function ChartCard({ title, subtitle, children, className = '', onClick }) {
    const isClickable = Boolean(onClick);
    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}
                ${isClickable ? 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-blue-100 transition-all' : ''}`}
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="text-base font-bold text-slate-800">{title}</h4>
                    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                {isClickable && (
                    <span className="text-xs text-blue-500 font-bold flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                        Ver todo <ChevronRight size={13} />
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

// ─── Barra de progreso clickeable ─────────────────────────────────────────────
function ProgressBar({ value, color = 'bg-blue-500', label, sublabel, onClick }) {
    const isClickable = Boolean(onClick);
    return (
        <div
            onClick={onClick}
            className={`space-y-1 rounded-xl p-2 -mx-2 transition-all ${isClickable ? 'cursor-pointer hover:bg-slate-50 hover:ring-1 hover:ring-slate-200' : ''
                }`}
        >
            <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 truncate max-w-[180px]">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{value}%</span>
                    {isClickable && <ChevronRight size={14} className="text-slate-300" />}
                </div>
            </div>
            {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
            <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                    className={`${color} h-2.5 rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                />
            </div>
        </div>
    );
}

// ─── Tooltip Recharts ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-2xl border border-slate-700">
            <p className="font-bold text-slate-200 mb-1">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
                    <span className="text-slate-300">{p.name}:</span>
                    <span className="font-bold">{p.value}{p.name?.includes('Asistencia') ? '%' : ''}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Badge del sistema ────────────────────────────────────────────────────────
function SysBadge({ ok, label }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            {ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
            {label}
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);

    const fetchAnalytics = async () => {
        setRefreshing(true);
        setError(null);
        try {
            const res = await api.get('/academic/dashboard/admin-analytics/');
            setData(res.data);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Error cargando analytics admin:', err);
            const status = err?.response?.status;
            const detail = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Error desconocido';
            setError(`[${status || 'SIN CONEXIÓN'}] ${detail}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-72 gap-4">
                <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium text-sm">Cargando analytics del sistema...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-72 gap-3">
                <AlertTriangle size={36} className="text-amber-400" />
                <p className="font-semibold text-slate-700">No se pudo cargar la información</p>
                {error && (
                    <p className="text-xs text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-100 max-w-md text-center">
                        {error}
                    </p>
                )}
                <button
                    onClick={fetchAnalytics}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <RefreshCw size={14} /> Reintentar
                </button>
            </div>
        );
    }

    const { kpis, charts, system } = data;
    const attendanceOk = kpis.today_attendance_rate >= 75;

    // ─── Navegación centralizada — usar objeto para soportar query params ─────
    const goTo = (path) => {
        const [pathname, search] = path.split('?');
        navigate({ pathname, search: search ? `?${search}` : '' });
    };

    return (
        <div className="space-y-6">

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <BarChart2 className="text-blue-600" size={26} />
                        Centro de Control — Super Admin
                    </h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                        Vista integral del sistema · Actualizado: {lastRefresh.toLocaleTimeString('es-CO')}
                    </p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-60"
                >
                    <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Actualizando...' : 'Actualizar Datos'}
                </button>
            </div>

            {/* ── KPIs Row 1: Usuarios ──────────────────────────────────────── */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    👥 Usuarios del Sistema
                    <span className="text-blue-400 font-normal normal-case tracking-normal">— haz clic para ir</span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard
                        title="Total Usuarios"
                        value={kpis.total_users}
                        icon={Users}
                        color="bg-blue-500"
                        subtitle="Todos los roles"
                        delay={0}
                        onClick={() => goTo('/users')}
                    />
                    <KpiCard
                        title="Estudiantes"
                        value={kpis.total_students}
                        icon={GraduationCap}
                        color="bg-indigo-500"
                        subtitle="Registrados"
                        delay={80}
                        onClick={() => goTo('/users?role=STUDENT')}
                    />
                    <KpiCard
                        title="Docentes"
                        value={kpis.total_teachers}
                        icon={BookOpen}
                        color="bg-purple-500"
                        subtitle="Activos"
                        delay={160}
                        onClick={() => goTo('/users?role=TEACHER')}
                    />
                    <KpiCard
                        title="En Riesgo"
                        value={kpis.at_risk_students}
                        icon={AlertTriangle}
                        color="bg-red-500"
                        subtitle="≥3 inasistencias"
                        delay={240}
                        onClick={() => goTo('/users?risk=1')}
                    />
                </div>
            </div>

            {/* ── KPIs Row 2: Académico ─────────────────────────────────────── */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    📚 Indicadores Académicos
                    <span className="text-blue-400 font-normal normal-case tracking-normal">— haz clic para ir</span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard
                        title="Cursos Totales"
                        value={kpis.total_courses}
                        icon={BookOpen}
                        color="bg-cyan-500"
                        subtitle="Sin filtrar año"
                        delay={0}
                        onClick={() => goTo('/classes')}
                    />
                    <KpiCard
                        title="Cursos Activos"
                        value={kpis.active_courses}
                        icon={Zap}
                        color="bg-emerald-500"
                        subtitle={`Año ${new Date().getFullYear()}`}
                        delay={80}
                        onClick={() => goTo('/classes')}
                    />
                    <KpiCard
                        title="Sesiones Totales"
                        value={kpis.total_sessions}
                        icon={Calendar}
                        color="bg-amber-500"
                        subtitle="Clases registradas"
                        delay={160}
                        onClick={() => goTo('/classes')}
                    />
                    <KpiCard
                        title="Asistencia Hoy"
                        value={`${kpis.today_attendance_rate}%`}
                        icon={Activity}
                        color={attendanceOk ? 'bg-emerald-500' : 'bg-red-500'}
                        subtitle={`${kpis.today_present} presentes · ${kpis.today_absent} ausentes`}
                        delay={240}
                        onClick={() => goTo('/classes')}
                    />
                </div>
            </div>

            {/* ── Gráficas principales ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Asistencia mensual — área */}
                <ChartCard
                    title="Tendencia de Asistencia"
                    subtitle="Últimos 6 meses — presencia + tardanzas"
                    className="lg:col-span-2"
                    onClick={() => goTo('/classes')}
                >
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={charts.monthly_attendance} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradRate" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="rate" name="Asistencia" stroke="#3B82F6" strokeWidth={2.5} fill="url(#gradRate)" dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Distribución por rol — Pie clickeable por segmento */}
                <ChartCard title="Distribución de Usuarios" subtitle="Clic en cada rol para ver la lista">
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                data={charts.user_distribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                                onClick={(entry) => {
                                    if (entry.label === 'Estudiantes') goTo('/users?role=STUDENT');
                                    else if (entry.label === 'Docentes') goTo('/users?role=TEACHER');
                                    else goTo('/users');
                                }}
                                cursor="pointer"
                            >
                                {charts.user_distribution.map((_, index) => (
                                    <Cell key={index} fill={PIE_COLORS[index]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val, name) => [val, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Leyenda clickeable */}
                    <div className="space-y-2 mt-2">
                        {charts.user_distribution.map((item, i) => {
                            const roleMap = { 'Estudiantes': '/users?role=STUDENT', 'Docentes': '/users?role=TEACHER', 'Admins': '/users' };
                            return (
                                <div
                                    key={i}
                                    onClick={() => goTo(roleMap[item.label] || '/users')}
                                    className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                                        <span className="text-slate-600 font-medium">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-slate-800">{item.value}</span>
                                        <ChevronRight size={12} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ChartCard>
            </div>

            {/* ── Desglose mensual + Nuevos usuarios ────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="Desglose Mensual de Asistencia"
                    subtitle="Presentes · Tardanzas · Ausentes"
                    onClick={() => goTo('/classes')}
                >
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={charts.monthly_attendance} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={16}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                            <Bar dataKey="present" name="Presentes" fill="#059669" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="late" name="Tardanzas" fill="#D97706" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="absent" name="Ausentes" fill="#EF4444" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Nuevos Usuarios Registrados"
                    subtitle="Últimos 6 meses"
                    onClick={() => goTo('/users')}
                >
                    {charts.monthly_new_users.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={charts.monthly_new_users} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="count" name="Nuevos usuarios" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: '#8B5CF6', r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-52 text-slate-300">
                            <div className="text-center">
                                <Users size={40} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Sin registros en los últimos 6 meses</p>
                            </div>
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* ── Rankings ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top 5 cursos */}
                <ChartCard
                    title="🏆 Top Cursos por Asistencia"
                    subtitle="Clic en cada curso para ver el detalle"
                >
                    {charts.top_courses.length > 0 ? (
                        <div className="space-y-1">
                            {charts.top_courses.map((course, i) => (
                                <ProgressBar
                                    key={i}
                                    value={course.attendance_rate}
                                    label={`${i + 1}. ${course.name}`}
                                    sublabel={`${course.teacher} · ${course.students} est. · ${course.sessions} sesiones`}
                                    color={
                                        course.attendance_rate >= 85 ? 'bg-emerald-500' :
                                            course.attendance_rate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                    }
                                    onClick={() => goTo('/classes')}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-slate-300">
                            <p className="text-sm">Sin datos suficientes</p>
                        </div>
                    )}
                    {charts.top_courses.length > 0 && (
                        <button
                            onClick={() => goTo('/classes')}
                            className="mt-4 w-full text-center text-xs text-blue-500 hover:text-blue-700 font-bold py-2 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center gap-1"
                        >
                            Ver todos los cursos <ChevronRight size={13} />
                        </button>
                    )}
                </ChartCard>

                {/* Rendimiento docentes */}
                <ChartCard
                    title="👨‍🏫 Rendimiento por Docente"
                    subtitle="Clic para ver la lista de usuarios"
                >
                    {charts.teacher_performance.length > 0 ? (
                        <div className="space-y-1">
                            {charts.teacher_performance.map((teacher, i) => (
                                <ProgressBar
                                    key={i}
                                    value={teacher.attendance_rate}
                                    label={`${i + 1}. ${teacher.name}`}
                                    sublabel={`${teacher.courses} cursos · ${teacher.students} estudiantes`}
                                    color={
                                        teacher.attendance_rate >= 85 ? 'bg-blue-500' :
                                            teacher.attendance_rate >= 70 ? 'bg-purple-500' : 'bg-orange-500'
                                    }
                                    onClick={() => goTo('/users?role=TEACHER')}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-slate-300">
                            <p className="text-sm">Sin datos de docentes</p>
                        </div>
                    )}
                    {charts.teacher_performance.length > 0 && (
                        <button
                            onClick={() => goTo('/users?role=TEACHER')}
                            className="mt-4 w-full text-center text-xs text-blue-500 hover:text-blue-700 font-bold py-2 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center gap-1"
                        >
                            Ver todos los docentes <ChevronRight size={13} />
                        </button>
                    )}
                </ChartCard>
            </div>

            {/* ── Panel del Sistema ─────────────────────────────────────────── */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
                            <Server size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Estado del Servidor</h4>
                            <p className="text-xs text-slate-400">Información en tiempo real del entorno</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-emerald-400 font-bold">ONLINE</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { icon: Cpu, color: 'text-blue-400', label: 'Python', value: `v${system.python_version}` },
                        { icon: Globe, color: 'text-purple-400', label: 'Django', value: `v${system.django_version}` },
                        { icon: Database, color: 'text-cyan-400', label: 'Base de Datos', value: system.database },
                        {
                            icon: Shield, color: 'text-amber-400', label: 'Entorno', value: system.environment,
                            valueClass: system.environment === 'Production' ? 'text-emerald-400' : 'text-amber-400'
                        },
                    ].map(({ icon: Icon, color, label, value, valueClass }, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <Icon size={16} className={`${color} mb-2`} />
                            <p className="text-xs text-slate-400">{label}</p>
                            <p className={`text-base font-bold ${valueClass || 'text-white'}`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Registros DB — clickeables */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-3">📦 Registros en Base de Datos</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Usuarios', value: system.total_db_records.users, icon: Users, color: 'text-blue-400', path: '/users' },
                            { label: 'Cursos', value: system.total_db_records.courses, icon: BookOpen, color: 'text-purple-400', path: '/classes' },
                            { label: 'Sesiones', value: system.total_db_records.sessions, icon: Calendar, color: 'text-cyan-400', path: '/classes' },
                            { label: 'Asistencias', value: system.total_db_records.attendance_records, icon: CheckCircle, color: 'text-emerald-400', path: '/classes' },
                        ].map(({ label, value, icon: Icon, color, path }, i) => (
                            <div
                                key={i}
                                onClick={() => goTo(path)}
                                className="text-center cursor-pointer hover:bg-white/10 rounded-xl p-2 transition-colors group"
                            >
                                <Icon size={16} className={`${color} mx-auto mb-1 group-hover:scale-110 transition-transform`} />
                                <p className="text-xl font-black text-white">{value.toLocaleString()}</p>
                                <p className="text-xs text-slate-500">{label}</p>
                                <p className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Ver →</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                    <SysBadge ok={true} label="API REST activa" />
                    <SysBadge ok={!system.debug_mode} label={system.debug_mode ? 'Debug MODE ON' : 'Debug OFF'} />
                    <SysBadge ok={system.database.includes('PostgreSQL')} label={system.database.includes('PostgreSQL') ? 'PostgreSQL OK' : 'SQLite (dev)'} />
                    <SysBadge ok={system.environment === 'Production'} label={system.environment} />
                    <SysBadge ok={kpis.today_sessions > 0} label={kpis.today_sessions > 0 ? `${kpis.today_sessions} sesiones hoy` : 'Sin sesiones hoy'} />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        <Clock size={13} />
                        SO: {system.os}
                    </div>
                </div>
            </div>

        </div>
    );
}
