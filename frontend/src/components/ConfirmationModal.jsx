import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", isDestructive = false }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden scale-100 transition-all">
                <div className="p-6 text-center">
                    <div className={`mx-auto w-16 h-16 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'} rounded-full flex items-center justify-center mb-4`}>
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-slate-500 mb-6">{message}</p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`flex-1 py-3 px-4 text-white font-bold rounded-xl transition-colors shadow-lg ${isDestructive ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-upn-600 hover:bg-upn-700 shadow-upn-600/20'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                </button>
            </div>
        </div>
    );
}
