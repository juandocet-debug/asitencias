/* eslint-disable */
// components/practicas/misPracticas/SesionCard.jsx
// Card colapsable de una sesión de práctica — muestra asistencia y diario de campo del estudiante.

import React, { useState, useEffect, useRef } from 'react';
import {
    MapPin, Check, X, Loader2, PenLine, BookOpen, Save, ChevronDown, ChevronUp,
    MessageSquare, CheckCircle2, Pencil, Image as ImageIcon, Upload, Clock
} from 'lucide-react';
import api from '../../../services/api';

const STATUS_CFG = {
    PRESENT: { full: 'Presente', bg: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    LATE: { full: 'Tardanza', bg: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    ABSENT: { full: 'Ausente', bg: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
    EXCUSED: { full: 'Excusado', bg: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function SesionCard({ seg, userId, onUpdated, showToast }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const miAsist = seg.asistencias?.find(a => a.student === userId);
    const statusCfg = STATUS_CFG[miAsist?.status];
    const miDiario = seg.reflexiones?.find(r => r.student === userId);

    const [form, setForm] = useState({
        actividades: miDiario?.actividades || '',
        reflexion_pedagogica: miDiario?.reflexion_pedagogica || '',
        aprendizajes: miDiario?.aprendizajes || '',
        horas: miDiario?.horas || '0',
    });

    useEffect(() => {
        if (miDiario) {
            setForm({ actividades: miDiario.actividades || '', reflexion_pedagogica: miDiario.reflexion_pedagogica || '', aprendizajes: miDiario.aprendizajes || '', horas: miDiario.horas || '0' });
            setImagePreview(miDiario.imagen_url || null);
            setImageFile(null);
        }
    }, [seg]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('La imagen es muy pesada (máx 5MB).', 'error'); return; }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!form.actividades.trim()) { showToast('Describe al menos las actividades realizadas', 'error'); return; }
        setSaving(true);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([k, v]) => formData.append(k, v));
            if (imageFile) formData.append('imagen', imageFile);
            if (miDiario) {
                await api.patch(`/practicas/reflexiones/${miDiario.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                formData.append('seguimiento', seg.id);
                formData.append('student', userId);
                await api.post('/practicas/reflexiones/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            showToast('Diario de campo guardado ✓');
            setEditing(false);
            onUpdated();
        } catch (e) {
            const err = e.response?.data;
            showToast(err?.actividades?.[0] || err?.non_field_errors?.[0] || 'Error al guardar', 'error');
        } finally { setSaving(false); }
    };

    const textareaClass = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all";
    const labelClass = "block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1";

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors" onClick={() => setOpen(o => !o)}>
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
                    {statusCfg && <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusCfg.badge}`}>{statusCfg.full}</span>}
                    {miDiario && !editing && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-violet-50 text-violet-700 border-violet-200 flex items-center gap-1">
                            <PenLine size={10} /> Diario · {miDiario.horas}h
                        </span>
                    )}
                    {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </button>

            {open && (
                <div className="border-t border-slate-100">
                    {seg.novedades && (
                        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                            <p className="text-xs font-bold text-amber-600 uppercase mb-1 flex items-center gap-1"><MessageSquare size={12} /> Novedades del profesor</p>
                            <p className="text-sm text-amber-900">{seg.novedades}</p>
                        </div>
                    )}
                    {miAsist?.comment && (
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Comentario</p>
                            <p className="text-sm text-slate-700">{miAsist.comment}</p>
                        </div>
                    )}

                    <div className="px-5 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <PenLine size={16} className="text-violet-500" /> Mi diario de campo
                            </h4>
                            {miDiario && !editing && (
                                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 border border-violet-200 transition-colors">
                                    <Pencil size={11} /> Editar
                                </button>
                            )}
                        </div>

                        {/* Vista de lectura */}
                        {!editing && miDiario ? (
                            <div className="space-y-4">
                                {[
                                    { label: 'Actividades realizadas', text: miDiario.actividades, icon: BookOpen },
                                    { label: 'Reflexión pedagógica', text: miDiario.reflexion_pedagogica, icon: PenLine },
                                    { label: 'Aprendizajes', text: miDiario.aprendizajes, icon: CheckCircle2 },
                                ].filter(x => x.text).map(({ label, text, icon: Icon }) => (
                                    <div key={label} className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5"><Icon size={11} />{label}</p>
                                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{text}</p>
                                    </div>
                                ))}
                                <span className="flex items-center gap-1 bg-blue-50 text-blue-600 font-bold text-xs px-3 py-1.5 rounded-full border border-blue-200 w-fit">
                                    <Clock size={11} /> {miDiario.horas} horas
                                </span>
                                {miDiario.imagen_url && (
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><ImageIcon size={11} /> Evidencia</p>
                                        <div className="rounded-lg overflow-hidden border border-slate-200">
                                            <img src={miDiario.imagen_url} alt="Evidencia práctica" className="w-full h-auto object-cover max-h-64" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : editing || !miDiario ? (
                            /* Formulario */
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400">Documenta lo que hiciste, cómo lo viviste y qué aprendiste.</p>
                                <div>
                                    <label className={labelClass}><BookOpen size={11} /> Actividades realizadas <span className="text-red-400">*</span></label>
                                    <textarea value={form.actividades} onChange={e => setForm({ ...form, actividades: e.target.value })} rows={4} placeholder="Describe las actividades..." className={textareaClass} />
                                </div>
                                <div>
                                    <label className={labelClass}><PenLine size={11} /> Reflexión pedagógica</label>
                                    <textarea value={form.reflexion_pedagogica} onChange={e => setForm({ ...form, reflexion_pedagogica: e.target.value })} rows={3} placeholder="¿Cómo fue tu actuación?" className={textareaClass} />
                                </div>
                                <div>
                                    <label className={labelClass}><CheckCircle2 size={11} /> Aprendizajes y mejoras</label>
                                    <textarea value={form.aprendizajes} onChange={e => setForm({ ...form, aprendizajes: e.target.value })} rows={2} placeholder="¿Qué aprendiste?" className={textareaClass} />
                                </div>
                                <div>
                                    <label className={labelClass}><Clock size={11} /> Horas dedicadas <span className="text-red-400">*</span></label>
                                    <input type="number" step="0.5" min="0" max="24" value={form.horas}
                                        onChange={e => setForm({ ...form, horas: e.target.value })}
                                        className="w-32 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all" />
                                </div>
                                <div>
                                    <label className={labelClass}><ImageIcon size={11} /> Evidencia visual (Opcional)</label>
                                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageChange} />
                                    {!imagePreview
                                        ? <button type="button" onClick={() => fileInputRef.current?.click()}
                                            className="w-full border-2 border-dashed border-slate-200 hover:border-violet-300 bg-slate-50 hover:bg-violet-50/50 rounded-xl p-4 text-center transition-all group flex flex-col items-center gap-2">
                                            <Upload size={20} className="text-slate-400 group-hover:text-violet-500" />
                                            <span className="text-sm font-semibold text-slate-500 group-hover:text-violet-600">Subir foto (Máx 5MB)</span>
                                        </button>
                                        : <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden group">
                                            <img src={imagePreview} alt="Preview" className="h-32 w-auto object-cover" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => { setImageFile(null); setImagePreview(miDiario?.imagen_url || null); fileInputRef.current.value = ''; }}
                                                    className="bg-white/90 hover:bg-white text-red-600 font-bold px-3 py-1.5 rounded-lg text-xs shadow flex items-center gap-1">
                                                    <X size={12} /> Quitar
                                                </button>
                                            </div>
                                        </div>
                                    }
                                </div>
                                <div className="flex gap-3 pt-1">
                                    {editing && miDiario && (
                                        <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">
                                            Cancelar
                                        </button>
                                    )}
                                    <button type="button" onClick={handleSave} disabled={saving || !form.actividades.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors">
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        {miDiario ? 'Actualizar diario' : 'Guardar diario'}
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {!miDiario && !editing && (
                            <button onClick={() => setEditing(true)} className="w-full border-2 border-dashed border-violet-200 hover:border-violet-400 rounded-2xl p-6 text-center transition-colors group">
                                <PenLine size={28} className="text-violet-200 group-hover:text-violet-400 mx-auto mb-2 transition-colors" />
                                <p className="text-violet-400 group-hover:text-violet-600 font-bold text-sm transition-colors">Registrar mi diario de campo</p>
                                <p className="text-violet-300 text-xs mt-1">Documenta tus actividades, horas y aprendizajes</p>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
