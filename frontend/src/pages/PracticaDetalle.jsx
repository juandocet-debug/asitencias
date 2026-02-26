/* eslint-disable */
/**
 * PracticaDetalle.jsx
 * Vista de seguimiento coordinador/profe — tabla de estudiantes con fallas,
 * drill-down por alumno, historial día a día con reflexiones.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ClipboardList, Calendar, MapPin, Users, Plus,
    Loader2, Check, X, AlertTriangle, ChevronDown, ChevronUp,
    UserCheck, Hash, ClipboardCheck, BookOpen, MessageSquare,
    Pencil, Eye, BarChart2, ChevronRight, PenLine
} from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

/* ── ESTADO helpers ─────────────────────────────────────── */
const STATUS_CFG = {
    PRESENT: { label: 'P', full: 'Presente', bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50 border-emerald-200' },
    LATE: { label: 'T', full: 'Tardanza', bg: 'bg-amber-400', text: 'text-amber-700', light: 'bg-amber-50 border-amber-200' },
    ABSENT: { label: 'A', full: 'Ausente', bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50 border-red-200' },
    EXCUSED: { label: 'E', full: 'Excusado', bg: 'bg-slate-400', text: 'text-slate-600', light: 'bg-slate-100 border-slate-200' },
};

const StatusDot = ({ status, size = 'sm' }) => {
    const cfg = STATUS_CFG[status];
    if (!cfg) return <span className="text-slate-300 text-xs">—</span>;
    const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs';
    return (
        <span title={cfg.full} className={`${sz} rounded-full ${cfg.bg} text-white font-black flex items-center justify-center`}>
            {cfg.label}
        </span>
    );
};

/* ── Primitivos ─────────────────────────────────────────── */
const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
    if (!open) return null;
    const w = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl', xl: 'max-w-3xl' };
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${w[size]} max-h-[92vh] flex flex-col`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <h3 className="text-base font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
                {footer && <div className="px-6 py-4 border-t border-slate-100 flex gap-3">{footer}</div>}
            </div>
        </div>
    );
};

const Toast = ({ toast, onClose }) => {
    if (!toast) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-semibold text-sm
            ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            {toast.message}
            <button onClick={onClose} className="ml-1 p-0.5 hover:bg-white/20 rounded-lg"><X size={13} /></button>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function PracticaDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();

    const [practica, setPractica] = useState(null);
    const [students, setStudents] = useState([]);
    const [resumen, setResumen] = useState([]);  // estadísticas por alumno
    const [seguimientos, setSeguimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [activeView, setActiveView] = useState('resumen'); // 'resumen' | 'historial'
    const [newSegModal, setNewSegModal] = useState(false);
    const [studentModal, setStudentModal] = useState(null); // alumno drill-down

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 4500);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [pR, sR, segR, resR] = await Promise.all([
                api.get(`/practicas/practicas/${id}/`),
                api.get(`/practicas/practicas/${id}/students/`),
                api.get(`/practicas/seguimientos/?practica=${id}`),
                api.get(`/practicas/practicas/${id}/resumen-asistencia/`),
            ]);
            setPractica(pR.data);
            setStudents(sR.data.students || []);
            setSeguimientos(segR.data);
            setResumen(resR.data);
        } catch { showToast('Error al cargar', 'error'); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="animate-spin text-upn-500 w-10 h-10 mb-4" />
                <p className="text-slate-400 font-medium">Cargando práctica...</p>
            </div>
        );
    }

    if (!practica) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <AlertTriangle size={40} className="text-red-300 mb-4" />
                <p className="text-slate-500 font-medium">Práctica no encontrada</p>
                <button onClick={() => navigate('/coordinator/practicas')} className="mt-4 text-upn-600 font-semibold text-sm">
                    ← Volver a Prácticas
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* Header */}
            <div>
                <button onClick={() => navigate('/coordinator/practicas')}
                    className="flex items-center gap-2 text-slate-400 hover:text-upn-600 text-sm font-semibold mb-4 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold text-upn-500 uppercase tracking-wider mb-0.5">Seguimiento</p>
                        <h1 className="text-3xl font-black text-slate-900">{practica.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-slate-500">
                            <span>{practica.year} · {practica.period === 1 ? '1er' : '2do'} sem.</span>
                            {practica.profesor_info && (
                                <span className="flex items-center gap-1.5">
                                    <UserCheck size={13} className="text-violet-400" />{practica.profesor_info.full_name}
                                </span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border
                                ${practica.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {practica.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>
                    </div>
                    <button onClick={() => setNewSegModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-upn-600 hover:bg-upn-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-upn-600/20 transition-all">
                        <Plus size={16} /> Nueva Visita
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Estudiantes', value: students.length, icon: Users, color: 'upn' },
                    { label: 'Visitas', value: seguimientos.length, icon: ClipboardCheck, color: 'violet' },
                    { label: 'Sitios', value: practica.sitios_detail?.length || 0, icon: MapPin, color: 'blue' },
                    { label: 'Objetivos', value: practica.objetivos_detail?.length || 0, icon: BookOpen, color: 'emerald' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
                        <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center mb-3`}>
                            <Icon size={20} className={`text-${color}-500`} />
                        </div>
                        <p className="text-2xl font-black text-slate-800">{value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* QR Strip */}
            <div className="bg-upn-50 border border-upn-200 rounded-2xl px-6 py-4 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-upn-400 uppercase mb-0.5">Código de inscripción</p>
                    <p className="font-mono font-black text-2xl text-upn-900 tracking-widest">{practica.code}</p>
                </div>
                <Hash size={32} className="text-upn-200" />
            </div>

            {/* Vista: Resumen | Historial */}
            <div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
                    {[{ key: 'resumen', label: '📊 Resumen alumnos' }, { key: 'historial', label: '📋 Historial visitas' }].map(v => (
                        <button key={v.key} onClick={() => setActiveView(v.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
                                ${activeView === v.key ? 'bg-white shadow text-upn-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                            {v.label}
                        </button>
                    ))}
                </div>

                {activeView === 'resumen' && (
                    <ResumenEstudiantes
                        resumen={resumen} seguimientos={seguimientos}
                        onClickStudent={setStudentModal}
                    />
                )}

                {activeView === 'historial' && (
                    <HistorialVisitas
                        seguimientos={seguimientos} students={students}
                        onUpdated={load} showToast={showToast}
                    />
                )}
            </div>

            {/* Modales */}
            {newSegModal && (
                <NuevoSeguimientoModal
                    practicaId={id}
                    students={students}
                    sitios={practica.sitios_detail || []}
                    onClose={() => setNewSegModal(false)}
                    onCreated={() => { setNewSegModal(false); load(); showToast('Visita registrada ✓'); }}
                    showToast={showToast}
                />
            )}

            {studentModal && (
                <HistorialAlumnoModal
                    practica={practica} student={studentModal}
                    onClose={() => setStudentModal(null)} showToast={showToast}
                />
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   RESUMEN DE ESTUDIANTES — tabla con fallas y % asistencia
══════════════════════════════════════════════════════════ */
function ResumenEstudiantes({ resumen, seguimientos, onClickStudent }) {
    const [sortField, setSortField] = useState('full_name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');

    const sorted = [...resumen]
        .filter(s => !search || s.full_name.toLowerCase().includes(search.toLowerCase()) || s.document_number.includes(search))
        .sort((a, b) => {
            let va = a[sortField], vb = b[sortField];
            if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            return sortDir === 'asc' ? va - vb : vb - va;
        });

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const SortIcon = ({ field }) => sortField === field
        ? (sortDir === 'asc' ? <ChevronUp size={12} className="text-upn-500" /> : <ChevronDown size={12} className="text-upn-500" />)
        : <ChevronDown size={12} className="text-slate-300" />;

    if (resumen.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 text-center">
                <Users size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">Sin estudiantes inscritos</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar estudiante..."
                    className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Header tabla */}
                <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase">
                    <button onClick={() => toggleSort('full_name')} className="col-span-3 flex items-center gap-1 text-left hover:text-slate-600">Estudiante <SortIcon field="full_name" /></button>
                    <button onClick={() => toggleSort('present')} className="col-span-1 flex items-center justify-center gap-1 hover:text-slate-600">P <SortIcon field="present" /></button>
                    <button onClick={() => toggleSort('absent')} className="col-span-1 flex items-center justify-center gap-1 hover:text-slate-600">A <SortIcon field="absent" /></button>
                    <button onClick={() => toggleSort('late')} className="col-span-1 flex items-center justify-center gap-1 hover:text-slate-600">T <SortIcon field="late" /></button>
                    <button onClick={() => toggleSort('excused')} className="col-span-1 flex items-center justify-center gap-1 hover:text-slate-600">E <SortIcon field="excused" /></button>
                    <button onClick={() => toggleSort('attendance_pct')} className="col-span-2 flex items-center justify-center gap-1 hover:text-slate-600">% Asist. <SortIcon field="attendance_pct" /></button>
                    {/* Columnas por sesión */}
                    {seguimientos.slice(0, 3).map(seg => (
                        <div key={seg.id} className="col-span-1 text-center truncate" title={seg.date}>
                            {new Date(seg.date + 'T12:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })}
                        </div>
                    ))}
                    <div className="col-span-1 text-right">Det.</div>
                </div>

                {sorted.map((s, i) => {
                    const pct = s.attendance_pct;
                    const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';

                    return (
                        <div key={s.id} className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                            {/* Nombre */}
                            <div className="col-span-3 flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-upn-100 flex items-center justify-center text-upn-700 font-bold text-xs flex-shrink-0">
                                    {s.photo ? <img src={s.photo} alt="" className="w-full h-full object-cover rounded-full" /> : s.full_name[0]}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800 text-sm truncate">{s.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{s.document_number}</p>
                                </div>
                            </div>

                            {/* Conteos */}
                            <div className="col-span-1 text-center">
                                <span className="font-bold text-emerald-600 text-sm">{s.present}</span>
                            </div>
                            <div className="col-span-1 text-center">
                                <span className="font-bold text-red-500 text-sm">{s.absent}</span>
                            </div>
                            <div className="col-span-1 text-center">
                                <span className="font-bold text-amber-500 text-sm">{s.late}</span>
                            </div>
                            <div className="col-span-1 text-center">
                                <span className="font-bold text-slate-400 text-sm">{s.excused}</span>
                            </div>

                            {/* Barra % */}
                            <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className={`text-xs font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</span>
                                </div>
                            </div>

                            {/* Últimas 3 sesiones como dots */}
                            {seguimientos.slice(0, 3).map(seg => {
                                const asist = seg.asistencias?.find(a => a.student === s.id);
                                return (
                                    <div key={seg.id} className="col-span-1 flex justify-center">
                                        <StatusDot status={asist?.status} />
                                    </div>
                                );
                            })}

                            {/* Détalle */}
                            <div className="col-span-1 flex justify-end">
                                <button onClick={() => onClickStudent(s)}
                                    className="p-1.5 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-lg transition-colors">
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Leyenda */}
                <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex gap-4 text-[10px] font-bold text-slate-400 uppercase">
                    {Object.entries(STATUS_CFG).map(([k, v]) => (
                        <span key={k} className="flex items-center gap-1">
                            <span className={`w-4 h-4 rounded-full ${v.bg} text-white flex items-center justify-center text-[9px]`}>{v.label}</span>
                            {v.full}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   HISTORIAL DE VISITAS — colapsables con asistencia inline
══════════════════════════════════════════════════════════ */
function HistorialVisitas({ seguimientos, students, onUpdated, showToast }) {
    if (seguimientos.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 text-center">
                <ClipboardCheck size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">Sin visitas registradas</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {seguimientos.map(seg => (
                <SeguimientoCard key={seg.id} seg={seg} students={students} onUpdated={onUpdated} showToast={showToast} />
            ))}
        </div>
    );
}

/* ── Card de seguimiento colapsable ─────────────────────── */
function SeguimientoCard({ seg, students, onUpdated, showToast }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [attend, setAttend] = useState({});

    useEffect(() => {
        const map = {};
        seg.asistencias?.forEach(a => { map[a.student] = a.status; });
        setAttend(map);
    }, [seg]);

    const saveAttendance = async () => {
        setSaving(true);
        try {
            await Promise.all(students.map(s => {
                const status = attend[s.id] || 'ABSENT';
                const existing = seg.asistencias?.find(a => a.student === s.id);
                return existing
                    ? api.patch(`/practicas/asistencias/${existing.id}/`, { status })
                    : api.post('/practicas/asistencias/', { seguimiento: seg.id, student: s.id, status });
            }));
            showToast('Asistencia guardada');
            onUpdated();
        } catch { showToast('Error', 'error'); }
        finally { setSaving(false); }
    };

    const presentCount = students.filter(s => attend[s.id] === 'PRESENT').length;
    const absentCount = students.filter(s => !attend[s.id] || attend[s.id] === 'ABSENT').length;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                onClick={() => setOpen(o => !o)}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-upn-50 flex items-center justify-center flex-shrink-0">
                        <Calendar size={18} className="text-upn-500" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">
                            {new Date(seg.date + 'T12:00').toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        {seg.topic && <p className="text-sm text-slate-500">{seg.topic}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{presentCount} ✓</span>
                        <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">{absentCount} ✗</span>
                    </div>
                    {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </button>

            {open && (
                <div className="border-t border-slate-100">
                    {seg.novedades && (
                        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                            <p className="text-xs font-bold text-amber-600 uppercase mb-1 flex items-center gap-1"><MessageSquare size={12} /> Novedades</p>
                            <p className="text-sm text-amber-900">{seg.novedades}</p>
                        </div>
                    )}

                    {students.length > 0 && (
                        <div>
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-500 uppercase">Asistencia</p>
                                <button onClick={saveAttendance} disabled={saving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-upn-600 text-white text-xs font-bold rounded-lg hover:bg-upn-700 disabled:opacity-50">
                                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Guardar
                                </button>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {students.map(s => {
                                    const status = attend[s.id] || 'ABSENT';
                                    const asist = seg.asistencias?.find(a => a.student === s.id);
                                    return (
                                        <div key={s.id} className="flex items-center gap-3 px-5 py-2.5">
                                            <StatusDot status={status} />
                                            <p className="flex-1 text-sm font-semibold text-slate-700 truncate">{s.full_name}</p>
                                            {/* Bandera de reflexión */}
                                            {asist?.has_reflexion && (
                                                <span title="Tiene reflexión registrada" className="text-violet-400"><PenLine size={12} /></span>
                                            )}
                                            <div className="flex gap-1">
                                                {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                                                    <button key={key}
                                                        onClick={() => setAttend(p => ({ ...p, [s.id]: key }))}
                                                        className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all
                                                            ${status === key
                                                                ? `${cfg.light} ${cfg.text} ring-1 ring-inset ring-current`
                                                                : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
                                                        {cfg.full}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   MODAL: Historial de un alumno + sus reflexiones
══════════════════════════════════════════════════════════ */
function HistorialAlumnoModal({ practica, student, onClose, showToast }) {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reflModal, setReflModal] = useState(null); // objeto historial con reflexion

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get(`/practicas/practicas/${practica.id}/historial-estudiante/${student.id}/`);
            setHistorial(r.data.historial || []);
        } catch { showToast('Error al cargar historial', 'error'); }
        finally { setLoading(false); }
    }, [practica.id, student.id]);

    useEffect(() => { load(); }, [load]);

    const pct = student.attendance_pct ?? 0;

    return (
        <Modal open={true} onClose={onClose} title={`Historial — ${student.full_name}`} size="lg">
            {/* Resumen rápido */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-5">
                <div className="w-12 h-12 rounded-full bg-upn-100 flex items-center justify-center text-upn-700 font-black text-lg flex-shrink-0">
                    {student.photo ? <img src={student.photo} alt="" className="w-full h-full object-cover rounded-full" /> : student.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800">{student.full_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{student.document_number}</p>
                </div>
                {[
                    { label: 'P', value: student.present, color: 'text-emerald-600' },
                    { label: 'A', value: student.absent, color: 'text-red-500' },
                    { label: 'T', value: student.late, color: 'text-amber-500' },
                    { label: 'E', value: student.excused, color: 'text-slate-400' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                        <p className={`font-black text-lg ${color}`}>{value}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{label}</p>
                    </div>
                ))}
                <div>
                    <p className={`font-black text-xl ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</p>
                    <p className="text-[10px] text-slate-400 font-bold">Asist.</p>
                </div>
            </div>

            {loading
                ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-upn-400 w-7 h-7" /></div>
                : historial.length === 0
                    ? <p className="text-center text-slate-400 py-8">Sin sesiones registradas</p>
                    : <div className="space-y-3">
                        {historial.map(h => (
                            <div key={h.seguimiento_id} className="rounded-2xl border border-slate-200 overflow-hidden">
                                {/* Fila principal */}
                                <div className="flex items-center gap-4 px-4 py-3">
                                    <StatusDot status={h.status} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800">
                                            {new Date(h.date + 'T12:00').toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        {h.topic && <p className="text-xs text-slate-400 truncate">{h.topic}</p>}
                                        {h.sitio && <p className="text-[11px] text-slate-400 flex items-center gap-1"><span className="text-slate-300">📍</span>{h.sitio}</p>}
                                    </div>
                                    {/* Botón reflexion */}
                                    {h.reflexion
                                        ? <button onClick={() => setReflModal(h)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-xs font-bold hover:bg-violet-100 transition-colors">
                                            <PenLine size={12} /> Ver reflexión
                                        </button>
                                        : <span className="text-[11px] text-slate-300 italic">Sin reflexión</span>
                                    }
                                </div>
                                {/* Reflexion expandida */}
                                {reflModal?.seguimiento_id === h.seguimiento_id && h.reflexion && (
                                    <div className="border-t border-slate-100 px-4 py-4 bg-violet-50 space-y-3">
                                        {[
                                            { label: 'Actividades realizadas', value: h.reflexion.actividades },
                                            { label: 'Reflexión pedagógica', value: h.reflexion.reflexion_pedagogica },
                                            { label: 'Aprendizajes', value: h.reflexion.aprendizajes },
                                        ].filter(x => x.value).map(({ label, value }) => (
                                            <div key={label}>
                                                <p className="text-[10px] font-bold text-violet-500 uppercase mb-1">{label}</p>
                                                <p className="text-sm text-slate-700 whitespace-pre-line">{value}</p>
                                            </div>
                                        ))}
                                        <button onClick={() => setReflModal(null)} className="text-xs text-violet-400 hover:text-violet-600 font-semibold">Cerrar</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
            }
        </Modal>
    );
}

/* ══════════════════════════════════════════════════════════
   MODAL: Nueva Visita con asistencia
══════════════════════════════════════════════════════════ */
function NuevoSeguimientoModal({ practicaId, students, sitios, onClose, onCreated, showToast }) {
    const [form, setForm] = useState({ practica: practicaId, date: new Date().toISOString().split('T')[0], topic: '', novedades: '', sitio: '' });
    const [saving, setSaving] = useState(false);
    const [attend, setAttend] = useState(Object.fromEntries(students.map(s => [s.id, 'PRESENT'])));

    const handleCreate = async () => {
        if (!form.date) return;
        setSaving(true);
        try {
            const segRes = await api.post('/practicas/seguimientos/', { ...form, sitio: form.sitio || null });
            const segId = segRes.data.id;
            if (students.length > 0) {
                await Promise.all(students.map(s =>
                    api.post('/practicas/asistencias/', { seguimiento: segId, student: s.id, status: attend[s.id] || 'ABSENT' })
                ));
            }
            onCreated();
        } catch (e) { showToast(e.response?.data?.date?.[0] || 'Error', 'error'); }
        finally { setSaving(false); }
    };

    return (
        <Modal open={true} onClose={onClose} title="Registrar Visita de Seguimiento" size="xl"
            footer={<>
                <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50">Cancelar</button>
                <button onClick={handleCreate} disabled={saving || !form.date}
                    className="flex-1 py-2.5 bg-upn-600 hover:bg-upn-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving && <Loader2 size={14} className="animate-spin" />} Registrar
                </button>
            </>}
        >
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fecha *</label>
                        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100" />
                    </div>
                    {sitios.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Sitio</label>
                            <select value={form.sitio} onChange={e => setForm({ ...form, sitio: e.target.value })}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none appearance-none">
                                <option value="">— Sin especificar —</option>
                                {sitios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Actividad / Tema</label>
                    <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}
                        placeholder="Ej: Planificación de actividades recreativas"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Novedades</label>
                    <textarea value={form.novedades} onChange={e => setForm({ ...form, novedades: e.target.value })} rows={3}
                        placeholder="Observaciones de la visita..."
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-upn-100" />
                </div>

                {students.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Asistencia</label>
                            <div className="flex gap-2 ml-auto">
                                <button type="button" onClick={() => setAttend(Object.fromEntries(students.map(s => [s.id, 'PRESENT'])))}
                                    className="text-[11px] font-bold text-emerald-600 hover:underline">Todos presente</button>
                                <button type="button" onClick={() => setAttend(Object.fromEntries(students.map(s => [s.id, 'ABSENT'])))}
                                    className="text-[11px] font-bold text-red-500 hover:underline">Todos ausente</button>
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            {students.map((s, i) => (
                                <div key={s.id} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                                    <StatusDot status={attend[s.id] || 'ABSENT'} />
                                    <p className="flex-1 text-sm font-semibold text-slate-700 truncate">{s.full_name}</p>
                                    <div className="flex gap-1">
                                        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                                            <button key={key} type="button"
                                                onClick={() => setAttend(p => ({ ...p, [s.id]: key }))}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all
                                                    ${(attend[s.id] || 'ABSENT') === key
                                                        ? `${cfg.light} ${cfg.text}`
                                                        : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
                                                {cfg.full}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
