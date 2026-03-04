/* eslint-disable */
// components/tools/toolsUi.jsx
// Primitivos compartidos para Tools: Toast, ItemRow, DeleteModal, CrudModal.

import React from 'react';
import { X, Check, AlertTriangle, Trash2, Loader2, Building2 } from 'lucide-react';

// ── Toast ─────────────────────────────────────────────────
export function Toast({ toast, onClose }) {
    if (!toast) return null;
    return (
        <div className={`fixed bottom-6 right-6 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100]`}>
            {toast.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
            <span className="font-medium">{toast.message}</span>
            <button onClick={onClose} className="hover:bg-white/20 rounded p-1"><X size={16} /></button>
        </div>
    );
}

// ── Fila genérica con hover y acciones ────────────────────
export function ItemRow({ icon: Icon, iconBg, iconColor, title, meta, onEdit, onDelete }) {
    return (
        <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon size={22} className={iconColor} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800">{title}</h4>
                    <div className="flex items-center gap-3 mt-0.5">{meta}</div>
                </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-2 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-lg transition-colors" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg></button>
            </div>
        </div>
    );
}

// ── Modal confirmación de eliminación ────────────────────
export function DeleteModal({ item, onCancel, onConfirm }) {
    if (!item) return null;
    const label = item._type === 'faculty' ? 'Facultad' : 'Programa';
    const warn = item._type === 'faculty'
        ? 'Se eliminarán todos los programas asociados.'
        : 'Los usuarios vinculados perderán esta asignación.';
    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar {label}?</h3>
                    <p className="text-slate-500 mb-1"><strong>{item.name}</strong></p>
                    <p className="text-xs text-slate-400 mb-6">{warn}</p>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                            <Trash2 size={16} /> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Modal CRUD genérico Facultad / Programa ───────────────
export function CrudModal({ open, onClose, type, editing, formData, setFormData, faculties, saving, onSave }) {
    if (!open) return null;
    const isFaculty = type === 'faculty';
    const title = `${editing ? 'Editar' : 'Crear'} ${isFaculty ? 'Facultad' : 'Programa'}`;
    const inputCls = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500";

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Nombre *</label>
                        <input autoFocus placeholder={isFaculty ? 'Ej: Facultad de Educación Física' : 'Ej: Licenciatura en Recreación'}
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Código</label>
                        <input placeholder={isFaculty ? 'Ej: FEF' : 'Ej: LR'}
                            value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            className={`${inputCls} font-mono`} maxLength={10} />
                        <p className="text-[11px] text-slate-400">Abreviatura corta para identificar rápidamente.</p>
                    </div>
                    {!isFaculty && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Building2 size={12} /> Facultad *</label>
                            <select value={formData.faculty} onChange={e => setFormData({ ...formData, faculty: e.target.value })} className={inputCls}>
                                <option value="">— Seleccionar —</option>
                                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="pt-4 flex gap-3">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                        <button onClick={onSave} disabled={saving || !formData.name.trim()}
                            className="flex-1 px-4 py-2.5 bg-upn-600 text-white rounded-xl text-sm font-bold hover:bg-upn-700 transition-colors shadow-lg shadow-upn-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving && <Loader2 size={16} className="animate-spin" />}
                            {editing ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
