import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, Calendar, BarChart3, Download, AlertTriangle,
    CheckCircle, Clock, XCircle, Phone, Mail, TrendingUp, TrendingDown,
    FileText, Search, Loader2, X, Edit3, Save, AlertCircle
} from 'lucide-react';
import api from '../services/api';

// Toast Component
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);
    const bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-slate-800';
    return (
        <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100]`}>
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="hover:bg-white/20 rounded p-1"><X size={16} /></button>
        </div>
    );
}

// Helper to format date
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

export default function ClassReports() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [studentReport, setStudentReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('students');
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const showToast = (msg, type = 'success') => setToast({ message: msg, type });

    // Media URL helper
    const getMediaUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `http://127.0.0.1:8000${path.startsWith('/') ? '' : '/'}${path}`;
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [courseRes, statsRes, historyRes, reportRes] = await Promise.all([
                api.get(`/academic/courses/${id}/`),
                api.get(`/academic/courses/${id}/attendance_stats/`),
                api.get(`/academic/courses/${id}/attendance_history/`),
                api.get(`/academic/courses/${id}/student_report/`)
            ]);
            setCourse(courseRes.data);
            setStats(statsRes.data);
            setHistory(historyRes.data);
            setStudentReport(reportRes.data);
        } catch (error) {
            console.error("Error:", error);
            showToast("Error al cargar datos", "error");
        } finally {
            setLoading(false);
        }
    };

    // Filter students
    const filteredStudents = useMemo(() => {
        if (!searchTerm.trim()) return studentReport;
        const term = searchTerm.toLowerCase();
        return studentReport.filter(s =>
            s.first_name?.toLowerCase().includes(term) ||
            s.last_name?.toLowerCase().includes(term) ||
            s.document_number?.includes(term)
        );
    }, [studentReport, searchTerm]);

    // Calculate global stats
    const globalStats = useMemo(() => {
        if (!studentReport.length) return { avgRate: 0, bestStudent: null, trend: 0 };

        const avgRate = Math.round(studentReport.reduce((sum, s) => sum + s.attendance_rate, 0) / studentReport.length);
        const sorted = [...studentReport].sort((a, b) => b.attendance_rate - a.attendance_rate);
        const bestStudent = sorted[0];
        const trend = avgRate >= 80 ? 5 : avgRate >= 50 ? -2 : -10;

        return { avgRate, bestStudent, trend };
    }, [studentReport]);

    // Generate PDF
    const generatePDF = async () => {
        setGeneratingPdf(true);
        showToast("Generando PDF...", "success");

        const printWindow = window.open('', '_blank');

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Asistencia - ${course?.name || 'Clase'}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    padding: 30px; 
                    color: #1e293b;
                    font-size: 11px;
                    line-height: 1.4;
                }
                .header { 
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px; 
                    border-bottom: 2px solid #0F4C81;
                    padding-bottom: 15px;
                }
                .header-left h1 { 
                    color: #0F4C81; 
                    font-size: 22px; 
                    margin-bottom: 3px;
                }
                .header-left p { color: #64748b; font-size: 12px; }
                .header-right { text-align: right; color: #64748b; font-size: 10px; }
                
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 25px;
                }
                .summary-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                }
                .summary-box strong { display: block; font-size: 24px; color: #0F4C81; }
                .summary-box span { color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
                
                .student-section {
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    margin-bottom: 12px;
                    page-break-inside: avoid;
                    overflow: hidden;
                }
                .student-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-bottom: 1px solid #e2e8f0;
                }
                .student-info h3 { font-size: 13px; color: #1e293b; margin-bottom: 2px; }
                .student-info p { font-size: 10px; color: #64748b; }
                .student-rate { 
                    font-size: 18px; 
                    font-weight: bold; 
                    padding: 6px 14px; 
                    border-radius: 20px;
                }
                .rate-good { background: #dcfce7; color: #166534; }
                .rate-warning { background: #fef3c7; color: #92400e; }
                .rate-danger { background: #fee2e2; color: #991b1b; }
                
                .student-body { padding: 12px 15px; }
                .stats-inline {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 10px;
                }
                .stat-item { display: flex; align-items: center; gap: 5px; }
                .stat-dot { width: 8px; height: 8px; border-radius: 50%; }
                .dot-present { background: #22c55e; }
                .dot-late { background: #f59e0b; }
                .dot-absent { background: #ef4444; }
                
                .dates-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    margin-top: 8px;
                }
                .date-tag {
                    font-size: 9px;
                    padding: 3px 8px;
                    border-radius: 4px;
                    background: #fee2e2;
                    color: #991b1b;
                }
                .date-tag.late { background: #fef3c7; color: #92400e; }
                
                .footer {
                    margin-top: 25px;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 9px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 12px;
                }
                
                @media print {
                    body { padding: 15px; }
                    .student-section { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-left">
                    <h1>📋 Reporte de Asistencia</h1>
                    <p><strong>${course?.name || 'Clase'}</strong> &bull; Período ${course?.year}-${course?.period}</p>
                </div>
                <div class="header-right">
                    <p>Fecha: ${new Date().toLocaleDateString('es-CO')}</p>
                    <p>Total Sesiones: ${stats?.total_sessions || 0}</p>
                </div>
            </div>
            
            <div class="summary-grid">
                <div class="summary-box">
                    <strong>${stats?.total_students || 0}</strong>
                    <span>Estudiantes</span>
                </div>
                <div class="summary-box">
                    <strong>${stats?.total_sessions || 0}</strong>
                    <span>Sesiones</span>
                </div>
                <div class="summary-box">
                    <strong>${globalStats.avgRate}%</strong>
                    <span>Promedio Asistencia</span>
                </div>
                <div class="summary-box">
                    <strong style="color: ${stats?.alert_count > 0 ? '#dc2626' : '#16a34a'}">${stats?.alert_count || 0}</strong>
                    <span>Alertas (3+ fallas)</span>
                </div>
            </div>
            
            ${studentReport.map(student => {
            const rateClass = student.attendance_rate >= 80 ? 'rate-good' : student.attendance_rate >= 50 ? 'rate-warning' : 'rate-danger';
            return `
                <div class="student-section">
                    <div class="student-header">
                        <div class="student-info">
                            <h3>${student.first_name} ${student.last_name}</h3>
                            <p>Doc: ${student.document_number} ${student.email ? `• ${student.email}` : ''} ${student.phone_number ? `• Tel: ${student.phone_number}` : ''}</p>
                        </div>
                        <div class="student-rate ${rateClass}">${student.attendance_rate}%</div>
                    </div>
                    <div class="student-body">
                        <div class="stats-inline">
                            <div class="stat-item"><span class="stat-dot dot-present"></span> ${student.present} Presentes</div>
                            <div class="stat-item"><span class="stat-dot dot-late"></span> ${student.late} Tardanzas</div>
                            <div class="stat-item"><span class="stat-dot dot-absent"></span> ${student.absent} Fallas</div>
                        </div>
                        ${student.absent_dates?.length > 0 ? `
                        <div>
                            <strong style="font-size: 10px; color: #dc2626;">Fechas de Fallas:</strong>
                            <div class="dates-row">
                                ${student.absent_dates.map(d => `<span class="date-tag">${formatDate(d)}</span>`).join('')}
                            </div>
                        </div>
                        ` : ''}
                        ${student.late_dates?.length > 0 ? `
                        <div style="margin-top: 6px;">
                            <strong style="font-size: 10px; color: #d97706;">Fechas de Tardanzas:</strong>
                            <div class="dates-row">
                                ${student.late_dates.map(d => `<span class="date-tag late">${formatDate(d)}</span>`).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                `;
        }).join('')}
            
            <div class="footer">
                Documento generado el ${new Date().toLocaleString('es-CO')} &bull; Sistema de Asistencia UPN &bull; Universidad Pedagógica Nacional
            </div>
            
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
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

            {/* Student Detail Modal */}
            {selectedStudent && (
                <StudentDetailModal
                    student={selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                    getMediaUrl={getMediaUrl}
                    onUpdate={() => { fetchData(); setSelectedStudent(null); }}
                    showToast={showToast}
                    courseId={id}
                />
            )}

            {/* Header */}
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
                <button
                    onClick={generatePDF}
                    disabled={generatingPdf}
                    className="flex items-center gap-2 bg-upn-600 hover:bg-upn-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                    {generatingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                    Descargar PDF
                </button>
            </div>

            {/* Stats Bar - Compacta con datos importantes */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Métricas principales en línea */}
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users size={16} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-800">{stats?.total_students || 0}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-medium">Estudiantes</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-200"></div>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <CheckCircle size={16} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-emerald-600">{globalStats.avgRate}%</p>
                                <p className="text-[10px] text-slate-500 uppercase font-medium">Asistencia Prom.</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-200"></div>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <XCircle size={16} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-red-600">
                                    {studentReport.reduce((sum, s) => sum + s.absent, 0)}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase font-medium">Total Fallas</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-200"></div>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Clock size={16} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-amber-600">
                                    {studentReport.reduce((sum, s) => sum + s.late, 0)}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase font-medium">Total Retardos</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-200"></div>

                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 ${stats?.alert_count > 0 ? 'bg-red-100' : 'bg-slate-100'} rounded-lg flex items-center justify-center`}>
                                <AlertTriangle size={16} className={stats?.alert_count > 0 ? 'text-red-600' : 'text-slate-400'} />
                            </div>
                            <div>
                                <p className={`text-lg font-bold ${stats?.alert_count > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                    {stats?.alert_count || 0}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase font-medium">En Riesgo</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-200"></div>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Calendar size={16} className="text-slate-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-800">{stats?.total_sessions || 0}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-medium">Sesiones</p>
                            </div>
                        </div>
                    </div>

                    {/* Indicador de tendencia */}
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${globalStats.avgRate >= 80 ? 'bg-emerald-100 text-emerald-700' : globalStats.avgRate >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {globalStats.avgRate >= 80 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {globalStats.avgRate >= 80 ? 'Buen rendimiento' : globalStats.avgRate >= 60 ? 'Requiere atención' : 'Crítico'}
                    </div>
                </div>
            </div>


            {/* Main Content Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <TabButton
                        active={activeTab === 'students'}
                        onClick={() => setActiveTab('students')}
                        icon={<Users size={16} />}
                        label="Por Estudiante"
                    />
                    <TabButton
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                        icon={<BarChart3 size={16} />}
                        label="Historial Sesiones"
                    />
                    <TabButton
                        active={activeTab === 'alerts'}
                        onClick={() => setActiveTab('alerts')}
                        icon={<AlertTriangle size={16} />}
                        label="Alertas"
                    />
                </div>

                <div className="p-6">
                    {/* Tab: Por Estudiante */}
                    {activeTab === 'students' && (
                        <div>
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Reporte Individual</h3>
                                    <p className="text-sm text-slate-500">Haz clic en un estudiante para ver detalles y editar</p>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o documento..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-400 transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Student List */}
                            {filteredStudents.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredStudents.map((student, idx) => (
                                        <StudentRow
                                            key={idx}
                                            student={student}
                                            onClick={() => setSelectedStudent(student)}
                                            getMediaUrl={getMediaUrl}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState icon={<Users size={48} />} message="No hay estudiantes registrados" />
                            )}
                        </div>
                    )}

                    {/* Tab: Historial */}
                    {activeTab === 'overview' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Historial por Sesión</h3>
                                    <p className="text-sm text-slate-500">Registro de asistencia de cada clase</p>
                                </div>
                            </div>

                            {history.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tema</th>
                                                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Presentes</th>
                                                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tardanzas</th>
                                                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Faltas</th>
                                                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Asistencia</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {history.map((session, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <span className="font-medium text-slate-800">{formatDate(session.date)}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-600">{session.topic || <span className="text-slate-400">—</span>}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">{session.present}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">{session.late}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700">{session.absent}</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${session.attendance_rate >= 80 ? 'bg-emerald-500' : session.attendance_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                    style={{ width: `${session.attendance_rate}%` }}
                                                                />
                                                            </div>
                                                            <span className={`text-xs font-semibold ${session.attendance_rate >= 80 ? 'text-emerald-600' : session.attendance_rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                                {session.attendance_rate}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyState icon={<Calendar size={48} />} message="No hay sesiones registradas aún" />
                            )}
                        </div>
                    )}

                    {/* Tab: Alertas */}
                    {activeTab === 'alerts' && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-red-50 rounded-xl">
                                    <AlertTriangle size={20} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Estudiantes en Alerta</h3>
                                    <p className="text-sm text-slate-500">Estudiantes con 3 o más fallas</p>
                                </div>
                            </div>

                            {stats?.students_with_alerts?.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {stats.students_with_alerts.map((student, idx) => (
                                        <AlertCard key={idx} student={student} course={course} getMediaUrl={getMediaUrl} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={32} className="text-emerald-600" />
                                    </div>
                                    <h4 className="font-bold text-emerald-800 text-lg mb-1">¡Excelente!</h4>
                                    <p className="text-emerald-600 text-sm">No hay estudiantes con alertas de asistencia.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Clean Stat Card (matching Dashboard style)
function StatCardClean({ label, value, subtitle, trend, trendUp, icon, iconBg, isAlert }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                    <p className={`text-3xl font-bold ${isAlert ? 'text-red-600' : 'text-slate-800'}`}>{value}</p>
                    {trend && (
                        <p className={`text-xs font-medium flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {trend}
                        </p>
                    )}
                    {!trend && subtitle && (
                        <p className="text-xs text-slate-400">{subtitle}</p>
                    )}
                </div>
                <div className={`${iconBg} text-white p-3 rounded-xl`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Student Row - Compacta con todos los datos
function StudentRow({ student, onClick, getMediaUrl }) {
    const [showPhoto, setShowPhoto] = useState(false);
    const rateColor = student.attendance_rate >= 80 ? 'text-emerald-600' : student.attendance_rate >= 50 ? 'text-amber-600' : 'text-red-600';
    const rateBg = student.attendance_rate >= 80 ? 'bg-emerald-50' : student.attendance_rate >= 50 ? 'bg-amber-50' : 'bg-red-50';

    const handleEmailClick = (e) => {
        e.stopPropagation();
        window.location.href = `mailto:${student.email}`;
    };

    const handlePhotoClick = (e) => {
        e.stopPropagation();
        if (student.photo) setShowPhoto(true);
    };

    return (
        <>
            <div
                onClick={onClick}
                className="flex items-center gap-4 py-3 px-4 bg-white border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-all group"
            >
                {/* Foto con ampliar */}
                <div
                    onClick={handlePhotoClick}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-sm font-semibold text-slate-500 uppercase flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-upn-300 transition-all"
                >
                    {student.photo ? (
                        <img src={getMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        `${student.first_name?.[0]}${student.last_name?.[0]}`
                    )}
                </div>

                {/* Nombre + Correo (en columna) */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">
                        {student.first_name} {student.last_name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-slate-400 truncate">{student.email}</span>
                        <button
                            onClick={handleEmailClick}
                            className="p-0.5 text-slate-400 hover:text-upn-600 transition-colors"
                            title="Enviar correo"
                        >
                            <Mail size={12} />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-2">
                    <div className="text-center px-2.5 py-1 bg-emerald-50 rounded-lg min-w-[40px]">
                        <span className="text-sm font-bold text-emerald-600">{student.present}</span>
                        <p className="text-[9px] text-emerald-600 font-medium">Asist.</p>
                    </div>
                    <div className="text-center px-2.5 py-1 bg-amber-50 rounded-lg min-w-[40px]">
                        <span className="text-sm font-bold text-amber-600">{student.late}</span>
                        <p className="text-[9px] text-amber-600 font-medium">Tard.</p>
                    </div>
                    <div className="text-center px-2.5 py-1 bg-red-50 rounded-lg min-w-[40px]">
                        <span className="text-sm font-bold text-red-600">{student.absent}</span>
                        <p className="text-[9px] text-red-600 font-medium">Fallas</p>
                    </div>
                    {(student.excused || 0) > 0 && (
                        <div className="text-center px-2.5 py-1 bg-blue-50 rounded-lg min-w-[40px]">
                            <span className="text-sm font-bold text-blue-600">{student.excused}</span>
                            <p className="text-[9px] text-blue-600 font-medium">Exc.</p>
                        </div>
                    )}
                </div>

                {/* Porcentaje */}
                <div className={`px-3 py-1.5 rounded-lg ${rateBg} min-w-[55px] text-center`}>
                    <span className={`text-sm font-bold ${rateColor}`}>{student.attendance_rate}%</span>
                </div>

                {/* Icono editar */}
                <div className="text-slate-300 group-hover:text-upn-600 transition-colors">
                    <Edit3 size={16} />
                </div>
            </div>

            {/* Modal ampliar foto */}
            {showPhoto && student.photo && (
                <div
                    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowPhoto(false)}
                >
                    <div className="relative max-w-md">
                        <img
                            src={getMediaUrl(student.photo)}
                            alt={`${student.first_name} ${student.last_name}`}
                            className="rounded-2xl shadow-2xl max-h-[80vh] object-contain"
                        />
                        <button
                            onClick={() => setShowPhoto(false)}
                            className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-lg hover:bg-slate-100"
                        >
                            <X size={16} />
                        </button>
                        <p className="text-center text-white mt-3 font-medium">
                            {student.first_name} {student.last_name}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}




// Alert Card
function AlertCard({ student, course, getMediaUrl }) {
    return (
        <div className="bg-white border border-red-100 rounded-xl p-5">
            <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center overflow-hidden text-base font-semibold text-red-600 uppercase flex-shrink-0">
                    {student.photo ? (
                        <img src={getMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        `${student.first_name?.[0]}${student.last_name?.[0]}`
                    )}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{student.first_name} {student.last_name}</h4>
                    <p className="text-sm text-slate-500 mb-3">{student.document_number}</p>
                    <div className="flex gap-4 text-sm">
                        <span className="text-red-600 font-semibold">{student.absences} Fallas</span>
                        <span className="text-amber-600 font-semibold">{student.lates} Tardanzas</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-2 mt-4">
                {student.email && (
                    <a
                        href={`mailto:${student.email}?subject=Seguimiento de Asistencia - ${course?.name}&body=Estimado/a ${student.first_name},%0A%0AEste es un seguimiento respecto a su asistencia en la clase ${course?.name}. Actualmente tiene ${student.absences} fallas registradas.%0A%0APor favor comuníquese con nosotros.`}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                        <Mail size={16} /> Email
                    </a>
                )}
                {student.phone_number && (
                    <a
                        href={`tel:${student.phone_number}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-upn-600 hover:bg-upn-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                        <Phone size={16} /> Llamar
                    </a>
                )}
            </div>
        </div>
    );
}

// Student Detail Modal with Edit
function StudentDetailModal({ student, onClose, getMediaUrl, onUpdate, showToast, courseId }) {
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);

    // Normalizar las fechas (pueden ser strings o objetos)
    const normalizeAbsent = (student.absent_dates || []).map(d => typeof d === 'object' ? d.date : d);
    const normalizeLate = student.late_dates || [];
    const normalizePresent = student.present_dates || [];
    const normalizeExcused = (student.excused_dates || []).map(d => typeof d === 'object' ? d.date : d);

    const [editedAbsent, setEditedAbsent] = useState([...normalizeAbsent]);
    const [editedLate, setEditedLate] = useState([...normalizeLate]);
    const [editedPresent, setEditedPresent] = useState([...normalizePresent]);
    const [editedExcused, setEditedExcused] = useState([...normalizeExcused]);

    // Change status of a date
    const changeStatus = (date, fromStatus, toStatus) => {
        const dateStr = typeof date === 'object' ? date.date : date;

        // Remove from current list
        if (fromStatus === 'absent') setEditedAbsent(prev => prev.filter(d => d !== dateStr));
        else if (fromStatus === 'late') setEditedLate(prev => prev.filter(d => d !== dateStr));
        else if (fromStatus === 'present') setEditedPresent(prev => prev.filter(d => d !== dateStr));
        else if (fromStatus === 'excused') setEditedExcused(prev => prev.filter(d => d !== dateStr));

        // Add to new list
        if (toStatus === 'absent') setEditedAbsent(prev => [...prev, dateStr].sort());
        else if (toStatus === 'late') setEditedLate(prev => [...prev, dateStr].sort());
        else if (toStatus === 'present') setEditedPresent(prev => [...prev, dateStr].sort());
        else if (toStatus === 'excused') setEditedExcused(prev => [...prev, dateStr].sort());
    };

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
                    updates
                });
                showToast("Asistencia actualizada correctamente", "success");
                onUpdate();
            } else {
                showToast("No hay cambios para guardar", "success");
                setEditMode(false);
            }
        } catch (error) {
            console.error("Error updating:", error);
            showToast("Error al actualizar", "error");
        } finally {
            setSaving(false);
        }
    };

    const rateColor = student.attendance_rate >= 80 ? 'text-emerald-600 bg-emerald-50' : student.attendance_rate >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';


    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
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

                {/* Stats Bar */}
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


                {/* Content */}
                <div className="p-6 max-h-[350px] overflow-y-auto">
                    {/* Edit Toggle */}
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

                    {/* Absent Dates */}
                    {(editMode ? editedAbsent : normalizeAbsent)?.length > 0 && (
                        <div className="mb-5">
                            <h4 className="text-xs font-semibold text-red-600 uppercase mb-3 flex items-center gap-2">
                                <XCircle size={14} /> Fallas ({(editMode ? editedAbsent : normalizeAbsent).length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(editMode ? editedAbsent : normalizeAbsent).map((date, idx) => (
                                    <DateBadge
                                        key={idx}
                                        date={date}
                                        type="absent"
                                        editable={editMode}
                                        onChangeStatus={(toStatus) => changeStatus(date, 'absent', toStatus)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Late Dates */}
                    {(editMode ? editedLate : normalizeLate)?.length > 0 && (
                        <div className="mb-5">
                            <h4 className="text-xs font-semibold text-amber-600 uppercase mb-3 flex items-center gap-2">
                                <Clock size={14} /> Tardanzas ({(editMode ? editedLate : normalizeLate).length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(editMode ? editedLate : normalizeLate).map((date, idx) => (
                                    <DateBadge
                                        key={idx}
                                        date={date}
                                        type="late"
                                        editable={editMode}
                                        onChangeStatus={(toStatus) => changeStatus(date, 'late', toStatus)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Present Dates */}
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

                    {/* Excused Dates */}
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
                                        onChangeStatus={(toStatus) => changeStatus(date, 'excused', toStatus)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No Data */}
                    {!normalizePresent?.length && !normalizeLate?.length && !normalizeAbsent?.length && !normalizeExcused?.length && (
                        <div className="text-center py-12 text-slate-400">
                            <Calendar size={40} className="mx-auto mb-3 opacity-50" />
                            <p>No hay registros de asistencia</p>
                        </div>
                    )}
                </div>


                {/* Actions */}
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
            </div>
        </div>
    );
}

// Date Badge with edit capability
function DateBadge({ date, type, editable, onChangeStatus }) {
    const [showMenu, setShowMenu] = useState(false);

    const colors = {
        absent: 'bg-red-50 text-red-700 border-red-100',
        late: 'bg-amber-50 text-amber-700 border-amber-100',
        present: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        excused: 'bg-blue-50 text-blue-700 border-blue-100'
    };

    const icons = {
        absent: <XCircle size={12} />,
        late: <Clock size={12} />,
        present: <CheckCircle size={12} />,
        excused: <FileText size={12} />
    };

    // Handle date object or string
    const dateStr = typeof date === 'object' ? date.date : date;

    if (!editable) {
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${colors[type]}`}>
                {icons[type]} {formatDate(dateStr)}
            </span>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${colors[type]} hover:shadow-md transition-all cursor-pointer`}
            >
                {icons[type]} {formatDate(dateStr)} <Edit3 size={10} className="ml-1 opacity-50" />
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


function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-5 py-4 font-semibold text-sm transition-all border-b-2 ${active ? 'text-upn-700 border-upn-600 bg-white' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'}`}
        >
            {icon} {label}
        </button>
    );
}

function EmptyState({ icon, message }) {
    return (
        <div className="text-center py-16 text-slate-400">
            <div className="mx-auto mb-4 opacity-30">{icon}</div>
            <p className="text-base">{message}</p>
        </div>
    );
}
