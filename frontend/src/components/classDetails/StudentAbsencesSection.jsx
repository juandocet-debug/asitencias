/* eslint-disable */
// components/classDetails/StudentAbsencesSection.jsx
// Vista que ve el ESTUDIANTE: lista de sus faltas/retardos + modal para subir excusa.
// Maneja su propio estado del modal de excusa para no ensuciar ClassDetails.

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Upload, FileText } from 'lucide-react';
import api from '../../services/api';

export default function StudentAbsencesSection({ myAbsences, onExcuseSubmitted, showToast }) {
    const [excuseModalOpen, setExcuseModalOpen] = useState(false);
    const [selectedAbsence, setSelectedAbsence] = useState(null);
    const [excuseNote, setExcuseNote] = useState('');
    const [excuseFile, setExcuseFile] = useState(null);

    const openExcuse = (att) => { setSelectedAbsence(att); setExcuseModalOpen(true); };
    const closeExcuse = () => { setExcuseModalOpen(false); setExcuseNote(''); setExcuseFile(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('attendance_id', selectedAbsence.id);
        formData.append('excuse_note', excuseNote);
        if (excuseFile) formData.append('excuse_file', excuseFile);
        try {
            await api.post('/academic/attendance/submit_excuse/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showToast('Excusa enviada correctamente', 'success');
            closeExcuse();
            onExcuseSubmitted?.();
        } catch (err) {
            showToast(err.response?.data?.error || 'Error al enviar excusa', 'error');
        }
    };

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                    <AlertCircle className="text-amber-500" /> Mis Faltas y Retardos
                </h3>

                {myAbsences.length > 0 ? (
                    <div className="space-y-4">
                        {myAbsences.map(att => (
                            <div key={att.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-upn-200 transition-colors bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${att.status === 'ABSENT' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {att.status === 'ABSENT' ? 'F' : 'R'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{att.status_label} - {att.date}</p>
                                        <p className="text-sm text-slate-500">
                                            Estado Excusa: <span className={`font-bold ${att.excuse_status === 'APPROVED' ? 'text-emerald-600' : att.excuse_status === 'REJECTED' ? 'text-red-600' : 'text-amber-600'}`}>
                                                {att.excuse_status_label || 'Sin excusa'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                {!att.has_excuse ? (
                                    <button onClick={() => openExcuse(att)}
                                        className="px-4 py-2 bg-upn-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-upn-700 transition-colors flex items-center gap-2 justify-center">
                                        <Upload size={16} /> Subir Excusa
                                    </button>
                                ) : (
                                    <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-sm font-medium flex items-center gap-2 justify-center cursor-default">
                                        <FileText size={16} /> Excusa Enviada
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <CheckCircle size={48} className="mx-auto mb-3 text-emerald-200" />
                        <p className="font-medium text-slate-600">¡Excelente!</p>
                        <p className="text-sm">No tienes faltas ni retardos registrados.</p>
                    </div>
                )}
            </div>

            {/* Modal de excusa — interno al componente */}
            {excuseModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Justificar Inasistencia</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Sube un comprobante o escribe el motivo de tu falta del día <b>{selectedAbsence?.date}</b>.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Motivo / Nota</label>
                                <textarea className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-upn-500 outline-none"
                                    rows="3" value={excuseNote} onChange={e => setExcuseNote(e.target.value)}
                                    placeholder="Explica brevemente..." required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Adjuntar Archivo (Opcional)</label>
                                <input type="file"
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-upn-50 file:text-upn-700 hover:file:bg-upn-100"
                                    onChange={e => setExcuseFile(e.target.files[0])} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeExcuse}
                                    className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                                <button type="submit"
                                    className="flex-1 py-2.5 bg-upn-600 hover:bg-upn-700 text-white rounded-xl font-bold shadow-lg shadow-upn-600/20">Enviar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
