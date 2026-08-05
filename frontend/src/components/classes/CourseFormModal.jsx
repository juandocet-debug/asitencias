import React from 'react';
import { Save, X } from 'lucide-react';
import { COLOR_PALETTE } from './CourseCard';

const inputCls = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 transition-all font-medium";

export default function CourseFormModal({ open, onClose, editingId, formData, setFormData, onSubmit }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Editar clase' : 'Nueva clase'}</h3>
                    <button onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-600"><X size={24} /></button>
                </div>

                <form onSubmit={onSubmit} className="space-y-5 p-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Nombre de la clase</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={event => setFormData({ ...formData, name: event.target.value })}
                            className={inputCls}
                            placeholder="Ej. Taller de Recreación I"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700">Año</label>
                            <input
                                type="number"
                                min="2026"
                                max="2060"
                                required
                                value={formData.year}
                                onChange={event => setFormData({ ...formData, year: parseInt(event.target.value) })}
                                className={inputCls}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700">Periodo</label>
                            <select
                                value={formData.period}
                                onChange={event => setFormData({ ...formData, period: parseInt(event.target.value) })}
                                className={`${inputCls} cursor-pointer appearance-none`}
                            >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[{ label: 'Fecha inicio', field: 'start_date' }, { label: 'Fecha fin', field: 'end_date' }].map(({ label, field }) => (
                            <div key={field} className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">{label}</label>
                                <input
                                    type="date"
                                    required
                                    value={formData[field]}
                                    onChange={event => setFormData({ ...formData, [field]: event.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Color de la clase</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(COLOR_PALETTE).map(([key, val]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color: key })}
                                    className="relative h-10 w-10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                                    style={{
                                        background: val.gradient,
                                        boxShadow: formData.color === key ? `0 0 0 3px white, 0 0 0 5px ${val.color}` : 'none',
                                        transform: formData.color === key ? 'scale(1.1)' : 'scale(1)',
                                    }}
                                    title={val.label}
                                >
                                    {formData.color === key && <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100">Cancelar</button>
                        <button type="submit" className="flex items-center gap-2 rounded-xl bg-upn-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-upn-600/20 transition-all hover:bg-upn-700 active:scale-95">
                            <Save size={18} /> {editingId ? 'Guardar cambios' : 'Crear clase'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
