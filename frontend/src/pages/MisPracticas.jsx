/* eslint-disable */
/**
 * MisPracticas.jsx
 * Vista del estudiante: tabla de prácticas, sesiones, diario de campo,
 * tareas del profesor y carga de evidencias.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ClipboardList, Calendar, MapPin, Check, X, Loader2, AlertTriangle,
    PenLine, BookOpen, Save, ChevronDown, ChevronUp, Plus, ArrowLeft,
    MessageSquare, CheckCircle2, Pencil, Image as ImageIcon, Upload,
    User as UserIcon, Target, Building2, Phone, Mail, Info,
    Clock, FileText, ListChecks, ChevronRight, Send
} from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

/* ── Primitivos ─────────────────────────────────────────── */
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

const STATUS_CFG = {
    PRESENT: { full: 'Presente', bg: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    LATE: { full: 'Tardanza', bg: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    ABSENT: { full: 'Ausente', bg: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
    EXCUSED: { full: 'Excusado', bg: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const TABS = [
    { key: 'sesiones', label: 'Sesiones y Diario', icon: Calendar },
    { key: 'tareas', label: 'Tareas', icon: ListChecks },
    { key: 'info', label: 'Información', icon: Info },
];

/* ══════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL — tabla de prácticas
══════════════════════════════════════════════════════════ */
export default function MisPracticas() {
    const { user } = useUser();
    const [practicas, setPracticas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [selected, setSelected] = useState(null);

    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 4500);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get('/practicas/mis-practicas/');
            setPracticas(r.data);
        } catch { showToast('Error al cargar tus prácticas', 'error'); }
        finally { setLoading(false); }
    }, []);

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!joinCode || joinCode.length !== 6) {
            showToast('El código debe tener 6 caracteres', 'error');
            return;
        }
        setJoining(true);
        try {
            await api.post('/practicas/join/', { code: joinCode });
            showToast('¡Te has unido a la práctica exitosamente!');
            setShowJoinModal(false);
            setJoinCode('');
            load();
        } catch (e) {
            showToast(e.response?.data?.error || 'Error al unirse a la práctica', 'error');
        } finally {
            setJoining(false);
        }
    };

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="animate-spin text-upn-500 w-10 h-10 mb-4" />
                <p className="text-slate-400 font-medium">Cargando tus prácticas...</p>
            </div>
        );
    }

    // Estado vacío
    if (practicas.length === 0) {
        return (
            <div className="max-w-xl mx-auto py-32 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                    <ClipboardList size={40} className="text-slate-300" />
                </div>
                <h2 className="text-xl font-black text-slate-700 mb-2">Sin prácticas inscritas</h2>
                <p className="text-slate-400 text-sm mb-6">Pide a tu profesor de prácticas el código para unirte.</p>
                <button onClick={() => setShowJoinModal(true)}
                    className="inline-flex items-center gap-2 bg-upn-600 hover:bg-upn-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-upn-600/20">
                    <Plus size={18} /> Unirme con código
                </button>
                {showJoinModal && <JoinModal joinCode={joinCode} setJoinCode={setJoinCode} joining={joining} handleJoin={handleJoin} close={() => setShowJoinModal(false)} />}
                <Toast toast={toast} onClose={() => setToast(null)} />
            </div>
        );
    }

    // Si seleccionó una práctica → vista detalle
    if (selected) {
        return (
            <>
                <PracticaView practica={selected} user={user} showToast={showToast}
                    onBack={() => setSelected(null)} />
                <Toast toast={toast} onClose={() => setToast(null)} />
            </>
        );
    }

    // ── Tabla de prácticas ──
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-xs font-bold text-upn-500 uppercase tracking-wider mb-1">Mi módulo</p>
                    <h1 className="text-3xl font-black text-slate-900">Mis Prácticas</h1>
                </div>
                <button onClick={() => setShowJoinModal(true)}
                    className="flex items-center gap-1.5 bg-upn-50 hover:bg-upn-100 text-upn-600 font-bold py-2 px-4 rounded-xl border border-upn-200 transition-colors text-sm">
                    <Plus size={16} /> Código
                </button>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase text-xs">Práctica</th>
                                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase text-xs hidden sm:table-cell">Profesor</th>
                                <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase text-xs">Periodo</th>
                                <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase text-xs hidden md:table-cell">Estudiantes</th>
                                <th className="text-right px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {practicas.map(p => (
                                <tr key={p.id} onClick={() => setSelected(p)}
                                    className="hover:bg-upn-50/50 cursor-pointer transition-colors group">
                                    <td className="px-5 py-4">
                                        <p className="font-bold text-slate-800 group-hover:text-upn-600 transition-colors">{p.name}</p>
                                        {p.program_name && <p className="text-xs text-slate-400 mt-0.5">{p.program_name}</p>}
                                    </td>
                                    <td className="px-4 py-4 hidden sm:table-cell">
                                        <p className="text-slate-600">{p.profesor_info?.full_name || '—'}</p>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="bg-upn-50 text-upn-600 font-bold text-xs px-2.5 py-1 rounded-full">
                                            {p.year}-{p.period}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center hidden md:table-cell">
                                        <span className="text-slate-500 font-semibold">{p.student_count}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-upn-500 transition-colors inline" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showJoinModal && <JoinModal joinCode={joinCode} setJoinCode={setJoinCode} joining={joining} handleJoin={handleJoin} close={() => setShowJoinModal(false)} />}
            <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   MODAL PARA UNIRSE CON CÓDIGO
══════════════════════════════════════════════════════════ */
function JoinModal({ joinCode, setJoinCode, joining, handleJoin, close }) {
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Unirme a una Práctica</h2>
                            <p className="text-sm text-slate-500 mt-1">Ingresa el código de 6 caracteres de tu práctica.</p>
                        </div>
                        <button onClick={close} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleJoin} className="space-y-5">
                        <input type="text" value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="Ej: A1B2C3" maxLength={6}
                            className="w-full text-center text-3xl font-bold tracking-widest px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-upn-500 focus:ring-4 focus:ring-upn-500/10 outline-none transition-all" />
                        <button type="submit" disabled={joining || joinCode.length !== 6}
                            className="w-full flex justify-center items-center gap-2 bg-upn-600 hover:bg-upn-700 disabled:bg-upn-300 text-white font-bold py-3.5 rounded-xl transition-colors">
                            {joining ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                            Confirmar código
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   VISTA DETALLE DE UNA PRÁCTICA — con tabs
══════════════════════════════════════════════════════════ */
function PracticaView({ practica, user, showToast, onBack }) {
    const [activeTab, setActiveTab] = useState('sesiones');
    const [seguimientos, setSeguimientos] = useState([]);
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [segRes, tarRes] = await Promise.all([
                api.get(`/practicas/seguimientos/?practica=${practica.id}`),
                api.get(`/practicas/tareas/?practica=${practica.id}`),
            ]);
            setSeguimientos(segRes.data);
            setTareas(tarRes.data);
        } catch { showToast('Error al cargar datos', 'error'); }
        finally { setLoading(false); }
    }, [practica.id]);

    useEffect(() => { loadAll(); }, [loadAll]);

    // Stats del alumno
    const total = seguimientos.length;
    const misAsist = seguimientos.flatMap(s => s.asistencias).filter(a => a.student === user.id);
    const presente = misAsist.filter(a => a.status === 'PRESENT').length;
    const ausente = misAsist.filter(a => a.status === 'ABSENT').length;
    const misDiarios = seguimientos.filter(s => s.reflexiones?.some(r => r.student === user.id));
    const conDiario = misDiarios.length;
    const totalHoras = seguimientos.flatMap(s => s.reflexiones || [])
        .filter(r => r.student === user.id)
        .reduce((sum, r) => sum + parseFloat(r.horas || 0), 0);

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div>
                <button onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-upn-600 text-sm font-semibold mb-4 group transition-colors">
                    <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> Volver a mis prácticas
                </button>
                <p className="text-xs font-bold text-upn-500 uppercase tracking-wider mb-1">Mi Práctica</p>
                <h1 className="text-3xl font-black text-slate-900">{practica.name}</h1>
                <p className="text-slate-500 text-sm mt-1">
                    {practica.year} · {practica.period === 1 ? '1er' : '2do'} semestre
                    {practica.profesor_info && <> · <UserIcon size={12} className="inline mb-0.5" /> {practica.profesor_info.full_name}</>}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { label: 'Sesiones', value: total, icon: Calendar, color: 'upn' },
                    { label: 'Asistidas', value: presente, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Ausencias', value: ausente, icon: AlertTriangle, color: 'red' },
                    { label: 'Diarios', value: conDiario, icon: PenLine, color: 'violet' },
                    { label: 'Horas', value: totalHoras.toFixed(1), icon: Clock, color: 'blue' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4">
                        <div className={`w-9 h-9 rounded-lg bg-${color}-50 flex items-center justify-center mb-2`}>
                            <Icon size={18} className={`text-${color}-500`} />
                        </div>
                        <p className="text-xl font-black text-slate-800">{value}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all
                            ${activeTab === key ? 'bg-white text-upn-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Icon size={15} /> <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {loading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-upn-400 w-7 h-7" /></div>
                : <>
                    {activeTab === 'sesiones' && <TabSesiones seguimientos={seguimientos} userId={user.id} onUpdated={loadAll} showToast={showToast} />}
                    {activeTab === 'tareas' && <TabTareas tareas={tareas} practicaId={practica.id} userId={user.id} onUpdated={loadAll} showToast={showToast} />}
                    {activeTab === 'info' && <TabInfo practica={practica} />}
                </>
            }
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   TAB: SESIONES Y DIARIO DE CAMPO
══════════════════════════════════════════════════════════ */
function TabSesiones({ seguimientos, userId, onUpdated, showToast }) {
    if (seguimientos.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 text-center">
                <Calendar size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">Tu profesor de prácticas aún no ha registrado sesiones</p>
            </div>
        );
    }
    return (
        <div className="space-y-3">
            {seguimientos.map(seg => (
                <SesionCard key={seg.id} seg={seg} userId={userId} onUpdated={onUpdated} showToast={showToast} />
            ))}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   TAB: TAREAS
══════════════════════════════════════════════════════════ */
function TabTareas({ tareas, practicaId, userId, onUpdated, showToast }) {
    if (tareas.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 text-center">
                <ListChecks size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">No hay tareas asignadas aún</p>
                <p className="text-slate-300 text-sm mt-1">Tu profesor de prácticas las creará aquí</p>
            </div>
        );
    }
    return (
        <div className="space-y-3">
            {tareas.map(t => (
                <TareaCard key={t.id} tarea={t} userId={userId} onUpdated={onUpdated} showToast={showToast} />
            ))}
        </div>
    );
}

/* ── TareaCard ── */
function TareaCard({ tarea, userId, onUpdated, showToast }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingEvid, setUploadingEvid] = useState(false);
    const evidFileRef = useRef(null);

    const miEntrega = tarea.entregas?.find(e => e.student === userId);
    const [propuesta, setPropuesta] = useState(miEntrega?.propuesta || '');

    useEffect(() => { setPropuesta(miEntrega?.propuesta || ''); }, [tarea]);

    const handleSaveEntrega = async () => {
        if (!propuesta.trim()) { showToast('Escribe tu propuesta', 'error'); return; }
        setSaving(true);
        try {
            if (miEntrega) {
                await api.patch(`/practicas/entregas/${miEntrega.id}/`, { propuesta });
            } else {
                await api.post('/practicas/entregas/', { tarea: tarea.id, student: userId, propuesta });
            }
            showToast('Entrega guardada ✓');
            setEditing(false);
            onUpdated();
        } catch (e) {
            showToast(e.response?.data?.propuesta?.[0] || 'Error al guardar', 'error');
        } finally { setSaving(false); }
    };

    const handleUploadEvidencia = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('Máximo 5MB', 'error'); return; }
        if (!miEntrega) { showToast('Primero guarda tu propuesta', 'error'); return; }
        setUploadingEvid(true);
        try {
            const fd = new FormData();
            fd.append('entrega', miEntrega.id);
            fd.append('archivo', file);
            fd.append('descripcion', file.name);
            await api.post('/practicas/evidencias/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            showToast('Evidencia subida ✓');
            onUpdated();
        } catch { showToast('Error al subir evidencia', 'error'); }
        finally { setUploadingEvid(false); evidFileRef.current.value = ''; }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setOpen(o => !o)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${miEntrega ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    {miEntrega ? <CheckCircle2 size={20} className="text-emerald-500" /> : <ListChecks size={20} className="text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">{tarea.titulo}</p>
                    {tarea.created_by_name && <p className="text-xs text-slate-400 mt-0.5">Asignada por {tarea.created_by_name}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {miEntrega && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            Entregada
                        </span>
                    )}
                    {miEntrega?.evidencias?.length > 0 && (
                        <span className="px-2 py-1 rounded-full text-[11px] font-bold border bg-blue-50 text-blue-600 border-blue-200">
                            {miEntrega.evidencias.length} archivos
                        </span>
                    )}
                    {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </button>

            {open && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                    {/* Descripción de la tarea */}
                    {tarea.descripcion && (
                        <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                                <FileText size={11} /> Instrucciones
                            </p>
                            <p className="text-sm text-slate-700 whitespace-pre-line">{tarea.descripcion}</p>
                        </div>
                    )}

                    {/* Entrega existente (lectura) */}
                    {miEntrega && !editing ? (
                        <div className="space-y-3">
                            <div className="bg-emerald-50 rounded-xl p-4">
                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1.5 flex items-center gap-1">
                                    <Send size={11} /> Mi propuesta
                                </p>
                                <p className="text-sm text-slate-700 whitespace-pre-line">{miEntrega.propuesta}</p>
                            </div>

                            {miEntrega.evidencias?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                                        <ImageIcon size={11} /> Evidencias ({miEntrega.evidencias.length})
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {miEntrega.evidencias.map(ev => (
                                            <a key={ev.id} href={ev.archivo_url} target="_blank" rel="noreferrer"
                                                className="block border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                                <img src={ev.archivo_url} alt={ev.descripcion} className="w-full h-24 object-cover" />
                                                {ev.descripcion && <p className="text-[10px] text-slate-500 p-1.5 truncate">{ev.descripcion}</p>}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button onClick={() => setEditing(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 border border-violet-200 transition-colors">
                                    <Pencil size={11} /> Editar
                                </button>
                                <input type="file" ref={evidFileRef} accept="image/*,.pdf" className="hidden" onChange={handleUploadEvidencia} />
                                <button onClick={() => evidFileRef.current?.click()} disabled={uploadingEvid}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 border border-blue-200 transition-colors">
                                    {uploadingEvid ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />} Subir evidencia
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Formulario de entrega */
                        <div className="space-y-3">
                            <textarea value={propuesta} onChange={e => setPropuesta(e.target.value)}
                                rows={4} placeholder="Describe tu propuesta, qué hiciste, cómo lo abordaste..."
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all" />
                            <div className="flex gap-2">
                                {editing && miEntrega && (
                                    <button onClick={() => setEditing(false)}
                                        className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">
                                        Cancelar
                                    </button>
                                )}
                                <button onClick={handleSaveEntrega} disabled={saving || !propuesta.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors">
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {miEntrega ? 'Actualizar' : 'Enviar entrega'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   TAB: INFORMACIÓN DE LA PRÁCTICA
══════════════════════════════════════════════════════════ */
function TabInfo({ practica }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-5 space-y-5">
            {practica.profesor_info && (
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <UserIcon size={18} className="text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Profesor de Prácticas</p>
                        <p className="font-bold text-slate-800">{practica.profesor_info.full_name}</p>
                        {practica.profesor_info.email && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={10} /> {practica.profesor_info.email}</p>
                        )}
                    </div>
                </div>
            )}

            {practica.sitios_detail?.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Building2 size={11} /> Sitios de práctica</p>
                    <div className="space-y-2">
                        {practica.sitios_detail.map(s => (
                            <div key={s.id} className="bg-slate-50 rounded-xl p-3">
                                <p className="font-semibold text-slate-700 text-sm">{s.name}</p>
                                {s.address && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={10} />{s.address}</p>}
                                {s.contact_name && <p className="text-xs text-slate-400 mt-0.5">Contacto: {s.contact_name}</p>}
                                {s.phone_mobile && <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={9} />{s.phone_mobile}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {practica.objetivos_detail?.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Target size={11} /> Objetivos pedagógicos</p>
                    <div className="space-y-1.5">
                        {practica.objetivos_detail.map(o => (
                            <div key={o.id} className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">{o.name}</p>
                                    {o.description && <p className="text-xs text-slate-400 mt-0.5">{o.description}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {practica.program_name && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <BookOpen size={12} />
                    <span>Programa: <span className="font-semibold text-slate-600">{practica.program_name}</span></span>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   CARD DE SESIÓN — asistencia + diario de campo
══════════════════════════════════════════════════════════ */
function SesionCard({ seg, userId, onUpdated, showToast }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const miAsist = seg.asistencias?.find(a => a.student === userId);
    const statusCfg = STATUS_CFG[miAsist?.status];
    const miDiario = seg.reflexiones?.find(r => r.student === userId);

    const [form, setForm] = useState({
        actividades: miDiario?.actividades || '',
        reflexion_pedagogica: miDiario?.reflexion_pedagogica || '',
        aprendizajes: miDiario?.aprendizajes || '',
        horas: miDiario?.horas || '0',
    });

    useEffect(() => {
        if (miDiario) {
            setForm({
                actividades: miDiario.actividades || '',
                reflexion_pedagogica: miDiario.reflexion_pedagogica || '',
                aprendizajes: miDiario.aprendizajes || '',
                horas: miDiario.horas || '0',
            });
            setImagePreview(miDiario.imagen_url || null);
            setImageFile(null);
        }
    }, [seg]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { showToast('La imagen es muy pesada (máx 5MB).', 'error'); return; }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!form.actividades.trim()) { showToast('Describe al menos las actividades realizadas', 'error'); return; }
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('actividades', form.actividades);
            formData.append('reflexion_pedagogica', form.reflexion_pedagogica);
            formData.append('aprendizajes', form.aprendizajes);
            formData.append('horas', form.horas);
            if (imageFile) formData.append('imagen', imageFile);

            if (miDiario) {
                await api.patch(`/practicas/reflexiones/${miDiario.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                formData.append('seguimiento', seg.id);
                formData.append('student', userId);
                await api.post('/practicas/reflexiones/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            showToast('Diario de campo guardado ✓');
            setEditing(false);
            onUpdated();
        } catch (e) {
            const err = e.response?.data;
            showToast(err?.actividades?.[0] || err?.non_field_errors?.[0] || 'Error al guardar', 'error');
        } finally { setSaving(false); }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setOpen(o => !o)}>
                <div className={`w-2 h-10 rounded-full flex-shrink-0 ${statusCfg ? statusCfg.bg : 'bg-slate-200'}`} />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">
                        {new Date(seg.date + 'T12:00').toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {seg.topic && <span className="text-xs text-slate-400">{seg.topic}</span>}
                        {seg.sitio_name && <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10} />{seg.sitio_name}</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {statusCfg && <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusCfg.badge}`}>{statusCfg.full}</span>}
                    {miDiario && !editing && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-violet-50 text-violet-700 border-violet-200 flex items-center gap-1">
                            <PenLine size={10} /> Diario · {miDiario.horas}h
                        </span>
                    )}
                    {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </button>

            {open && (
                <div className="border-t border-slate-100">
                    {seg.novedades && (
                        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                            <p className="text-xs font-bold text-amber-600 uppercase mb-1 flex items-center gap-1">
                                <MessageSquare size={12} /> Novedades del profesor
                            </p>
                            <p className="text-sm text-amber-900">{seg.novedades}</p>
                        </div>
                    )}

                    {miAsist?.comment && (
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Comentario</p>
                            <p className="text-sm text-slate-700">{miAsist.comment}</p>
                        </div>
                    )}

                    <div className="px-5 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <PenLine size={16} className="text-violet-500" />
                                Mi diario de campo
                            </h4>
                            {miDiario && !editing && (
                                <button onClick={() => setEditing(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 border border-violet-200 transition-colors">
                                    <Pencil size={11} /> Editar
                                </button>
                            )}
                        </div>

                        {!editing && miDiario ? (
                            <div className="space-y-4">
                                {[
                                    { label: 'Actividades realizadas', text: miDiario.actividades, icon: BookOpen },
                                    { label: 'Reflexión pedagógica', text: miDiario.reflexion_pedagogica, icon: PenLine },
                                    { label: 'Aprendizajes', text: miDiario.aprendizajes, icon: CheckCircle2 },
                                ].filter(x => x.text).map(({ label, text, icon: Icon }) => (
                                    <div key={label} className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                                            <Icon size={11} />{label}
                                        </p>
                                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{text}</p>
                                    </div>
                                ))}

                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1 bg-blue-50 text-blue-600 font-bold text-xs px-3 py-1.5 rounded-full border border-blue-200">
                                        <Clock size={11} /> {miDiario.horas} horas
                                    </span>
                                </div>

                                {miDiario.imagen_url && (
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><ImageIcon size={11} /> Evidencia</p>
                                        <div className="rounded-lg overflow-hidden border border-slate-200">
                                            <img src={miDiario.imagen_url} alt="Evidencia práctica" className="w-full h-auto object-cover max-h-64" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400">Documenta lo que hiciste, cómo lo viviste y qué aprendiste.</p>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                        <BookOpen size={11} /> Actividades realizadas <span className="text-red-400">*</span>
                                    </label>
                                    <textarea value={form.actividades} onChange={e => setForm({ ...form, actividades: e.target.value })}
                                        rows={4} placeholder="Describe las actividades que desarrollaste..."
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                        <PenLine size={11} /> Reflexión pedagógica
                                    </label>
                                    <textarea value={form.reflexion_pedagogica} onChange={e => setForm({ ...form, reflexion_pedagogica: e.target.value })}
                                        rows={3} placeholder="¿Cómo fue tu actuación? ¿Qué funcionó y qué no?"
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                        <CheckCircle2 size={11} /> Aprendizajes y mejoras
                                    </label>
                                    <textarea value={form.aprendizajes} onChange={e => setForm({ ...form, aprendizajes: e.target.value })}
                                        rows={2} placeholder="¿Qué aprendiste? ¿Qué harías diferente?"
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                        <Clock size={11} /> Horas dedicadas <span className="text-red-400">*</span>
                                    </label>
                                    <input type="number" step="0.5" min="0" max="24" value={form.horas}
                                        onChange={e => setForm({ ...form, horas: e.target.value })}
                                        className="w-32 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                        <ImageIcon size={11} /> Evidencia visual (Opcional)
                                    </label>
                                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageChange} />
                                    {!imagePreview ? (
                                        <button type="button" onClick={() => fileInputRef.current?.click()}
                                            className="w-full border-2 border-dashed border-slate-200 hover:border-violet-300 bg-slate-50 hover:bg-violet-50/50 rounded-xl p-4 text-center transition-all group flex flex-col items-center gap-2">
                                            <Upload size={20} className="text-slate-400 group-hover:text-violet-500" />
                                            <span className="text-sm font-semibold text-slate-500 group-hover:text-violet-600">Subir foto (Máx 5MB)</span>
                                        </button>
                                    ) : (
                                        <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden group">
                                            <img src={imagePreview} alt="Preview" className="h-32 w-auto object-cover" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => { setImageFile(null); setImagePreview(miDiario?.imagen_url || null); fileInputRef.current.value = ''; }}
                                                    className="bg-white/90 hover:bg-white text-red-600 font-bold px-3 py-1.5 rounded-lg text-xs shadow flex items-center gap-1">
                                                    <X size={12} /> Quitar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-1">
                                    {(editing && miDiario) && (
                                        <button type="button" onClick={() => setEditing(false)}
                                            className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">
                                            Cancelar
                                        </button>
                                    )}
                                    <button type="button" onClick={handleSave} disabled={saving || !form.actividades.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors">
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        {miDiario ? 'Actualizar diario' : 'Guardar diario'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!miDiario && !editing && (
                            <button onClick={() => setEditing(true)}
                                className="w-full border-2 border-dashed border-violet-200 hover:border-violet-400 rounded-2xl p-6 text-center transition-colors group">
                                <PenLine size={28} className="text-violet-200 group-hover:text-violet-400 mx-auto mb-2 transition-colors" />
                                <p className="text-violet-400 group-hover:text-violet-600 font-bold text-sm transition-colors">
                                    Registrar mi diario de campo
                                </p>
                                <p className="text-violet-300 text-xs mt-1">Documenta tus actividades, horas y aprendizajes</p>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
