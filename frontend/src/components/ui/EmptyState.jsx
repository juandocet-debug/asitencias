// components/ui/EmptyState.jsx
// Estado vacío genérico — para cuando una lista no tiene datos.

import React from 'react';

export default function EmptyState({ icon, message }) {
    return (
        <div className="text-center py-16 text-slate-400">
            <div className="mx-auto mb-4 opacity-30">{icon}</div>
            <p className="text-base">{message}</p>
        </div>
    );
}
