/* eslint-disable */
// components/register/registerUtils.jsx
// Primitivos compartidos: Toast, SuccessModal, InputGroup

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, ArrowRight } from 'lucide-react';

export function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-amber-500';
    const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

    return (
        <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-5 duration-300`}>
            <Icon size={20} />
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"><X size={16} /></button>
        </div>
    );
}

export function SuccessModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} className="text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Registro Exitoso!</h3>
                <p className="text-slate-500 mb-6">
                    Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión usando tu <strong>número de cédula</strong> y la <strong>contraseña</strong> que estableciste.
                </p>
                <button onClick={onClose} className="w-full bg-upn-700 hover:bg-upn-800 text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2">
                    Ir a Iniciar Sesión <ArrowRight size={20} />
                </button>
            </motion.div>
        </div>
    );
}

export function InputGroup({ label, icon, helper, className, ...props }) {
    return (
        <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                {icon} {label}
            </label>
            <div className="relative group">
                <input
                    {...props}
                    className={`block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-600 transition-all font-medium ${className}`}
                />
            </div>
            {helper && <p className="text-xs text-slate-500 ml-1">{helper}</p>}
        </div>
    );
}
