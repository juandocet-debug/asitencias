import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle, AlertCircle, ArrowUpRight, BookOpen, Clock, Activity, Edit2, X, Plus, Trash2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const StatCard = ({ title, value, label, icon: Icon, color, trend, subtext }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-hover hover:shadow-md">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800 mb-2">{value}</h3>
                {trend && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit mb-2">
                        <ArrowUpRight size={14} /> {trend}%
                    </div>
                )}
                {subtext && (
                    <p className="text-xs text-slate-400">{subtext}</p>
                )}
            </div>
            <div className={`p-4 rounded-xl shadow-lg transform transition-transform hover:scale-105 ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </div>
);

const ScheduleModal = ({ isOpen, onClose, course, onSave }) => {
    const [schedule, setSchedule] = useState([{ day: 'MON', start: '08:00', end: '10:00' }]);

    useEffect(() => {
        if (course?.all_schedules && course.all_schedules.length > 0) {
            setSchedule(course.all_schedules);
        } else {
            setSchedule([{ day: 'MON', start: '08:00', end: '10:00' }]);
        }
    }, [course]);

    const handleChange = (index, field, value) => {
        const newSchedule = [...schedule];
        newSchedule[index][field] = value;
        setSchedule(newSchedule);
    };

    const addSlot = () => {
        setSchedule([...schedule, { day: 'MON', start: '08:00', end: '10:00' }]);
    };

    const removeSlot = (index) => {
        const newSchedule = schedule.filter((_, i) => i !== index);
        setSchedule(newSchedule);
    };

    const handleSave = () => {
        onSave(course.id, schedule);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Programar Horario</h3>
                        <p className="text-sm text-slate-500">{course?.name} ({course?.code})</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {schedule.map((slot, index) => (
                        <div key={index} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <select
                                value={slot.day}
                                onChange={(e) => handleChange(index, 'day', e.target.value)}
                                className="bg-white border border-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 flex-1"
                            >
                                <option value="MON">Lunes</option>
                                <option value="TUE">Martes</option>
                                <option value="WED">Miércoles</option>
                                <option value="THU">Jueves</option>
                                <option value="FRI">Viernes</option>
                                <option value="SAT">Sábado</option>
                                <option value="SUN">Domingo</option>
                            </select>
                            <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => handleChange(index, 'start', e.target.value)}
                                className="bg-white border border-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 w-24"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => handleChange(index, 'end', e.target.value)}
                                className="bg-white border border-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 w-24"
                            />
                            <button onClick={() => removeSlot(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                <button onClick={addSlot} className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700">
                    <Plus size={16} /> Agregar horario
                </button>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all">
                        Guardar Horario
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState('2026');
    const [period, setPeriod] = useState('');

    // Schedule Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    useEffect(() => {
        fetchStats();
    }, [year, period]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const params = { year };
            if (period) params.period = period;

            const response = await api.get('/academic/dashboard/stats/', { params });
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditSchedule = (course) => {
        setSelectedCourse(course);
        setIsModalOpen(true);
    };

    const handleSaveSchedule = async (courseId, newSchedule) => {
        try {
            await api.patch(`/academic/courses/${courseId}/`, { schedule: newSchedule });
            setIsModalOpen(false);
            fetchStats(); // Recargar datos
        } catch (error) {
            console.error("Error saving schedule:", error);
            alert("Error al guardar el horario");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-upn-600"></div>
            </div>
        );
    }

    if (!stats) return null;

    const isStudent = user?.role === 'STUDENT';

    return (
        <div className="space-y-8">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">
                        {isStudent ? `Hola, ${user.first_name}` : 'Panel de Control'}
                    </h2>
                    <p className="text-slate-500 text-sm">Resumen de actividad académica</p>
                </div>

                <div className="flex gap-3">
                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-upn-500 focus:outline-none"
                    >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                    </select>

                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-upn-500 focus:outline-none"
                    >
                        <option value="">Todos los periodos</option>
                        <option value="1">Periodo 1</option>
                        <option value="2">Periodo 2</option>
                    </select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isStudent ? (
                    <>
                        <StatCard
                            title="Mis Clases Totales"
                            value={stats.stats.total_courses || 0}
                            icon={BookOpen}
                            color="bg-blue-500"
                            subtext="Cursos inscritos activos"
                        />
                        <StatCard
                            title="Asistencia Global"
                            value={`${stats.stats.attendance_rate || 0}%`}
                            icon={Activity}
                            color={stats.stats.attendance_rate >= 80 ? "bg-emerald-500" : "bg-amber-500"}
                            subtext="Promedio general"
                        />
                        <StatCard
                            title="Faltas Totales"
                            value={stats.stats.total_absences || 0}
                            icon={AlertCircle}
                            color="bg-red-500"
                            subtext="Inasistencias registradas"
                        />
                        <StatCard
                            title="Clases Hoy"
                            value={stats.today_classes?.length || 0}
                            icon={Calendar}
                            color="bg-indigo-500"
                            subtext="Según horario"
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Mis Cursos Totales"
                            value={stats.stats.total_courses || 0}
                            icon={BookOpen}
                            color="bg-blue-500"
                        />
                        <StatCard
                            title="Total Estudiantes"
                            value={stats.stats.total_students || 0}
                            icon={Users}
                            color="bg-indigo-500"
                        />
                        <StatCard
                            title="Clases Hoy"
                            value={stats.stats.today_sessions || 0}
                            icon={Calendar}
                            color="bg-orange-500"
                            subtext="Programadas hoy"
                        />
                        <StatCard
                            title="Asistencia Hoy"
                            value={`${stats.stats.today_attendance_rate || 0}%`}
                            icon={CheckCircle}
                            color="bg-emerald-500"
                        />
                    </>
                )}
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content (Today's Classes) */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Calendar size={20} className="text-upn-600" />
                            Clases de Hoy
                        </h3>
                    </div>

                    {stats.today_classes && stats.today_classes.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {stats.today_classes.map((clase, i) => (
                                <div key={i} className="p-5 hover:bg-slate-50 transition-colors flex items-center group">
                                    <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg mr-4 group-hover:scale-110 transition-transform">
                                        {clase.code?.substring(0, 2) || 'C'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-800 text-lg">{clase.name}</h4>
                                            {!isStudent && (
                                                <button
                                                    onClick={() => handleEditSchedule(clase)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar Horario"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-sm flex items-center gap-2">
                                            <Clock size={14} /> {clase.schedule || 'Sin horario definido'}
                                        </p>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="hidden sm:block text-right">
                                            <span className="block text-sm font-semibold text-slate-700">{clase.code}</span>
                                            {isStudent && (
                                                <span className="text-xs text-slate-500">Docente: {clase.teacher}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => navigate(`/classes/${clase.id}`)}
                                            className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            Ir a Clase
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No hay clases programadas para hoy.</p>
                            {!isStudent && (
                                <p className="text-sm mt-2">
                                    (Asegúrate de configurar los horarios de tus cursos)
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Stats (Alerts / Quick Actions) */}
                <div className="space-y-6">
                    {/* Alertas de Asistencia */}
                    {isStudent && stats.stats.alerts && stats.stats.alerts.length > 0 && (
                        <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                            <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                                <AlertCircle size={20} />
                                Alertas de Riesgo
                            </h3>
                            <div className="space-y-3">
                                {stats.stats.alerts.map((alert, i) => (
                                    <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-red-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{alert.course_name}</p>
                                            <p className="text-xs text-red-500 font-medium">{alert.absences} inasistencias</p>
                                        </div>
                                        <div className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">
                                            Límite: {alert.limit}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-red-600 mt-4 text-center">
                                Estás cerca o has superado el límite de faltas permitido.
                            </p>
                        </div>
                    )}

                    {/* Quick Access Card */}
                    <div className="bg-upn-600 text-white rounded-2xl p-6 shadow-xl shadow-upn-600/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-8 -translate-y-8"></div>
                        <h3 className="font-bold text-lg mb-2 relative z-10">
                            {isStudent ? 'Mis Clases' : 'Ver Todos los Cursos'}
                        </h3>
                        <p className="text-blue-100 text-sm mb-6 relative z-10">
                            {isStudent
                                ? 'Accede a la lista completa de tus materias inscritas y revisa tu historial.'
                                : 'Administra todas tus asignaturas, estudiantes y configuraciones.'}
                        </p>
                        <button
                            onClick={() => navigate('/classes')}
                            className="w-full bg-white text-upn-700 font-bold py-3 rounded-xl shadow hover:bg-blue-50 transition-colors relative z-10"
                        >
                            {isStudent ? 'Ver todas mis clases' : 'Gestionar Cursos'}
                        </button>
                    </div>
                </div>
            </div>

            <ScheduleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                course={selectedCourse}
                onSave={handleSaveSchedule}
            />
        </div>
    );
}
