
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BarChart3, AlertTriangle, CheckCircle, FileText, Search, Loader2 } from 'lucide-react';
import { getMediaUrl } from '../utils/dateUtils';
import { generateAttendancePDF } from '../utils/pdfExport';
import { useAttendanceReport } from '../hooks/useAttendanceReport';
import api from '../services/api';
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

    const handleDeleteSession = async (date) => {
        try {
            await api.delete(
                `/academic/attendance/delete_session/?course_id=${id}&date=${date}`
            );
            showToast('Sesión eliminada correctamente', 'success');
            refresh();
        } catch (err) {
            const msg = err?.response?.data?.error || 'Error al eliminar la sesión';
            showToast(msg, 'error');
        }
    };

    const showToast = (msg, type = 'success') => setToast({ message: msg, type });

    // Datos — hook reutilizable
    const { course, stats, history, studentReport, loading, refreshing, error, fetchData, refresh, globalStats } = useAttendanceReport(id);

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
        generateAttendancePDF({ course, stats, globalStats, studentReport, history });
        setGeneratingPdf(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#7657f6]" />
        </div>
    );

    return (
        <div className="space-y-5 pb-24 md:space-y-7">
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
                onSaved={(msg, type) => { showToast(msg, type); refresh(); }}
                initialDate={editDate}
            />

            {/* Encabezado de página */}
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(50,58,90,0.10)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/classes/${id}`)} className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f0edff] text-[#7657f6] transition active:scale-95">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#7657f6]">Asistencia</p>
                        <h2 className="text-2xl font-black text-[#172033]">Reportes</h2>
                        <p className="text-sm font-semibold text-slate-500">{course?.name} • Período {course?.year}-{course?.period}</p>
                    </div>
                </div>
                <button onClick={handleGeneratePDF} disabled={generatingPdf} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#8b6dff] to-[#7657f6] px-5 py-3 text-sm font-black text-white shadow-xl shadow-violet-200 transition active:scale-[0.98] disabled:opacity-50 md:w-auto">
                    {generatingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                    Descargar PDF
                </button>
            </div>
            </div>

            {/* Barra de métricas */}
            <AttendanceSummaryBar stats={stats} globalStats={globalStats} studentReport={studentReport} />

            {/* Tarjeta principal con pestañas */}
            <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(50,58,90,0.10)]">
                <div className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-white/70 p-2">
                    <TabButton active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<Users size={16} />} label="Por Estudiante" />
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart3 size={16} />} label="Historial Sesiones" />
                    <TabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon={<AlertTriangle size={16} />} label="Alertas" />
                </div>

                <div className="p-4 md:p-6">
                    {/* ── Estudiantes ── */}
                    {activeTab === 'students' && (
                        <div>
                            {/* Banner excusas pendientes */}
                            {studentReport.some(s => s.pending_excuses?.length > 0) && (
                                <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-[1.7rem] border border-violet-100 bg-[#f0edff] p-5 md:flex-row">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-[#8b6dff] to-[#7657f6] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
                                            <FileText size={28} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">Excusas por Revisar</h4>
                                            <p className="text-sm text-slate-600">Hay estudiantes con justificaciones pendientes de aprobación.</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-[#7657f6] text-white rounded-xl font-bold text-sm">
                                        {studentReport.reduce((acc, s) => acc + (s.pending_excuses?.length || 0), 0)} Pendientes
                                    </div>
                                </div>
                            )}
                            {/* Buscador */}
                            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Reporte Individual</h3>
                                    <p className="text-sm text-slate-500">Haz clic en un estudiante para ver detalles y editar</p>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input type="text" placeholder="Buscar por nombre o documento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm transition-all placeholder:text-slate-400 focus:border-[#7657f6] focus:outline-none focus:ring-4 focus:ring-violet-100" />
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
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Historial por Sesión</h3>
                                    <p className="text-sm text-slate-500">Haz clic en "Editar" para modificar la asistencia de una sesión</p>
                                </div>
                                {refreshing && (
                                    <span className="flex items-center gap-1.5 text-xs text-[#7657f6] font-semibold animate-pulse">
                                        <Loader2 size={13} className="animate-spin" /> Actualizando…
                                    </span>
                                )}
                            </div>
                            <SessionHistoryTable history={history} onEdit={handleEditSession} onDelete={handleDeleteSession} />
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
                                        <div className="p-2.5 bg-[#f0edff] rounded-xl"><FileText size={20} className="text-[#7657f6]" /></div>
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









