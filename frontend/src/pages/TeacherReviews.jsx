/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardCheck, Search, Filter, Calendar, Users,
    FileText, CheckCircle, XCircle, Clock, ExternalLink,
    Eye, MoreHorizontal, X, FileSearch, Loader2, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

export default function TeacherReviews() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReview, setSelectedReview] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await api.get('/academic/attendance/teacher_all_pending_excuses/');
            setReviews(response.data);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, decision) => {
        try {
            setActionLoading(true);
            await api.post('/academic/attendance/review_excuse/', {
                attendance_id: id,
                decision: decision
            });
            // Remover de la lista local
            setReviews(prev => prev.filter(r => r.id !== id));
            setSelectedReview(null);
        } catch (error) {
            console.error("Error updating review:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredReviews = reviews.filter(r =>
        r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.course_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getMediaUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${path}`;
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES') + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Revisiones Pendientes</h1>
                    <p className="text-slate-500 mt-1">
                        Gestiona las justificaciones de asistencia enviadas por tus estudiantes.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl border border-blue-100 font-bold flex items-center gap-2">
                        <ClipboardCheck size={20} />
                        {reviews.length} pendientes
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
                {/* Search & Tabs */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por estudiante o materia..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-400 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-upn-200 border-t-upn-600 rounded-full animate-spin mx-auto"></div>
                        <p className="text-slate-500 font-medium">Cargando excusas...</p>
                    </div>
                ) : filteredReviews.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estudiante</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Materia</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Inasistencia</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Recibido</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredReviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                                                    {review.student_photo ? (
                                                        <img src={getMediaUrl(review.student_photo)} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                                                            <Users size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{review.student_name}</p>
                                                    <p className="text-xs text-slate-500">{review.student_document}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                                                {review.course_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-bold text-slate-700">{formatDate(review.date)}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${review.status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {review.status === 'ABSENT' ? <XCircle size={12} /> : <Clock size={12} />}
                                                {review.status_label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-xs text-slate-500 font-medium">{formatTime(review.submitted_at)}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={() => setSelectedReview(review)}
                                                className="mx-auto flex items-center gap-2 bg-upn-700 hover:bg-upn-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-upn-700/20 hover:scale-105"
                                            >
                                                <Eye size={14} /> Revisar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">¡Todo al día!</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                            No tienes excusas pendientes de revisión en ninguno de tus cursos.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de Revisión */}
            <AnimatePresence>
                {selectedReview && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedReview(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
                        >
                            {/* Header Modal */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-upn-700 rounded-xl flex items-center justify-center text-white">
                                        <FileSearch size={22} />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-lg">Revisar Justificación</h4>
                                </div>
                                <button onClick={() => setSelectedReview(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                                {/* Info Alumno y Clase */}
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white">
                                        {selectedReview.student_photo ? (
                                            <img src={getMediaUrl(selectedReview.student_photo)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Users size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 leading-tight">{selectedReview.student_name}</p>
                                        <p className="text-xs text-upn-600 font-bold uppercase tracking-wider mt-1">{selectedReview.course_name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium mt-1">Inasistencia del: {formatDate(selectedReview.date)}</p>
                                    </div>
                                </div>

                                {/* Nota */}
                                <div className="space-y-3">
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} /> Nota del estudiante
                                    </h5>
                                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 italic text-slate-700 text-sm leading-relaxed relative">
                                        <div className="absolute top-[-10px] left-4 bg-blue-600 text-white p-1 rounded-md">
                                            <FileText size={12} />
                                        </div>
                                        "{selectedReview.excuse_note || 'Sin comentarios adjuntos.'}"
                                    </div>
                                </div>

                                {/* Archivo Adjunto */}
                                {selectedReview.excuse_file && (
                                    <div className="space-y-3">
                                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <AlertCircle size={14} /> Documento de Soporte
                                        </h5>
                                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shadow-inner group relative">
                                            {selectedReview.excuse_file.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                                                <img
                                                    src={getMediaUrl(selectedReview.excuse_file)}
                                                    className="w-full h-auto max-h-[300px] object-contain transition-transform group-hover:scale-105 duration-500"
                                                    alt="Soporte"
                                                />
                                            ) : (
                                                <div className="p-10 text-center">
                                                    <FileText size={48} className="mx-auto mb-3 text-slate-400" />
                                                    <p className="text-sm font-bold text-slate-600">Documento PDF / Archivo</p>
                                                    <a
                                                        href={getMediaUrl(selectedReview.excuse_file)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-4 inline-flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm border border-slate-200 hover:bg-slate-50"
                                                    >
                                                        <ExternalLink size={14} /> Abrir documento
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer con Acciones */}
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button
                                    onClick={() => handleAction(selectedReview.id, 'REJECTED')}
                                    disabled={actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-4 rounded-2xl font-bold transition-all hover:shadow-lg disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" /> : <><XCircle size={18} /> Rechazar</>}
                                </button>
                                <button
                                    onClick={() => handleAction(selectedReview.id, 'APPROVED')}
                                    disabled={actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 bg-upn-700 hover:bg-upn-800 text-white border border-upn-800 px-4 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-upn-700/30 hover:shadow-upn-700/40 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Aprobar Excusa</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
