/* eslint-disable */
/**
 * MisPracticas.jsx
 * Vista del estudiante: ver sus prácticas, sesiones de práctica
 * y registrar sus actividades + reflexiones pedagógicas.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ClipboardList, Calendar, MapPin, Check, X, Loader2, AlertTriangle,
    PenLine, BookOpen, Save, ChevronDown, ChevronUp, Plus, ArrowLeft,
    MessageSquare, CheckCircle2, Pencil, Image as ImageIcon, Upload,
    User as UserIcon, Target, Building2, Phone, Mail, Info
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

/* ══════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function MisPracticas() {
    const { user } = useUser();
    const [practicas, setPracticas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [selected, setSelected] = useState(null); // práctica activa

    // Modal state for joining via code
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
            if (r.data.length === 1) setSelected(r.data[0]);
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

    if (practicas.length === 0) {
        return (
            <div className="max-w-xl mx-auto py-32 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                    <ClipboardList size={40} className="text-slate-300" />
                </div>
                <h2 className="text-xl font-black text-slate-700 mb-2">Sin prácticas inscritas</h2>
                <p className="text-slate-400 text-sm mb-6">Pide a tu profesor de prácticas el código para unirte.</p>
                <button
                    onClick={() => setShowJoinModal(true)}
                    className="inline-flex items-center gap-2 bg-upn-600 hover:bg-upn-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-upn-600/20"
                >
                    <Plus size={18} /> Unirme con código
                </button>
                {showJoinModal && <JoinModal joinCode={joinCode} setJoinCode={setJoinCode} joining={joining} handleJoin={handleJoin} close={() => setShowJoinModal(false)} />}
                <Toast toast={toast} onClose={() => setToast(null)} />
            </div>
        );
    }

    if (!selected) {
        // Selector de práctica
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs font-bold text-upn-500 uppercase tracking-wider mb-1">Mi módulo</p>
                        <h1 className="text-3xl font-black text-slate-900">Mis Prácticas</h1>
                    </div>
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="flex items-center gap-1.5 bg-upn-50 hover:bg-upn-100 text-upn-600 font-bold py-2 px-4 rounded-xl border border-upn-200 transition-colors text-sm"
                    >
                        <Plus size={16} /> Código
                    </button>
                </div>
                <div className="space-y-3">
                    {practicas.map(p => (
                        <button key={p.id} onClick={() => setSelected(p)}
                            className="w-full text-left bg-white rounded-2xl border border-slate-200 hover:border-upn-400 hover:shadow-xl hover:shadow-upn-600/5 p-5 transition-all group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-black text-slate-900 text-lg group-hover:text-upn-700 transition-colors">{p.name}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">{p.year} · {p.period === 1 ? '1er' : '2do'} semestre</p>
                                    {p.profesor_info && <p className="text-xs text-slate-400 mt-1">👤 {p.profesor_info.full_name}</p>}
                                </div>
                                <div className="w-12 h-12 bg-upn-50 rounded-2xl flex items-center justify-center group-hover:bg-upn-600 transition-colors">
                                    <ChevronDown size={20} className="text-upn-400 group-hover:text-white -rotate-90 transition-colors" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
                {showJoinModal && <JoinModal joinCode={joinCode} setJoinCode={setJoinCode} joining={joining} handleJoin={handleJoin} close={() => setShowJoinModal(false)} />}
                <Toast toast={toast} onClose={() => setToast(null)} />
            </div>
        );
    }

    return (
        <PracticaView practica={selected} user={user} showToast={showToast}
            onBack={practicas.length > 1 ? () => setSelected(null) : null} />
    );
}

/* ══════════════════════════════════════════════════════════
   MODAL PARA UNIRSE CON CÓDIGO
══════════════════════════════════════════════════════════ */
function JoinModal({ joinCode, setJoinCode, joining, handleJoin, close }) {
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                        <div>
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="Ej: A1B2C3"
                                maxLength={6}
                                className="w-full text-center text-3xl font-bold tracking-widest px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-upn-500 focus:ring-4 focus:ring-upn-500/10 outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={joining || joinCode.length !== 6}
                            className="w-full flex justify-center items-center gap-2 bg-upn-600 hover:bg-upn-700 disabled:bg-upn-300 text-white font-bold py-3.5 rounded-xl transition-colors"
                        >
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
   VISTA DE UNA PRÁCTICA — historial de sesiones + reflexiones
══════════════════════════════════════════════════════════ */
function PracticaView({ practica, user, showToast, onBack }) {
    const [seguimientos, setSeguimientos] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get(`/practicas/seguimientos/?practica=${practica.id}`);
            setSeguimientos(r.data);
        } catch { showToast('Error al cargar sesiones', 'error'); }
        finally { setLoading(false); }
    }, [practica.id]);

    useEffect(() => { load(); }, [load]);

    // Stats del alumno
    const total = seguimientos.length;
    const misAsist = seguimientos.flatMap(s => s.asistencias).filter(a => a.student === user.id);
    const presente = misAsist.filter(a => a.status === 'PRESENT').length;
    const ausente = misAsist.filter(a => a.status === 'ABSENT').length;
    const conRefl = seguimientos.filter(s => s.reflexiones?.some(r => r.student === user.id)).length;

    // Sección desplegable de información
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div>
                {onBack && (
                    <button onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-upn-600 text-sm font-semibold mb-4 group transition-colors">
                        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> Volver a mis prácticas
                    </button>
                )}
                <p className="text-xs font-bold text-upn-500 uppercase tracking-wider mb-1">Mi Práctica</p>
                <h1 className="text-3xl font-black text-slate-900">{practica.name}</h1>
                <p className="text-slate-500 text-sm mt-1">{practica.year} · {practica.period === 1 ? '1er' : '2do'} semestre</p>
            </div>

            {/* ── Ficha de la Práctica (desplegable) ── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button onClick={() => setShowInfo(i => !i)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-upn-50 flex items-center justify-center">
                            <Info size={20} className="text-upn-500" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-slate-800">Información de la práctica</p>
                            <p className="text-xs text-slate-400">Profesor, sitios y objetivos</p>
                        </div>
                    </div>
                    {showInfo ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {showInfo && (
                    <div className="border-t border-slate-100 px-5 py-4 space-y-5">
                        {/* Profesor de prácticas */}
                        {practica.profesor_info && (
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <UserIcon size={18} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Profesor de Prácticas</p>
                                    <p className="font-bold text-slate-800">{practica.profesor_info.full_name}</p>
                                    {practica.profesor_info.email && (
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <Mail size={10} /> {practica.profesor_info.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sitios de práctica */}
                        {practica.sitios_detail && practica.sitios_detail.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                                    <Building2 size={11} /> Sitios de práctica
                                </p>
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

                        {/* Objetivos */}
                        {practica.objetivos_detail && practica.objetivos_detail.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                                    <Target size={11} /> Objetivos pedagógicos
                                </p>
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

                        {/* Programa */}
                        {practica.program_name && (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <BookOpen size={12} />
                                <span>Programa: <span className="font-semibold text-slate-600">{practica.program_name}</span></span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Sesiones', value: total, icon: Calendar, color: 'upn' },
                    { label: 'Asistidas', value: presente, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Ausencias', value: ausente, icon: AlertTriangle, color: 'red' },
                    { label: 'Reflexiones', value: conRefl, icon: PenLine, color: 'violet' },
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

            {/* Sesiones */}
            {loading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-upn-400 w-7 h-7" /></div>
                : seguimientos.length === 0
                    ? <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 text-center">
                        <Calendar size={36} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-semibold">Tu profesor de prácticas aún no ha registrado sesiones</p>
                    </div>
                    : <div className="space-y-3">
                        <h2 className="text-base font-bold text-slate-700">Mis sesiones de práctica</h2>
                        {seguimientos.map(seg => (
                            <SesionCard key={seg.id} seg={seg} userId={user.id} onUpdated={load} showToast={showToast} />
                        ))}
                    </div>
            }
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   CARD DE SESIÓN — asistencia del alumno + reflexión
══════════════════════════════════════════════════════════ */
function SesionCard({ seg, userId, onUpdated, showToast }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Evidencia fotográfica
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    // Asistencia del alumno en esta sesión
    const miAsist = seg.asistencias?.find(a => a.student === userId);
    const statusCfg = STATUS_CFG[miAsist?.status];

    // Reflexión existente
    const miReflexion = seg.reflexiones?.find(r => r.student === userId);

    const [form, setForm] = useState({
        actividades: miReflexion?.actividades || '',
        reflexion_pedagogica: miReflexion?.reflexion_pedagogica || '',
        aprendizajes: miReflexion?.aprendizajes || '',
    });

    // Sincronizar si la reflexión cambia (por reload)
    useEffect(() => {
        if (miReflexion) {
            setForm({
                actividades: miReflexion.actividades || '',
                reflexion_pedagogica: miReflexion.reflexion_pedagogica || '',
                aprendizajes: miReflexion.aprendizajes || '',
            });
            setImagePreview(miReflexion.imagen_url || null);
            setImageFile(null);
        }
    }, [seg]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showToast('La imagen es muy pesada (máx 5MB).', 'error');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!form.actividades.trim()) {
            showToast('Describe al menos las actividades realizadas', 'error');
            return;
        }
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('actividades', form.actividades);
            formData.append('reflexion_pedagogica', form.reflexion_pedagogica);
            formData.append('aprendizajes', form.aprendizajes);

            if (imageFile) {
                formData.append('imagen', imageFile);
            }

            if (miReflexion) {
                await api.patch(`/practicas/reflexiones/${miReflexion.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                formData.append('seguimiento', seg.id);
                formData.append('student', userId);
                await api.post('/practicas/reflexiones/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }

            showToast('Reflexión guardada ✓');
            setEditing(false);
            onUpdated();
        } catch (e) {
            const err = e.response?.data;
            showToast(err?.actividades?.[0] || err?.non_field_errors?.[0] || 'Error al guardar', 'error');
        }
        finally { setSaving(false); }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Cabecera colapsable */}
            <button className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setOpen(o => !o)}>
                {/* Estado asistencia */}
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
                    {/* Badge asistencia */}
                    {statusCfg && (
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusCfg.badge}`}>
                            {statusCfg.full}
                        </span>
                    )}
                    {/* Badge reflexión */}
                    {miReflexion && !editing && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-violet-50 text-violet-700 border-violet-200 flex items-center gap-1">
                            <PenLine size={10} /> Reflexión
                        </span>
                    )}
                    {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </button>

            {/* Contenido expandido */}
            {open && (
                <div className="border-t border-slate-100">
                    {/* Novedades del profesor */}
                    {seg.novedades && (
                        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                            <p className="text-xs font-bold text-amber-600 uppercase mb-1 flex items-center gap-1">
                                <MessageSquare size={12} /> Novedades del profesor
                            </p>
                            <p className="text-sm text-amber-900">{seg.novedades}</p>
                        </div>
                    )}

                    {/* Mi comentario de asistencia */}
                    {miAsist?.comment && (
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Comentario</p>
                            <p className="text-sm text-slate-700">{miAsist.comment}</p>
                        </div>
                    )}

                    {/* ── Reflexión pedagógica ── */}
                    <div className="px-5 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <PenLine size={16} className="text-violet-500" />
                                Mi reflexión pedagógica
                            </h4>
                            {miReflexion && !editing && (
                                <button onClick={() => setEditing(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 border border-violet-200 transition-colors">
                                    <Pencil size={11} /> Editar
                                </button>
                            )}
                        </div>

                        {!editing && miReflexion ? (
                            /* Vista solo-lectura */
                            <div className="space-y-4">
                                {[
                                    { label: 'Actividades realizadas', text: miReflexion.actividades, icon: BookOpen },
                                    { label: 'Reflexión pedagógica', text: miReflexion.reflexion_pedagogica, icon: PenLine },
                                    { label: 'Aprendizajes', text: miReflexion.aprendizajes, icon: CheckCircle2 },
                                ].filter(x => x.text).map(({ label, text, icon: Icon }) => (
                                    <div key={label} className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                                            <Icon size={11} />{label}
                                        </p>
                                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{text}</p>
                                    </div>
                                ))}

                                {miReflexion.imagen_url && (
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                                            <ImageIcon size={11} /> Evidencia
                                        </p>
                                        <div className="rounded-lg overflow-hidden border border-slate-200">
                                            <img src={miReflexion.imagen_url} alt="Evidencia práctica" className="w-full h-auto object-cover max-h-64" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Formulario edición */
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400">Documenta lo que hiciste, cómo lo viviste y qué aprendiste.</p>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                        <BookOpen size={11} /> Actividades realizadas <span className="text-red-400">*</span>
                                    </label>
                                    <textarea value={form.actividades} onChange={e => setForm({ ...form, actividades: e.target.value })}
                                        rows={4} placeholder="Describe las actividades que desarrollaste en esta sesión de práctica..."
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                        <PenLine size={11} /> Reflexión pedagógica
                                    </label>
                                    <textarea value={form.reflexion_pedagogica} onChange={e => setForm({ ...form, reflexion_pedagogica: e.target.value })}
                                        rows={4} placeholder="¿Cómo fue tu actuación pedagógica? ¿Qué estrategias usaste? ¿Qué funcionó y qué no?"
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                        <CheckCircle2 size={11} /> Aprendizajes y mejoras
                                    </label>
                                    <textarea value={form.aprendizajes} onChange={e => setForm({ ...form, aprendizajes: e.target.value })}
                                        rows={3} placeholder="¿Qué aprendiste? ¿Qué harías diferente la próxima vez?"
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all" />
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
                                            <span className="text-sm font-semibold text-slate-500 group-hover:text-violet-600">Subir foto o documento... (Máx 5MB)</span>
                                        </button>
                                    ) : (
                                        <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden group">
                                            <img src={imagePreview} alt="Preview" className="h-32 w-auto object-cover" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => { setImageFile(null); setImagePreview(miReflexion?.imagen_url || null); fileInputRef.current.value = ''; }}
                                                    className="bg-white/90 hover:bg-white text-red-600 font-bold px-3 py-1.5 rounded-lg text-xs shadow flex items-center gap-1">
                                                    <X size={12} /> Quitar imagen
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-1">
                                    {(editing && miReflexion) && (
                                        <button type="button" onClick={() => setEditing(false)}
                                            className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">
                                            Cancelar
                                        </button>
                                    )}
                                    <button type="button" onClick={handleSave} disabled={saving || !form.actividades.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors">
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        {miReflexion ? 'Actualizar reflexión' : 'Guardar reflexión'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Invitación si no tiene reflexión y no está editando */}
                        {!miReflexion && !editing && (
                            <button onClick={() => setEditing(true)}
                                className="w-full border-2 border-dashed border-violet-200 hover:border-violet-400 rounded-2xl p-6 text-center transition-colors group">
                                <PenLine size={28} className="text-violet-200 group-hover:text-violet-400 mx-auto mb-2 transition-colors" />
                                <p className="text-violet-400 group-hover:text-violet-600 font-bold text-sm transition-colors">
                                    Registrar mi reflexión pedagógica
                                </p>
                                <p className="text-violet-300 text-xs mt-1">Documenta tus actividades y aprendizajes de esta sesión</p>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
