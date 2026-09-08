import React, { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, ClipboardSignature, FilePlus2, GraduationCap, PenLine, Plus, Save, Star } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import MobilePageFrame from '../components/mobile/MobilePageFrame';
import MobileHero from '../components/mobile/MobileHero';
import SoftCard from '../components/mobile/SoftCard';

const today = new Date().toISOString().slice(0, 10);
const createEmptyRubric = () => ({
    title: '',
    description: '',
    evaluator_count: 1,
    criteria: [
        { name: 'Criterio 1', order: 0, levels: [{ value: 1, description: 'Bajo' }, { value: 3, description: 'Medio' }, { value: 5, description: 'Alto' }] },
    ],
});

export default function AcademicRecords() {
    const { user, activeRole } = useUser();
    const role = activeRole || user?.role;
    const canManage = ['ADMIN', 'TEACHER', 'PRACTICE_TEACHER'].includes(role);
    const [courses, setCourses] = useState([]);
    const [minutes, setMinutes] = useState([]);
    const [rubrics, setRubrics] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [grades, setGrades] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [loading, setLoading] = useState(true);
    const [minuteForm, setMinuteForm] = useState({ title: '', date: today, achievements: '', agreements: '', summary: '', status: 'PUBLISHED' });
    const [rubricForm, setRubricForm] = useState(createEmptyRubric);
    const [evaluationForm, setEvaluationForm] = useState({ rubric: '', course: '' });
    const [gradeDrafts, setGradeDrafts] = useState({});
    const [signatureData, setSignatureData] = useState('');

    useEffect(() => { loadBase(); }, []);
    useEffect(() => { loadRecords(); }, [selectedCourse]);

    const selectedCourseObj = useMemo(() => courses.find(course => String(course.id) === String(selectedCourse)), [courses, selectedCourse]);
    const visibleEvaluations = selectedCourse ? evaluations.filter(item => String(item.course) === String(selectedCourse)) : evaluations;

    async function loadBase() {
        setLoading(true);
        try {
            const [coursesRes, signatureRes] = await Promise.all([
                api.get('/academic/courses/?archived=false'),
                api.get('/records/signature/').catch(() => ({ data: { signature_data: '' } })),
            ]);
            setCourses(coursesRes.data || []);
            if (coursesRes.data?.[0]) setSelectedCourse(String(coursesRes.data[0].id));
            setSignatureData(signatureRes.data?.signature_data || '');
        } finally {
            setLoading(false);
        }
    }

    async function loadRecords() {
        const courseQuery = selectedCourse ? `?course=${selectedCourse}` : '';
        const [minutesRes, rubricsRes, evaluationsRes, gradesRes] = await Promise.all([
            api.get(`/records/minutes/${courseQuery}`),
            api.get('/records/rubrics/'),
            api.get(`/records/evaluations/${courseQuery}`),
            api.get('/records/grades/'),
        ]);
        setMinutes(minutesRes.data || []);
        setRubrics(rubricsRes.data || []);
        setEvaluations(evaluationsRes.data || []);
        setGrades(gradesRes.data || []);
    }

    async function createMinute(event) {
        event.preventDefault();
        if (!selectedCourse) return;
        const studentIds = selectedCourseObj?.students?.map(student => student.id) || [];
        await api.post('/records/minutes/', {
            ...minuteForm,
            course: selectedCourse,
            attendee_ids: studentIds,
            participant_ids: studentIds,
        });
        setMinuteForm({ title: '', date: today, achievements: '', agreements: '', summary: '', status: 'PUBLISHED' });
        loadRecords();
    }

    async function signMinute(id) {
        await api.post(`/records/minutes/${id}/sign/`, { signature_data: signatureData });
        loadRecords();
    }

    async function saveSignature() {
        await api.post('/records/signature/', { signature_data: signatureData });
    }

    async function createRubric(event) {
        event.preventDefault();
        await api.post('/records/rubrics/', rubricForm);
        setRubricForm(createEmptyRubric());
        loadRecords();
    }

    async function assignRubric(event) {
        event.preventDefault();
        await api.post('/records/evaluations/', evaluationForm);
        setEvaluationForm({ rubric: '', course: selectedCourse || '' });
        loadRecords();
    }

    async function saveGrade(evaluation, student) {
        const key = `${evaluation.id}-${student.id}`;
        const draft = gradeDrafts[key] || {};
        await api.post('/records/grades/save-batch/', {
            evaluation: evaluation.id,
            student: student.id,
            final_grade: draft.final_grade || 0,
            comments: draft.comments || '',
            scores: {},
        });
        loadRecords();
    }

    function setGradeField(evaluationId, studentId, field, value) {
        const key = `${evaluationId}-${studentId}`;
        setGradeDrafts(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
    }

    return (
        <MobilePageFrame>
            <MobileHero
                eyebrow="Académico"
                title="Actas y rúbricas"
                subtitle={canManage ? 'Crea actas, publica rúbricas y califica desde AGON.' : 'Consulta tus actas, firmas y notas en tu mismo perfil AGON.'}
                action={canManage ? <CourseSelect courses={courses} value={selectedCourse} onChange={setSelectedCourse} /> : null}
            />

            {loading ? <SoftCard>Cargando información académica...</SoftCard> : canManage ? (
                <TeacherRecords
                    courses={courses}
                    selectedCourse={selectedCourse}
                    setSelectedCourse={setSelectedCourse}
                    selectedCourseObj={selectedCourseObj}
                    minutes={minutes}
                    rubrics={rubrics}
                    visibleEvaluations={visibleEvaluations}
                    grades={grades}
                    minuteForm={minuteForm}
                    setMinuteForm={setMinuteForm}
                    rubricForm={rubricForm}
                    setRubricForm={setRubricForm}
                    evaluationForm={evaluationForm}
                    setEvaluationForm={setEvaluationForm}
                    gradeDrafts={gradeDrafts}
                    setGradeField={setGradeField}
                    createMinute={createMinute}
                    createRubric={createRubric}
                    assignRubric={assignRubric}
                    saveGrade={saveGrade}
                />
            ) : (
                <StudentRecords
                    minutes={minutes}
                    grades={grades}
                    signatureData={signatureData}
                    setSignatureData={setSignatureData}
                    saveSignature={saveSignature}
                    signMinute={signMinute}
                />
            )}
        </MobilePageFrame>
    );
}

function CourseSelect({ courses, value, onChange }) {
    return (
        <select value={value} onChange={event => onChange(event.target.value)} className="rounded-2xl border border-white/50 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow">
            {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
        </select>
    );
}

function TeacherRecords(props) {
    const students = props.selectedCourseObj?.students || [];
    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
            <div className="space-y-4">
                <SoftCard>
                    <FormTitle icon={FilePlus2} title="Nueva acta" />
                    <form onSubmit={props.createMinute} className="mt-4 grid gap-3">
                        <input value={props.minuteForm.title} onChange={e => props.setMinuteForm({ ...props.minuteForm, title: e.target.value })} required placeholder="Título del acta" className="field" />
                        <input type="date" value={props.minuteForm.date} onChange={e => props.setMinuteForm({ ...props.minuteForm, date: e.target.value })} className="field" />
                        <textarea value={props.minuteForm.achievements} onChange={e => props.setMinuteForm({ ...props.minuteForm, achievements: e.target.value })} placeholder="Logros" className="field min-h-20" />
                        <textarea value={props.minuteForm.agreements} onChange={e => props.setMinuteForm({ ...props.minuteForm, agreements: e.target.value })} placeholder="Acuerdos" className="field min-h-20" />
                        <textarea value={props.minuteForm.summary} onChange={e => props.setMinuteForm({ ...props.minuteForm, summary: e.target.value })} placeholder="Síntesis o compromisos" className="field min-h-20" />
                        <button className="primary-btn"><Plus size={18} /> Publicar acta para firma</button>
                    </form>
                </SoftCard>

                <SoftCard>
                    <FormTitle icon={BookOpenCheck} title="Rúbricas" />
                    <form onSubmit={props.createRubric} className="mt-4 grid gap-3">
                        <input value={props.rubricForm.title} onChange={e => props.setRubricForm({ ...props.rubricForm, title: e.target.value })} required placeholder="Título de la rúbrica" className="field" />
                        <textarea value={props.rubricForm.description} onChange={e => props.setRubricForm({ ...props.rubricForm, description: e.target.value })} placeholder="Descripción" className="field min-h-20" />
                        <button className="primary-btn"><Save size={18} /> Guardar rúbrica base</button>
                    </form>
                    <form onSubmit={props.assignRubric} className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <select value={props.evaluationForm.rubric} onChange={e => props.setEvaluationForm({ ...props.evaluationForm, rubric: e.target.value, course: props.selectedCourse })} required className="field">
                            <option value="">Seleccionar rúbrica</option>
                            {props.rubrics.map(rubric => <option key={rubric.id} value={rubric.id}>{rubric.title}</option>)}
                        </select>
                        <button className="secondary-btn"><ClipboardSignature size={18} /> Asignar al curso</button>
                    </form>
                </SoftCard>
            </div>

            <div className="space-y-4">
                <SoftCard>
                    <FormTitle icon={ClipboardSignature} title="Actas del curso" />
                    <List items={props.minutes} empty="No hay actas publicadas todavía" render={minute => (
                        <div className="rounded-xl border border-slate-100 p-3">
                            <p className="font-black text-slate-800">{minute.title}</p>
                            <p className="text-xs font-bold text-slate-500">{minute.date} · {minute.signatures?.length || 0} firmas</p>
                        </div>
                    )} />
                </SoftCard>
                <SoftCard>
                    <FormTitle icon={Star} title="Calificar" />
                    <List items={props.visibleEvaluations} empty="Asigna una rúbrica para empezar a calificar" render={evaluation => (
                        <div className="space-y-3 rounded-xl border border-slate-100 p-3">
                            <p className="font-black text-slate-800">{evaluation.rubric_detail?.title}</p>
                            {students.map(student => {
                                const key = `${evaluation.id}-${student.id}`;
                                const existing = props.grades.find(grade => grade.evaluation === evaluation.id && grade.student === student.id);
                                return (
                                    <div key={student.id} className="grid gap-2 rounded-lg bg-slate-50 p-2">
                                        <p className="text-sm font-bold text-slate-700">{student.first_name} {student.last_name}</p>
                                        <div className="flex gap-2">
                                            <input type="number" min="0" max="5" step="0.1" placeholder={existing?.final_grade || 'Nota'} onChange={e => props.setGradeField(evaluation.id, student.id, 'final_grade', e.target.value)} className="field w-24" />
                                            <input placeholder={existing?.comments || 'Comentario'} onChange={e => props.setGradeField(evaluation.id, student.id, 'comments', e.target.value)} className="field" />
                                            <button onClick={() => props.saveGrade(evaluation, student)} className="icon-btn" type="button"><Save size={16} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )} />
                </SoftCard>
            </div>
        </div>
    );
}

function StudentRecords({ minutes, grades, signatureData, setSignatureData, saveSignature, signMinute }) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <SoftCard>
                <FormTitle icon={PenLine} title="Mi firma" />
                <textarea value={signatureData} onChange={e => setSignatureData(e.target.value)} placeholder="Pega aquí tu firma en base64 o dibújala desde el módulo de firma cuando esté disponible." className="field mt-4 min-h-24" />
                <button onClick={saveSignature} className="primary-btn mt-3"><Save size={18} /> Guardar firma</button>
            </SoftCard>
            <SoftCard>
                <FormTitle icon={ClipboardSignature} title="Mis actas" />
                <List items={minutes} empty="No tienes actas pendientes" render={minute => (
                    <div className="rounded-xl border border-slate-100 p-3">
                        <p className="font-black text-slate-800">{minute.title}</p>
                        <p className="text-xs font-bold text-slate-500">{minute.course_name} · {minute.date}</p>
                        <p className="mt-2 text-sm text-slate-600">{minute.summary || minute.agreements}</p>
                        <button disabled={minute.signed_by_me} onClick={() => signMinute(minute.id)} className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black ${minute.signed_by_me ? 'bg-emerald-50 text-emerald-700' : 'bg-[#7657f6] text-white'}`}>
                            <CheckCircle2 size={17} /> {minute.signed_by_me ? 'Firmada' : 'Firmar acta'}
                        </button>
                    </div>
                )} />
            </SoftCard>
            <SoftCard className="lg:col-span-2">
                <FormTitle icon={GraduationCap} title="Mis notas" />
                <List items={grades} empty="Aún no hay notas publicadas" render={grade => (
                    <div className="rounded-xl border border-slate-100 p-3">
                        <p className="font-black text-slate-800">{grade.evaluation_detail?.rubric_detail?.title}</p>
                        <p className="text-sm font-bold text-[#7657f6]">Nota final: {grade.final_grade}</p>
                        {grade.comments && <p className="mt-1 text-sm text-slate-600">{grade.comments}</p>}
                    </div>
                )} />
            </SoftCard>
        </div>
    );
}

function FormTitle({ icon: Icon, title }) {
    return <h2 className="flex items-center gap-2 text-lg font-black text-slate-800"><Icon size={20} className="text-[#7657f6]" /> {title}</h2>;
}

function List({ items, empty, render }) {
    if (!items.length) return <p className="mt-3 text-sm font-semibold text-slate-500">{empty}</p>;
    return <div className="mt-4 grid gap-3">{items.map(item => <React.Fragment key={item.id}>{render(item)}</React.Fragment>)}</div>;
}
