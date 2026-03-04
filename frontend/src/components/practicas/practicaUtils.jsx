/* eslint-disable */
// components/practicas/practicaUtils.jsx
// Constantes y primitivos compartidos por páginas de prácticas.

import React from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';

// ── Configuración de estados de asistencia ────────────────
export const STATUS_CFG = {
    PRESENT: { label: 'P', full: 'Presente', bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50 border-emerald-200' },
    LATE: { label: 'T', full: 'Tardanza', bg: 'bg-amber-400', text: 'text-amber-700', light: 'bg-amber-50 border-amber-200' },
    ABSENT: { label: 'A', full: 'Ausente', bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50 border-red-200' },
    EXCUSED: { label: 'E', full: 'Excusado', bg: 'bg-slate-400', text: 'text-slate-600', light: 'bg-slate-100 border-slate-200' },
};

// ── Dot de estado (P/T/A/E) ───────────────────────────────
export const StatusDot = ({ status, size = 'sm' }) => {
    const cfg = STATUS_CFG[status];
    if (!cfg) return <span className="text-slate-300 text-xs">—</span>;
    const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs';
    return (
        <span title={cfg.full} className={`${sz} rounded-full ${cfg.bg} text-white font-black flex items-center justify-center`}>
            {cfg.label}
        </span>
    );
};

// ── Modal genérico ────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
    if (!open) return null;
    const w = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl', xl: 'max-w-3xl' };
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${w[size]} max-h-[92vh] flex flex-col`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <h3 className="text-base font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
                {footer && <div className="px-6 py-4 border-t border-slate-100 flex gap-3">{footer}</div>}
            </div>
        </div>
    );
};

// ── Toast de notificación ─────────────────────────────────
export const PracticaToast = ({ toast, onClose }) => {
    if (!toast) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-semibold text-sm
            ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            {toast.message}
            <button onClick={onClose} className="ml-1 p-0.5 hover:bg-white/20 rounded-lg"><X size={13} /></button>
        </div>
    );
};
