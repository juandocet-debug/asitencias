/* eslint-disable */
// components/practicas/TabObjetivos.jsx
// Tab para gestionar los objetivos pedagógicos del programa.

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Target, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { Modal, Field, InputField, Textarea, BtnPrimary, BtnSec, EmptyState } from './practicasUi';

export default function TabObjetivos({ programId, showToast }) {
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
