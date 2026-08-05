/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Calendar, CheckCircle, FileText, Loader2, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function MyAbsences() {
    const navigate = useNavigate();
    const [absences, setAbsences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [selectedAbsence, setSelectedAbsence] = useState(null);
    const [excuseNote, setExcuseNote] = useState('');
    const [excuseFile, setExcuseFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchAbsences(); }, []);

    const fetchAbsences = async () => {
        try {
            const res = await api.get('/academic/attendance/all_my_absences/');
            setAbsences(res.data);
        } catch {
            setToast({ message: 'Error al cargar faltas', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedAbsence(null);
        setExcuseNote('');
        setExcuseFile(null);
    };

    const handleExcuseSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        const formData = new FormData();
        formData.append('attendance_id', selectedAbsence.id);
        formData.append('excuse_note', excuseNote);
        if (excuseFile) formData.append('excuse_file', excuseFile);
        try {
            await api.post('/academic/attendance/submit_excuse/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setToast({ message: 'Excusa enviada correctamente', type: 'success' });
            closeModal();
            fetchAbsences();
        } catch (error) {
            setToast({ message: error.response?.data?.error || 'Error al enviar excusa', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <GameLoading />;

    return (
        <section className="relative min-h-full overflow-hidden bg-[#050219] px-4 pb-28 pt-5 text-white md:px-8 md:pb-10">
            <GameBackdrop />
            <div className="relative mx-auto w-full max-w-md space-y-5 md:max-w-5xl">
                {toast && <Toast {...toast} onClose={() => setToast(null)} />}
                <header className="relative overflow-hidden rounded-[2.2rem] border border-violet-300/35 bg-[#10072e]/90 p-5 shadow-[0_0_60px_rgba(118,87,246,0.32)]">
                    <HudCorners />
                    <button onClick={() => navigate(-1)} className="mb-4 grid h-11 w-11 place-items-center rounded-2xl border border-violet-300/25 bg-white/8 text-violet-100">
                        <ArrowLeft size={22} />
                    </button>
                    <p className="text-[11px] font-black uppercase tracking-[0.32em] text-violet-200">Registro de eventos</p>
                    <h1 className="mt-2 text-4xl font-black italic leading-none drop-shadow-[0_0_16px_rgba(139,109,255,0.9)]">Faltas y retardos</h1>
                    <p className="mt-3 text-sm font-semibold text-violet-100/70">Gestiona excusas y mantén limpia tu racha de asistencia.</p>
                </header>

                <section className="relative overflow-hidden rounded-[2rem] border border-violet-300/30 bg-[#0d0828]/92 p-5 shadow-[0_0_38px_rgba(118,87,246,0.22)]">
                    <HudCorners />
                    {absences.length ? (
                        <div className="space-y-3">
                            {absences.map(absence => (
                                <AbsenceCard key={absence.id} absence={absence} onExcuse={() => setSelectedAbsence(absence)} onOpen={() => navigate(`/classes/${absence.course_id}`)} />
                            ))}
                        </div>
                    ) : <CleanRecord />}
                </section>

                {selectedAbsence && (
                    <ExcuseModal
                        absence={selectedAbsence}
                        note={excuseNote}
                        setNote={setExcuseNote}
                        setFile={setExcuseFile}
                        file={excuseFile}
                        submitting={submitting}
                        onClose={closeModal}
                        onSubmit={handleExcuseSubmit}
                    />
                )}
            </div>
        </section>
    );
}

function AbsenceCard({ absence, onExcuse, onOpen }) {
    const absent = absence.status === 'ABSENT';
    return (
        <div className={`rounded-[1.5rem] border p-4 ${absent ? 'border-rose-300/35 bg-rose-500/10 text-rose-100' : 'border-amber-300/35 bg-amber-500/10 text-amber-100'}`}>
            <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-current/35 bg-black/25 text-xl font-black shadow-[0_0_16px_currentColor]">{absent ? '!' : '⏱'}</div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">{absence.status_label}</p>
                    <h3 className="truncate text-lg font-black text-white">{absence.course_name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-white/65"><Calendar size={13} /> {absence.date}</p>
                </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {!absence.has_excuse ? (
                    <button onClick={onExcuse} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-[#7657f6]">
                        <Upload size={15} /> Gestionar excusa
                    </button>
                ) : (
                    <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-black">
                        <FileText size={15} /> {absence.excuse_status_label || 'Excusa enviada'}
                    </div>
                )}
                <button onClick={onOpen} className="grid h-11 place-items-center rounded-2xl border border-white/20 bg-black/20 px-4 text-xs font-black text-white sm:w-14">
                    <BookOpen size={18} />
                </button>
            </div>
        </div>
    );
}

function CleanRecord() {
    return (
        <div className="rounded-[1.8rem] border border-emerald-300/25 bg-emerald-500/10 p-10 text-center text-emerald-100">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.6rem] border border-emerald-300/40 bg-black/25 shadow-[0_0_24px_rgba(32,231,166,.35)]">
                <CheckCircle size={42} />
            </div>
            <h2 className="mt-5 text-3xl font-black italic text-white">¡Todo al día!</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-emerald-100/70">No tienes inasistencias ni retardos registrados en el periodo seleccionado.</p>
        </div>
    );
}

function ExcuseModal({ absence, note, setNote, file, setFile, submitting, onClose, onSubmit }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur" onClick={() => !submitting && onClose()}>
            <form onSubmit={onSubmit} className="w-full max-w-md rounded-[2rem] border border-violet-300/35 bg-[#10072e] p-5 text-white shadow-2xl" onClick={event => event.stopPropagation()}>
                <div className="flex items-start justify-between">
                    <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">Justificación</p><h3 className="text-2xl font-black">Enviar excusa</h3></div>
                    <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10"><X size={18} /></button>
                </div>
                <p className="mt-3 text-sm font-semibold text-violet-100/70">{absence.course_name} · {absence.date}</p>
                <textarea required rows="3" value={note} onChange={event => setNote(event.target.value)} placeholder="Explica brevemente..." className="mt-4 w-full rounded-2xl border border-violet-300/25 bg-black/25 p-3 text-sm outline-none focus:ring-4 focus:ring-violet-300/20" />
                <input type="file" onChange={event => setFile(event.target.files[0])} className="mt-3 w-full text-sm text-violet-100 file:mr-3 file:rounded-full file:border-0 file:bg-violet-500 file:px-4 file:py-2 file:text-sm file:font-black file:text-white" />
                {file && <p className="mt-2 text-xs font-bold text-violet-100/70">{file.name}</p>}
                <button type="submit" disabled={submitting} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
                    {submitting && <Loader2 size={18} className="animate-spin" />} Enviar excusa
                </button>
            </form>
        </div>
    );
}

function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);
    return <div className={`fixed bottom-6 right-6 z-[100] rounded-2xl px-5 py-3 text-sm font-black text-white shadow-2xl ${type === 'error' ? 'bg-rose-600' : 'bg-emerald-500'}`}>{message}</div>;
}

function GameLoading() {
    return (
        <section className="relative grid min-h-full place-items-center overflow-hidden bg-[#050219] px-6 py-24 text-white">
            <GameBackdrop />
            <div className="relative rounded-[2rem] border border-violet-300/35 bg-[#10072e]/90 p-8 text-center shadow-[0_0_55px_rgba(118,87,246,0.38)]">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.6rem] border border-violet-300/45 bg-black/25 text-3xl shadow-[0_0_24px_rgba(139,109,255,0.55)]"><span className="animate-pulse">✦</span></div>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.28em] text-violet-300">Cargando eventos</p>
            </div>
        </section>
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

function HudCorners() {
    return (
        <>
            <span className="absolute left-3 top-3 h-6 w-6 border-l border-t border-violet-300/50" />
            <span className="absolute right-3 top-3 h-6 w-6 border-r border-t border-violet-300/50" />
            <span className="absolute bottom-3 left-3 h-6 w-6 border-b border-l border-violet-300/50" />
            <span className="absolute bottom-3 right-3 h-6 w-6 border-b border-r border-violet-300/50" />
        </>
    );
}
