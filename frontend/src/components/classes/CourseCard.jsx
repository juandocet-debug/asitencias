/* eslint-disable */
// components/classes/CourseCard.jsx
// Tarjeta visual de un curso con gradiente de color y acciones de edición/eliminación.

import React from 'react';
import { Edit2, Trash2, Users, Eye } from 'lucide-react';

export const COLOR_PALETTE = {
    blue: { gradient: 'linear-gradient(135deg, #3b82f6, #4f46e5)', lightBg: '#eff6ff', color: '#1d4ed8', label: 'Azul' },
    violet: { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', lightBg: '#f5f3ff', color: '#6d28d9', label: 'Violeta' },
    emerald: { gradient: 'linear-gradient(135deg, #10b981, #0d9488)', lightBg: '#ecfdf5', color: '#047857', label: 'Esmeralda' },
    amber: { gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)', lightBg: '#fffbeb', color: '#b45309', label: 'Ámbar' },
    rose: { gradient: 'linear-gradient(135deg, #f43f5e, #ec4899)', lightBg: '#fff1f2', color: '#be123c', label: 'Rosa' },
    cyan: { gradient: 'linear-gradient(135deg, #06b6d4, #0284c7)', lightBg: '#ecfeff', color: '#0e7490', label: 'Cian' },
};

export default function CourseCard({ course, canManage, onEdit, onDelete, onClick }) {
    const p = COLOR_PALETTE[course.color] || COLOR_PALETTE.blue;
    const studentCount = course.students?.length ?? 0;

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1 group overflow-hidden cursor-pointer"
        >
            {/* Header con gradiente */}
            <div className="relative px-5 py-5 overflow-hidden" style={{ background: p.gradient }}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8" style={{ background: 'rgba(255,255,255,0.12)' }} />
                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full translate-y-6 -translate-x-4" style={{ background: 'rgba(255,255,255,0.08)' }} />

                <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl border shadow-lg"
                            style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
                            {course.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-base leading-tight drop-shadow-sm"
                                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {course.name}
                            </h3>
                            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{course.year}-{course.period}</span>
                        </div>
                    </div>

                    {canManage && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={e => { e.stopPropagation(); onEdit(course); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors"
                                style={{ background: 'rgba(255,255,255,0.2)' }} title="Editar">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); onDelete(course.id); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors hover:bg-red-500/80"
                                style={{ background: 'rgba(255,255,255,0.2)' }} title="Eliminar">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3.5">
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{ background: p.lightBg, color: p.color }}>
                        <span style={{ opacity: 0.6 }}>#</span> {course.code}
                    </span>
                    <span className="text-slate-400 font-medium" style={{ fontSize: '11px' }}>
                        {course.start_date && new Date(course.start_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                        {course.end_date && ` — ${new Date(course.end_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}`}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: p.lightBg }}>
                            <Users size={15} style={{ color: p.color }} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">{studentCount}</p>
                            <p className="text-slate-400" style={{ fontSize: '10px', marginTop: '-2px' }}>Estudiantes</p>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 group-hover:shadow-md transition-shadow"
                        style={{ background: p.lightBg, color: p.color }}>
                        <Eye size={13} /> Ver
                    </div>
                </div>
            </div>
        </div>
    );
}
