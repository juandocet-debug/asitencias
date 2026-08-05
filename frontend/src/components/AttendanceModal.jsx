import React, { useState } from 'react';
import { Check, X, Search, Save, Loader2, Users, User, Clock } from 'lucide-react';
import { useAttendanceModal } from '../hooks/useAttendanceModal';
import StudentAttendanceCard from './attendance/StudentAttendanceCard';
import { statusConfig } from './attendance/statusConfig';
import api from '../services/api';

export default function AttendanceModal({ isOpen, onClose, courseId, students = [], getMediaUrl, onSaved, initialDate }) {
    const [checkin, setCheckin] = useState(null);
    const [openingCheckin, setOpeningCheckin] = useState(false);
    const {
        attendanceData, attendanceDate, setAttendanceDate, isExistingSession, loadingSession,
        mode, setMode, timeRanges, setTimeRanges,
        searchTerm, setSearchTerm, filtered, paginated,
        toggleStatus, markAll, counts,
        savingAttendance, handleSave, getCurrentTime, getAutoStatus,
    } = useAttendanceModal({ isOpen, courseId, students, initialDate });

    if (!isOpen) return null;

    const autoStatus = mode === 'auto' ? getAutoStatus() : null;
    const autoConf = autoStatus ? statusConfig[autoStatus] : null;

    const handleSaveClick = async () => {
        try {
            await handleSave();
            onSaved?.(`Asistencia ${isExistingSession ? 'actualizada' : 'guardada'} correctamente`, 'success');
            onClose();
        } catch {
            onSaved?.('Error al guardar asistencia', 'error');
        }
    };

    const openStudentCheckin = async () => {
        setOpeningCheckin(true);
        try {
            const { data } = await api.post('/academic/attendance/open_self_checkin/', {
                course_id: courseId,
                minutes: 10,
            });
            setCheckin(data);
            onSaved?.('Ventana de asistencia abierta para estudiantes', 'success');
        } catch {
            onSaved?.('No se pudo abrir la asistencia para estudiantes', 'error');
        } finally {
            setOpeningCheckin(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-md sm:items-center" onClick={onClose}>
            <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#f7f8fc] shadow-2xl sm:mx-4 sm:h-[92vh] sm:max-w-5xl sm:rounded-[2rem]" onClick={e => e.stopPropagation()}>
                <ModalHeader
                    isExistingSession={isExistingSession}
                    students={students}
                    mode={mode}
                    attendanceDate={attendanceDate}
                    setAttendanceDate={setAttendanceDate}
                    onClose={onClose}
                />

                <ModeBar
                    mode={mode}
                    setMode={setMode}
                    markAll={markAll}
                    checkin={checkin}
                    openingCheckin={openingCheckin}
                    onOpenCheckin={openStudentCheckin}
                />
                {checkin && <CheckinFeedback checkin={checkin} />}

                {mode === 'auto' && (
                    <AutoTimeBar
                        timeRanges={timeRanges}
                        setTimeRanges={setTimeRanges}
                        currentTime={getCurrentTime()}
                        autoConf={autoConf}
                    />
                )}

                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

                <div className="flex-1 overflow-y-auto bg-[#f7f8fc] p-3 sm:p-5">
                    {loadingSession ? (
                        <div className="grid h-32 place-items-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[#7657f6]" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {paginated.map(student => (
                                    <StudentAttendanceCard
                                        key={student.id}
                                        student={student}
                                        status={attendanceData[student.id]}
                                        onToggle={toggleStatus}
                                        getMediaUrl={getMediaUrl}
                                    />
                                ))}
                            </div>
                            {filtered.length === 0 && (
                                <div className="py-16 text-center text-slate-400">
                                    <Users size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="font-bold">No se encontraron estudiantes</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <ModalFooter counts={counts} onClose={onClose} onSave={handleSaveClick} saving={savingAttendance} loading={loadingSession} isExistingSession={isExistingSession} />
            </div>
        </div>
    );
}

function ModalHeader({ isExistingSession, students, mode, attendanceDate, setAttendanceDate, onClose }) {
    return (
        <div className="flex flex-shrink-0 items-center justify-between bg-gradient-to-br from-[#8b6dff] to-[#7657f6] px-4 py-4 text-white sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-white/20"><Check size={18} /></div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-black">{isExistingSession ? 'Editar Asistencia' : 'Llamar Asistencia'}</h3>
                        {isExistingSession && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-950">EDITANDO</span>}
                    </div>
                    <p className="text-xs font-semibold text-white/70">{students.length} participantes · {mode === 'manual' ? 'Manual' : 'Por horario'}</p>
                </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
                <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-[118px] rounded-xl border border-white/30 bg-white/15 px-2 py-2 text-xs font-bold text-white outline-none [color-scheme:dark] sm:w-auto" />
                <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-white/15"><X size={18} /></button>
            </div>
        </div>
    );
}

function ModeBar({ mode, setMode, markAll, checkin, openingCheckin, onOpenCheckin }) {
    return (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
                <ModeButton active={mode === 'manual'} onClick={() => setMode('manual')} icon={<User size={13} />}>Manual</ModeButton>
                <ModeButton active={mode === 'auto'} onClick={() => setMode('auto')} icon={<Clock size={13} />}>Por Horario</ModeButton>
            </div>
            {mode === 'manual' ? (
                <div className="ml-auto flex gap-2">
                    <button onClick={() => markAll('PRESENT')} className="rounded-xl bg-emerald-100 px-3 py-2 text-[11px] font-black text-emerald-700">✓ Todos</button>
                    <button onClick={() => markAll('ABSENT')} className="rounded-xl bg-red-100 px-3 py-2 text-[11px] font-black text-red-700">× Ninguno</button>
                </div>
            ) : (
                <button onClick={() => markAll('ABSENT')} className="ml-auto rounded-xl bg-slate-200 px-3 py-2 text-[11px] font-black text-slate-600">Reiniciar</button>
            )}
            <button onClick={onOpenCheckin} disabled={openingCheckin} className="w-full rounded-2xl bg-[#2a2147] px-4 py-3 text-xs font-black text-white shadow-lg shadow-violet-100 disabled:opacity-60 sm:w-auto">
                {openingCheckin ? 'Abriendo...' : checkin ? `Abierto · ${checkin.code}` : 'Abrir para estudiantes'}
            </button>
        </div>
    );
}

function CheckinFeedback({ checkin }) {
    const expiresAt = new Date(checkin.expires_at).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="flex-shrink-0 border-b border-violet-100 bg-[#f0edff] px-4 py-3 sm:px-6">
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7657f6]">Ventana abierta</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl bg-[#2a2147] px-5 py-3 text-2xl font-black tracking-[0.24em] text-white">
                        {checkin.code}
                    </div>
                    <p className="text-sm font-bold text-slate-600">
                        Muéstralo en clase. Cierra a las <span className="text-[#7657f6]">{expiresAt}</span>.
                    </p>
                </div>
            </div>
        </div>
    );
}

function ModeButton({ active, onClick, icon, children }) {
    return (
        <button onClick={onClick} className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition ${active ? 'bg-[#7657f6] text-white shadow-md shadow-violet-100' : 'text-slate-500'}`}>
            {icon}{children}
        </button>
    );
}

function AutoTimeBar({ timeRanges, setTimeRanges, currentTime, autoConf }) {
    const ranges = [
        ['present', 'Presente', 'emerald', timeRanges.present],
        ['late', 'Retardo', 'amber', timeRanges.late],
    ];

    return (
        <div className="flex-shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="grid grid-cols-2 gap-2">
                {ranges.map(([key, label, color, range]) => (
                    <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className={`mb-2 text-[10px] font-black uppercase tracking-widest ${color === 'emerald' ? 'text-emerald-700' : 'text-amber-700'}`}>{label}</p>
                        <div className="grid grid-cols-2 gap-2">
                            <input type="time" value={range.start} onChange={e => setTimeRanges(p => ({ ...p, [key]: { ...p[key], start: e.target.value } }))} className="min-w-0 rounded-xl bg-white px-2 py-2 text-xs font-bold" />
                            <input type="time" value={range.end} onChange={e => setTimeRanges(p => ({ ...p, [key]: { ...p[key], end: e.target.value } }))} className="min-w-0 rounded-xl bg-white px-2 py-2 text-xs font-bold" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-black text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-[#7657f6]" /> {currentTime}
                {autoConf && <span className={`rounded-full px-2.5 py-1 ${autoConf.badge}`}>{autoConf.icon} {autoConf.label}</span>}
            </div>
        </div>
    );
}

function SearchBar({ searchTerm, setSearchTerm }) {
    return (
        <div className="flex-shrink-0 border-b border-slate-100 bg-white px-4 py-3 sm:px-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por nombre o documento..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none focus:ring-4 focus:ring-violet-100" />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={16} /></button>}
            </div>
        </div>
    );
}

function ModalFooter({ counts, onClose, onSave, saving, loading, isExistingSession }) {
    return (
        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6">
            <div className="mb-3 flex items-center justify-center gap-5">
                <Counter color="bg-emerald-500" value={counts.present} />
                <Counter color="bg-red-500" value={counts.absent} />
                <Counter color="bg-amber-500" value={counts.late} />
            </div>
            <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 rounded-2xl border-2 border-slate-200 px-5 py-3 text-sm font-black text-slate-600 sm:flex-none">Cancelar</button>
                <button onClick={onSave} disabled={saving || loading} className="flex-[2] rounded-2xl bg-gradient-to-br from-[#8b6dff] to-[#7657f6] px-5 py-3 text-sm font-black text-white shadow-xl shadow-violet-200 disabled:opacity-60 sm:flex-1">
                    {saving ? 'Guardando...' : isExistingSession ? 'Actualizar' : 'Guardar'}
                    {saving ? null : <Save size={16} className="ml-2 inline" />}
                </button>
            </div>
        </div>
    );
}

function Counter({ color, value }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-full ${color}`} />
            <span className="text-xs font-black text-slate-700">{value}</span>
        </div>
    );
}







