// components/reports/DateBadge.jsx
// Badge de fecha con estado de asistencia. En modo editable muestra un menú
// para cambiar el estado (presente / tardanza / falla / excusa).

import React, { useState } from 'react';
import { CheckCircle, Clock, XCircle, FileText, Edit3 } from 'lucide-react';
import { formatDateShort } from '../../utils/dateUtils';

const COLORS = {
    absent: 'bg-red-50 text-red-700 border-red-100',
    late: 'bg-amber-50 text-amber-700 border-amber-100',
    present: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    excused: 'bg-blue-50 text-blue-700 border-blue-100',
};

const ICONS = {
    absent: <XCircle size={12} />,
    late: <Clock size={12} />,
    present: <CheckCircle size={12} />,
    excused: <FileText size={12} />,
};

export default function DateBadge({ date, type, editable, onChangeStatus, onViewExcuse }) {
    const [showMenu, setShowMenu] = useState(false);

    // date puede ser un string o un objeto { date, has_excuse, ... }
    const dateStr = typeof date === 'object' ? date.date : date;
    const hasExcuse = typeof date === 'object' && date.has_excuse;

    // Modo solo lectura
    if (!editable) {
        return (
            <div className="relative group">
                <span
                    onClick={hasExcuse || type === 'excused' ? onViewExcuse : undefined}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${COLORS[type]} ${hasExcuse || type === 'excused' ? 'cursor-pointer hover:shadow-md' : ''
                        }`}
                >
                    {ICONS[type]} {formatDateShort(dateStr)}
                    {hasExcuse && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-0.5" title="Tiene Excusa" />
                    )}
                </span>
            </div>
        );
    }

    // Modo editable con menú desplegable
    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${COLORS[type]} hover:shadow-md transition-all cursor-pointer`}
            >
                {ICONS[type]} {formatDateShort(dateStr)} <Edit3 size={10} className="ml-1 opacity-50" />
                {hasExcuse && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-0.5" />}
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl shadow-xl border border-slate-200 py-1 min-w-[150px]">
                        <p className="px-3 py-1.5 text-xs text-slate-400 font-medium">Cambiar a:</p>
                        {type !== 'present' && (
                            <button onClick={() => { onChangeStatus('present'); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 text-emerald-700 flex items-center gap-2">
                                <CheckCircle size={14} /> Presente
                            </button>
                        )}
                        {type !== 'late' && (
                            <button onClick={() => { onChangeStatus('late'); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 text-amber-700 flex items-center gap-2">
                                <Clock size={14} /> Tardanza
                            </button>
                        )}
                        {type !== 'absent' && (
                            <button onClick={() => { onChangeStatus('absent'); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-700 flex items-center gap-2">
                                <XCircle size={14} /> Falla
                            </button>
                        )}
                        {type !== 'excused' && (
                            <button onClick={() => { onChangeStatus('excused'); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-blue-700 flex items-center gap-2">
                                <FileText size={14} /> Excusa
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
