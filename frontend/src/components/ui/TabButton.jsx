// components/ui/TabButton.jsx
// Botón de pestaña genérico con indicador de activo.

import React from 'react';

export default function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition-all ${active
                    ? 'bg-[#f0edff] text-[#7657f6] shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
        >
            {icon} {label}
        </button>
    );
}

