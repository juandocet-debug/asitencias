/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, Calendar, CheckCircle, Clock, Edit2, Users } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import ScheduleModal from '../components/ScheduleModal';
import AdminDashboard from './AdminDashboard';
import MobilePageFrame from '../components/mobile/MobilePageFrame';
import MobileHero from '../components/mobile/MobileHero';
import SectionHeader from '../components/mobile/SectionHeader';
import AppStatCard from '../components/mobile/AppStatCard';
import SoftCard from '../components/mobile/SoftCard';
import StudentDashboardView from '../components/dashboard/StudentDashboardView';
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
    const [checkins, setCheckins] = useState([]);

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
            if (isStudent) {
                const open = await api.get('/academic/attendance/my_open_checkins/');
                setCheckins(open.data || []);
            }
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
        } catch (err) {
            console.error('Error al guardar el horario', err);
        }
    };

    if (loading) return isStudent ? <GameLoadingState /> : <LoadingState />;
    if (!stats) return null;

    if (isStudent) {
        return (
            <StudentDashboardView
                user={user}
                stats={stats}
                checkins={checkins}
                onRefresh={fetchStats}
                navigate={navigate}
            />
        );
    }

    return (
        <MobilePageFrame>
            <MobileHero
                title="Panel académico"
                subtitle="Resumen inteligente de asistencia, clases y actividad."
                action={<Filters year={year} period={period} setYear={setYear} setPeriod={setPeriod} />}
            />

            <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                {buildCards(stats).map((card, index) => (
                    <AppStatCard key={card.title} {...card} theme={subjectThemes[index % subjectThemes.length]} />
                ))}
            </section>

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

            <ActionCard onClick={() => navigate('/classes')} />

            <ScheduleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                course={selectedCourse}
                onSave={saveSchedule}
            />
        </MobilePageFrame>
    );
}

function buildCards(stats) {
    const data = stats.stats || {};
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

function ActionCard({ onClick }) {
    return (
        <button onClick={onClick} className="w-full overflow-hidden rounded-[2rem] bg-[#7657f6] p-5 text-left text-white shadow-xl shadow-violet-300/50">
            <p className="text-lg font-black">Gestiona tus cursos</p>
            <p className="mt-2 text-sm font-semibold text-white/75">Administra clases, estudiantes y horarios.</p>
            <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-[#7657f6]">Ir a clases</div>
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

function GameLoadingState() {
    return (
        <section className="relative grid min-h-full place-items-center overflow-hidden bg-[#050219] px-6 py-24 text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(139,109,255,0.42),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(255,198,76,0.16),transparent_24%),linear-gradient(180deg,#120934_0%,#06021a_55%,#03010d_100%)]" />
            <div className="pointer-events-none fixed inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(139,109,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(139,109,255,.35)_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="relative rounded-[2rem] border border-violet-300/35 bg-[#10072e]/90 p-8 text-center shadow-[0_0_55px_rgba(118,87,246,0.38)]">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.6rem] border border-violet-300/45 bg-black/25 text-3xl shadow-[0_0_24px_rgba(139,109,255,0.55)]">
                    <span className="animate-pulse">✦</span>
                </div>
                <div className="mx-auto mt-5 h-2 w-48 overflow-hidden rounded-full bg-violet-950">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 shadow-[0_0_14px_rgba(139,109,255,0.9)]" />
                </div>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.28em] text-violet-300">Cargando misión</p>
                <p className="mt-1 text-sm font-semibold text-violet-100/70">Preparando tu tablero de jugador...</p>
            </div>
        </section>
    );
}
