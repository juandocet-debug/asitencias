/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, Award, BookOpen, Calendar, CheckCircle, Clock, Edit2, Star, Users } from 'lucide-react';
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

            {isStudent && <StudentProgress stats={stats.stats || {}} history={stats.recent_attendance || []} />}

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
                    {isStudent && <StudentCheckinCard checkins={checkins} onDone={fetchStats} />}
                    {isStudent && <RiskAlerts alerts={stats.stats.alerts || []} />}
                    {isStudent && <JoinCourseCard onClick={() => navigate('/register')} />}
                    {!isStudent && <ActionCard onClick={() => navigate('/classes')} />}
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
            { title: 'Puntos', value: data.points || 0, icon: Star, detail: `${data.stars || 0} estrellas` },
            { title: 'Faltas', value: data.total_absences || 0, icon: AlertCircle, detail: 'Gestionar excusas', onClick: () => navigate('/my-absences') },
        ];
    }
    return [
        { title: 'Cursos', value: data.total_courses || 0, icon: BookOpen },
        { title: 'Estudiantes', value: data.total_students || 0, icon: Users },
        { title: 'Clases hoy', value: data.today_sessions || 0, icon: Calendar },
        { title: 'Asistencia', value: `${data.today_attendance_rate || 0}%`, icon: CheckCircle },
    ];
}

function StudentProgress({ stats, history }) {
    const labels = {
        PRESENT: ['Presente', 'text-emerald-300 border-emerald-400/50', <CheckCircle size={20} />],
        LATE: ['Retardo', 'text-rose-300 border-rose-400/50', <Clock size={20} />],
        ABSENT: ['Falta', 'text-red-300 border-red-400/50', <AlertCircle size={20} />],
        EXCUSED: ['Excusa', 'text-slate-300 border-slate-400/50', <Activity size={20} />],
    };
    const xp = Math.min(stats.points || 0, 300);
    const xpWidth = `${Math.max((xp / 300) * 100, 4)}%`;

    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-violet-400/50 bg-[#090424] p-4 text-white shadow-[0_0_45px_rgba(118,87,246,0.35)] md:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,109,255,0.35),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(245,181,64,0.22),transparent_24%),linear-gradient(135deg,rgba(118,87,246,0.18),transparent_42%)]" />
            <div className="pointer-events-none absolute inset-x-6 top-3 h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
            <div className="relative space-y-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-violet-300">Mi progreso</p>
                        <h3 className="mt-1 text-3xl font-black italic tracking-tight text-white drop-shadow-[0_0_12px_rgba(139,109,255,0.9)] md:text-4xl">
                            Puntos, estrellas y asistencias
                        </h3>
                        <div className="mt-3 h-px w-56 bg-gradient-to-r from-violet-400 via-violet-200 to-transparent" />
                    </div>
                    <div className="rounded-[1.4rem] border border-violet-400/40 bg-white/5 p-3 shadow-[0_0_24px_rgba(245,181,64,0.25)] md:w-72">
                        <div className="flex items-center gap-3">
                            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/60 bg-amber-400/15 text-amber-200 shadow-[0_0_22px_rgba(245,181,64,0.55)]">
                                <Star size={30} fill="currentColor" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-amber-200">NIVEL 1</p>
                                <p className="text-xs font-semibold text-white/65">Aprendiz en misión</p>
                                <div className="mt-2 h-2 rounded-full bg-violet-950">
                                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 shadow-[0_0_12px_rgba(139,109,255,0.9)]" style={{ width: xpWidth }} />
                                </div>
                                <p className="mt-1 text-xs font-black text-white/80">{xp} / 300 XP</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MiniMetric tone="violet" icon={<Award size={30} />} label="Puntos" value={stats.points || 0} />
                    <MiniMetric tone="amber" icon={<Star size={30} fill="currentColor" />} label="Estrellas" value={stats.stars || 0} />
                    <MiniMetric tone="emerald" icon={<CheckCircle size={30} />} label="Presentes" value={stats.total_present || 0} />
                    <MiniMetric tone="rose" icon={<Clock size={30} />} label="Retardos" value={stats.total_lates || 0} />
                </div>
                <div className="rounded-[1.5rem] border border-violet-400/30 bg-white/[0.04] p-3 shadow-inner">
                    <p className="mb-3 text-sm font-black text-white">Ultimas asistencias</p>
                    {history.length ? history.map((item, index) => {
                        const status = labels[item.status] || labels.ABSENT;
                        return (
                            <div key={`${item.date}-${index}`} className="flex items-center gap-3 rounded-2xl border border-violet-400/20 bg-[#110936]/80 p-3">
                                <span className={`grid h-11 w-11 place-items-center rounded-xl border bg-white/5 ${status[1]}`}>{status[2]}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-black text-white">{item.course_name}</p>
                                    <p className="text-xs font-semibold text-violet-200/70">{item.date}</p>
                                </div>
                                <span className={`rounded-xl border px-4 py-2 text-xs font-black ${status[1]}`}>{status[0]}</span>
                            </div>
                        );
                    }) : <p className="rounded-2xl border border-violet-400/20 bg-white/[0.04] p-4 text-sm font-semibold text-violet-100/70">Aun no tienes asistencias registradas.</p>}
                </div>
            </div>
        </section>
    );
}

function MiniMetric({ icon, label, value, tone }) {
    const tones = {
        violet: 'border-violet-400/50 text-violet-200 from-violet-500/25',
        amber: 'border-amber-400/50 text-amber-200 from-amber-500/25',
        emerald: 'border-emerald-400/50 text-emerald-200 from-emerald-500/25',
        rose: 'border-rose-400/50 text-rose-200 from-rose-500/25',
    };

    return (
        <div className={`relative overflow-hidden rounded-[1.5rem] border bg-gradient-to-br ${tones[tone]} to-transparent p-4 shadow-[0_0_24px_rgba(118,87,246,0.18)]`}>
            <div className="absolute inset-x-4 bottom-3 h-1 rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
            </div>
            <div className="flex items-center gap-4 pb-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl border border-current/40 bg-black/25 shadow-[0_0_22px_currentColor]">{icon}</div>
                <div>
                    <p className="text-4xl font-black italic text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]">{value}</p>
                    <p className="text-sm font-black">{label}</p>
                </div>
            </div>
        </div>
    );
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

function ActionCard({ onClick }) {
    return (
        <button onClick={onClick} className="w-full overflow-hidden rounded-[2rem] bg-[#7657f6] p-5 text-left text-white shadow-xl shadow-violet-300/50">
            <p className="text-lg font-black">Gestiona tus cursos</p>
            <p className="mt-2 text-sm font-semibold text-white/75">Administra clases, estudiantes y horarios.</p>
            <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-[#7657f6]">
                Ir a clases
            </div>
        </button>
    );
}

function StudentCheckinCard({ checkins, onDone }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [reward, setReward] = useState(null);
    const [saving, setSaving] = useState(false);
    const open = checkins.find(item => !item.already_marked);
    if (!open && !reward) return null;

    const submit = async () => {
        if (!code.trim()) return;
        setError('');
        setSaving(true);
        try {
            const { data } = await api.post('/academic/attendance/self_checkin/', {
                session_id: open.session_id,
                code: code.trim().toUpperCase(),
            });
            setCode('');
            setReward(data.reward);
            onDone?.();
        } catch (requestError) {
            setError(requestError.response?.data?.error || 'No se pudo registrar la asistencia.');
        } finally {
            setSaving(false);
        }
    };

    if (reward) {
        return (
            <SoftCard className="overflow-hidden bg-gradient-to-br from-[#8b6dff] to-[#7657f6] text-white shadow-xl shadow-violet-200">
                <div className="flex items-center gap-4">
                    <div className="animate-bounce text-5xl">{reward.icon}</div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">Recompensa</p>
                        <h3 className="mt-1 text-xl font-black">{reward.title}</h3>
                        <p className="mt-1 text-sm font-semibold text-white/75">{reward.message}</p>
                    </div>
                </div>
                <button onClick={() => setReward(null)} className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#7657f6]">
                    +{reward.points} puntos · Listo
                </button>
            </SoftCard>
        );
    }

    return (
        <SoftCard className="border-violet-100 bg-[#f0edff]/90">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#7657f6]">Ahora</p>
            <h3 className="mt-1 text-xl font-black text-[#172033]">Marcar asistencia</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{open.course_name}</p>
            <div className="mt-4 grid gap-2">
                <input value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="Código del profesor" className="rounded-2xl border border-white/80 bg-white px-4 py-3 text-center font-black uppercase tracking-[0.18em] outline-none focus:ring-4 focus:ring-violet-100" />
                <button onClick={submit} disabled={saving || !code.trim()} className="rounded-2xl bg-gradient-to-br from-[#8b6dff] to-[#7657f6] px-4 py-3 text-sm font-black text-white shadow-xl shadow-violet-200 disabled:opacity-60">
                    {saving ? 'Marcando...' : 'Estoy en clase ✓'}
                </button>
                {error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-600">{error}</p>}
            </div>
        </SoftCard>
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

