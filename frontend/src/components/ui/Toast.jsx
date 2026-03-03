// components/ui/Toast.jsx
// Notificación temporal (éxito / error / info) — se cierra sola a los 4 segundos.

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor =
        type === 'success' ? 'bg-emerald-600' :
            type === 'error' ? 'bg-red-600' :
                'bg-slate-800';

    return (
        <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100]`}>
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
                <X size={16} />
            </button>
        </div>
    );
}
