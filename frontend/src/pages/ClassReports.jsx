/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BarChart3, AlertTriangle, CheckCircle, FileText, Search, Loader2 } from 'lucide-react';
import { getMediaUrl } from '../utils/dateUtils';
import { generateAttendancePDF } from '../utils/pdfExport';
import { useAttendanceReport } from '../hooks/useAttendanceReport';
import Toast from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import TabButton from '../components/ui/TabButton';
import AttendanceRow from '../components/reports/AttendanceRow';
import AlertCard from '../components/reports/AlertCard';
import ReportsAttendanceModal from '../components/reports/AttendanceModal';
import AttendanceSummaryBar from '../components/reports/AttendanceSummaryBar';
import SessionHistoryTable from '../components/reports/SessionHistoryTable';
import AttendanceModal from '../components/AttendanceModal';

export default function ClassReports() {
    const { id } = useParams();
    const navigate = useNavigate();

    // UI state
    const [activeTab, setActiveTab] = useState('students');
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Estado para edición de sesiones
    const [editAttendanceOpen, setEditAttendanceOpen] = useState(false);
    const [editDate, setEditDate] = useState(null);

    const handleEditSession = (date) => { setEditDate(date); setEditAttendanceOpen(true); };

    const showToast = (msg, type = 'success') => setToast({ message: msg, type });

    // Datos — hook reutilizable
    const { course, stats, history, studentReport, loading, error, fetchData, globalStats } = useAttendanceReport(id);

    // Mostrar errores del hook via toast
    useEffect(() => { if (error) showToast(error, 'error'); }, [error]);

    // Filtro de búsqueda (UI, no va en el hook)
    const filteredStudents = useMemo(() => {
        if (!searchTerm.trim()) return studentReport;
        const term = searchTerm.toLowerCase();
        return studentReport.filter(s =>
            s.first_name?.toLowerCase().includes(term) ||
            s.last_name?.toLowerCase().includes(term) ||
            s.document_number?.includes(term)
        );
    }, [studentReport, searchTerm]);

    const handleGeneratePDF = () => {
        setGeneratingPdf(true);
        showToast('Generando PDF...', 'success');
        generateAttendancePDF({ course, stats, globalStats, studentReport });
        setGeneratingPdf(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-upn-600" />
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {selectedStudent && (
                <ReportsAttendanceModal
                    student={selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                    getMediaUrl={getMediaUrl}
                    onUpdate={() => { fetchData(); setSelectedStudent(null); }}
                    showToast={showToast}
                    courseId={id}
                />
            )}

            {/* Modal edición de asistencia por sesión */}
            <AttendanceModal
                isOpen={editAttendanceOpen}
                onClose={() => { setEditAttendanceOpen(false); setEditDate(null); }}
                courseId={id}
                students={course?.students || []}
                getMediaUrl={getMediaUrl}
                onSaved={(msg, type) => { showToast(msg, type); fetchData(); }}
                initialDate={editDate}
            />

            {/* Encabezado de página */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/classes/${id}`)} className="p-2.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Reportes de Asistencia</h2>
                        <p className="text-slate-500">{course?.name} • Período {course?.year}-{course?.period}</p>
                    </div>
                </div>
                <button onClick={handleGeneratePDF} disabled={generatingPdf} className="flex items-center gap-2 bg-upn-600 hover:bg-upn-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50">
                    {generatingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                    Descargar PDF
                </button>
            </div>

            {/* Barra de métricas */}
            <AttendanceSummaryBar stats={stats} globalStats={globalStats} studentReport={studentReport} />

            {/* Tarjeta principal con pestañas */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-100">
                    <TabButton active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<Users size={16} />} label="Por Estudiante" />
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart3 size={16} />} label="Historial Sesiones" />
                    <TabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon={<AlertTriangle size={16} />} label="Alertas" />
                </div>

                <div className="p-6">
                    {/* ── Estudiantes ── */}
                    {activeTab === 'students' && (
                        <div>
                            {/* Banner excusas pendientes */}
                            {studentReport.some(s => s.pending_excuses?.length > 0) && (
                                <div className="mb-8 p-5 bg-blue-50 border border-blue-100 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                            <FileText size={28} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">Excusas por Revisar</h4>
                                            <p className="text-sm text-slate-600">Hay estudiantes con justificaciones pendientes de aprobación.</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">
                                        {studentReport.reduce((acc, s) => acc + (s.pending_excuses?.length || 0), 0)} Pendientes
                                    </div>
                                </div>
                            )}
                            {/* Buscador */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Reporte Individual</h3>
                                    <p className="text-sm text-slate-500">Haz clic en un estudiante para ver detalles y editar</p>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input type="text" placeholder="Buscar por nombre o documento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-400 transition-all placeholder:text-slate-400" />
                                </div>
                            </div>
                            {filteredStudents.length > 0
                                ? <div className="space-y-3">{filteredStudents.map((s, i) => <AttendanceRow key={i} student={s} onClick={() => setSelectedStudent(s)} getMediaUrl={getMediaUrl} />)}</div>
                                : <EmptyState icon={<Users size={48} />} message="No hay estudiantes registrados" />
                            }
                        </div>
                    )}

                    {/* ── Historial ── */}
                    {activeTab === 'overview' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-slate-800">Historial por Sesión</h3>
                                <p className="text-sm text-slate-500">Haz clic en "Editar" para modificar la asistencia de una sesión</p>
                            </div>
                            <SessionHistoryTable history={history} onEdit={handleEditSession} />
                        </div>
                    )}

                    {/* ── Alertas ── */}
                    {activeTab === 'alerts' && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-red-50 rounded-xl"><AlertTriangle size={20} className="text-red-500" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Estudiantes en Alerta</h3>
                                    <p className="text-sm text-slate-500">Estudiantes con 3 o más fallas</p>
                                </div>
                            </div>
                            {stats?.students_with_alerts?.length > 0
                                ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{stats.students_with_alerts.map((s, i) => <AlertCard key={i} student={s} course={course} getMediaUrl={getMediaUrl} />)}</div>
                                : <div className="text-center py-16 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-emerald-600" /></div>
                                    <h4 className="font-bold text-emerald-800 text-lg mb-1">¡Excelente!</h4>
                                    <p className="text-emerald-600 text-sm">No hay estudiantes en situación de riesgo.</p>
                                </div>
                            }
                            {/* Excusas pendientes */}
                            {studentReport.some(s => s.pending_excuses?.length > 0) && (
                                <div className="mt-12">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-blue-50 rounded-xl"><FileText size={20} className="text-blue-600" /></div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">Revisiones Pendientes</h3>
                                            <p className="text-sm text-slate-500">Estudiantes que han solicitado justificar una inasistencia</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {studentReport.filter(s => s.pending_excuses?.length > 0).map((s, i) =>
                                            <AttendanceRow key={`p-${i}`} student={s} onClick={() => setSelectedStudent(s)} getMediaUrl={getMediaUrl} />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
