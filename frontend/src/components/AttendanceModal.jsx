/* eslint-disable */
// components/AttendanceModal.jsx  —  componente delgado (~130 líneas)
// Toda la lógica vive en hooks/useAttendanceModal.js
// Nueva feature: al cambiar fecha, carga asistencia existente del backend.

import React from 'react';
import { Check, X, Search, Save, Loader2, Users, User, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAttendanceModal } from '../hooks/useAttendanceModal';
import StudentAttendanceCard, { statusConfig } from './attendance/StudentAttendanceCard';

export default function AttendanceModal({ isOpen, onClose, courseId, students = [], getMediaUrl, onSaved, initialDate }) {
    const {
        attendanceData, attendanceDate, setAttendanceDate, isExistingSession, loadingSession,
        mode, setMode, timeRanges, setTimeRanges,
        searchTerm, setSearchTerm, currentPage, setCurrentPage,
        filtered, paginated, totalPages,
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

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="bg-white w-full sm:rounded-2xl sm:max-w-5xl sm:mx-4 h-[100dvh] sm:h-[92vh] flex flex-col shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
                style={{ animation: 'slideUp .3s ease' }}>

                {/* ── HEADER ── */}
                <div className="bg-gradient-to-r from-upn-600 to-upn-700 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><Check size={18} /></div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm sm:text-base truncate">
                                    {isExistingSession ? 'Editar Asistencia' : 'Llamar Asistencia'}
                                </h3>
                                {isExistingSession && (
                                    <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-black rounded-full flex-shrink-0">EDITANDO</span>
                                )}
                            </div>
                            <p className="text-[10px] sm:text-xs text-white/70">
                                {students.length} participantes · {mode === 'manual' ? 'Modo Manual' : 'Modo Horario'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <input type="date" value={attendanceDate}
                            onChange={e => setAttendanceDate(e.target.value)}
                            className="px-2 py-1.5 bg-white/15 border border-white/30 rounded-lg text-xs font-medium focus:outline-none text-white w-[115px] sm:w-auto [color-scheme:dark]" />
                        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"><X size={18} /></button>
                    </div>
                </div>

                {/* ── MODE TOGGLE ── */}
                <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-3 flex-shrink-0 flex-wrap">
                    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                        {['manual', 'auto'].map(m => (
                            <button key={m} onClick={() => setMode(m)}
                                className={`py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${mode === m ? 'bg-upn-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                                {m === 'manual' ? <><User size={13} /> Manual</> : <><Clock size={13} /> Por Horario</>}
                            </button>
                        ))}
                    </div>
                    {mode === 'manual' && (
                        <div className="flex gap-1.5 ml-auto">
                            <button onClick={() => markAll('PRESENT')} className="px-3 py-1.5 text-[11px] font-bold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 active:scale-95">✓ Todos</button>
                            <button onClick={() => markAll('ABSENT')} className="px-3 py-1.5 text-[11px] font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 active:scale-95">✗ Ninguno</button>
                        </div>
                    )}
                    {mode === 'auto' && (
                        <button onClick={() => markAll('ABSENT')} className="px-3 py-1.5 text-[11px] font-bold bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 active:scale-95 ml-auto">↺ Reiniciar</button>
                    )}
                </div>

                {/* ── TIME RANGES (auto) ── */}
                {mode === 'auto' && (
                    <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-gradient-to-r from-indigo-50/80 to-upn-50/80 flex-shrink-0">
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                {
                                    key: 'present', color: 'emerald', label: 'Presente',
                                    start: timeRanges.present.start, end: timeRanges.present.end,
                                    onStart: v => setTimeRanges(p => ({ ...p, present: { ...p.present, start: v } })),
                                    onEnd: v => setTimeRanges(p => ({ ...p, present: { ...p.present, end: v }, late: { ...p.late, start: v } }))
                                },
                                {
                                    key: 'late', color: 'amber', label: 'Retardo',
                                    start: timeRanges.late.start, end: timeRanges.late.end,
                                    onStart: v => setTimeRanges(p => ({ ...p, late: { ...p.late, start: v } })),
                                    onEnd: v => setTimeRanges(p => ({ ...p, late: { ...p.late, end: v } }))
                                },
                            ].map(({ key, color, label, start, end, onStart, onEnd }) => (
                                <div key={key} className={`bg-white rounded-xl p-2.5 border border-${color}-200 shadow-sm`}>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <span className={`w-2 h-2 rounded-full bg-${color}-500`} />
                                        <span className={`text-[10px] font-black text-${color}-700 uppercase tracking-wider`}>{label}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <input type="time" value={start} onChange={e => onStart(e.target.value)}
                                            className={`flex-1 text-xs font-mono bg-${color}-50 rounded px-1 py-0.5 border-0 focus:ring-1 focus:ring-${color}-300 min-w-0`} />
                                        <span className="text-[10px] text-slate-400">-</span>
                                        <input type="time" value={end} onChange={e => onEnd(e.target.value)}
                                            className={`flex-1 text-xs font-mono bg-${color}-50 rounded px-1 py-0.5 border-0 focus:ring-1 focus:ring-${color}-300 min-w-0`} />
                                    </div>
                                </div>
                            ))}
                            <div className="bg-white rounded-xl p-2.5 border border-red-200 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-[10px] font-black text-red-700 uppercase tracking-wider">Falta</span>
                                </div>
                                <p className="text-xs font-mono text-red-600">+{timeRanges.late.end}</p>
                            </div>
                        </div>
                        <div className="mt-2.5 flex items-center justify-center gap-2.5">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-upn-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-upn-500" />
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-700">{getCurrentTime()}</span>
                            <span className="text-slate-300">→</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${autoConf?.badge}`}>{autoConf?.icon} {autoConf?.label}</span>
                        </div>
                    </div>
                )}

                {/* ── SEARCH ── */}
                <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Buscar por nombre o documento..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-200" />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={16} /></button>}
                    </div>
                </div>

                {/* ── STUDENT GRID ── */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50/80">
                    {loadingSession ? (
                        <div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-upn-600" /></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                                {paginated.map(student => (
                                    <StudentAttendanceCard
                                        key={student.id} student={student}
                                        status={attendanceData[student.id]}
                                        onToggle={toggleStatus} getMediaUrl={getMediaUrl}
                                    />
                                ))}
                            </div>
                            {filtered.length === 0 && (
                                <div className="text-center py-16 text-slate-400">
                                    <Users size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="font-medium">No se encontraron estudiantes</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── PAGINATION ── */}
                {totalPages > 1 && (
                    <div className="px-4 sm:px-6 py-2 border-t border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
                        <span className="text-[11px] text-slate-400">Pág. {currentPage}/{totalPages} · {filtered.length}</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={16} /></button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((page, idx, arr) => (
                                    <React.Fragment key={page}>
                                        {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-slate-300 text-xs px-0.5">…</span>}
                                        <button onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === page ? 'bg-upn-600 text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                            {page}
                                        </button>
                                    </React.Fragment>
                                ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}

                {/* ── FOOTER ── */}
                <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-white flex-shrink-0">
                    <div className="flex items-center justify-center gap-4 mb-3">
                        {[['bg-emerald-500', counts.present, 'presentes'], ['bg-red-500', counts.absent, 'ausentes'], ['bg-amber-500', counts.late, 'tarde']].map(([color, count, label]) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <span className={`w-3 h-3 rounded-full ${color}`} />
                                <span className="text-xs font-bold text-slate-700">{count}</span>
                                <span className="text-[10px] text-slate-400 hidden sm:inline">{label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="flex-1 sm:flex-none py-2.5 px-5 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 active:scale-[0.97]">Cancelar</button>
                        <button onClick={handleSaveClick} disabled={savingAttendance || loadingSession}
                            className="flex-[2] sm:flex-1 py-2.5 px-5 bg-gradient-to-r from-upn-600 to-upn-700 text-white rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97]">
                            {savingAttendance ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {savingAttendance ? 'Guardando...' : isExistingSession ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
            <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity:0 } to { transform: translateY(0); opacity:1 } }`}</style>
        </div>
    );
}
