import React, { useState } from 'react';
import { Activity, AlertCircle, Award, BookOpen, Calendar, CheckCircle, Clock, Shield, Star } from 'lucide-react';
import api from '../../services/api';
import MobilePageFrame from '../mobile/MobilePageFrame';
import SectionHeader from '../mobile/SectionHeader';
import SoftCard from '../mobile/SoftCard';

export default function StudentDashboardView({ user, stats, checkins, onRefresh, navigate }) {
    const data = stats.stats || {};
    const todayClasses = stats.today_classes || [];

    return (
        <MobilePageFrame>
            <section className="relative overflow-hidden rounded-[2.2rem] border border-violet-300/30 bg-[#0b0624] p-5 text-white shadow-[0_24px_70px_rgba(71,43,168,0.35)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_4%,rgba(139,109,255,0.45),transparent_28%),radial-gradient(circle_at_85%_6%,rgba(255,198,76,0.22),transparent_24%)]" />
                <div className="relative flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-3xl bg-violet-400 blur-xl opacity-40" />
                        <img src={user?.photo || '/este-agon.png'} alt={user?.first_name || 'Estudiante'} className="relative h-16 w-16 rounded-3xl border-2 border-white/20 object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-violet-200">Misión activa</p>
                        <h1 className="mt-1 truncate text-3xl font-black italic leading-none drop-shadow-[0_0_14px_rgba(139,109,255,0.9)]">
                            {user?.first_name || 'Estudiante'}
                        </h1>
                        <p className="mt-2 text-sm font-semibold text-violet-100/70">Sube puntos marcando tu asistencia en clase.</p>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <MissionCard tone="violet" icon={BookOpen} title="Mis clases" value={data.total_courses || 0} detail="Cursos activos" />
                <MissionCard tone="rose" icon={Activity} title="Asistencia" value={`${data.attendance_rate || 0}%`} detail="Promedio global" />
                <MissionCard tone="amber" icon={Star} title="Puntos" value={data.points || 0} detail={`${data.stars || 0} estrellas`} />
                <MissionCard tone="emerald" icon={AlertCircle} title="Faltas" value={data.total_absences || 0} detail="Gestionar excusas" onClick={() => navigate('/my-absences')} />
            </section>

            <PlayerProgress stats={data} history={stats.recent_attendance || []} />

            <div className="grid gap-5 lg:grid-cols-[1.45fr_0.9fr]">
                <section className="space-y-3">
                    <SectionHeader title="Clases de hoy" actionLabel="Ver clases" onAction={() => navigate('/classes')} />
                    <GamePanel>
                        {todayClasses.length ? todayClasses.map(course => (
                            <TodayMission key={course.id} course={course} onOpen={() => navigate(`/classes/${course.id}`)} />
                        )) : <EmptyToday />}
                    </GamePanel>
                </section>

                <aside className="space-y-4">
                    <StudentCheckinCard checkins={checkins} onDone={onRefresh} />
                    <JoinCourseCard onClick={() => navigate('/register')} />
                    <RiskAlerts alerts={data.alerts || []} />
                </aside>
            </div>
        </MobilePageFrame>
    );
}

function MissionCard({ icon: Icon, title, value, detail, tone, onClick }) {
    const tones = {
        violet: 'from-[#7657f6] to-[#8b6dff]',
        rose: 'from-[#ff5a6a] to-[#f15d79]',
        amber: 'from-[#ffc34d] to-[#f6a73c]',
        emerald: 'from-[#22c774] to-[#55c56d]',
    };
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag onClick={onClick} className={`relative min-h-[8.7rem] overflow-hidden rounded-[1.7rem] bg-gradient-to-br ${tones[tone]} p-4 text-left text-white shadow-[0_18px_35px_rgba(76,60,140,0.22)] transition active:scale-[0.98]`}>
            <div className="absolute -right-7 top-8 h-16 w-16 rounded-full bg-white/15" />
            <div className="absolute -left-8 -top-8 h-20 w-20 rounded-full bg-white/10" />
            <div className="relative flex h-full flex-col justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/22 shadow-inner"><Icon size={19} /></div>
                <div>
                    <p className="text-3xl font-black italic leading-none">{value}</p>
                    <h3 className="mt-1 text-sm font-black">{title}</h3>
                    <p className="mt-2 text-[10px] font-bold text-white/82">{detail}</p>
                </div>
            </div>
        </Tag>
    );
}

function PlayerProgress({ stats, history }) {
    const xp = Math.min(stats.points || 0, 300);
    const xpWidth = `${Math.max((xp / 300) * 100, 4)}%`;
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-violet-400/50 bg-[#090424] p-4 text-white shadow-[0_0_45px_rgba(118,87,246,0.35)] md:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,109,255,0.35),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(245,181,64,0.22),transparent_24%)]" />
            <div className="relative space-y-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-violet-300">Mi progreso</p>
                        <h2 className="mt-1 text-3xl font-black italic tracking-tight drop-shadow-[0_0_12px_rgba(139,109,255,0.9)] md:text-4xl">Puntos, estrellas y asistencias</h2>
                        <div className="mt-3 h-px w-56 bg-gradient-to-r from-violet-400 via-violet-200 to-transparent" />
                    </div>
                    <LevelBadge xp={xp} xpWidth={xpWidth} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <HudMetric tone="violet" icon={<Award size={30} />} label="Puntos" value={stats.points || 0} />
                    <HudMetric tone="amber" icon={<Star size={30} fill="currentColor" />} label="Estrellas" value={stats.stars || 0} />
                    <HudMetric tone="emerald" icon={<CheckCircle size={30} />} label="Presentes" value={stats.total_present || 0} />
                    <HudMetric tone="rose" icon={<Clock size={30} />} label="Retardos" value={stats.total_lates || 0} />
                </div>
                <AttendanceHistory history={history} />
            </div>
        </section>
    );
}

function LevelBadge({ xp, xpWidth }) {
    return (
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
    );
}

function HudMetric({ icon, label, value, tone }) {
    const tones = {
        violet: 'border-violet-400/50 text-violet-200 from-violet-500/25',
        amber: 'border-amber-400/50 text-amber-200 from-amber-500/25',
        emerald: 'border-emerald-400/50 text-emerald-200 from-emerald-500/25',
        rose: 'border-rose-400/50 text-rose-200 from-rose-500/25',
    };
    return (
        <div className={`relative overflow-hidden rounded-[1.5rem] border bg-gradient-to-br ${tones[tone]} to-transparent p-4 shadow-[0_0_24px_rgba(118,87,246,0.18)]`}>
            <div className="absolute inset-x-4 bottom-3 h-1 rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-current shadow-[0_0_10px_currentColor]" /></div>
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

function AttendanceHistory({ history }) {
    const labels = {
        PRESENT: ['Presente', 'text-emerald-300 border-emerald-400/50', <CheckCircle size={20} />],
        LATE: ['Retardo', 'text-rose-300 border-rose-400/50', <Clock size={20} />],
        ABSENT: ['Falta', 'text-red-300 border-red-400/50', <AlertCircle size={20} />],
        EXCUSED: ['Excusa', 'text-slate-300 border-slate-400/50', <Activity size={20} />],
    };
    return (
        <div className="rounded-[1.5rem] border border-violet-400/30 bg-white/[0.04] p-3 shadow-inner">
            <p className="mb-3 text-sm font-black text-white">Últimas asistencias</p>
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
            }) : <p className="rounded-2xl border border-violet-400/20 bg-white/[0.04] p-4 text-sm font-semibold text-violet-100/70">Aún no tienes asistencias registradas.</p>}
        </div>
    );
}

function GamePanel({ children }) {
    return <div className="rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-[0_20px_50px_rgba(80,72,130,0.15)]">{children}</div>;
}

function TodayMission({ course, onOpen }) {
    return (
        <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-[1.5rem] bg-[#120b32] p-3 text-left text-white shadow-inner">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/40 bg-violet-400/20 font-black text-violet-100">
                {course.code?.substring(0, 2) || 'C'}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{course.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-violet-100/65"><Clock size={13} /> {course.schedule || 'Sin horario definido'}</p>
            </div>
        </button>
    );
}

function JoinCourseCard({ onClick }) {
    return (
        <button onClick={onClick} className="relative w-full overflow-hidden rounded-[2rem] border border-violet-300/25 bg-[#0d0828] p-5 text-left text-white shadow-[0_18px_45px_rgba(80,52,170,0.25)]">
            <div className="absolute -right-10 -top-8 h-24 w-24 rounded-full bg-violet-400/25 blur-xl" />
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-violet-300">Nueva misión</p>
            <h3 className="mt-2 text-xl font-black">Agregarme a una clase</h3>
            <p className="mt-2 text-sm font-semibold text-violet-100/70">Ingresa el código que te dio tu profesor.</p>
            <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-[#7657f6]">Unirme con código</div>
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

    if (reward) return <RewardCard reward={reward} onClose={() => setReward(null)} />;

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

function RewardCard({ reward, onClose }) {
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
            <button onClick={onClose} className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#7657f6]">
                +{reward.points} puntos · Listo
            </button>
        </SoftCard>
    );
}

function RiskAlerts({ alerts }) {
    if (!alerts.length) return null;
    return (
        <SoftCard className="border-red-100 bg-red-50/90">
            <h3 className="mb-3 flex items-center gap-2 font-black text-red-700"><Shield size={18} /> Alertas</h3>
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

function EmptyToday() {
    return (
        <div className="py-10 text-center text-slate-400">
            <Calendar size={42} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">No hay clases programadas para hoy.</p>
        </div>
    );
}
