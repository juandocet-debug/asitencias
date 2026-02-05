import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Search, Trash2, QrCode, Check, Award, X, User, Mail, Phone, Save, CheckCircle, AlertCircle, Loader2, BarChart3 } from 'lucide-react';
import api from '../services/api';

// Toast Component
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-slate-800';
    const Icon = type === 'success' ? CheckCircle : AlertCircle;

    return (
        <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-5 duration-300`}>
            <Icon size={20} />
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded p-1 transition-colors">
                <X size={16} />
            </button>
        </div>
    );
}

export default function ClassDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => setToast({ message, type });

    // Modals & Logic
    const [qrOpen, setQrOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState({});
    const [savingAttendance, setSavingAttendance] = useState(false);

    // Base URL for media files
    const getMediaUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        // Construir URL completa del backend
        return `http://127.0.0.1:8000${path.startsWith('/') ? '' : '/'}${path}`;
    };

    useEffect(() => {
        fetchCourseAndStudents();
    }, [id]);

    const fetchCourseAndStudents = async () => {
        try {
            const response = await api.get(`/academic/courses/${id}/`);
            setCourse(response.data);

            if (response.data.students) {
                const initialData = {};
                response.data.students.forEach(s => {
                    initialData[s.id] = 'PRESENT';
                });
                setAttendanceData(initialData);
            }
        } catch (error) {
            console.error("Error fetching course:", error);
            showToast("Error al cargar la clase", "error");
        } finally {
            setLoading(false);
        }
    };

    // Filtered students for main list
    const filteredStudents = useMemo(() => {
        if (!course?.students) return [];
        if (!searchTerm.trim()) return course.students;
        const term = searchTerm.toLowerCase();
        return course.students.filter(s =>
            s.first_name?.toLowerCase().includes(term) ||
            s.last_name?.toLowerCase().includes(term) ||
            s.document_number?.includes(term)
        );
    }, [course?.students, searchTerm]);

    // Filtered students for attendance modal
    const filteredAttendanceStudents = useMemo(() => {
        if (!course?.students) return [];
        if (!attendanceSearchTerm.trim()) return course.students;
        const term = attendanceSearchTerm.toLowerCase();
        return course.students.filter(s =>
            s.first_name?.toLowerCase().includes(term) ||
            s.last_name?.toLowerCase().includes(term) ||
            s.document_number?.includes(term)
        );
    }, [course?.students, attendanceSearchTerm]);

    const handleAttendanceSubmit = async () => {
        setSavingAttendance(true);
        try {
            const payload = {
                course_id: course.id,
                date: attendanceDate,
                attendances: Object.keys(attendanceData).map(studentId => ({
                    student_id: parseInt(studentId),
                    status: attendanceData[studentId]
                }))
            };

            await api.post('/academic/attendance/bulk_create/', payload);
            showToast("¡Asistencia guardada exitosamente!", "success");
            setIsAttendanceModalOpen(false);
        } catch (error) {
            console.error("Error saving attendance:", error);
            showToast("Error al guardar asistencia", "error");
        } finally {
            setSavingAttendance(false);
        }
    };

    const toggleAttendanceStatus = (studentId) => {
        setAttendanceData(prev => {
            const current = prev[studentId] || 'PRESENT';
            const next = current === 'PRESENT' ? 'ABSENT' : (current === 'ABSENT' ? 'LATE' : 'PRESENT');
            return { ...prev, [studentId]: next };
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
            case 'ABSENT': return 'bg-red-100 text-red-800 border-red-300';
            case 'LATE': return 'bg-amber-100 text-amber-800 border-amber-300';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PRESENT': return 'Presente';
            case 'ABSENT': return 'Ausente';
            case 'LATE': return 'Tarde';
            default: return '-';
        }
    };

    // Mark all as present/absent
    const markAll = (status) => {
        if (!course?.students) return;
        const newData = {};
        course.students.forEach(s => {
            newData[s.id] = status;
        });
        setAttendanceData(newData);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-upn-600" />
        </div>
    );
    if (!course) return <div className="p-8 text-center text-slate-500">Clase no encontrada</div>;

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/classes')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{course.name}</h2>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar size={14} /> <span>{course.year}-{course.period}</span>
                        <span className="text-slate-300">|</span>
                        <Users size={14} /> <span>{course.students ? course.students.length : 0} Estudiantes</span>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 bg-upn-50 px-4 py-2 rounded-xl border border-upn-100 w-full md:w-auto">
                    <div className="text-upn-600 font-bold text-sm">CÓDIGO:</div>
                    <div className="font-mono text-xl font-black text-upn-900 tracking-wider">
                        {course.code}
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto flex-wrap">
                    <button onClick={() => setQrOpen(true)} className="flex-1 md:flex-none justify-center bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
                        <QrCode size={18} /> Código QR
                    </button>
                    <button
                        onClick={() => navigate(`/classes/${id}/reports`)}
                        className="flex-1 md:flex-none justify-center bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                        <BarChart3 size={18} /> Ver Reportes
                    </button>
                    <button
                        onClick={() => setIsAttendanceModalOpen(true)}
                        className="flex-1 md:flex-none justify-center bg-upn-600 hover:bg-upn-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-upn-600/20"
                    >
                        <Check size={18} /> Llamar Asistencia
                    </button>
                </div>
            </div>


            {/* Student List Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-upn-600" /> Lista de Estudiantes
                    </h3>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar estudiante..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-10">#</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estudiante</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student, index) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-400 font-medium">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setSelectedStudent(student)} className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 uppercase border-2 border-white shadow-md overflow-hidden hover:ring-2 hover:ring-upn-400 transition-all flex-shrink-0">
                                                    {student.photo ? (
                                                        <img src={getMediaUrl(student.photo)} alt={student.first_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{student.first_name?.[0]}{student.last_name?.[0]}</span>
                                                    )}
                                                </button>
                                                <div>
                                                    <p className="font-bold text-slate-800">{student.first_name} {student.last_name}</p>
                                                    <p className="text-xs text-slate-500 font-mono">ID: {student.document_number || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-sm text-slate-600">
                                                <span>{student.email}</span>
                                                <span className="text-xs text-slate-400">{student.phone_number || 'Sin Celular'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                Activo
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Ver Insignias">
                                                    <Award size={18} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <QrCode size={32} className="text-slate-300" />
                                            <p>{searchTerm ? 'No se encontraron resultados' : 'No hay estudiantes inscritos aún.'}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal QR */}
            {qrOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setQrOpen(false)}>
                    <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setQrOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Código de Acceso</h3>
                        <div className="bg-slate-900 p-6 rounded-2xl mb-6 shadow-inner inline-block">
                            <QrCode size={200} className="text-white" />
                        </div>
                        <div className="bg-upn-50 py-3 px-6 rounded-xl font-mono text-3xl font-black text-upn-900 tracking-widest border border-upn-100">
                            {course.code}
                        </div>
                        <p className="mt-4 text-slate-500 text-sm">Escanea o comparte este código para unirse a la clase.</p>
                    </div>
                </div>
            )}

            {/* Modal Foto Detalle */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedStudent(null)}>
                    <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="relative aspect-square bg-slate-100">
                            {selectedStudent.photo ? (
                                <img src={getMediaUrl(selectedStudent.photo)} alt={selectedStudent.first_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <User size={120} />
                                </div>
                            )}
                            <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 text-center">
                            <h3 className="text-2xl font-bold text-slate-900">{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                            <p className="text-slate-500 font-mono mt-1">{selectedStudent.document_number}</p>
                            <div className="flex items-center justify-center gap-4 mt-4">
                                <a href={`mailto:${selectedStudent.email}`} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"><Mail size={20} /></a>
                                {selectedStudent.phone_number && (
                                    <a href={`tel:${selectedStudent.phone_number}`} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"><Phone size={20} /></a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Asistencia - MEJORADO */}
            {isAttendanceModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-50/50 flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Check className="text-upn-600" /> Llamar Asistencia
                                </h3>
                                <p className="text-xs text-slate-500">Toca cada tarjeta para cambiar el estado. Click = Presente → Ausente → Tarde</p>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <input
                                    type="date"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-upn-500/20"
                                />
                                <button onClick={() => setIsAttendanceModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Search and Quick Actions */}
                        <div className="px-6 py-3 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center bg-white">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar estudiante por nombre o documento..."
                                    value={attendanceSearchTerm}
                                    onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => markAll('PRESENT')} className="px-4 py-2 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                                    Todos Presentes
                                </button>
                                <button onClick={() => markAll('ABSENT')} className="px-4 py-2 text-xs font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                                    Todos Ausentes
                                </button>
                            </div>
                        </div>

                        {/* Listado Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredAttendanceStudents.map(student => (
                                    <div key={student.id}
                                        onClick={() => toggleAttendanceStatus(student.id)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] select-none shadow-sm ${getStatusColor(attendanceData[student.id])}`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-14 h-14 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center overflow-hidden font-bold text-sm border-2 border-white shadow-sm flex-shrink-0">
                                                {student.photo ? (
                                                    <img src={getMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg">{student.first_name?.[0]}{student.last_name?.[0]}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold truncate">{student.first_name} {student.last_name}</h4>
                                                <p className="text-xs opacity-70 font-mono">{student.document_number}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <div className="px-3 py-1.5 rounded-lg bg-white/60 text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-current/10">
                                                {getStatusLabel(attendanceData[student.id])}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {filteredAttendanceStudents.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    <Search size={40} className="mx-auto mb-3 text-slate-300" />
                                    <p>No se encontraron estudiantes con ese criterio</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white flex-shrink-0">
                            <p className="text-sm text-slate-500">
                                <span className="font-bold text-emerald-600">{Object.values(attendanceData).filter(s => s === 'PRESENT').length}</span> presentes,{' '}
                                <span className="font-bold text-red-600">{Object.values(attendanceData).filter(s => s === 'ABSENT').length}</span> ausentes,{' '}
                                <span className="font-bold text-amber-600">{Object.values(attendanceData).filter(s => s === 'LATE').length}</span> tarde
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsAttendanceModalOpen(false)}
                                    className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAttendanceSubmit}
                                    disabled={savingAttendance}
                                    className="px-6 py-2.5 bg-upn-600 text-white rounded-xl text-sm font-bold hover:bg-upn-700 transition-colors shadow-lg shadow-upn-600/20 flex items-center gap-2 disabled:opacity-70"
                                >
                                    {savingAttendance ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {savingAttendance ? 'Guardando...' : 'Guardar Asistencia'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
