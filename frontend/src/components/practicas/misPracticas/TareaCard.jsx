/* eslint-disable */
// components/practicas/misPracticas/TareaCard.jsx
// Card colapsable de tarea del profesor — entrega + evidencias.

import React, { useState, useEffect, useRef } from 'react';
import {
    ListChecks, CheckCircle2, ChevronDown, ChevronUp, FileText, Send,
    Image as ImageIcon, Pencil, Upload, Loader2, Save
} from 'lucide-react';
import api from '../../../services/api';

export default function TareaCard({ tarea, userId, onUpdated, showToast }) {
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
            if (miEntrega) { await api.patch(`/practicas/entregas/${miEntrega.id}/`, { propuesta }); }
            else { await api.post('/practicas/entregas/', { tarea: tarea.id, student: userId, propuesta }); }
            showToast('Entrega guardada ✓');
            setEditing(false);
            onUpdated();
        } catch (e) { showToast(e.response?.data?.propuesta?.[0] || 'Error al guardar', 'error'); }
        finally { setSaving(false); }
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
            <button className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors" onClick={() => setOpen(o => !o)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${miEntrega ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    {miEntrega ? <CheckCircle2 size={20} className="text-emerald-500" /> : <ListChecks size={20} className="text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">{tarea.titulo}</p>
                    {tarea.created_by_name && <p className="text-xs text-slate-400 mt-0.5">Asignada por {tarea.created_by_name}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {miEntrega && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">Entregada</span>}
                    {miEntrega?.evidencias?.length > 0 && (
                        <span className="px-2 py-1 rounded-full text-[11px] font-bold border bg-blue-50 text-blue-600 border-blue-200">{miEntrega.evidencias.length} archivos</span>
                    )}
                    {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </button>

            {open && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                    {tarea.descripcion && (
                        <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1"><FileText size={11} /> Instrucciones</p>
                            <p className="text-sm text-slate-700 whitespace-pre-line">{tarea.descripcion}</p>
                        </div>
                    )}

                    {miEntrega && !editing ? (
                        <div className="space-y-3">
                            <div className="bg-emerald-50 rounded-xl p-4">
                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1.5 flex items-center gap-1"><Send size={11} /> Mi propuesta</p>
                                <p className="text-sm text-slate-700 whitespace-pre-line">{miEntrega.propuesta}</p>
                            </div>
                            {miEntrega.evidencias?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><ImageIcon size={11} /> Evidencias ({miEntrega.evidencias.length})</p>
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
                                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 border border-violet-200 transition-colors">
                                    <Pencil size={11} /> Editar
                                </button>
                                <input type="file" ref={evidFileRef} accept="image/*,.pdf" className="hidden" onChange={handleUploadEvidencia} />
                                <button onClick={() => evidFileRef.current?.click()} disabled={uploadingEvid} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 border border-blue-200 transition-colors">
                                    {uploadingEvid ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />} Subir evidencia
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <textarea value={propuesta} onChange={e => setPropuesta(e.target.value)} rows={4}
                                placeholder="Describe tu propuesta, qué hiciste, cómo lo abordaste..."
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all" />
                            <div className="flex gap-2">
                                {editing && miEntrega && (
                                    <button onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">
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
