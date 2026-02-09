/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { AlertCircle, FileText, Upload, CheckCircle, ArrowLeft, Loader2, X, Clock, BookOpen, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Toast Component local
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-slate-800';
    return (
        <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-5 duration-300`}>
            <span className="font-medium">{message}</span>
            <button onClick={onClose}>
                <X size={16} />
            </button>
        </div>
    );
}

export default function MyAbsences() {
    const navigate = useNavigate();
    const [absences, setAbsences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Modal state for excuse
    const [excuseModalOpen, setExcuseModalOpen] = useState(false);
    const [selectedAbsence, setSelectedAbsence] = useState(null);
    const [excuseNote, setExcuseNote] = useState('');
    const [excuseFile, setExcuseFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAbsences();
    }, []);

    const fetchAbsences = async () => {
        try {
            const res = await api.get('/academic/attendance/all_my_absences/');
            setAbsences(res.data);
        } catch (error) {
            console.error(error);
            showToast("Error al cargar faltas", "error");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => setToast({ message, type });

    const handleExcuseSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData();
        formData.append('attendance_id', selectedAbsence.id);
        formData.append('excuse_note', excuseNote);
        if (excuseFile) {
            formData.append('excuse_file', excuseFile);
        }

        try {
            await api.post('/academic/attendance/submit_excuse/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Excusa enviada correctamente', 'success');
            setExcuseModalOpen(false);
            setExcuseNote('');
            setExcuseFile(null);
            fetchAbsences();
        } catch (error) {
            showToast(error.response?.data?.error || 'Error al enviar excusa', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-upn-600" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 p-4">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Mis Faltas y Retardos</h2>
                    <p className="text-slate-500 text-sm">Gestiona tus excusas médicas o personales por inasistencia.</p>
                </div>
            </div>

            {/* Absences List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-8">
                {absences.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {absences.map(att => (
                            <div key={att.id} className="group border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row justify-between md:items-center gap-6 hover:border-upn-200 transition-all bg-slate-50/30 hover:bg-white hover:shadow-lg">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${att.status === 'ABSENT' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                        {att.status === 'ABSENT' ? 'F' : 'R'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md ${att.status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {att.status_label}
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-sm font-bold text-slate-400 flex items-center gap-1">
                                                <Calendar size={14} /> {att.date}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-upn-700 transition-colors">{att.course_name}</h4>
                                        <div className="mt-2 flex items-center gap-3">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${att.excuse_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : att.excuse_status === 'REJECTED' ? 'bg-red-100 text-red-700' : att.excuse_status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${att.excuse_status === 'APPROVED' ? 'bg-emerald-500' : att.excuse_status === 'REJECTED' ? 'bg-red-500' : att.excuse_status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                                                {att.excuse_status_label || 'Sin Excusa'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {!att.has_excuse ? (
                                        <button
                                            onClick={() => { setSelectedAbsence(att); setExcuseModalOpen(true); }}
                                            className="w-full md:w-auto px-6 py-3 bg-upn-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-upn-600/20 hover:bg-upn-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 justify-center"
                                        >
                                            <Upload size={18} /> Gestionar Excusa
                                        </button>
                                    ) : (
                                        <div className="w-full md:w-auto px-6 py-3 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold flex items-center gap-2 justify-center border border-slate-200">
                                            <FileText size={18} /> Excusa en Trámite
                                        </div>
                                    )}
                                    <button
                                        onClick={() => navigate(`/classes/${att.course_id}`)}
                                        className="p-3 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-xl transition-all"
                                        title="Ver detalles de la clase"
                                    >
                                        <BookOpen size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-emerald-500">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">¡Todo al día!</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">No tienes inasistencias ni retardos registrados en el periodo seleccionado.</p>
                    </div>
                )}
            </div>

            {/* Modal for uploading excuse */}
            {excuseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !submitting && setExcuseModalOpen(false)}></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Enviar Excusa</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                {selectedAbsence?.course_name} - {selectedAbsence?.date}
                            </p>

                            <form onSubmit={handleExcuseSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Motivo de la inasistencia</label>
                                    <textarea
                                        value={excuseNote}
                                        onChange={(e) => setExcuseNote(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-upn-500 focus:outline-none min-h-[120px]"
                                        placeholder="Describe brevemente el motivo..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Soporte Médico/Documental (Opcional)</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            onChange={(e) => setExcuseFile(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            accept=".pdf,image/*"
                                        />
                                        <div className="border-2 border-dashed border-slate-200 group-hover:border-upn-400 group-hover:bg-upn-50 transition-all rounded-xl p-4 flex items-center justify-center gap-3">
                                            <Upload className="text-slate-400 group-hover:text-upn-600" size={20} />
                                            <span className="text-sm font-medium text-slate-500 group-hover:text-upn-700">
                                                {excuseFile ? excuseFile.name : 'Subir foto o PDF'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2">Formatos permitidos: JPG, PNG, PDF. Tamaño máx: 5MB.</p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => setExcuseModalOpen(false)}
                                        className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-4 py-3 bg-upn-600 text-white font-bold rounded-xl shadow-lg shadow-upn-600/20 hover:bg-upn-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Excusa'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
