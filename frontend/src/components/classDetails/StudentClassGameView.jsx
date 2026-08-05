import React, { useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle, Clock, FileText, Upload, X, Zap } from 'lucide-react';
import api from '../../services/api';

export default function StudentClassGameView({ course, checkins, myAbsences, onBack, onDone, onExcuseSubmitted, showToast }) {
    return (
        <section className="relative min-h-full overflow-hidden bg-[#050219] px-4 pb-28 pt-5 text-white md:px-8 md:pb-10">
            <GameBackdrop />
            <div className="relative mx-auto w-full max-w-md space-y-5 md:max-w-5xl">
                <header className="relative overflow-hidden rounded-[2.2rem] border border-violet-300/35 bg-[#10072e]/90 p-5 shadow-[0_0_60px_rgba(118,87,246,0.32)]">
                    <HudCorners />
                    <button onClick={onBack} className="mb-4 grid h-11 w-11 place-items-center rounded-2xl border border-violet-300/25 bg-white/8 text-violet-100">
                        <ArrowLeft size={22} />
                    </button>
                    <p className="text-[11px] font-black uppercase tracking-[0.32em] text-violet-200">Misión de clase</p>
                    <h1 className="mt-2 text-4xl font-black italic leading-none drop-shadow-[0_0_16px_rgba(139,109,255,0.9)]">{course.name}</h1>
                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-violet-100/70">
                        <Calendar size={15} /> Temporada {course.year}-{course.period}
                    </p>
                    <div className="mt-5 rounded-2xl border border-violet-300/25 bg-black/25 px-4 py-3 font-mono text-xl font-black tracking-[0.18em] text-violet-100">
                        #{course.code}
                    </div>
                </header>

                <div className="grid gap-5 lg:grid-cols-[0.95fr_1.2fr]">
                    <StudentClassCheckin checkins={checkins} onDone={onDone} showToast={showToast} />
                    <AbsenceHud myAbsences={myAbsences} onExcuseSubmitted={onExcuseSubmitted} showToast={showToast} />
                </div>
            </div>
        </section>
    );
}

function StudentClassCheckin({ checkins, onDone, showToast }) {
    const [code, setCode] = useState('');
    const [reward, setReward] = useState(null);
    const [saving, setSaving] = useState(false);
    const open = checkins.find(item => !item.already_marked);

    const submit = async () => {
        if (!code.trim() || !open) return;
        setSaving(true);
        try {
            const { data } = await api.post('/academic/attendance/self_checkin/', {
                session_id: open.session_id,
                code: code.trim().toUpperCase(),
            });
            setCode('');
            setReward(data.reward);
            showToast('Asistencia registrada correctamente', 'success');
            onDone?.();
        } catch (error) {
            showToast(error.response?.data?.error || 'No se pudo registrar la asistencia', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (reward) return <RewardCard reward={reward} onClose={() => setReward(null)} />;

    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-300/35 bg-[#061f1a]/95 p-5 shadow-[0_0_38px_rgba(32,231,166,0.20)]">
            <HudCorners small />
            <div className="grid h-16 w-16 place-items-center rounded-[1.3rem] border border-emerald-200/40 bg-black/30 text-emerald-200 shadow-[0_0_20px_rgba(32,231,166,.35)]">
                <Zap size={30} fill="currentColor" />
            </div>
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">{open ? 'Portal abierto' : 'Portal cerrado'}</p>
            <h2 className="mt-1 text-2xl font-black italic">{open ? 'Estoy en clase' : 'Sin asistencia activa'}</h2>
            <p className="mt-2 text-sm font-semibold text-emerald-100/70">
                {open ? 'Escribe el código del profesor para reclamar tus puntos.' : 'Cuando el profesor abra asistencia aparecerá aquí.'}
            </p>
            {open && (
                <div className="mt-5 grid gap-2">
                    <input value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="CÓDIGO" className="rounded-2xl border border-emerald-200/25 bg-black/25 px-4 py-3 text-center font-black uppercase tracking-[0.18em] text-white outline-none placeholder:text-emerald-100/35 focus:ring-4 focus:ring-emerald-300/20" />
                    <button onClick={submit} disabled={saving || !code.trim()} className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-3 text-sm font-black text-[#03120f] shadow-[0_0_24px_rgba(32,231,166,0.35)] disabled:opacity-60">
                        {saving ? 'Marcando...' : 'Marcar asistencia ✓'}
                    </button>
                </div>
            )}
        </section>
    );
}

function AbsenceHud({ myAbsences, onExcuseSubmitted, showToast }) {
    const [selectedAbsence, setSelectedAbsence] = useState(null);
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-violet-300/30 bg-[#0d0828]/92 p-5 shadow-[0_0_38px_rgba(118,87,246,0.22)]">
            <HudCorners />
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-violet-300">Seguimiento</p>
            <h2 className="mt-1 text-2xl font-black italic">Faltas y retardos</h2>
            <div className="mt-5 space-y-3">
                {myAbsences.length ? myAbsences.map(att => (
                    <AbsenceRow key={att.id} att={att} onExcuse={() => setSelectedAbsence(att)} />
                )) : <CleanRecord />}
            </div>
            {selectedAbsence && (
                <ExcuseModal
                    absence={selectedAbsence}
                    onClose={() => setSelectedAbsence(null)}
                    onDone={() => { setSelectedAbsence(null); onExcuseSubmitted?.(); }}
                    showToast={showToast}
                />
            )}
        </section>
    );
}

function AbsenceRow({ att, onExcuse }) {
    const absent = att.status === 'ABSENT';
    return (
        <div className={`rounded-[1.4rem] border p-4 ${absent ? 'border-rose-300/35 bg-rose-500/10 text-rose-100' : 'border-amber-300/35 bg-amber-500/10 text-amber-100'}`}>
            <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-current/35 bg-black/25 text-lg font-black">{absent ? '!' : '⏱'}</div>
                <div className="min-w-0 flex-1">
                    <p className="font-black">{att.status_label} · {att.date}</p>
                    <p className="text-xs font-semibold text-white/62">Excusa: {att.excuse_status_label || 'Sin excusa'}</p>
                </div>
            </div>
            {!att.has_excuse ? (
                <button onClick={onExcuse} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-[#7657f6]">
                    <Upload size={15} /> Enviar excusa
                </button>
            ) : (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-black">
                    <FileText size={15} /> Excusa enviada
                </div>
            )}
        </div>
    );
}

function ExcuseModal({ absence, onClose, onDone, showToast }) {
    const [note, setNote] = useState('');
    const [file, setFile] = useState(null);

    const submit = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('attendance_id', absence.id);
        formData.append('excuse_note', note);
        if (file) formData.append('excuse_file', file);
        try {
            await api.post('/academic/attendance/submit_excuse/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            showToast('Excusa enviada correctamente', 'success');
            onDone();
        } catch (error) {
            showToast(error.response?.data?.error || 'Error al enviar excusa', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur" onClick={onClose}>
            <form onSubmit={submit} className="w-full max-w-md rounded-[2rem] border border-violet-300/35 bg-[#10072e] p-5 text-white shadow-2xl" onClick={event => event.stopPropagation()}>
                <div className="flex items-start justify-between">
                    <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">Justificación</p><h3 className="text-2xl font-black">Enviar excusa</h3></div>
                    <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10"><X size={18} /></button>
                </div>
                <p className="mt-3 text-sm font-semibold text-violet-100/70">Falta del día <b>{absence.date}</b>.</p>
                <textarea required rows="3" value={note} onChange={event => setNote(event.target.value)} placeholder="Explica brevemente..." className="mt-4 w-full rounded-2xl border border-violet-300/25 bg-black/25 p-3 text-sm outline-none focus:ring-4 focus:ring-violet-300/20" />
                <input type="file" onChange={event => setFile(event.target.files[0])} className="mt-3 w-full text-sm text-violet-100 file:mr-3 file:rounded-full file:border-0 file:bg-violet-500 file:px-4 file:py-2 file:text-sm file:font-black file:text-white" />
                <button type="submit" className="mt-4 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-black text-white">Enviar excusa</button>
            </form>
        </div>
    );
}

function RewardCard({ reward, onClose }) {
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-amber-300/45 bg-[#1c102c] p-5 shadow-[0_0_42px_rgba(245,181,64,0.30)]">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/25 blur-2xl" />
            <div className="relative flex items-center gap-4"><div className="animate-bounce text-5xl">{reward.icon}</div><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Recompensa</p><h3 className="mt-1 text-xl font-black">{reward.title}</h3><p className="mt-1 text-sm font-semibold text-white/75">{reward.message}</p></div></div>
            <button onClick={onClose} className="relative mt-4 w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-[#1b102c]">+{reward.points} puntos · Listo</button>
        </section>
    );
}

function CleanRecord() {
    return (
        <div className="rounded-[1.6rem] border border-emerald-300/25 bg-emerald-500/10 p-8 text-center text-emerald-100">
            <CheckCircle size={44} className="mx-auto mb-3" />
            <p className="text-xl font-black">¡Excelente!</p>
            <p className="text-sm font-semibold text-emerald-100/70">No tienes faltas ni retardos registrados.</p>
        </div>
    );
}

function GameBackdrop() {
    return (
        <>
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_7%,rgba(139,109,255,0.42),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(255,198,76,0.18),transparent_24%),linear-gradient(180deg,#120934_0%,#06021a_52%,#03010d_100%)]" />
            <div className="pointer-events-none fixed inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(139,109,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(139,109,255,.35)_1px,transparent_1px)] [background-size:42px_42px]" />
        </>
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
