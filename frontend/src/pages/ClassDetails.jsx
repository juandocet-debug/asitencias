/* eslint-disable */
// pages/ClassDetails.jsx  — Orquestador (~110 líneas)
// La lógica de cada sección vive en sus propios componentes.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Edit2, X, User, Mail, Phone, Loader2, Gamepad2, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import { getMediaUrl } from '../utils/dateUtils';

import Toast from '../components/ui/Toast';
import ClassActionsBar from '../components/classDetails/ClassActionsBar';
import StudentListSection from '../components/classDetails/StudentListSection';
import StudentClassGameView from '../components/classDetails/StudentClassGameView';
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

    // -- State --------------------------------------------------------
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [myAbsences, setMyAbsences] = useState([]);
    const [openCheckins, setOpenCheckins] = useState([]);

    const [qrOpen, setQrOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [attendanceOpen, setAttendanceOpen] = useState(false);
    const [manageOpen, setManageOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
    }, []);

    // -- Fetch ---------------------------------------------------------
    useEffect(() => { fetchCourse(); }, [id]);

    const fetchCourse = async () => {
        try {
            const res = await api.get(`/academic/courses/${id}/`);
            setCourse(res.data);
            if (isStudent) {
                fetchAbsences();
                fetchOpenCheckins();
            }
        } catch { showToast('Error al cargar la clase', 'error'); }
        finally { setLoading(false); }
    };

    const fetchAbsences = async () => {
        try {
            const res = await api.get(`/academic/attendance/my_absences/?course_id=${id}`);
            setMyAbsences(res.data);
        } catch { /* silencioso */ }
    };

    const fetchOpenCheckins = async () => {
        try {
            const res = await api.get('/academic/attendance/my_open_checkins/');
            setOpenCheckins((res.data || []).filter(item => String(item.course_id) === String(id)));
        } catch { setOpenCheckins([]); }
    };

    const handleSaveSchedule = async (courseId, newSchedule) => {
        try {
            await api.patch(`/academic/courses/${courseId}/`, { schedule: newSchedule });
            showToast('Horario actualizado correctamente', 'success');
            setScheduleOpen(false);
            fetchCourse();
        } catch { showToast('Error al guardar el horario', 'error'); }
    };

    // -- Guards --------------------------------------------------------
    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-upn-600" /></div>;
    if (!course) return <div className="p-8 text-center text-slate-500">Clase no encontrada</div>;

    if (isStudent) {
        return (
            <>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <StudentClassGameView
                    course={course}
                    checkins={openCheckins}
                    myAbsences={myAbsences}
                    onBack={() => navigate('/classes')}
                    onDone={() => { fetchOpenCheckins(); fetchAbsences(); }}
                    onExcuseSubmitted={fetchAbsences}
                    showToast={showToast}
                />
            </>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* -- Header -- */}
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

            {/* -- Acciones (profesor/admin) -- */}
            {!isStudent && (
                <ClassActionsBar
                    course={course} isAdmin={isAdmin} courseId={id}
                    onQr={() => setQrOpen(true)}
                    onManage={() => setManageOpen(true)}
                    onAttendance={() => setAttendanceOpen(true)}
                />
            )}

            {!isStudent && (
                <button
                    type="button"
                    onClick={() => navigate(`/missions?course=${id}`)}
                    className="group w-full overflow-hidden rounded-[2rem] border border-[#ccff00]/25 bg-[#07051d] p-5 text-left text-white shadow-[0_0_38px_rgba(124,76,255,0.18)] transition hover:-translate-y-0.5 hover:border-[#ccff00]/70"
                >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#ccff00] text-slate-950 shadow-[0_0_28px_rgba(204,255,0,0.38)]">
                                <Gamepad2 size={26} />
                            </span>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#ccff00]">Módulo independiente</p>
                                <h3 className="text-2xl font-black">Configurar misiones, recursos e inventario</h3>
                                <p className="text-sm font-semibold text-violet-100/65">Abre el centro gamer para esta clase y administra toda la experiencia.</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950">
                            Entrar <Sparkles size={16} className="text-[#7657f6]" />
                        </span>
                    </div>
                </button>
            )}

            {/* -- Vista estudiante: mis faltas -- */}
            {/* Vista profesor: lista de estudiantes */}
            <StudentListSection students={course.students || []} onSelectStudent={setSelectedStudent} getMediaUrl={getMediaUrl} />

            {/* -- Modal QR -- */}
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

            {/* -- Modal foto estudiante -- */}
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

            {/* -- Modales de lógica -- */}
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


