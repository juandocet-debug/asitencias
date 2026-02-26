/* eslint-disable */
/**
 * PracticaDetalle.jsx
 * Dashboard de seguimiento de una práctica — similar al ClassDetails del profesor.
 * Accesible por: Coordinador de Prácticas + Profesor de Práctica
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ClipboardList, Calendar, MapPin, Users, Plus,
    Loader2, Check, X, AlertTriangle, Edit2, ChevronDown, ChevronUp,
    UserCheck, Hash, ClipboardCheck, BookOpen, MessageSquare
} from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

/* ─── Helpers ─────────────────────────────────────────────── */
const STATUS_CONFIG = {
    PRESENT: { label: 'Presente', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    LATE: { label: 'Tardanza', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
    ABSENT: { label: 'Ausente', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    EXCUSED: { label: 'Excusado', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
};

const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
    if (!open) return null;
    const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[92vh] flex flex-col`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <h3 className="text-base font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
                {footer && <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">{footer}</div>}
            </div>
        </div>
    );
};

const Field = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
        {children}
    </div>
);

const Input = ({ icon: Icon, ...props }) => (
    <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
        <input {...props} className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 transition-all`} />
    </div>
);

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
    const [seguimientos, setSeguimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [newSegModal, setNewSegModal] = useState(false);
    const [detailSeg, setDetailSeg] = useState(null); // seguimiento abierto

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 4500);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [pR, sR, segR] = await Promise.all([
                api.get(`/practicas/practicas/${id}/`),
                api.get(`/practicas/practicas/${id}/students/`),
                api.get(`/practicas/seguimientos/?practica=${id}`),
            ]);
            setPractica(pR.data);
            setStudents(sR.data.students || []);
            setSeguimientos(segR.data);
        } catch { showToast('Error al cargar la práctica', 'error'); }
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
                <button onClick={() => navigate('/coordinator/practicas')} className="mt-4 text-upn-600 hover:text-upn-800 font-semibold text-sm">
                    ← Volver a Prácticas
                </button>
            </div>
        );
    }

    // Stats rápidas
    const totalSeguimientos = seguimientos.length;
    const totalStudents = students.length;
    const lastSeg = seguimientos[0];

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* ── Header ── */}
            <div>
                <button onClick={() => navigate('/coordinator/practicas')}
                    className="flex items-center gap-2 text-slate-400 hover:text-upn-600 text-sm font-semibold mb-4 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Volver a Prácticas
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold text-upn-500 uppercase tracking-wider mb-1">Seguimiento de Práctica</p>
                        <h1 className="text-3xl font-black text-slate-900">{practica.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="text-sm text-slate-500">{practica.year} · {practica.period === 1 ? '1er semestre' : '2do semestre'}</span>
                            {practica.profesor_info && (
                                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <UserCheck size={14} className="text-violet-400" />
                                    {practica.profesor_info.full_name}
                                </span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border
                                ${practica.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {practica.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>
                    </div>

                    <button onClick={() => setNewSegModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-upn-600 hover:bg-upn-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-upn-600/20 transition-all flex-shrink-0">
                        <Plus size={16} /> Nuevo Seguimiento
                    </button>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Estudiantes', value: totalStudents, icon: Users, color: 'upn' },
                    { label: 'Seguimientos', value: totalSeguimientos, icon: ClipboardCheck, color: 'violet' },
                    { label: 'Sitios', value: practica.sitios_detail?.length || 0, icon: MapPin, color: 'blue' },
                    { label: 'Objetivos', value: practica.objetivos_detail?.length || 0, icon: BookOpen, color: 'emerald' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
                        <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center mb-3`}>
                            <Icon size={20} className={`text-${color}-500`} />
                        </div>
                        <p className="text-2xl font-black text-slate-800">{value}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Código QR ── */}
            <div className="bg-upn-50 border border-upn-200 rounded-2xl px-6 py-4 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-upn-500 uppercase mb-1">Código de inscripción</p>
                    <p className="font-mono font-black text-2xl text-upn-900 tracking-widest">{practica.code}</p>
                </div>
                <Hash size={36} className="text-upn-300" />
            </div>

            {/* ── Layout principal ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Seguimientos — col izquierda (2/3) */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
                        <ClipboardCheck size={18} className="text-upn-500" /> Historial de seguimiento
                    </h2>

                    {seguimientos.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 flex flex-col items-center">
                            <ClipboardCheck size={36} className="text-slate-200 mb-3" />
                            <p className="text-slate-400 font-semibold">Sin visitas registradas aún</p>
                            <button onClick={() => setNewSegModal(true)}
                                className="mt-4 text-sm text-upn-600 hover:text-upn-800 font-semibold">
                                + Registrar primera visita
                            </button>
                        </div>
                    ) : (
                        seguimientos.map(seg => (
                            <SeguimientoCard key={seg.id} seg={seg} students={students}
                                onUpdated={load} showToast={showToast} />
                        ))
                    )}
                </div>

                {/* Panel derecho — Estudiantes y Sitios */}
                <div className="space-y-5">
                    {/* Estudiantes */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Users size={16} className="text-upn-400" /> Estudiantes</h3>
                            <span className="text-xs font-bold text-slate-400">{students.length}</span>
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                            {students.length === 0
                                ? <p className="text-center text-slate-400 text-sm py-8">Sin inscritos</p>
                                : students.map(s => (
                                    <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                                        <div className="w-8 h-8 rounded-full bg-upn-100 flex items-center justify-center flex-shrink-0 text-upn-700 font-bold text-xs">
                                            {s.full_name[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-700 truncate">{s.full_name}</p>
                                            <p className="text-[10px] text-slate-400">{s.document_number}</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    {/* Sitios */}
                    {practica.sitios_detail?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2"><MapPin size={16} className="text-blue-400" /> Sitios</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {practica.sitios_detail.map(s => (
                                    <div key={s.id} className="px-5 py-3">
                                        <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                                        {s.address && <p className="text-xs text-slate-400">{s.address}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Objetivos */}
                    {practica.objetivos_detail?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2"><BookOpen size={16} className="text-emerald-400" /> Objetivos</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {practica.objetivos_detail.map(o => (
                                    <div key={o.id} className="px-5 py-3">
                                        <p className="text-sm font-semibold text-slate-700">{o.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal Nuevo Seguimiento ── */}
            {newSegModal && (
                <NuevoSeguimientoModal
                    practicaId={id}
                    students={students}
                    sitios={practica.sitios_detail || []}
                    onClose={() => setNewSegModal(false)}
                    onCreated={() => { setNewSegModal(false); load(); showToast('Visita de seguimiento registrada ✓'); }}
                    showToast={showToast}
                />
            )}
        </div>
    );
}

/* ── Card de seguimiento (colapsable) ────────────────────────────── */
function SeguimientoCard({ seg, students, onUpdated, showToast }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [attend, setAttend] = useState({}); // studentId → status

    // Pre-cargar asistencias existentes
    useEffect(() => {
        const map = {};
        seg.asistencias?.forEach(a => { map[a.student] = a.status; });
        setAttend(map);
    }, [seg]);

    const setStatus = (studentId, status) => setAttend(p => ({ ...p, [studentId]: status }));

    const saveAttendance = async () => {
        setSaving(true);
        try {
            // Crear o actualizar cada registro
            await Promise.all(
                students.map(s => {
                    const status = attend[s.id] || 'ABSENT';
                    const existing = seg.asistencias?.find(a => a.student === s.id);
                    if (existing) {
                        return api.patch(`/practicas/asistencias/${existing.id}/`, { status });
                    } else {
                        return api.post('/practicas/asistencias/', { seguimiento: seg.id, student: s.id, status });
                    }
                })
            );
            showToast('Asistencia guardada');
            onUpdated();
        } catch { showToast('Error al guardar asistencia', 'error'); }
        finally { setSaving(false); }
    };

    const presentCount = students.filter(s => attend[s.id] === 'PRESENT').length;
    const absentCount = students.filter(s => attend[s.id] === 'ABSENT' || !attend[s.id]).length;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header colapsable */}
            <button className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                onClick={() => setOpen(!open)}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-upn-50 flex items-center justify-center flex-shrink-0">
                        <Calendar size={18} className="text-upn-500" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">
                            {new Date(seg.date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        {seg.topic && <p className="text-sm text-slate-500">{seg.topic}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> {presentCount} pres.
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> {absentCount} aus.
                        </span>
                    </div>
                    {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </button>

            {/* Contenido expandido */}
            {open && (
                <div className="border-t border-slate-100">
                    {/* Novedades */}
                    {seg.novedades && (
                        <div className="px-5 py-4 bg-amber-50 border-b border-amber-100">
                            <p className="text-xs font-bold text-amber-600 uppercase mb-1 flex items-center gap-1">
                                <MessageSquare size={12} /> Novedades
                            </p>
                            <p className="text-sm text-amber-900">{seg.novedades}</p>
                        </div>
                    )}

                    {/* Lista de asistencia */}
                    {students.length > 0 ? (
                        <div>
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-500 uppercase">Asistencia</p>
                                <button onClick={saveAttendance} disabled={saving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-upn-600 text-white text-xs font-bold rounded-lg hover:bg-upn-700 transition-colors disabled:opacity-50">
                                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    Guardar
                                </button>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {students.map(s => {
                                    const status = attend[s.id] || 'ABSENT';
                                    return (
                                        <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                                            <div className="w-8 h-8 rounded-full bg-upn-100 flex items-center justify-center flex-shrink-0 text-upn-700 font-bold text-xs">
                                                {s.full_name[0]}
                                            </div>
                                            <p className="flex-1 text-sm font-semibold text-slate-700 min-w-0 truncate">{s.full_name}</p>
                                            <div className="flex gap-1.5">
                                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                    <button key={key} onClick={() => setStatus(s.id, key)}
                                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all
                                                            ${status === key
                                                                ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-current`
                                                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                                            }`}>
                                                        {cfg.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 text-sm py-8">No hay estudiantes inscritos en esta práctica.</p>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Modal Nuevo Seguimiento ───────────────────────────────────── */
function NuevoSeguimientoModal({ practicaId, students, sitios, onClose, onCreated, showToast }) {
    const [form, setForm] = useState({ practica: practicaId, date: new Date().toISOString().split('T')[0], topic: '', novedades: '', sitio: '' });
    const [saving, setSaving] = useState(false);
    const [attend, setAttend] = useState(
        Object.fromEntries(students.map(s => [s.id, 'PRESENT']))
    );

    const setStatus = (id, status) => setAttend(p => ({ ...p, [id]: status }));

    const handleCreate = async () => {
        if (!form.date) return;
        setSaving(true);
        try {
            const payload = { ...form, sitio: form.sitio || null };
            const segRes = await api.post('/practicas/seguimientos/', payload);
            const segId = segRes.data.id;

            // Registrar asistencia de cada estudiante
            if (students.length > 0) {
                await Promise.all(
                    students.map(s => api.post('/practicas/asistencias/', {
                        seguimiento: segId, student: s.id, status: attend[s.id] || 'ABSENT'
                    }))
                );
            }

            onCreated();
        } catch (e) { showToast(e.response?.data?.date?.[0] || 'Error al crear', 'error'); }
        finally { setSaving(false); }
    };

    return (
        <Modal open={true} onClose={onClose} title="Registrar Visita de Seguimiento" size="xl"
            footer={<>
                <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={handleCreate} disabled={saving || !form.date}
                    className="flex-1 py-2.5 bg-upn-600 hover:bg-upn-700 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Registrar visita
                </button>
            </>}
        >
            <div className="space-y-5">
                {/* Fecha */}
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Fecha de visita *">
                        <Input icon={Calendar} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </Field>
                    {sitios.length > 0 && (
                        <Field label="Sitio visitado">
                            <select value={form.sitio} onChange={e => setForm({ ...form, sitio: e.target.value })}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 appearance-none">
                                <option value="">— Sin especificar —</option>
                                {sitios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </Field>
                    )}
                </div>

                <Field label="Actividad / Tema">
                    <Input icon={BookOpen} value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="Ej: Planificación de actividades recreativas" />
                </Field>

                <Field label="Novedades">
                    <textarea value={form.novedades} onChange={e => setForm({ ...form, novedades: e.target.value })}
                        placeholder="Observaciones, novedades o comentarios de la visita..."
                        rows={3}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 resize-none transition-all" />
                </Field>

                {/* Asistencia rápida */}
                {students.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <p className="text-xs font-bold text-slate-500 uppercase">Asistencia inicial</p>
                            <div className="flex gap-2 ml-auto">
                                <button type="button" onClick={() => setAttend(Object.fromEntries(students.map(s => [s.id, 'PRESENT'])))}
                                    className="text-[11px] font-bold text-emerald-600 hover:underline">Todos presente</button>
                                <button type="button" onClick={() => setAttend(Object.fromEntries(students.map(s => [s.id, 'ABSENT'])))}
                                    className="text-[11px] font-bold text-red-500 hover:underline">Todos ausente</button>
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            {students.map((s, i) => {
                                const status = attend[s.id] || 'PRESENT';
                                return (
                                    <div key={s.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                                        <div className="w-7 h-7 rounded-full bg-upn-100 flex items-center justify-center text-upn-700 font-bold text-xs flex-shrink-0">
                                            {s.full_name[0]}
                                        </div>
                                        <p className="flex-1 text-sm font-semibold text-slate-700 truncate">{s.full_name}</p>
                                        <div className="flex gap-1">
                                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                <button key={key} type="button" onClick={() => setStatus(s.id, key)}
                                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all
                                                        ${status === key
                                                            ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                                                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                                                        }`}>
                                                    {cfg.label}
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
        </Modal>
    );
}
