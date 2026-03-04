/* eslint-disable */
// components/practicas/HistorialAlumnoModal.jsx
// Modal con el historial completo de un alumno en una práctica: sesiones + reflexiones.

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, PenLine } from 'lucide-react';
import { StatusDot, Modal } from './practicaUtils';
import api from '../../services/api';

export default function HistorialAlumnoModal({ practica, student, onClose, showToast }) {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reflModal, setReflModal] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get(`/practicas/practicas/${practica.id}/historial-estudiante/${student.id}/`);
            setHistorial(r.data.historial || []);
        } catch { showToast('Error al cargar historial', 'error'); }
        finally { setLoading(false); }
    }, [practica.id, student.id]);

    useEffect(() => { load(); }, [load]);

    const pct = student.attendance_pct ?? 0;

    return (
        <Modal open={true} onClose={onClose} title={`Historial — ${student.full_name}`} size="lg">
            {/* Resumen rápido */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-5">
                <div className="w-12 h-12 rounded-full bg-upn-100 flex items-center justify-center text-upn-700 font-black text-lg flex-shrink-0">
                    {student.photo
                        ? <img src={student.photo} alt="" className="w-full h-full object-cover rounded-full" />
                        : student.full_name[0]
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800">{student.full_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{student.document_number}</p>
                </div>
                {[
                    { label: 'P', value: student.present, color: 'text-emerald-600' },
                    { label: 'A', value: student.absent, color: 'text-red-500' },
                    { label: 'T', value: student.late, color: 'text-amber-500' },
                    { label: 'E', value: student.excused, color: 'text-slate-400' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                        <p className={`font-black text-lg ${color}`}>{value}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{label}</p>
                    </div>
                ))}
                <div>
                    <p className={`font-black text-xl ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</p>
                    <p className="text-[10px] text-slate-400 font-bold">Asist.</p>
                </div>
            </div>

            {loading
                ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-upn-400 w-7 h-7" /></div>
                : historial.length === 0
                    ? <p className="text-center text-slate-400 py-8">Sin sesiones registradas</p>
                    : <div className="space-y-3">
                        {historial.map(h => (
                            <div key={h.seguimiento_id} className="rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="flex items-center gap-4 px-4 py-3">
                                    <StatusDot status={h.status} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800">
                                            {new Date(h.date + 'T12:00').toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        {h.topic && <p className="text-xs text-slate-400 truncate">{h.topic}</p>}
                                        {h.sitio && <p className="text-[11px] text-slate-400 flex items-center gap-1"><span className="text-slate-300">📍</span>{h.sitio}</p>}
                                    </div>
                                    {h.reflexion
                                        ? <button
                                            onClick={() => setReflModal(reflModal?.seguimiento_id === h.seguimiento_id ? null : h)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-xs font-bold hover:bg-violet-100 transition-colors">
                                            <PenLine size={12} /> Ver reflexión
                                        </button>
                                        : <span className="text-[11px] text-slate-300 italic">Sin reflexión</span>
                                    }
                                </div>

                                {/* Reflexión expandida */}
                                {reflModal?.seguimiento_id === h.seguimiento_id && h.reflexion && (
                                    <div className="border-t border-slate-100 px-4 py-4 bg-violet-50 space-y-3">
                                        {[
                                            { label: 'Actividades realizadas', value: h.reflexion.actividades },
                                            { label: 'Reflexión pedagógica', value: h.reflexion.reflexion_pedagogica },
                                            { label: 'Aprendizajes', value: h.reflexion.aprendizajes },
                                        ].filter(x => x.value).map(({ label, value }) => (
                                            <div key={label}>
                                                <p className="text-[10px] font-bold text-violet-500 uppercase mb-1">{label}</p>
                                                <p className="text-sm text-slate-700 whitespace-pre-line">{value}</p>
                                            </div>
                                        ))}
                                        <button onClick={() => setReflModal(null)} className="text-xs text-violet-400 hover:text-violet-600 font-semibold">Cerrar</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
            }
        </Modal>
    );
}
