import React, { useState } from 'react';
import { Activity, AlertCircle, Calendar, CheckCircle, Clock, Star, Zap } from 'lucide-react';
import api from '../../services/api';
import HeroAppStudent from './HeroAppStudent';
import SquadGridSection from './SquadGridSection';
import { useStudentMissions } from '../../hooks/useStudentMissions';

const missionTones = {
    violet: 'border-violet-300/55 from-violet-500/35 text-violet-100 shadow-violet-500/20',
    rose: 'border-rose-300/55 from-rose-500/35 text-rose-100 shadow-rose-500/20',
    amber: 'border-amber-300/55 from-amber-500/35 text-amber-100 shadow-amber-500/20',
    emerald: 'border-emerald-300/55 from-emerald-500/35 text-emerald-100 shadow-emerald-500/20',
};

export default function StudentDashboardView({ user, stats, checkins, onRefresh, navigate }) {
    const data = stats.stats || {};
    const todayClasses = stats.today_classes || [];
    const { missionSummary } = useStudentMissions(true);

    return (
        <section className="relative min-h-full overflow-hidden bg-[#050219] px-3 pb-28 pt-3 text-white sm:px-4 md:px-8 md:pb-10">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_7%,rgba(139,109,255,0.42),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(255,198,76,0.18),transparent_24%),radial-gradient(circle_at_70%_78%,rgba(32,231,166,0.16),transparent_28%),linear-gradient(180deg,#120934_0%,#06021a_48%,#03010d_100%)]" />
            <div className="pointer-events-none fixed inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(139,109,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(139,109,255,.35)_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="relative mx-auto w-full max-w-[30rem] space-y-5 md:max-w-6xl md:space-y-7">
                <HeroAppStudent user={user} stats={data} onAction={() => navigate('/classes')} />
                
                {/* Sección Gamer de 2 Columnas Lado a Lado conectada a la BD */}
                <SquadGridSection
                    missionSummary={missionSummary}
                    onOpenSquads={() => navigate('/classes')}
                    stats={data}
                    navigate={navigate}
                />

                <ProgressHud stats={data} history={stats.recent_attendance || []} />
                <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
                    <MissionPanel title="Misiones de hoy" action="Ver clases" onAction={() => navigate('/classes')}>
                        {todayClasses.length ? todayClasses.map((course, index) => (
                            <ClassMission key={course.id || index} course={course} index={index} onOpen={() => navigate(`/classes/${course.id}`)} />
                        )) : <EmptyToday />}
                    </MissionPanel>
                    <aside className="space-y-4">
                        <StudentCheckinCard checkins={checkins} onDone={onRefresh} />
                        <JoinCourseCard onClick={() => navigate('/register')} />
                        <RiskAlerts alerts={data.alerts || []} />
                    </aside>
                </div>
            </div>
        </section>
    );
}

function PlayerHero({ user, stats }) {
    return (
        <header className="relative overflow-hidden rounded-[2.2rem] border border-violet-300/35 bg-[#10072e]/90 p-5 shadow-[0_0_60px_rgba(118,87,246,0.32)] backdrop-blur">
            <HudCorners />
            <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
            <div className="relative flex items-center gap-4">
                <div className="relative grid h-20 w-20 place-items-center rounded-[1.7rem] border border-violet-200/40 bg-black/25 shadow-[0_0_24px_rgba(139,109,255,0.45)]">
                    <img src={user?.photo || '/este-agon.png'} alt={user?.first_name || 'Estudiante'} className="h-16 w-16 rounded-[1.35rem] object-cover" />
                    <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-emerald-200/60 bg-emerald-400 text-[#06130e]"><Zap size={14} fill="currentColor" /></span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.32em] text-violet-200">Misión activa</p>
                    <h1 className="mt-1 truncate text-3xl font-black italic leading-none text-white drop-shadow-[0_0_14px_rgba(139,109,255,0.9)] md:text-5xl">
                        {user?.first_name || 'Jugador'}
                    </h1>
                    <p className="mt-2 text-sm font-semibold text-violet-100/72">Marca asistencia, gana XP y conserva tu racha.</p>
                </div>
                <div className="hidden rounded-2xl border border-amber-300/45 bg-amber-400/10 p-4 text-amber-100 shadow-[0_0_24px_rgba(245,181,64,0.28)] md:block">
                    <p className="text-xs font-black">XP ACTUAL</p>
                    <p className="text-3xl font-black italic">{stats.points || 0}</p>
                </div>
            </div>
        </header>
    );
}

function MissionCard({ glyph, title, value, detail, tone, onClick }) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag onClick={onClick} className={`group relative min-h-[8.9rem] overflow-hidden rounded-[1.7rem] border bg-gradient-to-br ${missionTones[tone]} to-black/20 p-4 text-left shadow-2xl transition active:scale-[0.98]`}>
            <HudCorners small />
            <div className="absolute -right-8 top-8 h-20 w-20 rounded-full bg-white/10 blur-sm transition group-hover:scale-125" />
            <div className="relative flex h-full flex-col justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/30 bg-black/25 text-xl font-black shadow-[0_0_16px_currentColor]">{glyph}</div>
                <div>
                    <p className="text-3xl font-black italic leading-none text-white">{value}</p>
                    <h3 className="mt-1 text-sm font-black">{title}</h3>
                    <p className="mt-2 text-[10px] font-bold text-white/72">{detail}</p>
                </div>
            </div>
        </Tag>
    );
}

function ProgressHud({ stats, history }) {
    const xp = Math.min(stats.points || 0, 300);
    const xpWidth = `${Math.max((xp / 300) * 100, 4)}%`;
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-violet-400/50 bg-[#090424]/95 p-4 shadow-[0_0_55px_rgba(118,87,246,0.40)] md:p-6">
            <HudCorners />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,109,255,0.35),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(245,181,64,0.22),transparent_24%)]" />
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
                    <HudMetric tone="violet" glyph="◇" label="Puntos" value={stats.points || 0} />
                    <HudMetric tone="amber" glyph="★" label="Estrellas" value={stats.stars || 0} />
                    <HudMetric tone="emerald" glyph="✓" label="Presentes" value={stats.total_present || 0} />
                    <HudMetric tone="rose" glyph="⏱" label="Retardos" value={stats.total_lates || 0} />
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
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/60 bg-amber-400/15 text-amber-200 shadow-[0_0_22px_rgba(245,181,64,0.55)]"><Star size={30} fill="currentColor" /></div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-amber-200">NIVEL 1</p>
                    <p className="text-xs font-semibold text-white/65">Aprendiz en misión</p>
                    <div className="mt-2 h-2 rounded-full bg-violet-950"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 shadow-[0_0_12px_rgba(139,109,255,0.9)]" style={{ width: xpWidth }} /></div>
                    <p className="mt-1 text-xs font-black text-white/80">{xp} / 300 XP</p>
                </div>
            </div>
        </div>
    );
}

function HudMetric({ glyph, label, value, tone }) {
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
                <div className="grid h-16 w-16 place-items-center rounded-2xl border border-current/40 bg-black/25 text-3xl font-black shadow-[0_0_22px_currentColor]">{glyph}</div>
                <div><p className="text-4xl font-black italic text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]">{value}</p><p className="text-sm font-black">{label}</p></div>
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
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-white">{item.course_name}</p><p className="text-xs font-semibold text-violet-200/70">{item.date}</p></div>
                        <span className={`rounded-xl border px-4 py-2 text-xs font-black ${status[1]}`}>{status[0]}</span>
                    </div>
                );
            }) : <p className="rounded-2xl border border-violet-400/20 bg-white/[0.04] p-4 text-sm font-semibold text-violet-100/70">Aún no tienes asistencias registradas.</p>}
        </div>
    );
}

function MissionPanel({ title, action, onAction, children }) {
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-violet-300/30 bg-[#0d0828]/92 p-4 shadow-[0_0_38px_rgba(118,87,246,0.22)]">
            <HudCorners />
            <div className="mb-4 flex items-center justify-between gap-3">
                <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">Bitácora</p><h3 className="text-xl font-black text-white">{title}</h3></div>
                <button onClick={onAction} className="rounded-2xl border border-violet-300/30 bg-white/8 px-4 py-2 text-xs font-black text-violet-100">{action}</button>
            </div>
            <div className="space-y-3">{children}</div>
        </section>
    );
}

function ClassMission({ course, index, onOpen }) {
    const tones = ['violet', 'amber', 'emerald', 'rose'];
    const tone = tones[index % tones.length];
    return (
        <button onClick={onOpen} className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-[1.6rem] border bg-gradient-to-br ${missionTones[tone]} to-black/25 p-3 text-left shadow-xl`}>
            <div className="absolute -right-12 h-24 w-24 rounded-full bg-white/10 blur-lg group-hover:scale-125" />
            <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/30 bg-black/30 text-lg font-black text-white shadow-[0_0_16px_currentColor]">{course.code?.substring(0, 2) || 'C'}</div>
            <div className="relative min-w-0 flex-1">
                <p className="truncate text-base font-black text-white">{course.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-white/70"><Clock size={13} /> {course.schedule || 'Sin horario definido'}</p>
            </div>
            <span className="relative rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-black">Entrar</span>
        </button>
    );
}

function JoinCourseCard({ onClick }) {
    return (
        <button onClick={onClick} className="relative w-full overflow-hidden rounded-[2rem] border border-violet-300/35 bg-[#0d0828] p-5 text-left text-white shadow-[0_0_38px_rgba(118,87,246,0.26)]">
            <HudCorners small />
            <div className="absolute -right-10 -top-8 h-24 w-24 rounded-full bg-violet-400/25 blur-xl" />
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-violet-300">Nueva misión</p>
            <h3 className="mt-2 text-xl font-black">Agregarme a una clase</h3>
            <p className="mt-2 text-sm font-semibold text-violet-100/70">Ingresa el código que te dio tu profesor.</p>
            <div className="mt-5 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-center text-sm font-black text-white shadow-[0_0_24px_rgba(139,109,255,0.55)]">Unirme con código</div>
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
            const { data } = await api.post('/academic/attendance/self_checkin/', { session_id: open.session_id, code: code.trim().toUpperCase() });
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
        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-300/35 bg-[#061f1a]/95 p-5 text-white shadow-[0_0_38px_rgba(32,231,166,0.20)]">
            <HudCorners small />
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">Portal abierto</p>
            <h3 className="mt-1 text-xl font-black">Marcar asistencia</h3>
            <p className="mt-1 text-sm font-semibold text-emerald-100/70">{open.course_name}</p>
            <div className="mt-4 grid gap-2">
                <input value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="Código del profesor" className="rounded-2xl border border-emerald-200/25 bg-black/25 px-4 py-3 text-center font-black uppercase tracking-[0.18em] text-white outline-none placeholder:text-emerald-100/35 focus:ring-4 focus:ring-emerald-300/20" />
                <button onClick={submit} disabled={saving || !code.trim()} className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-3 text-sm font-black text-[#03120f] shadow-[0_0_24px_rgba(32,231,166,0.35)] disabled:opacity-60">
                    {saving ? 'Marcando...' : 'Estoy en clase ✓'}
                </button>
                {error && <p className="rounded-2xl border border-red-300/35 bg-red-500/15 px-3 py-2 text-center text-xs font-bold text-red-100">{error}</p>}
            </div>
        </section>
    );
}

function RewardCard({ reward, onClose }) {
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-amber-300/45 bg-[#1c102c] p-5 text-white shadow-[0_0_42px_rgba(245,181,64,0.30)]">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/25 blur-2xl" />
            <div className="relative flex items-center gap-4"><div className="animate-bounce text-5xl">{reward.icon}</div><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Recompensa</p><h3 className="mt-1 text-xl font-black">{reward.title}</h3><p className="mt-1 text-sm font-semibold text-white/75">{reward.message}</p></div></div>
            <button onClick={onClose} className="relative mt-4 w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-[#1b102c]">+{reward.points} puntos · Listo</button>
        </section>
    );
}

function RiskAlerts({ alerts }) {
    if (!alerts.length) return null;
    return (
        <section className="rounded-[2rem] border border-red-300/35 bg-red-500/10 p-4 text-red-100">
            <h3 className="mb-3 flex items-center gap-2 font-black"><AlertCircle size={18} /> Alertas</h3>
            <div className="space-y-2">{alerts.map((alert, index) => <div key={index} className="rounded-2xl border border-red-300/20 bg-black/20 p-3 text-sm"><p className="font-black">{alert.course_name}</p><p className="text-xs font-bold text-red-100/70">{alert.absences} inasistencias · límite {alert.limit}</p></div>)}</div>
        </section>
    );
}

function EmptyToday() {
    return (
        <div className="rounded-[1.6rem] border border-violet-300/20 bg-black/20 py-10 text-center text-violet-100/70">
            <Calendar size={42} className="mx-auto mb-3 opacity-50" />
            <p className="font-bold">No hay misiones programadas para hoy.</p>
        </div>
    );
}

function HudCorners({ small = false }) {
    const size = small ? 'h-4 w-4' : 'h-6 w-6';
    return (
        <>
            <span className={`absolute left-3 top-3 ${size} border-l border-t border-violet-300/50`} />
            <span className={`absolute right-3 top-3 ${size} border-r border-t border-violet-300/50`} />
            <span className={`absolute bottom-3 left-3 ${size} border-b border-l border-violet-300/50`} />
            <span className={`absolute bottom-3 right-3 ${size} border-b border-r border-violet-300/50`} />
        </>
    );
}
