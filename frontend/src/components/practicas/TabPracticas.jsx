/* eslint-disable */
// components/practicas/TabPracticas.jsx
// Tab de gestión de prácticas (coordinador): tabla filtrable + CRUD + QR modal.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    MapPin, Target, Plus, Edit2, Trash2, X, Check, Loader2,
    AlertTriangle, Search, Users, ClipboardList, UserCheck,
    Hash, User, QrCode, UserPlus, Eye, MoreVertical
} from 'lucide-react';
import api from '../../services/api';
import { Modal, Field, InputField, Sel, BtnPrimary, BtnSec, EmptyState } from './practicasUi';

// ── Fila de tabla con dropdown de acciones ───────────────
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
            <div className="col-span-4 min-w-0">
                <button onClick={onView} className="font-bold text-slate-800 hover:text-upn-700 text-sm text-left truncate block w-full transition-colors">
                    {p.name}
                </button>
                <span className="font-mono text-[11px] text-slate-400 tracking-widest">{p.code}</span>
            </div>
            <div className="col-span-2 text-sm text-slate-500">{p.year} · {p.period}er sem.</div>
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
            <div className="col-span-1 text-center"><span className="text-sm font-bold text-slate-700">{p.student_count}</span></div>
            <div className="col-span-1 flex justify-center">
                <span className={`w-2 h-2 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} title={p.is_active ? 'Activa' : 'Inactiva'} />
            </div>
            <div className="col-span-1 flex justify-end relative" ref={ref}>
                <button onClick={() => setMenuOpen(m => !m)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
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
                                    ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`}>
                                <item.icon size={14} />{item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Modal QR con imagen escaneable y gestión de estudiantes ─
function QRModal({ practica, onClose, showToast }) {
    const [students, setStudents] = useState([]);
    const [loadStu, setLoadStu] = useState(true);
    const [docNum, setDocNum] = useState('');
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState(null);
    const [tab, setTab] = useState('qr');

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

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&ecc=M&data=${encodeURIComponent(`PRACTICA:${practica.code}`)}`;

    return (
        <Modal open={true} onClose={onClose} title={`Estudiantes — ${practica.name}`} size="md">
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
                    <div className="border-8 border-white shadow-2xl rounded-3xl overflow-hidden mb-4">
                        <img src={qrUrl} alt="QR de práctica" width={220} height={220} className="block" onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="bg-upn-50 border border-upn-200 rounded-2xl px-6 py-3 text-center mb-4">
                        <p className="text-xs font-bold text-upn-400 uppercase mb-1">Código de inscripción</p>
                        <p className="font-mono font-black text-3xl text-upn-900 tracking-[0.4em]">{practica.code}</p>
                    </div>
                    <p className="text-xs text-slate-400 text-center max-w-xs">Comparte el código o escanea el QR para unirse</p>
                    <div className="mt-5 w-full">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Agregar por cédula</p>
                        <div className="flex gap-2">
                            <InputField icon={Hash} value={docNum}
                                onChange={e => setDocNum(e.target.value)}
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

// ── Tab principal de prácticas ───────────────────────────
export default function TabPracticas({ programId, showToast, navigate }) {
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

    const filtered = all.filter(p => {
        const q = search.toLowerCase();
        return (!q || p.name.toLowerCase().includes(q) || (p.profesor_info?.full_name || '').toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
            && (!fYear || String(p.year) === fYear)
            && (!fPeriod || String(p.period) === fPeriod)
            && (!fStatus || (fStatus === 'active' ? p.is_active : !p.is_active));
    });

    const years = [...new Set(all.map(p => p.year))].sort((a, b) => b - a);

    const openCreate = () => { setEditing(null); setForm({ ...emptyForm, program: programId }); setModalOpen(true); };
    const openEdit = (p) => {
        setEditing(p);
        setForm({ name: p.name, program: p.program, year: p.year, period: p.period, profesor_practica: p.profesor_practica || '', sitios: (p.sitios_detail || []).map(s => s.id), objetivos: (p.objetivos_detail || []).map(o => o.id), is_active: p.is_active });
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
        try { await api.delete(`/practicas/practicas/${delConfirm.id}/`); showToast('Eliminada'); setDelConfirm(null); load(); }
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
                    {[
                        { value: fYear, onChange: e => setFYear(e.target.value), options: [['', 'Año'], ...years.map(y => [String(y), String(y)])] },
                        { value: fPeriod, onChange: e => setFPeriod(e.target.value), options: [['', 'Semestre'], ['1', '1er Sem'], ['2', '2do Sem']] },
                        { value: fStatus, onChange: e => setFStatus(e.target.value), options: [['', 'Estado'], ['active', 'Activas'], ['inactive', 'Inactivas']] },
                    ].map((sel, i) => (
                        <select key={i} value={sel.value} onChange={sel.onChange} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none appearance-none cursor-pointer">
                            {sel.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    ))}
                    <BtnPrimary onClick={openCreate} className="px-4 py-2"><Plus size={15} /> Nueva</BtnPrimary>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-3">
                    {['Práctica', 'Año / Sem.', 'Profesor', 'Alumnos', 'Estado', 'Acc.'].map((h, i) => (
                        <div key={h} className={`text-[11px] font-bold text-slate-400 uppercase ${[4, 2, 3, 1, 1, 1][i] > 1 ? `col-span-${[4, 2, 3, 1, 1, 1][i]}` : 'col-span-1'} ${i >= 3 ? 'text-center' : ''} ${i === 5 ? 'text-right' : ''}`}>{h}</div>
                    ))}
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
                    ))}
                {filtered.length > 0 && (
                    <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 font-medium">
                        {filtered.length} de {all.length} práctica(s)
                    </div>
                )}
            </div>

            {/* Modal Crear/Editar */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Práctica' : 'Nueva Práctica'} size="lg"
                footer={<><BtnSec onClick={() => setModalOpen(false)} className="flex-1">Cancelar</BtnSec>
                    <BtnPrimary onClick={handleSave} loading={saving} disabled={!form.name.trim()} className="flex-1">
                        {editing ? 'Guardar cambios' : 'Crear práctica'}
                    </BtnPrimary></>}>
                <div className="space-y-5">
                    <Field label="Nombre *"><InputField icon={ClipboardList} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Práctica Recreación Comunitaria 2026-1" /></Field>
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
                    <Field label="Sitios" hint={sitios.length === 0 ? 'Crea sitios primero.' : ''}>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {sitios.map(s => {
                                const on = (form.sitios || []).includes(s.id); return (
                                    <button key={s.id} type="button" onClick={() => toggle('sitios', s.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${on ? 'bg-upn-600 text-white border-upn-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-upn-300'}`}>
                                        <MapPin size={11} />{s.name}{on && <Check size={10} />}
                                    </button>
                                );
                            })}
                        </div>
                    </Field>
                    <Field label="Objetivos">
                        <div className="flex flex-wrap gap-2 mt-1">
                            {objetivos.map(o => {
                                const on = (form.objetivos || []).includes(o.id); return (
                                    <button key={o.id} type="button" onClick={() => toggle('objetivos', o.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${on ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'}`}>
                                        <Target size={11} />{o.name}{on && <Check size={10} />}
                                    </button>
                                );
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

            {qrModal && <QRModal practica={qrModal} onClose={() => setQrModal(null)} showToast={showToast} />}

            <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Eliminar práctica" size="sm"
                footer={<><BtnSec onClick={() => setDelConfirm(null)} className="flex-1">Cancelar</BtnSec>
                    <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                        <Trash2 size={14} /> Eliminar
                    </button></>}>
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
