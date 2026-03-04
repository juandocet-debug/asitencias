/* eslint-disable */
// components/practicas/HistorialVisitas.jsx
// Lista colapsable de visitas/seguimientos con asistencia editable inline.

import React, { useState, useEffect } from 'react';
import { Calendar, ClipboardCheck, MessageSquare, Check, Loader2, PenLine } from 'lucide-react';
import { STATUS_CFG, StatusDot } from './practicaUtils';
import api from '../../services/api';

// ── Card colapsable de un seguimiento ────────────────────
function SeguimientoCard({ seg, students, onUpdated, showToast }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [attend, setAttend] = useState({});

    useEffect(() => {
        const map = {};
        seg.asistencias?.forEach(a => { map[a.student] = a.status; });
        setAttend(map);
    }, [seg]);

    const saveAttendance = async () => {
        setSaving(true);
        try {
            await Promise.all(students.map(s => {
                const status = attend[s.id] || 'ABSENT';
                const existing = seg.asistencias?.find(a => a.student === s.id);
                return existing
                    ? api.patch(`/practicas/asistencias/${existing.id}/`, { status })
                    : api.post('/practicas/asistencias/', { seguimiento: seg.id, student: s.id, status });
            }));
            showToast('Asistencia guardada');
            onUpdated();
        } catch { showToast('Error', 'error'); }
        finally { setSaving(false); }
    };

    const presentCount = students.filter(s => attend[s.id] === 'PRESENT').length;
    const absentCount = students.filter(s => !attend[s.id] || attend[s.id] === 'ABSENT').length;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                onClick={() => setOpen(o => !o)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-upn-50 flex items-center justify-center flex-shrink-0">
                        <Calendar size={18} className="text-upn-500" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">
                            {new Date(seg.date + 'T12:00').toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        {seg.topic && <p className="text-sm text-slate-500">{seg.topic}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{presentCount} ✓</span>
                        <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">{absentCount} ✗</span>
                    </div>
                    {open ? <span className="text-slate-400 text-sm">▲</span> : <span className="text-slate-400 text-sm">▼</span>}
                </div>
            </button>

            {open && (
                <div className="border-t border-slate-100">
                    {seg.novedades && (
                        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                            <p className="text-xs font-bold text-amber-600 uppercase mb-1 flex items-center gap-1"><MessageSquare size={12} /> Novedades</p>
                            <p className="text-sm text-amber-900">{seg.novedades}</p>
                        </div>
                    )}

                    {students.length > 0 && (
                        <div>
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-500 uppercase">Asistencia</p>
                                <button onClick={saveAttendance} disabled={saving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-upn-600 text-white text-xs font-bold rounded-lg hover:bg-upn-700 disabled:opacity-50">
                                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Guardar
                                </button>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {students.map(s => {
                                    const status = attend[s.id] || 'ABSENT';
                                    const asist = seg.asistencias?.find(a => a.student === s.id);
                                    return (
                                        <div key={s.id} className="flex items-center gap-3 px-5 py-2.5">
                                            <StatusDot status={status} />
                                            <p className="flex-1 text-sm font-semibold text-slate-700 truncate">{s.full_name}</p>
                                            {asist?.has_reflexion && <span title="Tiene reflexión" className="text-violet-400"><PenLine size={12} /></span>}
                                            <div className="flex gap-1">
                                                {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                                                    <button key={key}
                                                        onClick={() => setAttend(p => ({ ...p, [s.id]: key }))}
                                                        className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all
                                                            ${status === key
                                                                ? `${cfg.light} ${cfg.text} ring-1 ring-inset ring-current`
                                                                : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
                                                        {cfg.full}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Lista de seguimientos ─────────────────────────────────
export default function HistorialVisitas({ seguimientos, students, onUpdated, showToast }) {
    if (seguimientos.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 text-center">
                <ClipboardCheck size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">Sin visitas registradas</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {seguimientos.map(seg => (
                <SeguimientoCard key={seg.id} seg={seg} students={students} onUpdated={onUpdated} showToast={showToast} />
            ))}
        </div>
    );
}
