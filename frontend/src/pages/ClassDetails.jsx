/* eslint-disable */
// pages/ClassDetails.jsx  — Orquestador (~110 líneas)
// La lógica de cada sección vive en sus propios componentes.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Edit2, X, User, Mail, Phone, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import { getMediaUrl } from '../utils/dateUtils';

import Toast from '../components/ui/Toast';
import ClassActionsBar from '../components/classDetails/ClassActionsBar';
import StudentAbsencesSection from '../components/classDetails/StudentAbsencesSection';
import StudentListSection from '../components/classDetails/StudentListSection';
import AttendanceModal from '../components/AttendanceModal';
import ScheduleModal from '../components/ScheduleModal';
import ManageStudentsModal from '../components/reports/ManageStudentsModal';
import { useUser } from '../context/UserContext';

export default function ClassDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, activeRole } = useUser();

    // Basado en el ROL ACTIVO seleccionado — no en todos los roles del usuario
    const isStudent = activeRole === 'STUDENT';
    const isAdmin = activeRole === 'ADMIN' || (activeRole == null && user?.is_superuser === true);

    // ── State ────────────────────────────────────────────────────────
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [myAbsences, setMyAbsences] = useState([]);

    const [qrOpen, setQrOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [attendanceOpen, setAttendanceOpen] = useState(false);
    const [manageOpen, setManageOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);

    const showToast = (message, type = 'success') => setToast({ message, type });

    // ── Fetch ─────────────────────────────────────────────────────────
    useEffect(() => { fetchCourse(); }, [id]);   // eslint-disable-line

    const fetchCourse = async () => {
        try {
            const res = await api.get(`/academic/courses/${id}/`);
            setCourse(res.data);
            if (isStudent) fetchAbsences();
        } catch { showToast('Error al cargar la clase', 'error'); }
        finally { setLoading(false); }
    };

    const fetchAbsences = async () => {
        try {
            const res = await api.get(`/academic/attendance/my_absences/?course_id=${id}`);
            setMyAbsences(res.data);
        } catch { /* silencioso */ }
    };

    const handleSaveSchedule = async (courseId, newSchedule) => {
        try {
            await api.patch(`/academic/courses/${courseId}/`, { schedule: newSchedule });
            showToast('Horario actualizado correctamente', 'success');
            setScheduleOpen(false);
            fetchCourse();
        } catch { showToast('Error al guardar el horario', 'error'); }
    };

    // ── Guards ────────────────────────────────────────────────────────
    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-upn-600" /></div>;
    if (!course) return <div className="p-8 text-center text-slate-500">Clase no encontrada</div>;

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ── Header ── */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/classes')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-800">{course.name}</h2>
                        {!isStudent && (
                            <button onClick={() => setScheduleOpen(true)} className="p-1.5 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-lg transition-colors" title="Editar Horario">
                                <Edit2 size={18} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar size={14} /> <span>{course.year}-{course.period}</span>
                        {!isStudent && <><span className="text-slate-300">|</span><Users size={14} /> <span>{course.students?.length || 0} Estudiantes</span></>}
                    </div>
                </div>
            </div>

            {/* ── Acciones (profesor/admin) ── */}
            {!isStudent && (
                <ClassActionsBar
                    course={course} isAdmin={isAdmin} courseId={id}
                    onQr={() => setQrOpen(true)}
                    onManage={() => setManageOpen(true)}
                    onAttendance={() => setAttendanceOpen(true)}
                />
            )}

            {/* ── Vista estudiante: mis faltas ── */}
            {isStudent && <StudentAbsencesSection myAbsences={myAbsences} onExcuseSubmitted={fetchAbsences} showToast={showToast} />}

            {/* Vista profesor: lista de estudiantes */}
            {!isStudent && <StudentListSection students={course.students || []} onSelectStudent={setSelectedStudent} getMediaUrl={getMediaUrl} />}

            {/* ── Modal QR ── */}
            {qrOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setQrOpen(false)}>
                    <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setQrOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Código de Acceso</h3>
                        <div className="bg-white p-6 rounded-2xl mb-6 shadow-inner inline-block border-4 border-slate-900">
                            <QRCodeSVG value={`${window.location.origin}/register?code=${course.code}`} size={200} level="H" includeMargin={false} />
                        </div>
                        <div className="bg-upn-50 py-3 px-6 rounded-xl font-mono text-3xl font-black text-upn-900 tracking-widest border border-upn-100">{course.code}</div>
                        <p className="mt-4 text-slate-500 text-sm">Escanea o comparte este código para unirse a la clase.</p>
                    </div>
                </div>
            )}

            {/* ── Modal foto estudiante ── */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
                    <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="relative aspect-square bg-slate-100">
                            {selectedStudent.photo
                                ? <img src={getMediaUrl(selectedStudent.photo)} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={120} /></div>}
                            <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 text-center">
                            <h3 className="text-2xl font-bold text-slate-900">{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                            <p className="text-slate-500 font-mono mt-1">{selectedStudent.document_number}</p>
                            <div className="flex items-center justify-center gap-4 mt-4">
                                <a href={`mailto:${selectedStudent.email}`} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"><Mail size={20} /></a>
                                {selectedStudent.phone_number && <a href={`tel:${selectedStudent.phone_number}`} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"><Phone size={20} /></a>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modales de lógica ── */}
            <AttendanceModal
                isOpen={attendanceOpen} onClose={() => setAttendanceOpen(false)}
                courseId={id} students={course.students || []}
                getMediaUrl={getMediaUrl} onSaved={showToast}
            />
            <ScheduleModal
                isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)}
                course={course} onSave={handleSaveSchedule}
            />
            {manageOpen && (
                <ManageStudentsModal
                    courseId={id} courseName={course.name}
                    onClose={() => setManageOpen(false)}
                    onUpdate={fetchCourse} showToast={showToast}
                />
            )}
        </div>
    );
}
