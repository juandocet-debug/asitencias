/* eslint-disable */
// components/practicas/practicasUi.jsx
// Primitivos de UI compartidos para las páginas de Practicas (coordinador).
// Toast, Modal, Field, InputField, Textarea, Sel, BtnPrimary, BtnSec, EmptyState.

import React from 'react';
import { Check, AlertTriangle, X, Loader2 } from 'lucide-react';

export const Toast = ({ toast, onClose }) => {
    if (!toast) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-semibold text-sm
            ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span>{toast.message}</span>
            <button onClick={onClose} className="ml-1 hover:bg-white/20 rounded-lg p-0.5"><X size={14} /></button>
        </div>
    );
};

export const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
    if (!open) return null;
    const w = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${w[size]} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <h3 className="text-base font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
                {footer && <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">{footer}</div>}
            </div>
        </div>
    );
};

export const Field = ({ label, children, hint }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
        {children}
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
);

export const InputField = ({ icon: Icon, ...props }) => (
    <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
        <input {...props} className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 transition-all`} />
    </div>
);

export const Textarea = (props) => (
    <textarea {...props} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
        focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 resize-none transition-all" />
);

export const Sel = ({ children, ...props }) => (
    <select {...props} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
        focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-400 appearance-none cursor-pointer">
        {children}
    </select>
);

export const BtnPrimary = ({ loading, children, className = '', ...props }) => (
    <button {...props} disabled={loading || props.disabled}
        className={`flex items-center justify-center gap-2 px-5 py-2.5
            bg-upn-600 hover:bg-upn-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl
            shadow-lg shadow-upn-600/20 transition-all ${className}`}>
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
    </button>
);

export const BtnSec = ({ children, className = '', ...props }) => (
    <button {...props} className={`px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors ${className}`}>
        {children}
    </button>
);

export const EmptyState = ({ icon: Icon, title, subtitle }) => (
    <div className="flex flex-col items-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Icon size={36} className="text-slate-300" />
        </div>
        <p className="font-bold text-slate-600">{title}</p>
        {subtitle && <p className="text-slate-400 text-sm mt-1 text-center max-w-xs">{subtitle}</p>}
    </div>
);
