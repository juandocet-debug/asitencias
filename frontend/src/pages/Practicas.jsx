/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin, Target, Plus, Edit2, Trash2, X, Check,
    Loader2, AlertTriangle, Search, Users, ChevronRight,
    ClipboardList, UserCheck, Hash, Phone, Smartphone, User,
    QrCode, UserPlus, ArrowRight, Building2, ChevronDown,
    Eye, MoreVertical, Calendar
} from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

/* ──────────────────────────────────────────────────────────
   COMPONENTES GLOBALES
────────────────────────────────────────────────────────── */
const Toast = ({ toast, onClose }) => {
    if (!toast) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-semibold text-sm
            animate-in slide-in-from-bottom-4 fade-in
            ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span>{toast.message}</span>
            <button onClick={onClose} className="ml-1 hover:bg-white/20 rounded-lg p-0.5 transition-colors"><X size={14} /></button>
        </div>
    );
};

const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
    if (!open) return null;
    const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className={`bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <h3 className="text-base font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
                {footer && <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">{footer}</div>}
            </div>
        </div>
    );
};

const Field = ({ label, children, hint }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
        {children}
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
);

const Input = ({ icon: Icon, ...props }) => (
    <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
        <input
            {...props}
            className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
                text-slate-800 placeholder:text-slate-300
                focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 transition-all`}
        />
    </div>
);

const Textarea = (props) => (
    <textarea
        {...props}
        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300
            focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 transition-all resize-none"
    />
);

const Select = ({ children, ...props }) => (
    <select
        {...props}
        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800
            focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 transition-all appearance-none cursor-pointer"
    >
        {children}
    </select>
);

const BtnPrimary = ({ loading, children, disabled, className = '', ...props }) => (
    <button
        {...props}
        disabled={loading || disabled}
        className={`flex items-center justify-center gap-2 px-5 py-2.5 bg-upn-600 hover:bg-upn-700 text-white font-bold text-sm rounded-xl
            shadow-lg shadow-upn-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {children}
    </button>
);

const BtnSecondary = ({ children, className = '', ...props }) => (
    <button {...props} className={`px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors ${className}`}>
        {children}
    </button>
);

const EmptyState = ({ icon: Icon, title, subtitle }) => (
    <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Icon size={36} className="text-slate-300" />
        </div>
        <p className="font-bold text-slate-600 text-base">{title}</p>
        {subtitle && <p className="text-slate-400 text-sm mt-1 text-center max-w-xs">{subtitle}</p>}
    </div>
);

/* ──────────────────────────────────────────────────────────
   TABS
────────────────────────────────────────────────────────── */
const TABS = [
    { key: 'practicas', label: 'Prácticas', icon: ClipboardList },
    { key: 'sitios', label: 'Sitios', icon: Building2 },
    { key: 'objetivos', label: 'Objetivos', icon: Target },
    { key: 'docentes', label: 'Docentes', icon: UserCheck },
];

/* ══════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function PracticasPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('practicas');
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4500);
    }, []);

    const coordProfile = user?.coordinator_profiles?.find(cp => cp.coordinator_type === 'PRACTICAS');
    const programId = coordProfile?.program;
    const programName = coordProfile?.program_name || 'Tu programa';

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* ── Header ──────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold text-upn-500 uppercase tracking-wider mb-1">Módulo de Coordinación</p>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Prácticas</h1>
                    <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-4 h-4 rounded-full bg-upn-100 flex items-center justify-center">
                            <Building2 size={10} className="text-upn-600" />
                        </div>
                        <span className="text-sm text-slate-500 font-medium">{programName}</span>
                    </div>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────────── */}
            <div className="flex gap-1.5 flex-wrap bg-slate-100/60 p-1.5 rounded-2xl w-fit">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                            ${activeTab === key
                                ? 'bg-white text-upn-700 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                            }`}
                    >
                        <Icon size={15} />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Content ──────────────────────────────────────────── */}
            {activeTab === 'practicas' && <TabPracticas programId={programId} showToast={showToast} navigate={navigate} />}
            {activeTab === 'sitios' && <TabSitios programId={programId} showToast={showToast} />}
            {activeTab === 'objetivos' && <TabObjetivos programId={programId} showToast={showToast} />}
            {activeTab === 'docentes' && <TabDocentes programId={programId} showToast={showToast} />}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   TAB: PRÁCTICAS
══════════════════════════════════════════════════════════ */
function TabPracticas({ programId, showToast, navigate }) {
    const [practicas, setPracticas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [qrModal, setQrModal] = useState(null);   // practica seleccionada para QR
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [delConfirm, setDelConfirm] = useState(null);
    const [sitios, setSitios] = useState([]);
    const [objetivos, setObjetivos] = useState([]);
    const [docentes, setDocentes] = useState([]);

    const emptyForm = {
        name: '', program: programId, year: new Date().getFullYear(),
        period: 1, profesor_practica: '', sitios: [], objetivos: [], is_active: true,
    };
    const [form, setForm] = useState(emptyForm);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [pR, sR, oR, dR] = await Promise.all([
                api.get('/practicas/practicas/'),
                api.get('/practicas/sitios/'),
                api.get('/practicas/objetivos/'),
                programId ? api.get(`/practicas/docentes/?program=${programId}`) : Promise.resolve({ data: [] }),
            ]);
            setPracticas(pR.data);
            setSitios(sR.data);
            setObjetivos(oR.data);
            setDocentes(dR.data);
        } catch { showToast('Error al cargar datos', 'error'); }
        finally { setLoading(false); }
    }, [programId]);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditing(null); setForm({ ...emptyForm, program: programId }); setModalOpen(true); };
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
            const payload = { ...form, program: programId, profesor_practica: form.profesor_practica || null };
            if (editing) { await api.patch(`/practicas/practicas/${editing.id}/`, payload); showToast('Práctica actualizada'); }
            else { await api.post('/practicas/practicas/', payload); showToast('Práctica creada 🎉'); }
            setModalOpen(false);
            load();
        } catch (e) { showToast(e.response?.data?.name?.[0] || 'Error al guardar', 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/practicas/practicas/${delConfirm.id}/`); showToast('Práctica eliminada'); setDelConfirm(null); load(); }
        catch { showToast('No se puede eliminar', 'error'); }
    };

    const toggle = (field, val) => setForm(p => {
        const arr = [...(p[field] || [])];
        return { ...p, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-upn-500 w-8 h-8" /></div>;

    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400 font-medium">{practicas.length} práctica(s)</p>
                <BtnPrimary onClick={openCreate}>
                    <Plus size={16} /> Nueva Práctica
                </BtnPrimary>
            </div>

            {practicas.length === 0
                ? <EmptyState icon={ClipboardList} title="Sin prácticas aún" subtitle="Crea la primera práctica usando el botón superior." />
                : <div className="grid gap-4">
                    {practicas.map(p => <PracticaCard key={p.id} p={p} onEdit={openEdit} onDelete={setDelConfirm} onQR={setQrModal} onView={() => navigate(`/coordinator/practicas/${p.id}`)} />)}
                </div>
            }

            {/* ── Modal Crear / Editar ─────────────────────────────── */}
            <Modal
                open={modalOpen} onClose={() => setModalOpen(false)}
                title={editing ? 'Editar Práctica' : 'Nueva Práctica'}
                size="lg"
                footer={<>
                    <BtnSecondary onClick={() => setModalOpen(false)} className="flex-1">Cancelar</BtnSecondary>
                    <BtnPrimary onClick={handleSave} loading={saving} disabled={!form.name.trim()} className="flex-1">
                        {editing ? 'Guardar cambios' : 'Crear práctica'}
                    </BtnPrimary>
                </>}
            >
                <div className="space-y-5">
                    <Field label="Nombre de la práctica *">
                        <Input icon={ClipboardList} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Práctica Recreación Comunitaria 2026-1" />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Año">
                            <Input type="number" value={form.year} onChange={e => setForm({ ...form, year: +e.target.value })} />
                        </Field>
                        <Field label="Semestre">
                            <Select value={form.period} onChange={e => setForm({ ...form, period: +e.target.value })}>
                                <option value={1}>Primer semestre</option>
                                <option value={2}>Segundo semestre</option>
                            </Select>
                        </Field>
                    </div>

                    <Field label="Profesor de Práctica asignado" hint="Solo aparecen docentes del programa.">
                        <Select value={form.profesor_practica} onChange={e => setForm({ ...form, profesor_practica: e.target.value })}>
                            <option value="">— Sin asignar aún —</option>
                            {docentes.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                        </Select>
                    </Field>

                    {/* Sitios */}
                    <Field label="Sitios de práctica" hint={sitios.length === 0 ? 'Crea sitios en la pestaña "Sitios" primero.' : 'Selecciona uno o varios.'}>
                        {sitios.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                                {sitios.map(s => {
                                    const on = (form.sitios || []).includes(s.id);
                                    return (
                                        <button key={s.id} type="button" onClick={() => toggle('sitios', s.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                                                ${on ? 'bg-upn-600 text-white border-upn-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-upn-300 hover:text-upn-700'}`}>
                                            <MapPin size={11} />{s.name}{on && <Check size={10} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </Field>

                    {/* Objetivos */}
                    <Field label="Objetivos" hint={objetivos.length === 0 ? 'Crea objetivos en la pestaña "Objetivos" primero.' : undefined}>
                        {objetivos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                                {objetivos.map(o => {
                                    const on = (form.objetivos || []).includes(o.id);
                                    return (
                                        <button key={o.id} type="button" onClick={() => toggle('objetivos', o.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                                                ${on ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'}`}>
                                            <Target size={11} />{o.name}{on && <Check size={10} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </Field>

                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-upn-600' : 'bg-slate-200'} relative`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{form.is_active ? 'Práctica activa' : 'Práctica inactiva'}</span>
                    </label>
                </div>
            </Modal>

            {/* ── Modal QR / Agregar estudiante ───────────────────── */}
            {qrModal && <QRModal practica={qrModal} onClose={() => setQrModal(null)} showToast={showToast} onRefresh={load} />}

            {/* ── Modal Confirmar eliminar ─────────────────────────── */}
            <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Eliminar práctica" size="sm"
                footer={<>
                    <BtnSecondary onClick={() => setDelConfirm(null)} className="flex-1">Cancelar</BtnSecondary>
                    <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                        <Trash2 size={15} /> Eliminar
                    </button>
                </>}
            >
                <div className="text-center py-2">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={28} className="text-red-500" />
                    </div>
                    <p className="text-slate-600 text-sm">¿Eliminar <strong className="text-slate-800">{delConfirm?.name}</strong>? Esta acción no se puede deshacer.</p>
                </div>
            </Modal>
        </div>
    );
}

/* ── Card de práctica ── */
function PracticaCard({ p, onEdit, onDelete, onQR, onView }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 hover:border-upn-200 hover:shadow-lg hover:shadow-upn-50 transition-all overflow-hidden group">
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        {/* Header card */}
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-9 h-9 rounded-xl bg-upn-50 flex items-center justify-center flex-shrink-0">
                                <ClipboardList size={18} className="text-upn-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 leading-tight">{p.name}</h3>
                                <p className="text-xs text-slate-400">{p.year} · {p.period === 1 ? '1er sem.' : '2do sem.'}</p>
                            </div>
                            <span className={`ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0
                                ${p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {p.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>

                        {/* Info pills */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {p.profesor_info && (
                                <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-full">
                                    <UserCheck size={11} /> {p.profesor_info.full_name}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full">
                                <Users size={11} /> {p.student_count} estudiante(s)
                            </span>
                            {p.sitios_detail?.map(s => (
                                <span key={s.id} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                                    <MapPin size={11} /> {s.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button onClick={onView} className="flex items-center gap-1 px-3 py-1.5 bg-upn-50 text-upn-700 hover:bg-upn-100 border border-upn-200 rounded-xl text-xs font-bold transition-colors">
                            <Eye size={12} /> Ver
                        </button>
                        <button onClick={() => onQR(p)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors">
                            <QrCode size={12} /> QR
                        </button>
                        <div className="flex gap-1">
                            <button onClick={() => onEdit(p)} className="flex-1 p-1.5 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-lg transition-colors">
                                <Edit2 size={13} />
                            </button>
                            <button onClick={() => onDelete(p)} className="flex-1 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* QR Code visible */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Hash size={13} className="text-slate-400" />
                        <span className="font-mono font-black text-slate-700 tracking-widest text-sm">{p.code}</span>
                        <span className="text-[10px] text-slate-400 font-normal">código de inscripción</span>
                    </div>
                    <button onClick={onView} className="text-xs text-upn-500 hover:text-upn-700 font-semibold flex items-center gap-1 transition-colors">
                        Seguimiento <ArrowRight size={11} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Modal QR / Agregar estudiante ─────────────────────────── */
function QRModal({ practica, onClose, showToast, onRefresh }) {
    const [students, setStudents] = useState([]);
    const [loadStu, setLoadStu] = useState(true);
    const [docNum, setDocNum] = useState('');
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState(null);

    const loadStudents = useCallback(async () => {
        setLoadStu(true);
        try {
            const res = await api.get(`/practicas/practicas/${practica.id}/students/`);
            setStudents(res.data.students || []);
        } catch { showToast('Error al cargar estudiantes', 'error'); }
        finally { setLoadStu(false); }
    }, [practica.id]);

    useEffect(() => { loadStudents(); }, [loadStudents]);

    const handleAdd = async () => {
        if (!docNum.trim()) return;
        setAdding(true);
        try {
            const res = await api.post(`/practicas/practicas/${practica.id}/add-student/`, { document_number: docNum.trim() });
            showToast(res.data.message);
            setDocNum('');
            loadStudents();
        } catch (e) { showToast(e.response?.data?.error || 'Error al agregar', 'error'); }
        finally { setAdding(false); }
    };

    const handleRemove = async (studentId) => {
        setRemoving(studentId);
        try {
            const res = await api.post(`/practicas/practicas/${practica.id}/remove-student/`, { student_id: studentId });
            showToast(res.data.message);
            loadStudents();
        } catch { showToast('Error al quitar estudiante', 'error'); }
        finally { setRemoving(null); }
    };

    return (
        <Modal open={true} onClose={onClose} title={`Estudiantes — ${practica.name}`} size="md">
            {/* Código QR */}
            <div className="bg-upn-50 border border-upn-200 rounded-2xl p-4 mb-5 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-upn-500 uppercase mb-1">Código de inscripción</p>
                    <p className="font-mono font-black text-3xl text-upn-900 tracking-[0.3em]">{practica.code}</p>
                    <p className="text-[11px] text-upn-400 mt-1">Los estudiantes usan este código para unirse</p>
                </div>
                <QrCode size={48} className="text-upn-300" />
            </div>

            {/* Agregar por cédula */}
            <div className="mb-5">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Agregar por cédula</p>
                <div className="flex gap-2">
                    <Input
                        icon={Hash}
                        type="text"
                        value={docNum}
                        onChange={e => setDocNum(e.target.value)}
                        placeholder="Número de cédula del estudiante"
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    <BtnPrimary onClick={handleAdd} loading={adding} disabled={!docNum.trim()}>
                        <UserPlus size={15} />
                    </BtnPrimary>
                </div>
            </div>

            {/* Lista de inscritos */}
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Inscritos ({students.length})</p>
                {loadStu
                    ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-upn-400 w-6 h-6" /></div>
                    : students.length === 0
                        ? <div className="flex flex-col items-center py-8 text-slate-400">
                            <Users size={32} className="mb-2 opacity-30" />
                            <p className="text-sm">Sin estudiantes inscritos</p>
                        </div>
                        : <div className="space-y-2 max-h-64 overflow-y-auto">
                            {students.map(s => (
                                <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                                    <div className="w-8 h-8 rounded-full bg-upn-100 flex items-center justify-center flex-shrink-0 text-upn-700 font-bold text-sm">
                                        {s.full_name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{s.full_name}</p>
                                        <p className="text-[11px] text-slate-400">{s.document_number}</p>
                                    </div>
                                    <button onClick={() => handleRemove(s.id)} disabled={removing === s.id}
                                        className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                        {removing === s.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                }
            </div>
        </Modal>
    );
}

/* ══════════════════════════════════════════════════════════
   TAB: SITIOS
══════════════════════════════════════════════════════════ */
function TabSitios({ programId, showToast }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [delConfirm, setDelConfirm] = useState(null);

    const empty = { name: '', address: '', description: '', contact_name: '', phone_fixed: '', phone_mobile: '', program: programId };
    const [form, setForm] = useState(empty);

    const load = useCallback(async () => {
        setLoading(true);
        try { const r = await api.get('/practicas/sitios/'); setItems(r.data); }
        catch { showToast('Error al cargar sitios', 'error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditing(null); setForm({ ...empty, program: programId }); setModalOpen(true); };
    const openEdit = (item) => { setEditing(item); setForm({ ...item, program: programId }); setModalOpen(true); };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (editing) { await api.patch(`/practicas/sitios/${editing.id}/`, form); showToast('Sitio actualizado'); }
            else { await api.post('/practicas/sitios/', form); showToast('Sitio creado'); }
            setModalOpen(false); load();
        } catch (e) { showToast(e.response?.data?.name?.[0] || 'Error al guardar', 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/practicas/sitios/${delConfirm.id}/`); showToast('Sitio eliminado'); setDelConfirm(null); load(); }
        catch { showToast('No se puede eliminar (está en uso)', 'error'); }
    };

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-upn-500 w-8 h-8" /></div>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400 font-medium">{items.length} sitio(s)</p>
                <BtnPrimary onClick={openCreate}><Plus size={16} /> Nuevo Sitio</BtnPrimary>
            </div>

            {items.length === 0
                ? <EmptyState icon={Building2} title="Sin sitios de práctica" subtitle="Crea sitios reutilizables para asignar a tus prácticas." />
                : <div className="grid gap-3">
                    {items.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl border border-slate-200 hover:border-upn-200 p-5 flex items-start gap-4 group transition-all hover:shadow-md">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Building2 size={22} className="text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                                    {!item.is_active && <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full">Inactivo</span>}
                                </div>
                                {item.address && (
                                    <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                        <MapPin size={11} className="text-slate-400 flex-shrink-0" /> {item.address}
                                    </p>
                                )}
                                {item.contact_name && (
                                    <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                        <User size={11} className="text-slate-400 flex-shrink-0" /> {item.contact_name}
                                        {item.phone_mobile && <span className="ml-2"><Smartphone size={10} className="inline mr-0.5 text-slate-400" />{item.phone_mobile}</span>}
                                        {item.phone_fixed && <span className="ml-1"><Phone size={10} className="inline mr-0.5 text-slate-400" />{item.phone_fixed}</span>}
                                    </p>
                                )}
                                {item.description && <p className="text-xs text-slate-400 mt-1 truncate">{item.description}</p>}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-xl transition-colors"><Edit2 size={15} /></button>
                                <button onClick={() => setDelConfirm(item)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={15} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            }

            {/* Modal Sitio */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Sitio' : 'Nuevo Sitio de Práctica'} size="md"
                footer={<>
                    <BtnSecondary onClick={() => setModalOpen(false)} className="flex-1">Cancelar</BtnSecondary>
                    <BtnPrimary onClick={handleSave} loading={saving} disabled={!form.name.trim()} className="flex-1">
                        {editing ? 'Guardar' : 'Crear sitio'}
                    </BtnPrimary>
                </>}
            >
                <div className="space-y-4">
                    <Field label="Nombre del sitio *">
                        <Input icon={Building2} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: IED El Bosque" />
                    </Field>
                    <Field label="Dirección">
                        <Input icon={MapPin} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Ej: Calle 100 #20-30, Bogotá" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Persona de contacto">
                            <Input icon={User} value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Nombre del contacto" />
                        </Field>
                        <Field label="Celular">
                            <Input icon={Smartphone} type="tel" value={form.phone_mobile} onChange={e => setForm({ ...form, phone_mobile: e.target.value })} placeholder="3XX XXX XXXX" />
                        </Field>
                    </div>
                    <Field label="Teléfono fijo">
                        <Input icon={Phone} type="tel" value={form.phone_fixed} onChange={e => setForm({ ...form, phone_fixed: e.target.value })} placeholder="(601) XXX XXXX" />
                    </Field>
                    <Field label="Descripción / contexto">
                        <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Breve descripción del lugar..." rows={3} />
                    </Field>
                </div>
            </Modal>

            <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Eliminar sitio" size="sm"
                footer={<>
                    <BtnSecondary onClick={() => setDelConfirm(null)} className="flex-1">Cancelar</BtnSecondary>
                    <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors">Eliminar</button>
                </>}
            >
                <p className="text-center text-slate-600 py-3">¿Eliminar <strong>{delConfirm?.name}</strong>?</p>
            </Modal>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   TAB: OBJETIVOS
══════════════════════════════════════════════════════════ */
function TabObjetivos({ programId, showToast }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [delConfirm, setDelConfirm] = useState(null);

    const empty = { name: '', description: '', program: programId };
    const [form, setForm] = useState(empty);

    const load = useCallback(async () => {
        setLoading(true);
        try { const r = await api.get('/practicas/objetivos/'); setItems(r.data); }
        catch { showToast('Error al cargar', 'error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditing(null); setForm({ ...empty, program: programId }); setModalOpen(true); };
    const openEdit = (item) => { setEditing(item); setForm({ name: item.name, description: item.description, program: programId }); setModalOpen(true); };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (editing) { await api.patch(`/practicas/objetivos/${editing.id}/`, form); showToast('Objetivo actualizado'); }
            else { await api.post('/practicas/objetivos/', form); showToast('Objetivo creado'); }
            setModalOpen(false); load();
        } catch (e) { showToast(e.response?.data?.name?.[0] || 'Error', 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/practicas/objetivos/${delConfirm.id}/`); showToast('Objetivo eliminado'); setDelConfirm(null); load(); }
        catch { showToast('No se puede eliminar', 'error'); }
    };

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-upn-500 w-8 h-8" /></div>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400 font-medium">{items.length} objetivo(s)</p>
                <BtnPrimary onClick={openCreate}><Plus size={16} /> Nuevo Objetivo</BtnPrimary>
            </div>

            {items.length === 0
                ? <EmptyState icon={Target} title="Sin objetivos" subtitle="Define los objetivos pedagógicos reutilizables de tu programa." />
                : <div className="grid gap-3">
                    {items.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl border border-slate-200 hover:border-upn-200 p-5 flex items-start gap-4 group transition-all hover:shadow-md">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                <Target size={18} className="text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-800">{item.name}</h3>
                                {item.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-xl transition-colors"><Edit2 size={15} /></button>
                                <button onClick={() => setDelConfirm(item)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={15} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            }

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Objetivo' : 'Nuevo Objetivo'} size="md"
                footer={<>
                    <BtnSecondary onClick={() => setModalOpen(false)} className="flex-1">Cancelar</BtnSecondary>
                    <BtnPrimary onClick={handleSave} loading={saving} disabled={!form.name.trim()} className="flex-1">
                        {editing ? 'Guardar' : 'Crear objetivo'}
                    </BtnPrimary>
                </>}
            >
                <div className="space-y-4">
                    <Field label="Objetivo *">
                        <Input icon={Target} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Aplicar metodologías pedagógicas en contexto real" />
                    </Field>
                    <Field label="Descripción ampliada">
                        <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalla el objetivo..." rows={4} />
                    </Field>
                </div>
            </Modal>

            <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Eliminar objetivo" size="sm"
                footer={<>
                    <BtnSecondary onClick={() => setDelConfirm(null)} className="flex-1">Cancelar</BtnSecondary>
                    <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors">Eliminar</button>
                </>}
            >
                <p className="text-center text-slate-600 py-3">¿Eliminar <strong>{delConfirm?.name}</strong>?</p>
            </Modal>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   TAB: DOCENTES
══════════════════════════════════════════════════════════ */
function TabDocentes({ programId, showToast }) {
    const [docentes, setDocentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = useCallback(async (q = '') => {
        setLoading(true);
        try {
            const url = `/practicas/docentes/?program=${programId}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
            const r = await api.get(url);
            setDocentes(r.data);
        } catch { showToast('Error al cargar docentes', 'error'); }
        finally { setLoading(false); }
    }, [programId]);

    useEffect(() => { if (programId) load(); }, [load]);

    const handleSearch = (e) => { const q = e.target.value; setSearch(q); load(q); };

    const ROLE_LABEL = { TEACHER: 'Docente', PRACTICE_TEACHER: 'Prof. Práctica' };

    return (
        <div className="space-y-5">
            {/* Search */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input type="text" value={search} onChange={handleSearch}
                        placeholder="Buscar docente por nombre, cédula o correo..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 transition-all" />
                </div>
            </div>

            {loading
                ? <div className="flex justify-center py-24"><Loader2 className="animate-spin text-upn-500 w-8 h-8" /></div>
                : docentes.length === 0
                    ? <EmptyState icon={UserCheck} title="Sin docentes encontrados"
                        subtitle="Verifica que los docentes tengan asignado este programa en Usuarios, o que pertenezcan a la misma facultad." />
                    : <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase">{docentes.length} docente(s)</p>
                        </div>
                        {docentes.map((d, i) => (
                            <div key={d.id} className={`px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-upn-100 flex items-center justify-center flex-shrink-0">
                                    {d.photo
                                        ? <img src={d.photo} alt="" className="w-full h-full object-cover" />
                                        : <span className="text-upn-700 font-bold text-sm">{d.full_name[0]}</span>
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 truncate">{d.full_name}</p>
                                    <p className="text-xs text-slate-400">{d.email}</p>
                                </div>
                                <div className="flex flex-wrap gap-1 flex-shrink-0">
                                    {(d.roles?.length > 0 ? d.roles : [d.role]).filter(r => ROLE_LABEL[r]).map(r => (
                                        <span key={r} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border
                                            ${r === 'PRACTICE_TEACHER'
                                                ? 'bg-upn-50 text-upn-700 border-upn-200'
                                                : 'bg-violet-50 text-violet-700 border-violet-200'
                                            }`}>
                                            {ROLE_LABEL[r]}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-xs font-mono text-slate-300 hidden lg:block">{d.document_number}</span>
                            </div>
                        ))}
                    </div>
            }
        </div>
    );
}
