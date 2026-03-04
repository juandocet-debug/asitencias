/* eslint-disable */
// components/classes/CourseFormModal.jsx
// Modal para crear / editar un curso con selector visual de color.

import React from 'react';
import { X, Save } from 'lucide-react';
import { COLOR_PALETTE } from './CourseCard';

const inputCls = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 transition-all font-medium";

export default function CourseFormModal({ open, onClose, editingId, formData, setFormData, onSubmit }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl w-full max-w-md relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Editar Clase' : 'Nueva Clase'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-5">
                    {/* Nombre */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Nombre de la Clase</label>
                        <input type="text" required value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className={inputCls} placeholder="Ej. Taller de Recreación I" />
                    </div>

                    {/* Año + Periodo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700">Año</label>
                            <input type="number" min="2026" max="2060" required value={formData.year}
                                onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700">Periodo</label>
                            <select value={formData.period} onChange={e => setFormData({ ...formData, period: parseInt(e.target.value) })}
                                className={`${inputCls} appearance-none cursor-pointer`}>
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                            </select>
                        </div>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Fecha Inicio', field: 'start_date' },
                            { label: 'Fecha Fin', field: 'end_date' },
                        ].map(({ label, field }) => (
                            <div key={field} className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">{label}</label>
                                <input type="date" required value={formData[field]}
                                    onChange={e => setFormData({ ...formData, [field]: e.target.value })} className={inputCls} />
                            </div>
                        ))}
                    </div>

                    {/* Color picker */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Color de la Clase</label>
                        <div className="flex gap-2 flex-wrap">
                            {Object.entries(COLOR_PALETTE).map(([key, val]) => (
                                <button key={key} type="button" onClick={() => setFormData({ ...formData, color: key })}
                                    className="relative w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                                    style={{
                                        background: val.gradient,
                                        boxShadow: formData.color === key ? `0 0 0 3px white, 0 0 0 5px ${val.color}` : 'none',
                                        transform: formData.color === key ? 'scale(1.1)' : 'scale(1)',
                                    }} title={val.label}>
                                    {formData.color === key && <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm transition-colors">Cancelar</button>
                        <button type="submit" className="px-6 py-2.5 bg-upn-600 hover:bg-upn-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-upn-600/20 flex items-center gap-2 active:scale-95 transition-all">
                            <Save size={18} /> {editingId ? 'Guardar Cambios' : 'Crear Clase'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
