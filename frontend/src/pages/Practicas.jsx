/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin, Target, Plus, Edit2, Trash2, X, Check,
    Loader2, AlertTriangle, Search, Users, ChevronDown, ChevronUp,
    ClipboardList, UserCheck, Hash, Phone, Smartphone, User,
    QrCode, UserPlus, Building2, Eye, Filter, Calendar,
    MoreVertical, ArrowUpDown
} from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

/* ──────────────────────────────────────────────────────────
   PRIMITIVOS DE UI
────────────────────────────────────────────────────────── */
const Toast = ({ toast, onClose }) => {
    if (!toast) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-semibold text-sm
            ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span>{toast.message}</span>
            <button onClick={onClose} className="ml-1 hover:bg-white/20 rounded-lg p-0.5"><X size={14} /></button>
        </div>
    );
};

const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
    if (!open) return null;
    const w = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${w[size]} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
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

const Field = ({ label, children, hint }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
        {children}
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
);

const InputField = ({ icon: Icon, ...props }) => (
    <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
        <input {...props} className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 transition-all`} />
    </div>
);

const Textarea = (props) => (
    <textarea {...props} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
        focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 resize-none transition-all" />
);

const Sel = ({ children, ...props }) => (
    <select {...props} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
        focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 appearance-none cursor-pointer">
        {children}
    </select>
);

const BtnPrimary = ({ loading, children, className = '', ...props }) => (
    <button {...props} disabled={loading || props.disabled}
        className={`flex items-center justify-center gap-2 px-5 py-2.5
            bg-upn-600 hover:bg-upn-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl
            shadow-lg shadow-upn-600/20 transition-all ${className}`}>
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
    </button>
);

const BtnSec = ({ children, className = '', ...props }) => (
    <button {...props} className={`px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors ${className}`}>
        {children}
    </button>
);

const EmptyState = ({ icon: Icon, title, subtitle }) => (
    <div className="flex flex-col items-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Icon size={36} className="text-slate-300" />
        </div>
        <p className="font-bold text-slate-600">{title}</p>
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
        <div className="space-y-8 max-w-6xl mx-auto">
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* Header */}
            <div>
                <p className="text-xs font-bold text-upn-500 uppercase tracking-wider mb-1">Módulo de Coordinación</p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Prácticas</h1>
                <div className="flex items-center gap-2 mt-1.5">
                    <Building2 size={13} className="text-upn-400" />
                    <span className="text-sm text-slate-500 font-medium">{programName}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 flex-wrap bg-slate-100/70 p-1.5 rounded-2xl w-fit">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                            ${activeTab === key ? 'bg-white text-upn-700 shadow border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Icon size={14} />{label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'practicas' && <TabPracticas programId={programId} showToast={showToast} navigate={navigate} />}
            {activeTab === 'sitios' && <TabSitios programId={programId} showToast={showToast} />}
            {activeTab === 'objetivos' && <TabObjetivos programId={programId} showToast={showToast} />}
            {activeTab === 'docentes' && <TabDocentes programId={programId} showToast={showToast} />}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   TAB PRÁCTICAS — Tabla con filtros y dropdown de acciones
══════════════════════════════════════════════════════════ */
function TabPracticas({ programId, showToast, navigate }) {
    const [all, setAll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [qrModal, setQrModal] = useState(null);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [delConfirm, setDelConfirm] = useState(null);
    const [sitios, setSitios] = useState([]);
    const [objetivos, setObjetivos] = useState([]);
    const [docentes, setDocentes] = useState([]);
    // Filtros
    const [search, setSearch] = useState('');
    const [fYear, setFYear] = useState('');
    const [fPeriod, setFPeriod] = useState('');
    const [fStatus, setFStatus] = useState('');

    const emptyForm = { name: '', program: programId, year: new Date().getFullYear(), period: 1, profesor_practica: '', sitios: [], objetivos: [], is_active: true };
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
            setAll(pR.data); setSitios(sR.data); setObjetivos(oR.data); setDocentes(dR.data);
        } catch { showToast('Error al cargar', 'error'); }
        finally { setLoading(false); }
    }, [programId]);

    useEffect(() => { load(); }, [load]);

    // Filtrado local
    const filtered = all.filter(p => {
        const q = search.toLowerCase();
        const matchQ = !q || p.name.toLowerCase().includes(q) || (p.profesor_info?.full_name || '').toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
        const matchY = !fYear || String(p.year) === fYear;
        const matchP = !fPeriod || String(p.period) === fPeriod;
        const matchS = !fStatus || (fStatus === 'active' ? p.is_active : !p.is_active);
        return matchQ && matchY && matchP && matchS;
    });

    const years = [...new Set(all.map(p => p.year))].sort((a, b) => b - a);

    const openCreate = () => { setEditing(null); setForm({ ...emptyForm, program: programId }); setModalOpen(true); };
    const openEdit = (p) => {
        setEditing(p);
        setForm({
            name: p.name, program: p.program, year: p.year, period: p.period,
            profesor_practica: p.profesor_practica || '',
            sitios: (p.sitios_detail || []).map(s => s.id),
            objetivos: (p.objetivos_detail || []).map(o => o.id),
            is_active: p.is_active
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
            setModalOpen(false); load();
        } catch (e) { showToast(e.response?.data?.name?.[0] || 'Error', 'error'); }
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
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, código o profesor..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400" />
                </div>
                <div className="flex gap-2">
                    <select value={fYear} onChange={e => setFYear(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none appearance-none cursor-pointer">
                        <option value="">Año</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={fPeriod} onChange={e => setFPeriod(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none appearance-none cursor-pointer">
                        <option value="">Semestre</option>
                        <option value="1">1er Sem</option>
                        <option value="2">2do Sem</option>
                    </select>
                    <select value={fStatus} onChange={e => setFStatus(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none appearance-none cursor-pointer">
                        <option value="">Estado</option>
                        <option value="active">Activas</option>
                        <option value="inactive">Inactivas</option>
                    </select>
                    <BtnPrimary onClick={openCreate} className="px-4 py-2">
                        <Plus size={15} /> Nueva
                    </BtnPrimary>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Cabecera */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-3">
                    <div className="col-span-4 text-[11px] font-bold text-slate-400 uppercase">Práctica</div>
                    <div className="col-span-2 text-[11px] font-bold text-slate-400 uppercase">Año / Sem.</div>
                    <div className="col-span-3 text-[11px] font-bold text-slate-400 uppercase">Profesor</div>
                    <div className="col-span-1 text-[11px] font-bold text-slate-400 uppercase text-center">Alumnos</div>
                    <div className="col-span-1 text-[11px] font-bold text-slate-400 uppercase text-center">Estado</div>
                    <div className="col-span-1 text-[11px] font-bold text-slate-400 uppercase text-right">Acc.</div>
                </div>

                {filtered.length === 0
                    ? <EmptyState icon={ClipboardList} title="Sin resultados" subtitle="Ajusta los filtros o crea una nueva práctica." />
                    : filtered.map((p, i) => (
                        <PracticaRow key={p.id} p={p}
                            onEdit={openEdit} onDelete={setDelConfirm}
                            onQR={setQrModal}
                            onView={() => navigate(`/coordinator/practicas/${p.id}`)}
                            last={i === filtered.length - 1}
                        />
                    ))
                }

                {filtered.length > 0 && (
                    <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 font-medium">
                        {filtered.length} de {all.length} práctica(s)
                    </div>
                )}
            </div>

            {/* ── Modal Crear/Editar ── */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Práctica' : 'Nueva Práctica'} size="lg"
                footer={<>
                    <BtnSec onClick={() => setModalOpen(false)} className="flex-1">Cancelar</BtnSec>
                    <BtnPrimary onClick={handleSave} loading={saving} disabled={!form.name.trim()} className="flex-1">
                        {editing ? 'Guardar cambios' : 'Crear práctica'}
                    </BtnPrimary>
                </>}>
                <div className="space-y-5">
                    <Field label="Nombre *">
                        <InputField icon={ClipboardList} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Práctica Recreación Comunitaria 2026-1" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Año"><InputField type="number" value={form.year} onChange={e => setForm({ ...form, year: +e.target.value })} /></Field>
                        <Field label="Semestre">
                            <Sel value={form.period} onChange={e => setForm({ ...form, period: +e.target.value })}>
                                <option value={1}>Primer semestre</option>
                                <option value={2}>Segundo semestre</option>
                            </Sel>
                        </Field>
                    </div>
                    <Field label="Profesor de Práctica" hint="Solo docentes del programa.">
                        <Sel value={form.profesor_practica} onChange={e => setForm({ ...form, profesor_practica: e.target.value })}>
                            <option value="">— Sin asignar —</option>
                            {docentes.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                        </Sel>
                    </Field>
                    <Field label="Sitios" hint={sitios.length === 0 ? 'Crea sitios en la pestaña "Sitios" primero.' : ''}>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {sitios.map(s => {
                                const on = (form.sitios || []).includes(s.id);
                                return <button key={s.id} type="button" onClick={() => toggle('sitios', s.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                                        ${on ? 'bg-upn-600 text-white border-upn-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-upn-300'}`}>
                                    <MapPin size={11} />{s.name}{on && <Check size={10} />}
                                </button>;
                            })}
                        </div>
                    </Field>
                    <Field label="Objetivos">
                        <div className="flex flex-wrap gap-2 mt-1">
                            {objetivos.map(o => {
                                const on = (form.objetivos || []).includes(o.id);
                                return <button key={o.id} type="button" onClick={() => toggle('objetivos', o.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                                        ${on ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'}`}>
                                    <Target size={11} />{o.name}{on && <Check size={10} />}
                                </button>;
                            })}
                        </div>
                    </Field>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                            className={`w-10 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-upn-600' : 'bg-slate-200'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{form.is_active ? 'Práctica activa' : 'Inactiva'}</span>
                    </label>
                </div>
            </Modal>

            {/* ── Modal QR ── */}
            {qrModal && <QRModal practica={qrModal} onClose={() => setQrModal(null)} showToast={showToast} onRefresh={load} />}

            {/* ── Confirmar eliminar ── */}
            <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Eliminar práctica" size="sm"
                footer={<>
                    <BtnSec onClick={() => setDelConfirm(null)} className="flex-1">Cancelar</BtnSec>
                    <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                        <Trash2 size={14} /> Eliminar
                    </button>
                </>}>
                <div className="text-center py-3">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <AlertTriangle size={26} className="text-red-500" />
                    </div>
                    <p className="text-slate-600 text-sm">¿Eliminar <strong>{delConfirm?.name}</strong>? Esta acción no se puede deshacer.</p>
                </div>
            </Modal>
        </div>
    );
}

/* ── Fila de tabla con dropdown de acciones ── */
function PracticaRow({ p, onEdit, onDelete, onQR, onView, last }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors ${!last ? 'border-b border-slate-100' : ''}`}>
            {/* Nombre + código */}
            <div className="col-span-4 min-w-0">
                <button onClick={onView} className="font-bold text-slate-800 hover:text-upn-700 text-sm text-left truncate block w-full transition-colors">
                    {p.name}
                </button>
                <span className="font-mono text-[11px] text-slate-400 tracking-widest">{p.code}</span>
            </div>

            {/* Año / Semestre */}
            <div className="col-span-2 text-sm text-slate-500">
                {p.year} · {p.period}er sem.
            </div>

            {/* Profesor */}
            <div className="col-span-3">
                {p.profesor_info
                    ? <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs flex-shrink-0">
                            {p.profesor_info.full_name[0]}
                        </div>
                        <span className="text-sm text-slate-700 truncate">{p.profesor_info.full_name}</span>
                    </div>
                    : <span className="text-xs text-slate-300 italic">Sin asignar</span>
                }
            </div>

            {/* Alumnos */}
            <div className="col-span-1 text-center">
                <span className="text-sm font-bold text-slate-700">{p.student_count}</span>
            </div>

            {/* Estado */}
            <div className="col-span-1 flex justify-center">
                <span className={`w-2 h-2 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} title={p.is_active ? 'Activa' : 'Inactiva'} />
            </div>

            {/* Acciones — dropdown */}
            <div className="col-span-1 flex justify-end" ref={ref}>
                <button onClick={() => setMenuOpen(m => !m)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical size={15} />
                </button>
                {menuOpen && (
                    <div className="absolute right-6 mt-8 z-20 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden w-44">
                        {[
                            { label: 'Ver seguimiento', icon: Eye, action: onView },
                            { label: 'Est. / QR', icon: QrCode, action: () => onQR(p) },
                            { label: 'Editar', icon: Edit2, action: () => onEdit(p) },
                            { label: 'Eliminar', icon: Trash2, action: () => onDelete(p), danger: true },
                        ].map(item => (
                            <button key={item.label} onClick={() => { setMenuOpen(false); item.action(); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors
                                    ${item.danger
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-slate-700 hover:bg-slate-50'}`}>
                                <item.icon size={14} />{item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Modal QR con imagen real escaneable ── */
function QRModal({ practica, onClose, showToast, onRefresh }) {
    const [students, setStudents] = useState([]);
    const [loadStu, setLoadStu] = useState(true);
    const [docNum, setDocNum] = useState('');
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState(null);
    const [tab, setTab] = useState('qr'); // 'qr' | 'list'

    const loadStudents = useCallback(async () => {
        setLoadStu(true);
        try {
            const r = await api.get(`/practicas/practicas/${practica.id}/students/`);
            setStudents(r.data.students || []);
        } catch { showToast('Error', 'error'); }
        finally { setLoadStu(false); }
    }, [practica.id]);

    useEffect(() => { loadStudents(); }, [loadStudents]);

    const handleAdd = async () => {
        if (!docNum.trim()) return;
        setAdding(true);
        try {
            const r = await api.post(`/practicas/practicas/${practica.id}/add-student/`, { document_number: docNum.trim() });
            showToast(r.data.message);
            setDocNum('');
            loadStudents();
        } catch (e) { showToast(e.response?.data?.error || 'Error', 'error'); }
        finally { setAdding(false); }
    };

    const handleRemove = async (id) => {
        setRemoving(id);
        try {
            const r = await api.post(`/practicas/practicas/${practica.id}/remove-student/`, { student_id: id });
            showToast(r.data.message);
            loadStudents();
        } catch { showToast('Error', 'error'); }
        finally { setRemoving(null); }
    };

    // QR real usando la API pública de qrserver.com — sin dependencias extra
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&ecc=M&data=${encodeURIComponent(`PRACTICA:${practica.code}`)}`;

    return (
        <Modal open={true} onClose={onClose} title={`Estudiantes — ${practica.name}`} size="md">
            {/* Sub-tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5">
                {[{ key: 'qr', label: 'Código QR' }, { key: 'list', label: `Lista (${students.length})` }].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
                            ${tab === t.key ? 'bg-white shadow text-upn-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'qr' && (
                <div className="flex flex-col items-center">
                    {/* QR real */}
                    <div className="border-8 border-white shadow-2xl rounded-3xl overflow-hidden mb-4">
                        <img src={qrUrl} alt="QR de práctica" width={220} height={220}
                            className="block" onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="bg-upn-50 border border-upn-200 rounded-2xl px-6 py-3 text-center mb-4">
                        <p className="text-xs font-bold text-upn-400 uppercase mb-1">Código de inscripción</p>
                        <p className="font-mono font-black text-3xl text-upn-900 tracking-[0.4em]">{practica.code}</p>
                    </div>
                    <p className="text-xs text-slate-400 text-center max-w-xs">Comparte el código o escanea el QR para unirse a esta práctica</p>

                    {/* Campo agregar por cédula */}
                    <div className="mt-5 w-full">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Agregar por cédula</p>
                        <div className="flex gap-2">
                            <InputField icon={Hash} value={docNum} onChange={e => setDocNum(e.target.value)}
                                placeholder="Cédula del estudiante"
                                onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                            <BtnPrimary onClick={handleAdd} loading={adding} disabled={!docNum.trim()} className="px-4">
                                <UserPlus size={15} />
                            </BtnPrimary>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'list' && (
                <div>
                    {loadStu
                        ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-upn-400 w-6 h-6" /></div>
                        : students.length === 0
                            ? <EmptyState icon={Users} title="Sin inscritos" subtitle="Agrega estudiantes desde la pestaña Código QR." />
                            : <div className="space-y-1">
                                {students.map(s => (
                                    <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group">
                                        <div className="w-8 h-8 rounded-full bg-upn-100 flex items-center justify-center text-upn-700 font-bold text-sm flex-shrink-0">
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
            )}
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
    const [search, setSearch] = useState('');

    const empty = { name: '', address: '', description: '', contact_name: '', phone_fixed: '', phone_mobile: '', program: programId };
    const [form, setForm] = useState(empty);

    const load = useCallback(async () => {
        setLoading(true);
        try { const r = await api.get('/practicas/sitios/'); setItems(r.data); }
        catch { showToast('Error', 'error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = items.filter(i =>
        !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.address?.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => { setEditing(null); setForm({ ...empty, program: programId }); setModalOpen(true); };
    const openEdit = (i) => { setEditing(i); setForm({ ...i, program: programId }); setModalOpen(true); };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (editing) { await api.patch(`/practicas/sitios/${editing.id}/`, form); showToast('Sitio actualizado'); }
            else { await api.post('/practicas/sitios/', form); showToast('Sitio creado'); }
            setModalOpen(false); load();
        } catch (e) { showToast(e.response?.data?.name?.[0] || 'Error', 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/practicas/sitios/${delConfirm.id}/`); showToast('Sitio eliminado'); setDelConfirm(null); load(); }
        catch { showToast('En uso, no se puede eliminar', 'error'); }
    };

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin w-8 h-8 text-upn-500" /></div>;

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar sitio..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100" />
                </div>
                <BtnPrimary onClick={openCreate}><Plus size={15} /> Nuevo sitio</BtnPrimary>
            </div>

            {filtered.length === 0
                ? <EmptyState icon={Building2} title="Sin sitios" subtitle="Crea sitios reutilizables para asignar a tus prácticas." />
                : <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-3">
                        <div className="col-span-3 text-[11px] font-bold text-slate-400 uppercase">Nombre</div>
                        <div className="col-span-3 text-[11px] font-bold text-slate-400 uppercase">Dirección</div>
                        <div className="col-span-3 text-[11px] font-bold text-slate-400 uppercase">Contacto</div>
                        <div className="col-span-2 text-[11px] font-bold text-slate-400 uppercase">Teléfonos</div>
                        <div className="col-span-1" />
                    </div>
                    {filtered.map((item, i) => (
                        <div key={item.id} className={`grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''} group`}>
                            <div className="col-span-3">
                                <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                                {!item.is_active && <span className="text-[10px] text-slate-400">Inactivo</span>}
                            </div>
                            <div className="col-span-3 text-xs text-slate-500 truncate">{item.address || '—'}</div>
                            <div className="col-span-3 text-xs text-slate-500 truncate">{item.contact_name || '—'}</div>
                            <div className="col-span-2 text-xs text-slate-500 space-y-0.5">
                                {item.phone_mobile && <p className="flex items-center gap-1"><Smartphone size={10} />{item.phone_mobile}</p>}
                                {item.phone_fixed && <p className="flex items-center gap-1"><Phone size={10} />{item.phone_fixed}</p>}
                                {!item.phone_mobile && !item.phone_fixed && <span>—</span>}
                            </div>
                            <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-lg"><Edit2 size={13} /></button>
                                <button onClick={() => setDelConfirm(item)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            }

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Sitio' : 'Nuevo Sitio'} size="md"
                footer={<><BtnSec onClick={() => setModalOpen(false)} className="flex-1">Cancelar</BtnSec>
                    <BtnPrimary onClick={handleSave} loading={saving} disabled={!form.name.trim()} className="flex-1">Guardar</BtnPrimary></>}>
                <div className="space-y-4">
                    <Field label="Nombre *"><InputField icon={Building2} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="IED El Bosque" /></Field>
                    <Field label="Dirección"><InputField icon={MapPin} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Calle 100 #20-30" /></Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Persona de contacto"><InputField icon={User} value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Nombre" /></Field>
                        <Field label="Celular"><InputField icon={Smartphone} value={form.phone_mobile} onChange={e => setForm({ ...form, phone_mobile: e.target.value })} placeholder="3XX XXX XXXX" /></Field>
                    </div>
                    <Field label="Teléfono fijo"><InputField icon={Phone} value={form.phone_fixed} onChange={e => setForm({ ...form, phone_fixed: e.target.value })} placeholder="(601) XXX XXXX" /></Field>
                    <Field label="Descripción"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Contexto del sitio..." rows={3} /></Field>
                </div>
            </Modal>

            <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Eliminar sitio" size="sm"
                footer={<><BtnSec onClick={() => setDelConfirm(null)} className="flex-1">Cancelar</BtnSec>
                    <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700">Eliminar</button></>}>
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
        catch { showToast('Error', 'error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (editing) { await api.patch(`/practicas/objetivos/${editing.id}/`, form); showToast('Actualizado'); }
            else { await api.post('/practicas/objetivos/', form); showToast('Creado'); }
            setModalOpen(false); load();
        } catch (e) { showToast(e.response?.data?.name?.[0] || 'Error', 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/practicas/objetivos/${delConfirm.id}/`); showToast('Eliminado'); setDelConfirm(null); load(); }
        catch { showToast('No se puede eliminar', 'error'); }
    };

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin w-8 h-8 text-upn-500" /></div>;

    return (
        <div className="space-y-5">
            <div className="flex justify-end">
                <BtnPrimary onClick={() => { setEditing(null); setForm({ ...empty, program: programId }); setModalOpen(true); }}>
                    <Plus size={15} /> Nuevo objetivo
                </BtnPrimary>
            </div>
            {items.length === 0
                ? <EmptyState icon={Target} title="Sin objetivos" subtitle="Define los objetivos pedagógicos de tu programa." />
                : <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {items.map((item, i) => (
                        <div key={item.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''} group`}>
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Target size={16} className="text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                {item.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditing(item); setForm({ name: item.name, description: item.description, program: programId }); setModalOpen(true); }}
                                    className="p-1.5 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-lg"><Edit2 size={13} /></button>
                                <button onClick={() => setDelConfirm(item)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            }
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Objetivo' : 'Nuevo Objetivo'} size="md"
                footer={<><BtnSec onClick={() => setModalOpen(false)} className="flex-1">Cancelar</BtnSec>
                    <BtnPrimary onClick={handleSave} loading={saving} disabled={!form.name.trim()} className="flex-1">Guardar</BtnPrimary></>}>
                <div className="space-y-4">
                    <Field label="Objetivo *"><InputField icon={Target} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Aplicar metodologías en contexto real" /></Field>
                    <Field label="Descripción"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalla el objetivo..." rows={4} /></Field>
                </div>
            </Modal>
            <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Eliminar" size="sm"
                footer={<><BtnSec onClick={() => setDelConfirm(null)} className="flex-1">Cancelar</BtnSec>
                    <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700">Eliminar</button></>}>
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
            const r = await api.get(`/practicas/docentes/?program=${programId}${q ? `&q=${encodeURIComponent(q)}` : ''}`);
            setDocentes(r.data);
        } catch { showToast('Error', 'error'); }
        finally { setLoading(false); }
    }, [programId]);

    useEffect(() => { if (programId) load(); }, [load]);

    const ROLE_LABEL = { TEACHER: 'Docente', PRACTICE_TEACHER: 'Prof. Práctica' };

    return (
        <div className="space-y-5">
            <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={search} onChange={e => { setSearch(e.target.value); load(e.target.value); }}
                    placeholder="Buscar docente por nombre, cédula o correo..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100" />
            </div>

            {loading
                ? <div className="flex justify-center py-24"><Loader2 className="animate-spin w-8 h-8 text-upn-500" /></div>
                : docentes.length === 0
                    ? <EmptyState icon={UserCheck} title="Sin docentes" subtitle="Verifica que los docentes tengan asignado este programa o facultad." />
                    : <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">{docentes.length} docente(s)</span>
                        </div>
                        {docentes.map((d, i) => (
                            <div key={d.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-upn-100 flex items-center justify-center flex-shrink-0">
                                    {d.photo ? <img src={d.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-upn-700 font-bold text-sm">{d.full_name[0]}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 truncate text-sm">{d.full_name}</p>
                                    <p className="text-xs text-slate-400">{d.email}</p>
                                </div>
                                <div className="flex gap-1.5">
                                    {(d.roles?.length > 0 ? d.roles : [d.role]).filter(r => ROLE_LABEL[r]).map(r => (
                                        <span key={r} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border
                                            ${r === 'PRACTICE_TEACHER' ? 'bg-upn-50 text-upn-700 border-upn-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                                            {ROLE_LABEL[r]}
                                        </span>
                                    ))}
                                </div>
                                <span className="font-mono text-xs text-slate-300 hidden lg:block">{d.document_number}</span>
                            </div>
                        ))}
                    </div>
            }
        </div>
    );
}
