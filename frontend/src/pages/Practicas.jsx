/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import {
    MapPin, Target, BookOpen, Plus, Edit2, Trash2, X, Check,
    Loader2, AlertTriangle, Search, QrCode, Users, ChevronRight,
    Building2, ClipboardList, UserCheck, Hash
} from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

// ─── Helpers ───────────────────────────────────────────────────────────────
const Toast = ({ toast, onClose }) => {
    if (!toast) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-medium
            ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span>{toast.message}</span>
            <button onClick={onClose} className="hover:bg-white/20 rounded p-0.5"><X size={15} /></button>
        </div>
    );
};

// ─── Tabs ──────────────────────────────────────────────────────────────────
const TAB_CONFIG = [
    { key: 'practicas', label: 'Prácticas', icon: ClipboardList },
    { key: 'sitios', label: 'Sitios', icon: MapPin },
    { key: 'objetivos', label: 'Objetivos', icon: Target },
    { key: 'docentes', label: 'Docentes', icon: UserCheck },
];

// ═══════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function PracticasPage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState('practicas');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Obtener el programa del coordinador (primer programa de PRACTICAS)
    const coordProgram = user?.coordinator_profiles?.find(cp => cp.coordinator_type === 'PRACTICAS');
    const programId = coordProgram?.program;
    const programName = coordProgram?.program_name || 'Tu programa';

    return (
        <div className="space-y-6">
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardList className="text-amber-600" />
                    Coordinación de Prácticas
                </h2>
                <p className="text-slate-500 mt-1">
                    Programa: <span className="font-semibold text-amber-700">{programName}</span>
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                            ${activeTab === key
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                            }`}
                    >
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'practicas' && <TabPracticas programId={programId} showToast={showToast} />}
            {activeTab === 'sitios' && <TabSitios programId={programId} showToast={showToast} />}
            {activeTab === 'objetivos' && <TabObjetivos programId={programId} showToast={showToast} />}
            {activeTab === 'docentes' && <TabDocentes programId={programId} showToast={showToast} />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: PRÁCTICAS
// ═══════════════════════════════════════════════════════════════════════════
function TabPracticas({ programId, showToast }) {
    const [practicas, setPracticas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [sitios, setSitios] = useState([]);
    const [objetivos, setObjetivos] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [form, setForm] = useState({
        name: '', program: programId, year: 2026, period: 1,
        profesor_practica: '', sitios: [], objetivos: [], is_active: true,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pRes, sRes, oRes, dRes] = await Promise.all([
                api.get('/practicas/practicas/'),
                api.get('/practicas/sitios/'),
                api.get('/practicas/objetivos/'),
                api.get(`/practicas/docentes/?program=${programId}`),
            ]);
            setPracticas(pRes.data);
            setSitios(sRes.data);
            setObjetivos(oRes.data);
            setDocentes(dRes.data);
        } catch (e) {
            showToast('Error al cargar prácticas', 'error');
        } finally {
            setLoading(false);
        }
    }, [programId]);

    useEffect(() => { if (programId) fetchData(); }, [fetchData]);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', program: programId, year: 2026, period: 1, profesor_practica: '', sitios: [], objetivos: [], is_active: true });
        setModalOpen(true);
    };

    const openEdit = (p) => {
        setEditing(p);
        setForm({
            name: p.name, program: p.program, year: p.year, period: p.period,
            profesor_practica: p.profesor_practica || '',
            sitios: p.sitios_detail?.map(s => s.id) || [],
            objetivos: p.objetivos_detail?.map(o => o.id) || [],
            is_active: p.is_active,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            const payload = { ...form, program: programId };
            if (editing) {
                await api.patch(`/practicas/practicas/${editing.id}/`, payload);
                showToast('Práctica actualizada');
            } else {
                await api.post('/practicas/practicas/', payload);
                showToast('Práctica creada');
            }
            setModalOpen(false);
            fetchData();
        } catch (e) {
            showToast(e.response?.data?.name?.[0] || 'Error al guardar', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/practicas/practicas/${deleteConfirm.id}/`);
            showToast('Práctica eliminada');
            setDeleteConfirm(null);
            fetchData();
        } catch {
            showToast('Error al eliminar', 'error');
        }
    };

    const toggleMulti = (field, val) => {
        setForm(prev => {
            const arr = [...(prev[field] || [])];
            return { ...prev, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
        });
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-600 w-8 h-8" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">{practicas.length} práctica(s) registrada(s)</p>
                <button onClick={openCreate} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-amber-600/20 transition-colors">
                    <Plus size={16} /> Nueva Práctica
                </button>
            </div>

            {practicas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                    <ClipboardList size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">No hay prácticas registradas aún.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {practicas.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-slate-800 text-lg">{p.name}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                            {p.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                        <span>📅 {p.year} · {p.period === 1 ? '1er semestre' : '2do semestre'}</span>
                                        {p.profesor_name && <span>👨‍🏫 {p.profesor_name}</span>}
                                        <span>👥 {p.student_count} estudiante(s)</span>
                                    </div>
                                    {/* Sitios */}
                                    {p.sitios_detail?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {p.sitios_detail.map(s => (
                                                <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[11px] font-semibold">
                                                    <MapPin size={10} /> {s.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {/* QR Code */}
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                                            <Hash size={13} className="text-amber-600" />
                                            <span className="font-mono font-black text-amber-800 tracking-widest text-sm">{p.code}</span>
                                        </div>
                                        <span className="text-[11px] text-slate-400">Código QR de inscripción</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 ml-4 flex-shrink-0">
                                    <button onClick={() => openEdit(p)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Edit2 size={15} /></button>
                                    <button onClick={() => setDeleteConfirm(p)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal crear/editar */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                            <h3 className="text-lg font-bold text-slate-800">{editing ? 'Editar Práctica' : 'Nueva Práctica'}</h3>
                            <button onClick={() => setModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            {/* Nombre */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Nombre *</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ej: Práctica Comunitaria 2026-1"
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                            </div>

                            {/* Año y Semestre */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Año</label>
                                    <input type="number" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Semestre</label>
                                    <select value={form.period} onChange={e => setForm({ ...form, period: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                                        <option value={1}>1er semestre</option>
                                        <option value={2}>2do semestre</option>
                                    </select>
                                </div>
                            </div>

                            {/* Profesor de Práctica */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><UserCheck size={12} /> Profesor de Práctica</label>
                                <select value={form.profesor_practica} onChange={e => setForm({ ...form, profesor_practica: e.target.value || null })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                                    <option value="">— Sin asignar —</option>
                                    {docentes.map(d => (
                                        <option key={d.id} value={d.id}>{d.full_name} ({d.document_number})</option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-400">Solo docentes del programa con rol Docente o Profesor de Práctica.</p>
                            </div>

                            {/* Sitios */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin size={12} /> Sitios de Práctica</label>
                                {sitios.length === 0
                                    ? <p className="text-xs text-slate-400 italic">No hay sitios creados. Ve a la pestaña "Sitios" para crearlos.</p>
                                    : <div className="flex flex-wrap gap-2">{sitios.map(s => {
                                        const active = (form.sitios || []).includes(s.id);
                                        return (
                                            <button key={s.id} type="button" onClick={() => toggleMulti('sitios', s.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                                                    ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700'}`}>
                                                <MapPin size={11} /> {s.name}
                                                {active && <Check size={11} />}
                                            </button>
                                        );
                                    })}</div>
                                }
                            </div>

                            {/* Objetivos */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Target size={12} /> Objetivos</label>
                                {objetivos.length === 0
                                    ? <p className="text-xs text-slate-400 italic">No hay objetivos creados. Ve a la pestaña "Objetivos".</p>
                                    : <div className="flex flex-wrap gap-2">{objetivos.map(o => {
                                        const active = (form.objetivos || []).includes(o.id);
                                        return (
                                            <button key={o.id} type="button" onClick={() => toggleMulti('objetivos', o.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                                                    ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                                                <Target size={11} /> {o.name}
                                                {active && <Check size={11} />}
                                            </button>
                                        );
                                    })}</div>
                                }
                            </div>

                            {/* Activa */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-4 h-4 accent-amber-600" />
                                <span className="text-sm font-medium text-slate-700">Práctica activa</span>
                            </label>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                            <button onClick={handleSave} disabled={saving || !form.name.trim()}
                                className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                                {editing ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal eliminar */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={28} className="text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">¿Eliminar práctica?</h3>
                        <p className="text-slate-500 mb-4"><strong>{deleteConfirm.name}</strong></p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50">Cancelar</button>
                            <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 flex items-center justify-center gap-2">
                                <Trash2 size={15} /> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB GENÉRICO (Sitios y Objetivos son muy similares)
// ═══════════════════════════════════════════════════════════════════════════
function GenericCatalogTab({ endpoint, programId, showToast, icon: Icon, color, singular, plural, fields }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const emptyForm = fields.reduce((acc, f) => ({ ...acc, [f.key]: f.default ?? '' }), { program: programId });
    const [form, setForm] = useState(emptyForm);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/practicas/${endpoint}/`);
            setItems(res.data);
        } catch { showToast('Error al cargar', 'error'); }
        finally { setLoading(false); }
    }, [endpoint]);

    useEffect(() => { if (programId) fetch(); }, [fetch]);

    const openCreate = () => { setEditing(null); setForm({ ...emptyForm, program: programId }); setModalOpen(true); };
    const openEdit = (item) => {
        setEditing(item);
        setForm(fields.reduce((acc, f) => ({ ...acc, [f.key]: item[f.key] ?? '' }), { program: programId }));
        setModalOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editing) { await api.patch(`/practicas/${endpoint}/${editing.id}/`, form); showToast(`${singular} actualizado`); }
            else { await api.post(`/practicas/${endpoint}/`, form); showToast(`${singular} creado`); }
            setModalOpen(false); fetch();
        } catch (e) { showToast(e.response?.data?.name?.[0] || 'Error al guardar', 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/practicas/${endpoint}/${deleteConfirm.id}/`); showToast(`${singular} eliminado`); setDeleteConfirm(null); fetch(); }
        catch { showToast('No se puede eliminar', 'error'); }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className={`animate-spin w-8 h-8 text-${color}-600`} /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">{items.length} {plural.toLowerCase()}</p>
                <button onClick={openCreate} className={`flex items-center gap-2 bg-${color}-600 hover:bg-${color}-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-${color}-600/20 transition-colors`}>
                    <Plus size={16} /> Nuevo {singular}
                </button>
            </div>

            {items.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                    <Icon size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">No hay {plural.toLowerCase()} aún.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {items.map((item, i) => (
                        <div key={item.id} className={`px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center flex-shrink-0`}>
                                    <Icon size={20} className={`text-${color}-600`} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{item.name}</p>
                                    {item.address && <p className="text-xs text-slate-400">{item.address}</p>}
                                    {item.description && <p className="text-xs text-slate-400 truncate max-w-xs">{item.description}</p>}
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Edit2 size={15} /></button>
                                <button onClick={() => setDeleteConfirm(item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">{editing ? `Editar ${singular}` : `Nuevo ${singular}`}</h3>
                            <button onClick={() => setModalOpen(false)}><X size={18} className="text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {fields.map(f => (
                                <div key={f.key} className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{f.label}{f.required ? ' *' : ''}</label>
                                    {f.type === 'textarea'
                                        ? <textarea value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                            placeholder={f.placeholder} rows={3}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none" />
                                        : <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                            placeholder={f.placeholder}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                                    }
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50">Cancelar</button>
                            <button onClick={handleSave} disabled={saving || !form.name?.trim()}
                                className={`flex-1 py-2.5 bg-${color}-600 text-white rounded-xl text-sm font-bold hover:bg-${color}-700 disabled:opacity-50 flex items-center justify-center gap-2`}>
                                {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                                {editing ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                        <AlertTriangle size={40} className="mx-auto text-red-500 mb-3" />
                        <p className="font-bold text-slate-800 mb-4">¿Eliminar <strong>{deleteConfirm.name}</strong>?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold">Cancelar</button>
                            <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TabSitios({ programId, showToast }) {
    return <GenericCatalogTab
        endpoint="sitios" programId={programId} showToast={showToast}
        icon={MapPin} color="blue" singular="Sitio" plural="Sitios de Práctica"
        fields={[
            { key: 'name', label: 'Nombre', placeholder: 'Ej: IED El Bosque', required: true },
            { key: 'address', label: 'Dirección', placeholder: 'Ej: Calle 100 #20-30' },
            { key: 'description', label: 'Descripción', placeholder: 'Contexto del sitio...', type: 'textarea' },
        ]}
    />;
}

function TabObjetivos({ programId, showToast }) {
    return <GenericCatalogTab
        endpoint="objetivos" programId={programId} showToast={showToast}
        icon={Target} color="emerald" singular="Objetivo" plural="Objetivos de Práctica"
        fields={[
            { key: 'name', label: 'Objetivo', placeholder: 'Ej: Aplicar métodos pedagógicos...', required: true },
            { key: 'description', label: 'Descripción ampliada', placeholder: 'Detalle del objetivo...', type: 'textarea' },
        ]}
    />;
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: DOCENTES DEL PROGRAMA
// ═══════════════════════════════════════════════════════════════════════════
function TabDocentes({ programId, showToast }) {
    const [docentes, setDocentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchDocentes = useCallback(async (q = '') => {
        setLoading(true);
        try {
            const res = await api.get(`/practicas/docentes/?program=${programId}${q ? `&q=${q}` : ''}`);
            setDocentes(res.data);
        } catch { showToast('Error al cargar docentes', 'error'); }
        finally { setLoading(false); }
    }, [programId]);

    useEffect(() => { if (programId) fetchDocentes(); }, [fetchDocentes]);

    const handleSearch = (e) => {
        const q = e.target.value;
        setSearch(q);
        fetchDocentes(q);
    };

    const ROLE_LABELS = { TEACHER: 'Docente', PRACTICE_TEACHER: 'Prof. Práctica', COORDINATOR: 'Coordinador', ADMIN: 'Admin', STUDENT: 'Estudiante' };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text" value={search} onChange={handleSearch}
                        placeholder="Buscar por nombre, cédula o correo..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-100"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-amber-600 w-7 h-7" /></div>
            ) : docentes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                    <UserCheck size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">No se encontraron docentes en este programa.</p>
                    <p className="text-slate-300 text-sm mt-1">Asegúrate de que los docentes tengan el programa asignado en Usuarios.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <UserCheck size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase">{docentes.length} docente(s) del programa</span>
                    </div>
                    {docentes.map((d, i) => (
                        <div key={d.id} className={`px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                                {d.photo
                                    ? <img src={d.photo} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-sm">{d.full_name[0]}</div>
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 truncate">{d.full_name}</p>
                                <p className="text-xs text-slate-400">{d.email}</p>
                            </div>
                            <div className="flex flex-wrap gap-1 flex-shrink-0">
                                {(d.roles?.length > 0 ? d.roles : [d.role]).map(r => (
                                    <span key={r} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border
                                        ${r === 'PRACTICE_TEACHER' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                        {ROLE_LABELS[r] || r}
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs font-mono text-slate-400 hidden sm:block">{d.document_number}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
