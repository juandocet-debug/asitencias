/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Search, Save, Loader2, CheckCircle, AlertCircle, User, Clock } from 'lucide-react';

const STUDENTS_PER_PAGE = 20;

const getStatusColor = (status) => {
    switch (status) {
        case 'PRESENT': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        case 'ABSENT': return 'bg-red-100 text-red-800 border-red-300';
        case 'LATE': return 'bg-amber-100 text-amber-800 border-amber-300';
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'PRESENT': return 'Presente';
        case 'ABSENT': return 'Ausente';
        case 'LATE': return 'Tarde';
        default: return '-';
    }
};

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
    // Modo de asistencia
    const [mode, setMode] = useState('manual');
    const [timeRanges, setTimeRanges] = useState({
        present: { start: '08:00', end: '08:20' },
        late: { start: '08:20', end: '08:40' },
    });

    // Búsqueda y paginación
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [clockTick, setClockTick] = useState(0);

    // Reset al abrir
    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1);
            setSearchTerm('');
            setMode('manual');
        }
    }, [isOpen]);

    // Reset página al buscar
    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    // Tick del reloj en modo auto
    useEffect(() => {
        if (mode !== 'auto' || !isOpen) return;
        const interval = setInterval(() => setClockTick(t => t + 1), 15000);
        return () => clearInterval(interval);
    }, [mode, isOpen]);

    // Helpers de hora
    const getCurrentTime = () => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    };

    const getAutoStatus = () => {
        const ct = getCurrentTime();
        if (ct >= timeRanges.present.start && ct < timeRanges.present.end) return 'PRESENT';
        if (ct >= timeRanges.late.start && ct < timeRanges.late.end) return 'LATE';
        return 'ABSENT';
    };

    // Filtrado
    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return students;
        const t = searchTerm.toLowerCase();
        return students.filter(s =>
            s.first_name?.toLowerCase().includes(t) ||
            s.last_name?.toLowerCase().includes(t) ||
            s.document_number?.includes(t)
        );
    }, [students, searchTerm]);

    // Paginación
    const totalPages = Math.ceil(filtered.length / STUDENTS_PER_PAGE);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * STUDENTS_PER_PAGE;
        return filtered.slice(start, start + STUDENTS_PER_PAGE);
    }, [filtered, currentPage]);

    // Toggle estado
    const toggleStatus = (studentId) => {
        if (mode === 'auto') {
            setAttendanceData(prev => {
                const current = prev[studentId];
                // Si ya está marcado como presente/tarde, desmarcar a absent
                if (current === 'PRESENT' || current === 'LATE') {
                    return { ...prev, [studentId]: 'ABSENT' };
                }
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

    // Marcar todos
    const markAll = (status) => {
        const newData = {};
        students.forEach(s => { newData[s.id] = status; });
        setAttendanceData(newData);
    };

    // Contadores
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

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-8">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[95vh] md:h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* ══════ HEADER ══════ */}
                <div className="px-4 md:px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                    <div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Check className="text-upn-600" size={20} /> Llamar Asistencia
                        </h3>
                        <p className="text-[11px] text-slate-500 hidden md:block">
                            {mode === 'manual' ? 'Toca cada tarjeta para cambiar estado' : 'Toca para registrar llegada — estado por hora'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-upn-500/20 w-[130px] md:w-auto"
                        />
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* ══════ MODE TOGGLE ══════ */}
                <div className="px-4 md:px-6 py-2.5 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="flex bg-slate-100 rounded-xl p-1 max-w-xs">
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${mode === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                                }`}
                        >
                            <User size={14} /> Manual
                        </button>
                        <button
                            onClick={() => setMode('auto')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${mode === 'auto' ? 'bg-white text-upn-700 shadow-sm' : 'text-slate-500'
                                }`}
                        >
                            <Clock size={14} /> Por Horario
                        </button>
                    </div>
                </div>

                {/* ══════ TIME RANGES (auto mode) ══════ */}
                {mode === 'auto' && (
                    <div className="px-4 md:px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-upn-50/50 to-indigo-50/50 flex-shrink-0 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Presente */}
                            <div className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-emerald-200">
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-emerald-700 font-bold">PRESENTE</p>
                                    <div className="flex items-center gap-1">
                                        <input type="time" value={timeRanges.present.start}
                                            onChange={e => setTimeRanges(p => ({ ...p, present: { ...p.present, start: e.target.value } }))}
                                            className="w-full text-xs font-mono bg-transparent p-0 border-0 focus:ring-0" />
                                        <span className="text-[10px] text-slate-400">a</span>
                                        <input type="time" value={timeRanges.present.end}
                                            onChange={e => setTimeRanges(p => ({ ...p, present: { ...p.present, end: e.target.value }, late: { ...p.late, start: e.target.value } }))}
                                            className="w-full text-xs font-mono bg-transparent p-0 border-0 focus:ring-0" />
                                    </div>
                                </div>
                            </div>
                            {/* Retardo */}
                            <div className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-amber-200">
                                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                                    <Clock size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-amber-700 font-bold">RETARDO</p>
                                    <div className="flex items-center gap-1">
                                        <input type="time" value={timeRanges.late.start}
                                            onChange={e => setTimeRanges(p => ({ ...p, late: { ...p.late, start: e.target.value } }))}
                                            className="w-full text-xs font-mono bg-transparent p-0 border-0 focus:ring-0" />
                                        <span className="text-[10px] text-slate-400">a</span>
                                        <input type="time" value={timeRanges.late.end}
                                            onChange={e => setTimeRanges(p => ({ ...p, late: { ...p.late, end: e.target.value } }))}
                                            className="w-full text-xs font-mono bg-transparent p-0 border-0 focus:ring-0" />
                                    </div>
                                </div>
                            </div>
                            {/* Falta */}
                            <div className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-red-200">
                                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle size={14} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-red-700 font-bold">FALTA</p>
                                    <p className="text-xs font-mono text-red-600">Después de {timeRanges.late.end}</p>
                                </div>
                            </div>
                        </div>
                        {/* Indicador de estado actual */}
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <span className="text-slate-500 text-xs">Ahora:</span>
                            <span className="font-mono font-bold text-slate-800 text-xs">{getCurrentTime()}</span>
                            <span className="text-slate-300">→</span>
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${autoStatus === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                                    autoStatus === 'LATE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {autoStatus === 'PRESENT' ? '✅ Presente' : autoStatus === 'LATE' ? '⏰ Retardo' : '❌ Falta'}
                            </span>
                        </div>
                    </div>
                )}

                {/* ══════ SEARCH + QUICK ACTIONS ══════ */}
                <div className="px-4 md:px-6 py-2.5 border-b border-slate-100 flex flex-col sm:flex-row gap-2 items-center bg-white flex-shrink-0">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar estudiante..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100"
                        />
                    </div>
                    {mode === 'manual' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => markAll('PRESENT')} className="flex-1 sm:flex-none px-3 py-2 text-[11px] font-bold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                                ✅ Todos Presentes
                            </button>
                            <button onClick={() => markAll('ABSENT')} className="flex-1 sm:flex-none px-3 py-2 text-[11px] font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                                ❌ Todos Ausentes
                            </button>
                        </div>
                    )}
                    {mode === 'auto' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => markAll('ABSENT')} className="flex-1 sm:flex-none px-3 py-2 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                                Reiniciar Todos
                            </button>
                        </div>
                    )}
                </div>

                {/* ══════ STUDENT GRID ══════ */}
                <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-slate-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-4">
                        {paginated.map(student => (
                            <div key={student.id}
                                onClick={() => toggleStatus(student.id)}
                                className={`p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] select-none shadow-sm ${getStatusColor(attendanceData[student.id])}`}
                            >
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/70 flex items-center justify-center overflow-hidden font-bold text-sm border-2 border-white shadow-sm flex-shrink-0">
                                        {student.photo ? (
                                            <img src={getMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm">{student.first_name?.[0]}{student.last_name?.[0]}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold truncate text-sm">{student.first_name} {student.last_name}</h4>
                                        <p className="text-[11px] opacity-70 font-mono">{student.document_number}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <div className="px-2.5 py-1 rounded-lg bg-white/60 text-[11px] font-bold uppercase tracking-wider">
                                        {getStatusLabel(attendanceData[student.id])}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <Search size={36} className="mx-auto mb-3 text-slate-300" />
                            <p>No se encontraron estudiantes</p>
                        </div>
                    )}
                </div>

                {/* ══════ PAGINATION ══════ */}
                {totalPages > 1 && (
                    <div className="px-4 md:px-6 py-2.5 border-t border-slate-100 flex items-center justify-center gap-1.5 bg-white flex-shrink-0">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors flex items-center justify-center text-sm font-bold"
                        >‹</button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .map((page, idx, arr) => (
                                <React.Fragment key={page}>
                                    {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-slate-300 text-xs px-1">...</span>}
                                    <button
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${currentPage === page ? 'bg-upn-600 text-white shadow-md' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >{page}</button>
                                </React.Fragment>
                            ))
                        }
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors flex items-center justify-center text-sm font-bold"
                        >›</button>
                        <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                            {((currentPage - 1) * STUDENTS_PER_PAGE) + 1}-{Math.min(currentPage * STUDENTS_PER_PAGE, filtered.length)} de {filtered.length}
                        </span>
                    </div>
                )}

                {/* ══════ FOOTER ══════ */}
                <div className="p-3 md:p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 bg-white flex-shrink-0">
                    <p className="text-xs md:text-sm text-slate-500">
                        <span className="font-bold text-emerald-600">{counts.present}</span> presentes,{' '}
                        <span className="font-bold text-red-600">{counts.absent}</span> ausentes,{' '}
                        <span className="font-bold text-amber-600">{counts.late}</span> tarde
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 sm:flex-none px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={onSave}
                            disabled={savingAttendance}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-upn-600 text-white rounded-xl text-sm font-bold hover:bg-upn-700 transition-colors shadow-lg shadow-upn-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {savingAttendance ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {savingAttendance ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
