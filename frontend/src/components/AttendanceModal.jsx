/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Search, Save, Loader2, CheckCircle, AlertCircle, User, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const STUDENTS_PER_PAGE = 20;

/* ═══════════ STATUS UTILS ═══════════ */
const statusConfig = {
    PRESENT: {
        bg: 'bg-gradient-to-br from-emerald-50 to-green-100',
        border: 'border-emerald-300',
        text: 'text-emerald-800',
        badge: 'bg-emerald-500 text-white',
        label: 'Presente',
        icon: '✓',
    },
    ABSENT: {
        bg: 'bg-gradient-to-br from-red-50 to-rose-100',
        border: 'border-red-300',
        text: 'text-red-800',
        badge: 'bg-red-500 text-white',
        label: 'Ausente',
        icon: '✗',
    },
    LATE: {
        bg: 'bg-gradient-to-br from-amber-50 to-yellow-100',
        border: 'border-amber-300',
        text: 'text-amber-800',
        badge: 'bg-amber-500 text-white',
        label: 'Tarde',
        icon: '⏱',
    },
};

const getConfig = (status) => statusConfig[status] || statusConfig.PRESENT;

export default function AttendanceModal({
    isOpen,
    onClose,
    students = [],
    attendanceData,
    setAttendanceData,
    attendanceDate,
    setAttendanceDate,
    onSave,
    savingAttendance,
    getMediaUrl
}) {
    const [mode, setMode] = useState('manual');
    const [timeRanges, setTimeRanges] = useState({
        present: { start: '07:00', end: '07:20' },
        late: { start: '07:20', end: '07:40' },
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [clockTick, setClockTick] = useState(0);

    useEffect(() => {
        if (isOpen) { setCurrentPage(1); setSearchTerm(''); setMode('manual'); }
    }, [isOpen]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    useEffect(() => {
        if (mode !== 'auto' || !isOpen) return;
        const interval = setInterval(() => setClockTick(t => t + 1), 10000);
        return () => clearInterval(interval);
    }, [mode, isOpen]);

    /* ─── Time helpers ─── */
    const getCurrentTime = () => {
        const n = new Date();
        return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
    };

    const getAutoStatus = () => {
        const ct = getCurrentTime();
        if (ct >= timeRanges.present.start && ct < timeRanges.present.end) return 'PRESENT';
        if (ct >= timeRanges.late.start && ct < timeRanges.late.end) return 'LATE';
        return 'ABSENT';
    };

    /* ─── Filter + Paginate ─── */
    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return students;
        const t = searchTerm.toLowerCase();
        return students.filter(s =>
            s.first_name?.toLowerCase().includes(t) ||
            s.last_name?.toLowerCase().includes(t) ||
            s.document_number?.includes(t)
        );
    }, [students, searchTerm]);

    const totalPages = Math.ceil(filtered.length / STUDENTS_PER_PAGE);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * STUDENTS_PER_PAGE;
        return filtered.slice(start, start + STUDENTS_PER_PAGE);
    }, [filtered, currentPage]);

    /* ─── Toggle ─── */
    const toggleStatus = (studentId) => {
        if (mode === 'auto') {
            setAttendanceData(prev => {
                const current = prev[studentId];
                if (current === 'PRESENT' || current === 'LATE') return { ...prev, [studentId]: 'ABSENT' };
                return { ...prev, [studentId]: getAutoStatus() };
            });
        } else {
            setAttendanceData(prev => {
                const current = prev[studentId] || 'PRESENT';
                const next = current === 'PRESENT' ? 'ABSENT' : (current === 'ABSENT' ? 'LATE' : 'PRESENT');
                return { ...prev, [studentId]: next };
            });
        }
    };

    const markAll = (status) => {
        const newData = {};
        students.forEach(s => { newData[s.id] = status; });
        setAttendanceData(newData);
    };

    /* ─── Counts ─── */
    const counts = useMemo(() => {
        const vals = Object.values(attendanceData);
        return {
            present: vals.filter(s => s === 'PRESENT').length,
            absent: vals.filter(s => s === 'ABSENT').length,
            late: vals.filter(s => s === 'LATE').length,
        };
    }, [attendanceData]);

    if (!isOpen) return null;

    const autoStatus = mode === 'auto' ? getAutoStatus() : null;
    const autoConf = autoStatus ? getConfig(autoStatus) : null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-end sm:items-center justify-center"
            onClick={onClose}>
            <div
                className="bg-white w-full sm:rounded-2xl sm:max-w-5xl sm:mx-4 h-[100dvh] sm:h-[92vh] flex flex-col shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
                style={{ animation: 'slideUp .3s ease' }}
            >
                {/* ── HEADER ── */}
                <div className="bg-gradient-to-r from-upn-600 to-upn-700 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Check size={18} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm sm:text-base truncate">Llamar Asistencia</h3>
                            <p className="text-[10px] sm:text-xs text-white/70">
                                {students.length} estudiantes · {mode === 'manual' ? 'Modo Manual' : 'Modo Horario'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                            type="date" value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            className="px-2 py-1.5 bg-white/15 border border-white/30 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-white/30 text-white w-[115px] sm:w-auto [color-scheme:dark]"
                        />
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ── MODE TOGGLE ── */}
                <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-3 flex-shrink-0 flex-wrap">
                    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                        <button onClick={() => setMode('manual')}
                            className={`py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'manual' ? 'bg-upn-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                                }`}>
                            <User size={13} /> Manual
                        </button>
                        <button onClick={() => setMode('auto')}
                            className={`py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'auto' ? 'bg-upn-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                                }`}>
                            <Clock size={13} /> Por Horario
                        </button>
                    </div>

                    {mode === 'manual' && (
                        <div className="flex gap-1.5 ml-auto">
                            <button onClick={() => markAll('PRESENT')}
                                className="px-3 py-1.5 text-[11px] font-bold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all active:scale-95">
                                ✓ Todos
                            </button>
                            <button onClick={() => markAll('ABSENT')}
                                className="px-3 py-1.5 text-[11px] font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all active:scale-95">
                                ✗ Ninguno
                            </button>
                        </div>
                    )}
                    {mode === 'auto' && (
                        <button onClick={() => markAll('ABSENT')}
                            className="px-3 py-1.5 text-[11px] font-bold bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all active:scale-95 ml-auto">
                            ↺ Reiniciar
                        </button>
                    )}
                </div>

                {/* ── TIME RANGES (auto) ── */}
                {mode === 'auto' && (
                    <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-gradient-to-r from-indigo-50/80 to-upn-50/80 flex-shrink-0">
                        <div className="grid grid-cols-3 gap-2">
                            {/* Presente */}
                            <div className="bg-white rounded-xl p-2.5 border border-emerald-200 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Presente</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <input type="time" value={timeRanges.present.start}
                                        onChange={e => setTimeRanges(p => ({ ...p, present: { ...p.present, start: e.target.value } }))}
                                        className="flex-1 text-xs font-mono bg-emerald-50 rounded px-1 py-0.5 border-0 focus:ring-1 focus:ring-emerald-300 min-w-0" />
                                    <span className="text-[10px] text-slate-400">-</span>
                                    <input type="time" value={timeRanges.present.end}
                                        onChange={e => setTimeRanges(p => ({ ...p, present: { ...p.present, end: e.target.value }, late: { ...p.late, start: e.target.value } }))}
                                        className="flex-1 text-xs font-mono bg-emerald-50 rounded px-1 py-0.5 border-0 focus:ring-1 focus:ring-emerald-300 min-w-0" />
                                </div>
                            </div>
                            {/* Retardo */}
                            <div className="bg-white rounded-xl p-2.5 border border-amber-200 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Retardo</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <input type="time" value={timeRanges.late.start}
                                        onChange={e => setTimeRanges(p => ({ ...p, late: { ...p.late, start: e.target.value } }))}
                                        className="flex-1 text-xs font-mono bg-amber-50 rounded px-1 py-0.5 border-0 focus:ring-1 focus:ring-amber-300 min-w-0" />
                                    <span className="text-[10px] text-slate-400">-</span>
                                    <input type="time" value={timeRanges.late.end}
                                        onChange={e => setTimeRanges(p => ({ ...p, late: { ...p.late, end: e.target.value } }))}
                                        className="flex-1 text-xs font-mono bg-amber-50 rounded px-1 py-0.5 border-0 focus:ring-1 focus:ring-amber-300 min-w-0" />
                                </div>
                            </div>
                            {/* Falta */}
                            <div className="bg-white rounded-xl p-2.5 border border-red-200 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span className="text-[10px] font-black text-red-700 uppercase tracking-wider">Falta</span>
                                </div>
                                <p className="text-xs font-mono text-red-600">+{timeRanges.late.end}</p>
                            </div>
                        </div>
                        {/* Live indicator */}
                        <div className="mt-2.5 flex items-center justify-center gap-2.5">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-upn-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-upn-500"></span>
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-700">{getCurrentTime()}</span>
                            <span className="text-slate-300">→</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${autoConf?.badge}`}>
                                {autoConf?.icon} {autoConf?.label}
                            </span>
                        </div>
                    </div>
                )}

                {/* ── SEARCH BAR ── */}
                <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o documento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-200 focus:border-upn-400 transition-all placeholder:text-slate-400"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── STUDENT GRID ── */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50/80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                        {paginated.map(student => {
                            const conf = getConfig(attendanceData[student.id]);
                            return (
                                <div key={student.id}
                                    onClick={() => toggleStatus(student.id)}
                                    className={`relative p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none
                                        hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] active:shadow-sm
                                        ${conf.bg} ${conf.border} ${conf.text}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                                            {student.photo ? (
                                                <img src={getMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm sm:text-base font-black opacity-60">
                                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                                </span>
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm truncate leading-tight">{student.first_name} {student.last_name}</h4>
                                            <p className="text-[11px] opacity-60 font-mono">{student.document_number}</p>
                                        </div>
                                        {/* Status badge */}
                                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 shadow-sm ${conf.badge}`}>
                                            {conf.icon}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filtered.length === 0 && (
                        <div className="text-center py-16 text-slate-400">
                            <Users size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="font-medium">No se encontraron estudiantes</p>
                            <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                        </div>
                    )}
                </div>

                {/* ── PAGINATION ── */}
                {totalPages > 1 && (
                    <div className="px-4 sm:px-6 py-2 border-t border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
                        <span className="text-[11px] text-slate-400">
                            Pág. {currentPage}/{totalPages} · {filtered.length} estudiantes
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-90">
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((page, idx, arr) => (
                                    <React.Fragment key={page}>
                                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                                            <span className="text-slate-300 text-xs px-0.5">…</span>
                                        )}
                                        <button onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all active:scale-90 ${currentPage === page
                                                    ? 'bg-upn-600 text-white shadow-md shadow-upn-600/30'
                                                    : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                                                }`}>{page}</button>
                                    </React.Fragment>
                                ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-90">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── FOOTER ── */}
                <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-white flex-shrink-0">
                    {/* Counters */}
                    <div className="flex items-center justify-center gap-4 mb-3">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                            <span className="text-xs font-bold text-slate-700">{counts.present}</span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">presentes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            <span className="text-xs font-bold text-slate-700">{counts.absent}</span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">ausentes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                            <span className="text-xs font-bold text-slate-700">{counts.late}</span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">tarde</span>
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2">
                        <button onClick={onClose}
                            className="flex-1 sm:flex-none py-2.5 px-5 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-[0.97]">
                            Cancelar
                        </button>
                        <button onClick={onSave} disabled={savingAttendance}
                            className="flex-[2] sm:flex-1 py-2.5 px-5 bg-gradient-to-r from-upn-600 to-upn-700 text-white rounded-xl text-sm font-bold hover:from-upn-700 hover:to-upn-800 transition-all shadow-lg shadow-upn-600/25 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97]">
                            {savingAttendance ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {savingAttendance ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Slide-up animation */}
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
