/* eslint-disable */
// components/practicas/TabSitios.jsx
// Tab para gestionar los sitios de práctica del programa.

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2, Building2, MapPin, Smartphone, Phone, User } from 'lucide-react';
import api from '../../services/api';
import { Modal, Field, InputField, Textarea, BtnPrimary, BtnSec, EmptyState } from './practicasUi';

export default function TabSitios({ programId, showToast }) {
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
                        {['Nombre', 'Dirección', 'Contacto', 'Teléfonos', ''].map((h, i) => (
                            <div key={i} className={`text-[11px] font-bold text-slate-400 uppercase col-span-${[3, 3, 3, 2, 1][i]}`}>{h}</div>
                        ))}
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
