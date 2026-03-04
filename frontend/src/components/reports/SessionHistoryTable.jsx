// components/reports/SessionHistoryTable.jsx
// Tabla de historial de sesiones de clase con estadísticas de asistencia por fecha.
// Props:
//   onEdit(date)   → si se pasa, muestra botón "Editar" por fila
//   onDelete(date) → si se pasa, muestra botón "Eliminar" con confirmación inline por fila

import React, { useState } from 'react';
import { Calendar, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import EmptyState from '../ui/EmptyState';

function AttendanceBar({ rate }) {
    const color = rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500';
    const textColor = rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600';
    return (
        <div className="flex items-center justify-center gap-2">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
            </div>
            <span className={`text-xs font-semibold ${textColor}`}>{rate}%</span>
        </div>
    );
}

const BADGE = 'inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-full text-xs font-semibold';

export default function SessionHistoryTable({ history, onEdit, onDelete }) {
    // Guarda la fecha de la fila que está esperando confirmación de eliminación
    const [confirmDate, setConfirmDate] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleDeleteClick = (date) => setConfirmDate(date);
    const handleCancelDelete = () => setConfirmDate(null);

    const handleConfirmDelete = async (date) => {
        setDeleting(true);
        try {
            await onDelete(date);
        } finally {
            setDeleting(false);
            setConfirmDate(null);
        }
    };

    if (!history.length) {
        return <EmptyState icon={<Calendar size={48} />} message="No hay sesiones registradas aún" />;
    }

    // Columnas dinámicas según qué props se pasaron
    const headers = ['Fecha', 'Tema', 'Presentes', 'Tardanzas', 'Faltas', 'Asistencia'];
    if (onEdit || onDelete) headers.push('');   // columna acción sin título

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-100">
                        {headers.map((h, i) => (
                            <th key={i} className={`${i <= 1 ? 'text-left' : 'text-center'} px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide`}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {history.map((session, idx) => {
                        const isConfirming = confirmDate === session.date;

                        return (
                            <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${isConfirming ? 'bg-red-50/60' : ''}`}>
                                {/* Fecha */}
                                <td className="px-4 py-4">
                                    <span className="font-medium text-slate-800">{formatDate(session.date)}</span>
                                </td>
                                {/* Tema */}
                                <td className="px-4 py-4 text-slate-600">
                                    {session.topic || <span className="text-slate-400">—</span>}
                                </td>
                                {/* Conteos */}
                                <td className="px-4 py-4 text-center">
                                    <span className={`${BADGE} bg-emerald-50 text-emerald-700`}>{session.present}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`${BADGE} bg-amber-50 text-amber-700`}>{session.late}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`${BADGE} bg-red-50 text-red-700`}>{session.absent}</span>
                                </td>
                                {/* Barra */}
                                <td className="px-4 py-4">
                                    <AttendanceBar rate={session.attendance_rate} />
                                </td>

                                {/* Acciones */}
                                {(onEdit || onDelete) && (
                                    <td className="px-4 py-4">
                                        {isConfirming ? (
                                            /* ── Mini confirmación inline ── */
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                                                    <AlertTriangle size={12} />
                                                    ¿Eliminar sesión?
                                                </span>
                                                <button
                                                    onClick={() => handleConfirmDelete(session.date)}
                                                    disabled={deleting}
                                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                                                >
                                                    {deleting ? '...' : 'Sí, borrar'}
                                                </button>
                                                <button
                                                    onClick={handleCancelDelete}
                                                    disabled={deleting}
                                                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : (
                                            /* ── Botones normales ── */
                                            <div className="flex items-center justify-end gap-2">
                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(session.date)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-upn-50 hover:bg-upn-100 text-upn-700 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <Edit2 size={13} /> Editar
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => handleDeleteClick(session.date)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <Trash2 size={13} /> Eliminar
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
