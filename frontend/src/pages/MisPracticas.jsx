/* eslint-disable */
/**
 * MisPracticas.jsx — Vista del estudiante
 * Orquestador: lista de prácticas → selección → PracticaView con tabs.
 * SesionCard → components/practicas/misPracticas/SesionCard.jsx
 * TareaCard  → components/practicas/misPracticas/TareaCard.jsx
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    ClipboardList, Calendar, Check, X, Loader2, AlertTriangle,
    PenLine, BookOpen, CheckCircle2, Plus, ArrowLeft,
    User as UserIcon, Target, Building2, Phone, Mail, Info,
    Clock, ListChecks, ChevronRight, MapPin
} from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import SesionCard from '../components/practicas/misPracticas/SesionCard';
import TareaCard from '../components/practicas/misPracticas/TareaCard';

// ── Toast ─────────────────────────────────────────────────
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

// ── Modal Unirse con código ───────────────────────────────
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
                        <button onClick={close} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={18} /></button>
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

// ── Tabs de la práctica seleccionada ─────────────────────
const TABS = [
    { key: 'sesiones', label: 'Sesiones y Diario', icon: Calendar },
    { key: 'tareas', label: 'Tareas', icon: ListChecks },
    { key: 'info', label: 'Información', icon: Info },
];

function TabInfo({ practica }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-5 space-y-5">
            {practica.profesor_info && (
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0"><UserIcon size={18} className="text-blue-500" /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Profesor de Prácticas</p>
                        <p className="font-bold text-slate-800">{practica.profesor_info.full_name}</p>
                        {practica.profesor_info.email && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={10} /> {practica.profesor_info.email}</p>}
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
                    <BookOpen size={12} /><span>Programa: <span className="font-semibold text-slate-600">{practica.program_name}</span></span>
                </div>
            )}
        </div>
    );
}

// ── Vista detalle de una práctica ─────────────────────────
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
            setSeguimientos(segRes.data); setTareas(tarRes.data);
        } catch { showToast('Error al cargar datos', 'error'); }
        finally { setLoading(false); }
    }, [practica.id]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const misAsist = seguimientos.flatMap(s => s.asistencias).filter(a => a.student === user.id);
    const presente = misAsist.filter(a => a.status === 'PRESENT').length;
    const ausente = misAsist.filter(a => a.status === 'ABSENT').length;
    const conDiario = seguimientos.filter(s => s.reflexiones?.some(r => r.student === user.id)).length;
    const totalHoras = seguimientos.flatMap(s => s.reflexiones || []).filter(r => r.student === user.id).reduce((s, r) => s + parseFloat(r.horas || 0), 0);

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-upn-600 text-sm font-semibold mb-4 group transition-colors">
                    <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> Volver a mis prácticas
                </button>
                <p className="text-xs font-bold text-upn-500 uppercase tracking-wider mb-1">Mi Práctica</p>
                <h1 className="text-3xl font-black text-slate-900">{practica.name}</h1>
                <p className="text-slate-500 text-sm mt-1">
                    {practica.year} · {practica.period === 1 ? '1er' : '2do'} semestre
                    {practica.profesor_info && <><> · </><UserIcon size={12} className="inline mb-0.5" /> {practica.profesor_info.full_name}</>}
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { label: 'Sesiones', value: seguimientos.length, icon: Calendar, color: 'upn' },
                    { label: 'Asistidas', value: presente, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Ausencias', value: ausente, icon: AlertTriangle, color: 'red' },
                    { label: 'Diarios', value: conDiario, icon: PenLine, color: 'violet' },
                    { label: 'Horas', value: totalHoras.toFixed(1), icon: Clock, color: 'blue' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4">
                        <div className={`w-9 h-9 rounded-lg bg-${color}-50 flex items-center justify-center mb-2`}><Icon size={18} className={`text-${color}-500`} /></div>
                        <p className="text-xl font-black text-slate-800">{value}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all
                            ${activeTab === key ? 'bg-white text-upn-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Icon size={15} /> <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {loading
                ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-upn-400 w-7 h-7" /></div>
                : <>
                    {activeTab === 'sesiones' && (
                        seguimientos.length === 0
                            ? <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 text-center"><Calendar size={36} className="text-slate-200 mx-auto mb-3" /><p className="text-slate-400 font-semibold">Aún no hay sesiones registradas</p></div>
                            : <div className="space-y-3">{seguimientos.map(seg => <SesionCard key={seg.id} seg={seg} userId={user.id} onUpdated={loadAll} showToast={showToast} />)}</div>
                    )}
                    {activeTab === 'tareas' && (
                        tareas.length === 0
                            ? <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 text-center"><ListChecks size={36} className="text-slate-200 mx-auto mb-3" /><p className="text-slate-400 font-semibold">No hay tareas asignadas aún</p></div>
                            : <div className="space-y-3">{tareas.map(t => <TareaCard key={t.id} tarea={t} userId={user.id} onUpdated={loadAll} showToast={showToast} />)}</div>
                    )}
                    {activeTab === 'info' && <TabInfo practica={practica} />}
                </>
            }
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function MisPracticas() {
    const { user } = useUser();
    const [practicas, setPracticas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [selected, setSelected] = useState(null);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);

    const showToast = useCallback((msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 4500); }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try { const r = await api.get('/practicas/mis-practicas/'); setPracticas(r.data); }
        catch { showToast('Error al cargar tus prácticas', 'error'); }
        finally { setLoading(false); }
    }, []);

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!joinCode || joinCode.length !== 6) { showToast('El código debe tener 6 caracteres', 'error'); return; }
        setJoining(true);
        try {
            await api.post('/practicas/join/', { code: joinCode });
            showToast('¡Te has unido a la práctica exitosamente!');
            setShowJoinModal(false);
            setJoinCode('');
            load();
        } catch (e) { showToast(e.response?.data?.error || 'Error al unirse a la práctica', 'error'); }
        finally { setJoining(false); }
    };

    useEffect(() => { load(); }, [load]);

    if (loading) return <div className="flex flex-col items-center justify-center py-32"><Loader2 className="animate-spin text-upn-500 w-10 h-10 mb-4" /><p className="text-slate-400 font-medium">Cargando tus prácticas...</p></div>;

    if (selected) return <><PracticaView practica={selected} user={user} showToast={showToast} onBack={() => setSelected(null)} /><Toast toast={toast} onClose={() => setToast(null)} /></>;

    if (practicas.length === 0) return (
        <div className="max-w-xl mx-auto py-32 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-5"><ClipboardList size={40} className="text-slate-300" /></div>
            <h2 className="text-xl font-black text-slate-700 mb-2">Sin prácticas inscritas</h2>
            <p className="text-slate-400 text-sm mb-6">Pide a tu profesor de prácticas el código para unirte.</p>
            <button onClick={() => setShowJoinModal(true)} className="inline-flex items-center gap-2 bg-upn-600 hover:bg-upn-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-upn-600/20">
                <Plus size={18} /> Unirme con código
            </button>
            {showJoinModal && <JoinModal joinCode={joinCode} setJoinCode={setJoinCode} joining={joining} handleJoin={handleJoin} close={() => setShowJoinModal(false)} />}
            <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-xs font-bold text-upn-500 uppercase tracking-wider mb-1">Mi módulo</p>
                    <h1 className="text-3xl font-black text-slate-900">Mis Prácticas</h1>
                </div>
                <button onClick={() => setShowJoinModal(true)} className="flex items-center gap-1.5 bg-upn-50 hover:bg-upn-100 text-upn-600 font-bold py-2 px-4 rounded-xl border border-upn-200 transition-colors text-sm">
                    <Plus size={16} /> Código
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase text-xs">Práctica</th>
                                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase text-xs hidden sm:table-cell">Profesor</th>
                                <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase text-xs">Periodo</th>
                                <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase text-xs hidden md:table-cell">Estudiantes</th>
                                <th className="text-right px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {practicas.map(p => (
                                <tr key={p.id} onClick={() => setSelected(p)} className="hover:bg-upn-50/50 cursor-pointer transition-colors group">
                                    <td className="px-5 py-4">
                                        <p className="font-bold text-slate-800 group-hover:text-upn-600 transition-colors">{p.name}</p>
                                        {p.program_name && <p className="text-xs text-slate-400 mt-0.5">{p.program_name}</p>}
                                    </td>
                                    <td className="px-4 py-4 hidden sm:table-cell"><p className="text-slate-600">{p.profesor_info?.full_name || '—'}</p></td>
                                    <td className="px-4 py-4 text-center"><span className="bg-upn-50 text-upn-600 font-bold text-xs px-2.5 py-1 rounded-full">{p.year}-{p.period}</span></td>
                                    <td className="px-4 py-4 text-center hidden md:table-cell"><span className="text-slate-500 font-semibold">{p.student_count}</span></td>
                                    <td className="px-5 py-4 text-right"><ChevronRight size={16} className="text-slate-300 group-hover:text-upn-500 transition-colors inline" /></td>
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
