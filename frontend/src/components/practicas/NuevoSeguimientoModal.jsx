/* eslint-disable */
// components/practicas/NuevoSeguimientoModal.jsx
// Modal para registrar una nueva visita de seguimiento con asistencia inicial.

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { STATUS_CFG, StatusDot, Modal } from './practicaUtils';
import api from '../../services/api';

export default function NuevoSeguimientoModal({ practicaId, students, sitios, onClose, onCreated, showToast }) {
    const [form, setForm] = useState({
        practica: practicaId,
        date: new Date().toISOString().split('T')[0],
        topic: '',
        novedades: '',
        sitio: '',
    });
    const [saving, setSaving] = useState(false);
    const [attend, setAttend] = useState(Object.fromEntries(students.map(s => [s.id, 'PRESENT'])));

    const handleCreate = async () => {
        if (!form.date) return;
        setSaving(true);
        try {
            const segRes = await api.post('/practicas/seguimientos/', { ...form, sitio: form.sitio || null });
            const segId = segRes.data.id;
            if (students.length > 0) {
                await Promise.all(students.map(s =>
                    api.post('/practicas/asistencias/', { seguimiento: segId, student: s.id, status: attend[s.id] || 'ABSENT' })
                ));
            }
            onCreated();
        } catch (e) {
            showToast(e.response?.data?.date?.[0] || 'Error al guardar', 'error');
        } finally { setSaving(false); }
    };

    const field = (label, children) => (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{label}</label>
            {children}
        </div>
    );
    const inputCls = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100";

    return (
        <Modal
            open={true}
            onClose={onClose}
            title="Registrar Visita de Seguimiento"
            size="xl"
            footer={<>
                <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50">
                    Cancelar
                </button>
                <button onClick={handleCreate} disabled={saving || !form.date}
                    className="flex-1 py-2.5 bg-upn-600 hover:bg-upn-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving && <Loader2 size={14} className="animate-spin" />} Registrar
                </button>
            </>}
        >
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    {field('Fecha *',
                        <input type="date" value={form.date}
                            onChange={e => setForm({ ...form, date: e.target.value })}
                            className={inputCls} />
                    )}
                    {sitios.length > 0 && field('Sitio',
                        <select value={form.sitio}
                            onChange={e => setForm({ ...form, sitio: e.target.value })}
                            className={`${inputCls} appearance-none`}>
                            <option value="">— Sin especificar —</option>
                            {sitios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                </div>

                {field('Actividad / Tema',
                    <input value={form.topic}
                        onChange={e => setForm({ ...form, topic: e.target.value })}
                        placeholder="Ej: Planificación de actividades recreativas"
                        className={inputCls} />
                )}

                {field('Novedades',
                    <textarea value={form.novedades}
                        onChange={e => setForm({ ...form, novedades: e.target.value })}
                        rows={3} placeholder="Observaciones de la visita..."
                        className={`${inputCls} resize-none`} />
                )}

                {students.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Asistencia</label>
                            <div className="flex gap-2 ml-auto">
                                <button type="button"
                                    onClick={() => setAttend(Object.fromEntries(students.map(s => [s.id, 'PRESENT'])))}
                                    className="text-[11px] font-bold text-emerald-600 hover:underline">
                                    Todos presente
                                </button>
                                <button type="button"
                                    onClick={() => setAttend(Object.fromEntries(students.map(s => [s.id, 'ABSENT'])))}
                                    className="text-[11px] font-bold text-red-500 hover:underline">
                                    Todos ausente
                                </button>
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            {students.map((s, i) => (
                                <div key={s.id} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                                    <StatusDot status={attend[s.id] || 'ABSENT'} />
                                    <p className="flex-1 text-sm font-semibold text-slate-700 truncate">{s.full_name}</p>
                                    <div className="flex gap-1">
                                        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                                            <button key={key} type="button"
                                                onClick={() => setAttend(p => ({ ...p, [s.id]: key }))}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all
                                                    ${(attend[s.id] || 'ABSENT') === key
                                                        ? `${cfg.light} ${cfg.text}`
                                                        : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
                                                {cfg.full}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
