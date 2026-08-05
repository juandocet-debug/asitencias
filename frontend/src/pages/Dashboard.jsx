/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, BookOpen, Calendar, CheckCircle, Clock, Edit2, Users } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import ScheduleModal from '../components/ScheduleModal';
import AdminDashboard from './AdminDashboard';
import MobilePageFrame from '../components/mobile/MobilePageFrame';
import MobileHero from '../components/mobile/MobileHero';
import SectionHeader from '../components/mobile/SectionHeader';
import AppStatCard from '../components/mobile/AppStatCard';
import SoftCard from '../components/mobile/SoftCard';
import { subjectThemes, ui } from '../design/tokens';

export default function Dashboard() {
    const { user, activeRole } = useUser();
    const role = activeRole || user?.role;
    const isAdmin = role === 'ADMIN';
    const isStudent = role === 'STUDENT';
    const canManage = role === 'ADMIN' || role === 'TEACHER';
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState('2026');
    const [period, setPeriod] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    useEffect(() => {
        if (!isAdmin) fetchStats();
    }, [year, period, isAdmin, role]);

    if (isAdmin) return <AdminDashboard />;

    const fetchStats = async () => {
        setLoading(true);
        try {
            const params = { year };
            if (period) params.period = period;
            const { data } = await api.get('/academic/dashboard/stats/', { params });
            setStats(data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSchedule = async (courseId, schedule) => {
        try {
            await api.patch(`/academic/courses/${courseId}/`, { schedule });
            setIsModalOpen(false);
            fetchStats();
        } catch {
            alert('Error al guardar el horario');
        }
    };

    if (loading) return <LoadingState />;
    if (!stats) return null;

    const cards = buildCards({ stats, isStudent, navigate });

    return (
        <MobilePageFrame>
            <MobileHero
                title={isStudent ? `${user.first_name}!` : 'Panel académico'}
                subtitle="Resumen inteligente de asistencia, clases y actividad."
                action={<Filters year={year} period={period} setYear={setYear} setPeriod={setPeriod} />}
            />

            <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                {cards.map((card, index) => (
                    <AppStatCard key={card.title} {...card} theme={subjectThemes[index % subjectThemes.length]} />
                ))}
            </section>

            <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
                <section className="space-y-3">
                    <SectionHeader title="Clases de hoy" actionLabel="Ver clases" onAction={() => navigate('/classes')} />
                    <SoftCard className="space-y-3">
                        {(stats.today_classes || []).length > 0 ? (
                            stats.today_classes.map((course, index) => (
                                <TodayCourse
                                    key={course.id || index}
                                    course={course}
                                    theme={subjectThemes[index % subjectThemes.length]}
                                    canManage={canManage}
                                    onEdit={() => { setSelectedCourse(course); setIsModalOpen(true); }}
                                    onOpen={() => navigate(`/classes/${course.id}`)}
                                />
                            ))
                        ) : (
                            <EmptyToday canManage={canManage} />
                        )}
                    </SoftCard>
                </section>

                <aside className="space-y-4">
                    {isStudent && <RiskAlerts alerts={stats.stats.alerts || []} />}
                    <ActionCard
                        isStudent={isStudent}
                        onClick={() => navigate(isStudent ? '/my-absences' : '/classes')}
                    />
                    {isStudent && <JoinCourseCard onClick={() => navigate('/register')} />}
                </aside>
            </div>

            <ScheduleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                course={selectedCourse}
                onSave={saveSchedule}
            />
        </MobilePageFrame>
    );
}

function JoinCourseCard({ onClick }) {
    return (
        <button onClick={onClick} className="w-full rounded-[2rem] bg-white p-5 text-left shadow-sm ring-1 ring-slate-100">
            <p className="text-lg font-black text-[#172033]">Agregarme a una clase</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">Ingresa el código que te dio tu profesor.</p>
            <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-black text-white">Unirme con código</div>
        </button>
    );
}

function buildCards({ stats, isStudent, navigate }) {
    const data = stats.stats || {};
    if (isStudent) {
        return [
            { title: 'Mis clases', value: data.total_courses || 0, icon: BookOpen, detail: 'Cursos activos' },
            { title: 'Asistencia', value: `${data.attendance_rate || 0}%`, icon: Activity, detail: 'Promedio global' },
            { title: 'Faltas', value: data.total_absences || 0, icon: AlertCircle, detail: 'Gestionar excusas', onClick: () => navigate('/my-absences') },
            { title: 'Hoy', value: stats.today_classes?.length || 0, icon: Calendar, detail: 'Clases programadas' },
        ];
    }
    return [
        { title: 'Cursos', value: data.total_courses || 0, icon: BookOpen },
        { title: 'Estudiantes', value: data.total_students || 0, icon: Users },
        { title: 'Clases hoy', value: data.today_sessions || 0, icon: Calendar },
        { title: 'Asistencia', value: `${data.today_attendance_rate || 0}%`, icon: CheckCircle },
    ];
}

function Filters({ year, period, setYear, setPeriod }) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:flex">
            <select value={year} onChange={event => setYear(event.target.value)} className={ui.input}>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
            </select>
            <select value={period} onChange={event => setPeriod(event.target.value)} className={ui.input}>
                <option value="">Todos los periodos</option>
                <option value="1">Periodo 1</option>
                <option value="2">Periodo 2</option>
            </select>
        </div>
    );
}

function TodayCourse({ course, theme, canManage, onEdit, onOpen }) {
    return (
        <div className="flex items-center gap-3 rounded-[1.4rem] bg-slate-50/80 p-3">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${theme.bg} text-lg font-black text-white`}>
                {course.code?.substring(0, 2) || 'C'}
            </div>
            <button onClick={onOpen} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-black text-[#172033]">{course.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Clock size={13} /> {course.schedule || 'Sin horario definido'}
                </p>
            </button>
            {canManage && (
                <button onClick={onEdit} className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-500 shadow-sm">
                    <Edit2 size={15} />
                </button>
            )}
        </div>
    );
}

function RiskAlerts({ alerts }) {
    if (!alerts.length) return null;
    return (
        <SoftCard className="border-red-100 bg-red-50/90">
            <h3 className="mb-3 flex items-center gap-2 font-black text-red-700"><AlertCircle size={18} /> Alertas</h3>
            <div className="space-y-2">
                {alerts.map((alert, index) => (
                    <div key={index} className="rounded-2xl bg-white p-3 text-sm shadow-sm">
                        <p className="font-black text-[#172033]">{alert.course_name}</p>
                        <p className="text-xs font-bold text-red-500">{alert.absences} inasistencias · límite {alert.limit}</p>
                    </div>
                ))}
            </div>
        </SoftCard>
    );
}

function ActionCard({ isStudent, onClick }) {
    return (
        <button onClick={onClick} className="w-full overflow-hidden rounded-[2rem] bg-[#7657f6] p-5 text-left text-white shadow-xl shadow-violet-300/50">
            <p className="text-lg font-black">{isStudent ? 'Cuida tu asistencia' : 'Gestiona tus cursos'}</p>
            <p className="mt-2 text-sm font-semibold text-white/75">{isStudent ? 'Revisa faltas, excusas y progreso.' : 'Administra clases, estudiantes y horarios.'}</p>
            <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-[#7657f6]">
                {isStudent ? 'Ver mis faltas' : 'Ir a clases'}
            </div>
        </button>
    );
}

function EmptyToday({ canManage }) {
    return (
        <div className="py-10 text-center text-slate-400">
            <Calendar size={42} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">No hay clases programadas para hoy.</p>
            {canManage && <p className="mt-1 text-xs">Configura horarios desde tus cursos.</p>}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="grid h-64 place-items-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-[#7657f6]" />
        </div>
    );
}
