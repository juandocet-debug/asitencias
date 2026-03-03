// components/reports/AttendanceModal.jsx
// Modal de detalle de asistencia de un participante.
// Permite ver el historial de fechas y editarlo. También maneja la revisión de excusas.

import React, { useState } from 'react';
import {
    X, Edit3, Save, Loader2, XCircle, Clock, CheckCircle,
    FileText, AlertCircle, Calendar, Mail, Phone
} from 'lucide-react';
import api from '../../services/api';
import { formatDate, formatDateShort } from '../../utils/dateUtils';
import DateBadge from './DateBadge';

export default function AttendanceModal({ student, onClose, getMediaUrl, onUpdate, showToast, courseId }) {
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [viewingExcuse, setViewingExcuse] = useState(null);

    // Normalizar las fechas (pueden ser strings o { date, has_excuse, ... })
    const normalizeAbsent = (student.absent_dates || []).map(d => typeof d === 'object' ? d.date : d);
    const normalizeLate = student.late_dates || [];
    const normalizePresent = student.present_dates || [];
    const normalizeExcused = (student.excused_dates || []).map(d => typeof d === 'object' ? d.date : d);

    const [editedAbsent, setEditedAbsent] = useState([...normalizeAbsent]);
    const [editedLate, setEditedLate] = useState([...normalizeLate]);
    const [editedPresent, setEditedPresent] = useState([...normalizePresent]);
    const [editedExcused, setEditedExcused] = useState([...normalizeExcused]);

    // Encuentra el objeto de asistencia original por fecha (para obtener excuse_file, etc.)
    const getAttendanceStatus = (dateStr) => {
        const absMatch = (student.absent_dates || []).find(d => (typeof d === 'object' ? d.date : d) === dateStr);
        if (absMatch && typeof absMatch === 'object') return absMatch;
        const lateMatch = (student.late_dates || []).find(d => (typeof d === 'object' ? d.date : d) === dateStr);
        if (lateMatch && typeof lateMatch === 'object') return lateMatch;
        const excMatch = (student.excused_dates || []).find(d => (typeof d === 'object' ? d.date : d) === dateStr);
        if (excMatch && typeof excMatch === 'object') return excMatch;
        return { date: dateStr };
    };

    // Cambia el estado de una fecha de una lista a otra
    const changeStatus = (date, fromStatus, toStatus) => {
        const dateStr = typeof date === 'object' ? date.date : date;
        if (fromStatus === 'absent') setEditedAbsent(prev => prev.filter(d => d !== dateStr));
        else if (fromStatus === 'late') setEditedLate(prev => prev.filter(d => d !== dateStr));
        else if (fromStatus === 'present') setEditedPresent(prev => prev.filter(d => d !== dateStr));
        else if (fromStatus === 'excused') setEditedExcused(prev => prev.filter(d => d !== dateStr));

        if (toStatus === 'absent') setEditedAbsent(prev => [...prev, dateStr].sort());
        else if (toStatus === 'late') setEditedLate(prev => [...prev, dateStr].sort());
        else if (toStatus === 'present') setEditedPresent(prev => [...prev, dateStr].sort());
        else if (toStatus === 'excused') setEditedExcused(prev => [...prev, dateStr].sort());
    };

    // Guarda los cambios de estado en el backend
    const saveChanges = async () => {
        setSaving(true);
        try {
            const allDates = new Set([...editedAbsent, ...editedLate, ...editedPresent, ...editedExcused]);
            const updates = [];

            allDates.forEach(dateStr => {
                let newStatus = 'PRESENT';
                if (editedAbsent.includes(dateStr)) newStatus = 'ABSENT';
                else if (editedLate.includes(dateStr)) newStatus = 'LATE';
                else if (editedExcused.includes(dateStr)) newStatus = 'EXCUSED';

                let oldStatus = 'PRESENT';
                if (normalizeAbsent.includes(dateStr)) oldStatus = 'ABSENT';
                else if (normalizeLate.includes(dateStr)) oldStatus = 'LATE';
                else if (normalizeExcused.includes(dateStr)) oldStatus = 'EXCUSED';

                if (newStatus !== oldStatus) {
                    updates.push({ date: dateStr, status: newStatus });
                }
            });

            if (updates.length > 0) {
                await api.post(`/academic/courses/${courseId}/update_attendance/`, {
                    student_id: student.id,
                    updates,
                });
                showToast('Asistencia actualizada correctamente', 'success');
                onUpdate();
            } else {
                showToast('No hay cambios para guardar', 'success');
                setEditMode(false);
            }
        } catch (error) {
            console.error('Error updating:', error);
            showToast('Error al actualizar', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Aprueba o rechaza una excusa
    const handleReviewAction = async (attendanceId, decision) => {
        try {
            await api.post('/academic/attendance/review_excuse/', {
                attendance_id: attendanceId,
                decision,
            });
            showToast(`Excusa ${decision === 'APPROVED' ? 'aprobada' : 'rechazada'}`, 'success');
            setViewingExcuse(null);
            onUpdate();
        } catch {
            showToast('Error al procesar la excusa', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

                {/* Encabezado con datos del participante */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-xl font-semibold text-slate-500 uppercase flex-shrink-0">
                                {student.photo ? (
                                    <img src={getMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    `${student.first_name?.[0]}${student.last_name?.[0]}`
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{student.first_name} {student.last_name}</h3>
                                <p className="text-sm text-slate-500">{student.document_number}</p>
                                {student.email && <p className="text-xs text-slate-400">{student.email}</p>}
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Barra de estadísticas */}
                <div className="grid grid-cols-5 divide-x divide-slate-100 bg-slate-50 border-b border-slate-100">
                    <div className="py-4 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{editMode ? editedPresent.length : student.present}</p>
                        <p className="text-xs text-slate-500 font-medium">Presentes</p>
                    </div>
                    <div className="py-4 text-center">
                        <p className="text-2xl font-bold text-amber-600">{editMode ? editedLate.length : student.late}</p>
                        <p className="text-xs text-slate-500 font-medium">Tardanzas</p>
                    </div>
                    <div className="py-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{editMode ? editedAbsent.length : student.absent}</p>
                        <p className="text-xs text-slate-500 font-medium">Fallas</p>
                    </div>
                    <div className="py-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{editMode ? editedExcused.length : (student.excused || 0)}</p>
                        <p className="text-xs text-slate-500 font-medium">Excusas</p>
                    </div>
                    <div className="py-4 text-center">
                        <p className={`text-2xl font-bold ${student.attendance_rate >= 80 ? 'text-emerald-600' : student.attendance_rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {student.attendance_rate}%
                        </p>
                        <p className="text-xs text-slate-500 font-medium">Asistencia</p>
                    </div>
                </div>

                {/* Contenido scrollable */}
                <div className="p-6 max-h-[350px] overflow-y-auto">
                    {/* Toggle edición */}
                    <div className="flex items-center justify-between mb-5">
                        <p className="text-sm text-slate-500">
                            {editMode ? '✏️ Haz clic en una fecha para cambiar su estado' : 'Historial de asistencia del estudiante'}
                        </p>
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${editMode ? 'bg-slate-200 text-slate-700' : 'bg-upn-50 text-upn-700 hover:bg-upn-100'}`}
                        >
                            <Edit3 size={14} /> {editMode ? 'Cancelar' : 'Editar'}
                        </button>
                    </div>

                    {/* Fallas */}
                    {(editMode ? editedAbsent : normalizeAbsent)?.length > 0 && (
                        <div className="mb-5">
                            <h4 className="text-xs font-semibold text-red-600 uppercase mb-3 flex items-center gap-2">
                                <XCircle size={14} /> Fallas ({(editMode ? editedAbsent : normalizeAbsent).length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(editMode ? editedAbsent : normalizeAbsent).map((date, idx) => (
                                    <DateBadge
                                        key={idx}
                                        date={getAttendanceStatus(date)}
                                        type="absent"
                                        editable={editMode}
                                        onViewExcuse={() => setViewingExcuse(getAttendanceStatus(date))}
                                        onChangeStatus={(toStatus) => changeStatus(date, 'absent', toStatus)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tardanzas */}
                    {(editMode ? editedLate : normalizeLate)?.length > 0 && (
                        <div className="mb-5">
                            <h4 className="text-xs font-semibold text-amber-600 uppercase mb-3 flex items-center gap-2">
                                <Clock size={14} /> Tardanzas ({(editMode ? editedLate : normalizeLate).length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(editMode ? editedLate : normalizeLate).map((date, idx) => (
                                    <DateBadge
                                        key={idx}
                                        date={getAttendanceStatus(date)}
                                        type="late"
                                        editable={editMode}
                                        onViewExcuse={() => setViewingExcuse(getAttendanceStatus(date))}
                                        onChangeStatus={(toStatus) => changeStatus(date, 'late', toStatus)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Presencias */}
                    {(editMode ? editedPresent : normalizePresent)?.length > 0 && (
                        <div className="mb-5">
                            <h4 className="text-xs font-semibold text-emerald-600 uppercase mb-3 flex items-center gap-2">
                                <CheckCircle size={14} /> Asistencias ({(editMode ? editedPresent : normalizePresent).length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(editMode ? editedPresent : normalizePresent).map((date, idx) => (
                                    <DateBadge
                                        key={idx}
                                        date={date}
                                        type="present"
                                        editable={editMode}
                                        onChangeStatus={(toStatus) => changeStatus(date, 'present', toStatus)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Excusas aprobadas */}
                    {(editMode ? editedExcused : normalizeExcused)?.length > 0 && (
                        <div className="mb-5">
                            <h4 className="text-xs font-semibold text-blue-600 uppercase mb-3 flex items-center gap-2">
                                <FileText size={14} /> Excusas ({(editMode ? editedExcused : normalizeExcused).length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(editMode ? editedExcused : normalizeExcused).map((date, idx) => (
                                    <DateBadge
                                        key={idx}
                                        date={date}
                                        type="excused"
                                        editable={editMode}
                                        onViewExcuse={() => setViewingExcuse(date)}
                                        onChangeStatus={(toStatus) => changeStatus(date, 'excused', toStatus)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Excusas pendientes de revisión */}
                    {!editMode && student.pending_excuses?.length > 0 && (
                        <div className="mb-5 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                                <AlertCircle size={16} /> Excusas Pendientes ({student.pending_excuses.length})
                            </h4>
                            <div className="space-y-2">
                                {student.pending_excuses.map((exc, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-200">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{formatDateShort(exc.date)}</span>
                                        </div>
                                        <button
                                            onClick={() => setViewingExcuse(exc)}
                                            className="text-xs font-bold text-upn-600 hover:text-upn-700 bg-upn-50 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Revisar Excusa
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sin datos */}
                    {!normalizePresent?.length && !normalizeLate?.length && !normalizeAbsent?.length && !normalizeExcused?.length && (
                        <div className="text-center py-12 text-slate-400">
                            <Calendar size={40} className="mx-auto mb-3 opacity-50" />
                            <p>No hay registros de asistencia</p>
                        </div>
                    )}
                </div>

                {/* Acciones del pie */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                    {editMode ? (
                        <>
                            <button
                                onClick={() => setEditMode(false)}
                                className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl font-semibold transition-colors hover:bg-slate-100"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 bg-upn-600 hover:bg-upn-700 text-white px-4 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Guardar Cambios
                            </button>
                        </>
                    ) : (
                        <>
                            {student.email && (
                                <a
                                    href={`mailto:${student.email}`}
                                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 rounded-xl font-semibold transition-colors"
                                >
                                    <Mail size={18} /> Enviar Email
                                </a>
                            )}
                            {student.phone_number && (
                                <a
                                    href={`tel:${student.phone_number}`}
                                    className="flex-1 flex items-center justify-center gap-2 bg-upn-600 hover:bg-upn-700 text-white px-4 py-3 rounded-xl font-semibold transition-colors"
                                >
                                    <Phone size={18} /> Llamar
                                </a>
                            )}
                        </>
                    )}
                </div>

                {/* Sub-modal: vista detallada de una excusa */}
                {viewingExcuse && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h4 className="font-bold text-slate-800">Detalle de la Excusa</h4>
                                <button onClick={() => setViewingExcuse(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Fecha de la Falta</p>
                                    <p className="font-bold text-slate-800">{formatDate(viewingExcuse.date)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Motivo/Nota</p>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm">
                                        "{viewingExcuse.excuse_note || 'Sin nota adjunta'}"
                                    </div>
                                </div>
                                {viewingExcuse.excuse_file && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Documento de Soporte</p>
                                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center min-h-[200px]">
                                            {viewingExcuse.excuse_file.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                                                <img
                                                    src={getMediaUrl(viewingExcuse.excuse_file)}
                                                    className="w-full h-auto max-h-[400px] object-contain"
                                                    alt="Soporte"
                                                />
                                            ) : (
                                                <div className="text-center p-8">
                                                    <FileText size={48} className="mx-auto mb-3 text-slate-400" />
                                                    <p className="text-sm font-bold text-slate-700 mb-4">El documento es un PDF u otro formato</p>
                                                    <a
                                                        href={getMediaUrl(viewingExcuse.excuse_file)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 bg-upn-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-upn-700 transition-colors"
                                                    >
                                                        Abrir documento en nueva pestaña
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {/* Botones de aprobación solo si la excusa está pendiente */}
                                {(viewingExcuse.attendance_id || (viewingExcuse.has_excuse && viewingExcuse.excuse_status === 'PENDING')) && (
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => handleReviewAction(viewingExcuse.attendance_id || viewingExcuse.id, 'REJECTED')}
                                            className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100"
                                        >
                                            <XCircle size={18} /> Rechazar
                                        </button>
                                        <button
                                            onClick={() => handleReviewAction(viewingExcuse.attendance_id || viewingExcuse.id, 'APPROVED')}
                                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                                        >
                                            <CheckCircle size={18} /> Aprobar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
