// components/ui/TabButton.jsx
// Botón de pestaña genérico con indicador de activo.

import React from 'react';

export default function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-5 py-4 font-semibold text-sm transition-all border-b-2 ${active
                    ? 'text-upn-700 border-upn-600 bg-white'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
                }`}
        >
            {icon} {label}
        </button>
    );
}
