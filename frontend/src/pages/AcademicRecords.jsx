import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ClipboardList, Download, Eye, FilePenLine, PenLine, Plus, Save, Trash2, Users } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';

const UPN_LOGO = 'https://i.ibb.co/C5SB6zj4/Identidad-UPN-25-vertical-azul-fondo-blanco.png';
const today = new Date().toISOString().slice(0, 10);
const roleLabel = { ADMIN: 'Administrador', TEACHER: 'Docente', STUDENT: 'Estudiante', COORDINATOR: 'Coordinador', PRACTICE_TEACHER: 'Profesor de práctica' };

const blankActa = () => ({
    tipo: 'ACTA', numero: '', total: '', fecha: today, hora_inicio: '', hora_final: '',
    instancias: '', lugar: '', asistentes: [], ausentes: [{ nombre: 'N/A', cargo: '' }],
    invitados: [{ nombre: 'N/A', cargo: '' }], orden_dia: '', desarrollo: '',
    compromisos: [{ compromiso: '', responsable: '', responsable_id: null, fecha: '' }],
    proxima_convocatoria: '', anexos: '', firmas: [],
});

const blankRubric = () => ({
    title: '', description: '', evaluator_count: 1,
    criteria: [{ name: 'Criterio 1', order: 0, levels: [{ value: 1, description: 'Bajo' }, { value: 3, description: 'Medio' }, { value: 5, description: 'Alto' }] }],
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
    const [mode, setMode] = useState(canManage ? 'minutes' : 'student');
    const [editingActa, setEditingActa] = useState(null);
    const [previewActa, setPreviewActa] = useState(null);
    const [signatureOpen, setSignatureOpen] = useState(null);
    const [storedSignature, setStoredSignature] = useState('');
    const [rubricForm, setRubricForm] = useState(blankRubric);
    const [evaluationForm, setEvaluationForm] = useState({ rubric: '', course: '' });
    const [gradeDrafts, setGradeDrafts] = useState({});

    useEffect(() => { loadBase(); }, []);
    useEffect(() => { loadRecords(); }, [selectedCourse]);

    const course = useMemo(() => courses.find(item => String(item.id) === String(selectedCourse)), [courses, selectedCourse]);
    const activeMinutes = selectedCourse ? minutes.filter(item => String(item.course) === String(selectedCourse)) : minutes;
    const visibleEvaluations = selectedCourse ? evaluations.filter(item => String(item.course) === String(selectedCourse)) : evaluations;
    const stats = useMemo(() => {
        const pending = activeMinutes.reduce((sum, minute) => sum + firmantes(minute).filter(item => !item.firmado).length, 0);
        const signed = activeMinutes.reduce((sum, minute) => sum + firmantes(minute).filter(item => item.firmado).length, 0);
        return { minutes: activeMinutes.length, pending, signed, evaluations: visibleEvaluations.length };
    }, [activeMinutes, visibleEvaluations]);

    async function loadBase() {
        const [coursesRes, sigRes] = await Promise.all([
            api.get('/academic/courses/?archived=false'),
            api.get('/records/signature/').catch(() => ({ data: {} })),
        ]);
        setCourses(coursesRes.data || []);
        if (coursesRes.data?.[0]) setSelectedCourse(String(coursesRes.data[0].id));
        setStoredSignature(sigRes.data?.signature_data || '');
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

    function importCoursePeople(target) {
        const rows = (course?.students || []).map(s => ({
            nombre: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
            cargo: roleLabel[s.role] || 'Estudiante',
            email: s.email || '',
            user_id: s.id,
            foto: s.photo || '',
        }));
        setEditingActa(prev => {
            const existing = new Set((prev[target] || []).map(item => item.user_id).filter(Boolean));
            const next = { ...prev, [target]: [...(prev[target] || []).filter(item => item.nombre && item.nombre !== 'N/A'), ...rows.filter(item => !existing.has(item.user_id))] };
            return { ...next, firmas: syncFirmas(next) };
        });
    }

    async function saveActa(acta) {
        const synced = { ...acta, firmas: syncFirmas(acta) };
        const payload = {
            course: selectedCourse,
            title: `Acta ${synced.numero || ''}`.trim() || 'Acta de reunión',
            date: synced.fecha,
            data: synced,
            attendee_ids: ids(synced.asistentes),
            absentee_ids: ids(synced.ausentes),
            participant_ids: ids([...synced.asistentes, ...synced.invitados]),
            status: 'PUBLISHED',
        };
        if (synced.id) await api.put(`/records/minutes/${synced.id}/`, payload);
        else await api.post('/records/minutes/', payload);
        setEditingActa(null);
        await loadRecords();
    }

    async function signMinute(minute, signature) {
        await api.post(`/records/minutes/${minute.id}/sign/`, { signature_data: signature });
        if (!storedSignature) {
            await api.post('/records/signature/', { signature_data: signature });
            setStoredSignature(signature);
        }
        setSignatureOpen(null);
        await loadRecords();
    }

    async function deleteMinute(minute) {
        const acta = toActa(minute);
        const ok = window.confirm(`¿Eliminar ${acta.tipo} No. ${acta.numero || minute.id}? Esta acción no se puede deshacer.`);
        if (!ok) return;
        await api.delete(`/records/minutes/${minute.id}/`);
        await loadRecords();
    }

    async function createRubric(event) {
        event.preventDefault();
        await api.post('/records/rubrics/', rubricForm);
        setRubricForm(blankRubric());
        await loadRecords();
    }

    async function assignRubric(event) {
        event.preventDefault();
        await api.post('/records/evaluations/', { ...evaluationForm, course: selectedCourse });
        setEvaluationForm({ rubric: '', course: selectedCourse });
        await loadRecords();
    }

    async function saveGrade(evaluation, student) {
        const key = `${evaluation.id}-${student.id}`;
        const draft = gradeDrafts[key] || {};
        await api.post('/records/grades/save-batch/', { evaluation: evaluation.id, student: student.id, final_grade: draft.final_grade || 0, comments: draft.comments || '', scores: {} });
        await loadRecords();
    }

    if (previewActa) return <PrintView acta={toActa(previewActa)} onBack={() => setPreviewActa(null)} />;
    if (editingActa) return <ActaEditor acta={editingActa} setActa={setEditingActa} onBack={() => setEditingActa(null)} onSave={saveActa} onPreview={() => setPreviewActa({ data: editingActa })} onImport={importCoursePeople} user={user} />;

    return (
        <div className="mx-auto max-w-7xl space-y-5">
            <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-[#7657f6]">AGON académico</p>
                        <h1 className="mt-1 text-2xl font-black text-slate-900">Actas FOR023GDC y rúbricas</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">Formato oficial de acta, firmas, PDF y calificaciones desde el mismo AGON.</p>
                    </div>
                    {canManage && <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="field max-w-sm">{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    <Stat label="Actas" value={stats.minutes} />
                    <Stat label="Firmas listas" value={stats.signed} />
                    <Stat label="Firmas pendientes" value={stats.pending} />
                    <Stat label="Evaluaciones" value={stats.evaluations} />
                </div>
            </section>

            <div className="flex flex-wrap gap-2">
                {canManage && <Tab active={mode === 'minutes'} onClick={() => setMode('minutes')} icon={FilePenLine} label="Actas" />}
                {canManage && <Tab active={mode === 'rubrics'} onClick={() => setMode('rubrics')} icon={ClipboardList} label="Rúbricas y notas" />}
                {!canManage && <Tab active icon={PenLine} label="Mis actas y notas" />}
            </div>

            {canManage && mode === 'minutes' && <MinutesPanel minutes={activeMinutes} onNew={() => setEditingActa(blankActa())} onEdit={m => setEditingActa({ id: m.id, ...toActa(m) })} onPreview={setPreviewActa} onDelete={deleteMinute} />}
            {canManage && mode === 'rubrics' && <RubricsPanel rubrics={rubrics} evaluations={visibleEvaluations} students={course?.students || []} grades={grades} rubricForm={rubricForm} setRubricForm={setRubricForm} evaluationForm={evaluationForm} setEvaluationForm={setEvaluationForm} gradeDrafts={gradeDrafts} setGradeDrafts={setGradeDrafts} createRubric={createRubric} assignRubric={assignRubric} saveGrade={saveGrade} />}
            {!canManage && <StudentPanel minutes={minutes} grades={grades} storedSignature={storedSignature} setSignatureOpen={setSignatureOpen} />}
            {signatureOpen && <SignatureModal minute={signatureOpen} storedSignature={storedSignature} onClose={() => setSignatureOpen(null)} onConfirm={signMinute} user={user} />}
        </div>
    );
}

function ids(rows) { return (rows || []).map(item => item.user_id).filter(Boolean); }
function toActa(minute) { return { ...blankActa(), ...(minute.data || {}) }; }
function firmantes(minute) { return syncFirmas(toActa(minute)); }
function syncFirmas(acta) {
    const people = [...(acta.asistentes || []), ...(acta.invitados || [])].filter(p => p.nombre && p.nombre !== 'N/A');
    const current = [...(acta.firmas || [])];
    const keys = new Set(current.map(f => f.user_id || f.nombre).filter(Boolean));
    people.forEach(person => {
        const key = person.user_id || person.nombre;
        if (key && !keys.has(key)) current.push({ nombre: person.nombre, firma: '', user_id: person.user_id || null, firmado: false, fecha: '' });
    });
    return current;
}

function Stat({ label, value }) {
    return <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"><p className="text-xs font-bold text-slate-500">{label}</p><p className="text-2xl font-black text-slate-900">{value}</p></div>;
}

function Tab({ active, icon: Icon, label, onClick }) {
    return <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${active ? 'bg-[#7657f6] text-white shadow-lg shadow-violet-200' : 'bg-white text-slate-600 border border-slate-200'}`}><Icon size={17} /> {label}</button>;
}

function MinutesPanel({ minutes, onNew, onEdit, onPreview, onDelete }) {
    return (
        <section className="rounded-[1.1rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <h2 className="font-black text-slate-900">Actas del curso</h2>
                <button onClick={onNew} className="primary-btn"><Plus size={17} /> Nueva acta oficial</button>
            </div>
            <div className="divide-y divide-slate-100">
                {minutes.length === 0 && <Empty text="Aún no hay actas para este curso." />}
                {minutes.map(minute => {
                    const acta = toActa(minute);
                    const signatures = firmantes(minute);
                    const signed = signatures.filter(item => item.firmado).length;
                    return <div key={minute.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                            <p className="font-black text-slate-800">{acta.tipo} No. {acta.numero || minute.id}</p>
                            <p className="text-sm font-semibold text-slate-500">{minute.course_name} · {acta.fecha || minute.date}</p>
                            <p className="mt-1 text-sm text-slate-600 line-clamp-2">{acta.orden_dia || 'Sin orden del día registrado'}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{signed} firmadas</span><span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">{Math.max(signatures.length - signed, 0)} pendientes</span></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => onPreview(minute)} className="secondary-btn"><Eye size={16} /> Ver/PDF</button>
                            <button onClick={() => onEdit(minute)} className="secondary-btn"><FilePenLine size={16} /> Editar</button>
                            <button onClick={() => onDelete(minute)} className="danger-btn"><Trash2 size={16} /> Eliminar</button>
                        </div>
                    </div>;
                })}
            </div>
        </section>
    );
}

function ActaEditor({ acta, setActa, onBack, onSave, onPreview, onImport, user }) {
    const [step, setStep] = useState(0);
    const set = (field, value) => setActa(prev => ({ ...prev, [field]: value }));
    const addRow = (field, row) => setActa(prev => ({ ...prev, [field]: [...(prev[field] || []), row] }));
    const delRow = (field, index) => setActa(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    const setRow = (field, index, key, value) => setActa(prev => {
        const rows = [...(prev[field] || [])];
        rows[index] = { ...rows[index], [key]: value };
        return { ...prev, [field]: rows };
    });
    const steps = ['General', 'Agenda', 'Resultados', 'Firmas'];
    return (
        <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="icon-soft"><ChevronLeft size={19} /></button>
                <div><h1 className="text-2xl font-black text-slate-900">Acta FOR023GDC</h1><p className="text-sm font-semibold text-slate-500">No se altera el formato oficial; esta vista solo captura sus campos.</p></div>
                <div className="ml-auto flex gap-2"><button onClick={onPreview} className="secondary-btn"><Eye size={16} /> Vista oficial</button><button onClick={() => onSave(acta)} className="primary-btn"><Save size={16} /> Guardar</button></div>
            </div>
            <div className="flex flex-wrap gap-2">{steps.map((s, i) => <button key={s} onClick={() => setStep(i)} className={`rounded-xl px-3 py-2 text-xs font-black ${step === i ? 'bg-[#7657f6] text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{i + 1}. {s}</button>)}</div>
            <section className="rounded-[1.1rem] border border-slate-200 bg-white p-5 shadow-sm">
                {step === 0 && <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-3"><Field label="Tipo"><select value={acta.tipo} onChange={e => set('tipo', e.target.value)} className="field"><option>ACTA</option><option>RESUMEN</option></select></Field><Field label="No. del acta"><input value={acta.numero} onChange={e => set('numero', e.target.value)} className="field" /></Field><Field label="Total de actas"><input value={acta.total} onChange={e => set('total', e.target.value)} className="field" /></Field></div>
                    <div className="grid gap-3 sm:grid-cols-3"><Field label="Fecha"><input type="date" value={acta.fecha} onChange={e => set('fecha', e.target.value)} className="field" /></Field><Field label="Hora inicio"><input type="time" value={acta.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} className="field" /></Field><Field label="Hora final"><input type="time" value={acta.hora_final} onChange={e => set('hora_final', e.target.value)} className="field" /></Field></div>
                    <Field label="Instancias / Dependencias"><input value={acta.instancias} onChange={e => set('instancias', e.target.value)} className="field" /></Field><Field label="Lugar"><input value={acta.lugar} onChange={e => set('lugar', e.target.value)} className="field" /></Field>
                    <PeopleSection title="Asistentes" rows={acta.asistentes} field="asistentes" setRow={setRow} addRow={addRow} delRow={delRow} onImport={() => onImport('asistentes')} />
                    <PeopleSection title="Ausentes" rows={acta.ausentes} field="ausentes" setRow={setRow} addRow={addRow} delRow={delRow} onImport={() => onImport('ausentes')} />
                    <PeopleSection title="Invitados" rows={acta.invitados} field="invitados" setRow={setRow} addRow={addRow} delRow={delRow} onImport={() => onImport('invitados')} />
                </div>}
                {step === 1 && <div className="grid gap-4"><Field label="Orden del día"><textarea value={acta.orden_dia} onChange={e => set('orden_dia', e.target.value)} className="field min-h-32" /></Field><Field label="Desarrollo del orden del día"><textarea value={acta.desarrollo} onChange={e => set('desarrollo', e.target.value)} className="field min-h-56" /></Field></div>}
                {step === 2 && <div className="grid gap-4"><Commitments acta={acta} setRow={setRow} addRow={addRow} delRow={delRow} /><Field label="Próxima convocatoria"><textarea value={acta.proxima_convocatoria} onChange={e => set('proxima_convocatoria', e.target.value)} className="field min-h-24" /></Field><Field label="Anexos"><textarea value={acta.anexos} onChange={e => set('anexos', e.target.value)} className="field min-h-24" /></Field></div>}
                {step === 3 && <Signatures acta={acta} user={user} addRow={addRow} delRow={delRow} />}
            </section>
        </div>
    );
}

function PeopleSection({ title, rows, field, setRow, addRow, delRow, onImport }) {
    return <div><div className="mb-2 flex items-center justify-between"><h3 className="font-black text-slate-800">{title}</h3><button onClick={onImport} className="secondary-btn"><Users size={15} /> Importar curso</button></div><div className="overflow-hidden rounded-xl border border-slate-200"><table className="w-full"><tbody>{rows.map((r, i) => <tr key={i} className="border-b border-slate-100"><td className="p-2"><input value={r.nombre || ''} onChange={e => setRow(field, i, 'nombre', e.target.value)} placeholder="Nombre" className="field" /></td><td className="p-2"><input value={r.cargo || ''} onChange={e => setRow(field, i, 'cargo', e.target.value)} placeholder="Cargo/dependencia" className="field" /></td><td className="w-12 p-2"><button onClick={() => delRow(field, i)} className="text-xs font-black text-red-500">Quitar</button></td></tr>)}</tbody></table></div><button onClick={() => addRow(field, { nombre: '', cargo: '', email: '', user_id: null })} className="mt-2 text-xs font-black text-[#7657f6]">+ Agregar fila</button></div>;
}

function Commitments({ acta, setRow, addRow, delRow }) {
    return <div><h3 className="mb-2 font-black text-slate-800">Compromisos</h3><div className="grid gap-2">{acta.compromisos.map((c, i) => <div key={i} className="grid gap-2 sm:grid-cols-[1fr_220px_160px_70px]"><input value={c.compromiso} onChange={e => setRow('compromisos', i, 'compromiso', e.target.value)} placeholder="Compromiso" className="field" /><input value={c.responsable} onChange={e => setRow('compromisos', i, 'responsable', e.target.value)} placeholder="Responsable" className="field" /><input type="date" value={c.fecha} onChange={e => setRow('compromisos', i, 'fecha', e.target.value)} className="field" /><button onClick={() => delRow('compromisos', i)} className="text-sm font-black text-red-500">Quitar</button></div>)}</div><button onClick={() => addRow('compromisos', { compromiso: '', responsable: '', responsable_id: null, fecha: '' })} className="mt-2 text-xs font-black text-[#7657f6]">+ Agregar compromiso</button></div>;
}

function Signatures({ acta, user, addRow, delRow }) {
    const signatures = syncFirmas(acta);
    return <div><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-black text-slate-800">Firmas del acta</h3><button onClick={() => addRow('firmas', { nombre: user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username, user_id: user?.id, firmado: false, firma: '', fecha: '' })} className="secondary-btn"><PenLine size={15} /> Agregarme</button></div><div className="grid gap-2">{signatures.map((f, i) => <div key={`${f.user_id || f.nombre}-${i}`} className={`rounded-xl border p-3 ${f.firmado ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}><div className="flex items-center justify-between gap-3"><div><p className="font-black text-slate-800">{f.nombre}</p><p className="text-xs font-bold text-slate-500">{f.firmado ? `Firmó: ${f.fecha || ''}` : 'Pendiente de firma'}</p></div>{f.firmado ? <CheckCircle2 className="text-emerald-600" /> : <button onClick={() => delRow('firmas', i)} className="text-xs font-black text-red-500">Quitar</button>}</div></div>)}</div></div>;
}

function StudentPanel({ minutes, grades, storedSignature, setSignatureOpen }) {
    return <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-[1.1rem] border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black text-slate-900">Mis actas</h2>{minutes.length === 0 && <Empty text="No tienes actas asignadas." />}{minutes.map(minute => <div key={minute.id} className="mt-3 rounded-xl border border-slate-100 p-3"><p className="font-black text-slate-800">{toActa(minute).tipo} No. {toActa(minute).numero || minute.id}</p><p className="text-xs font-bold text-slate-500">{minute.course_name} · {toActa(minute).fecha}</p><button onClick={() => setSignatureOpen(minute)} className="primary-btn mt-3">{minute.signed_by_me ? 'Ver acta firmada' : 'Revisar y firmar'}</button></div>)}</section><section className="rounded-[1.1rem] border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black text-slate-900">Mis notas</h2>{grades.length === 0 && <Empty text="Aún no hay notas publicadas." />}{grades.map(grade => <div key={grade.id} className="mt-3 rounded-xl border border-slate-100 p-3"><p className="font-black text-slate-800">{grade.evaluation_detail?.rubric_detail?.title}</p><p className="text-sm font-black text-[#7657f6]">Nota: {grade.final_grade}</p><p className="text-sm text-slate-600">{grade.comments}</p></div>)}</section></div>;
}

function RubricsPanel({ rubrics, evaluations, students, grades, rubricForm, setRubricForm, evaluationForm, setEvaluationForm, gradeDrafts, setGradeDrafts, createRubric, assignRubric, saveGrade }) {
    return <div className="grid gap-4 xl:grid-cols-[420px_1fr]"><section className="rounded-[1.1rem] border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black text-slate-900">Crear rúbrica</h2><form onSubmit={createRubric} className="mt-3 grid gap-3"><input value={rubricForm.title} onChange={e => setRubricForm({ ...rubricForm, title: e.target.value })} required placeholder="Título" className="field" /><textarea value={rubricForm.description} onChange={e => setRubricForm({ ...rubricForm, description: e.target.value })} placeholder="Descripción" className="field min-h-24" /><button className="primary-btn"><Save size={16} /> Guardar rúbrica</button></form><form onSubmit={assignRubric} className="mt-4 grid gap-3"><select value={evaluationForm.rubric} onChange={e => setEvaluationForm({ ...evaluationForm, rubric: e.target.value })} required className="field"><option value="">Selecciona rúbrica</option>{rubrics.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select><button className="secondary-btn"><ClipboardList size={16} /> Asignar al curso</button></form></section><section className="rounded-[1.1rem] border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black text-slate-900">Calificaciones</h2>{evaluations.length === 0 && <Empty text="Asigna una rúbrica para calificar." />}{evaluations.map(ev => <div key={ev.id} className="mt-3 rounded-xl border border-slate-100 p-3"><p className="font-black text-slate-800">{ev.rubric_detail?.title}</p>{students.map(student => { const key = `${ev.id}-${student.id}`; const existing = grades.find(g => g.evaluation === ev.id && g.student === student.id); return <div key={student.id} className="mt-2 grid gap-2 rounded-lg bg-slate-50 p-2 sm:grid-cols-[1fr_90px_1fr_48px]"><p className="text-sm font-bold text-slate-700">{student.first_name} {student.last_name}</p><input type="number" step="0.1" min="0" max="5" placeholder={existing?.final_grade || '0.0'} onChange={e => setGradeDrafts(prev => ({ ...prev, [key]: { ...(prev[key] || {}), final_grade: e.target.value } }))} className="field" /><input placeholder={existing?.comments || 'Comentario'} onChange={e => setGradeDrafts(prev => ({ ...prev, [key]: { ...(prev[key] || {}), comments: e.target.value } }))} className="field" /><button type="button" onClick={() => saveGrade(ev, student)} className="icon-btn"><Save size={16} /></button></div>; })}</div>)}</section></div>;
}

function SignatureModal({ minute, storedSignature, onClose, onConfirm, user }) {
    const canvasRef = useRef(null);
    const [drawing, setDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const start = e => { e.preventDefault(); setDrawing(true); const ctx = canvasRef.current.getContext('2d'); const p = pos(e, canvasRef.current); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = e => { if (!drawing) return; e.preventDefault(); const ctx = canvasRef.current.getContext('2d'); const p = pos(e, canvasRef.current); ctx.lineTo(p.x, p.y); ctx.strokeStyle = '#172033'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke(); setHasDrawn(true); };
    const confirm = () => onConfirm(minute, storedSignature || canvasRef.current.toDataURL('image/png'));
    return (
        <div className="fixed inset-0 z-50 bg-black/45 p-0 sm:grid sm:place-items-center sm:p-4">
            <div className="flex h-full w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h3 className="font-black text-slate-900">Revisar y firmar acta</h3>
                    <button onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-black text-slate-500">Cerrar</button>
                </div>
                <div className="flex-1 overflow-auto p-3 pb-36 sm:pb-4">
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <OfficialActa acta={toActa(minute)} compact />
                    </div>
                    {storedSignature ? (
                        <div className="mt-3 rounded-xl bg-emerald-50 p-3">
                            <p className="text-sm font-bold text-emerald-800">Se usará tu firma guardada.</p>
                            <img src={storedSignature} alt="Firma guardada" className="mt-2 max-h-20 rounded bg-white p-2" />
                        </div>
                    ) : (
                        <div className="mt-3">
                            <p className="mb-2 text-sm font-bold text-slate-700">Dibuja tu firma</p>
                            <canvas ref={canvasRef} width={520} height={170} className="h-44 w-full rounded-xl border-2 border-dashed border-slate-300 bg-white touch-none" onMouseDown={start} onMouseMove={move} onMouseUp={() => setDrawing(false)} onMouseLeave={() => setDrawing(false)} onTouchStart={start} onTouchMove={move} onTouchEnd={() => setDrawing(false)} />
                        </div>
                    )}
                </div>
                <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:static sm:rounded-b-2xl">
                    <button disabled={!storedSignature && !hasDrawn} onClick={confirm} className="primary-btn w-full"><PenLine size={16} /> Guardar y firmar como {user?.first_name || user?.username}</button>
                </div>
            </div>
        </div>
    );
}

function pos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

function PrintView({ acta, onBack }) {
    return <div className="mx-auto max-w-5xl"><div className="no-print mb-4 flex gap-2"><button onClick={onBack} className="secondary-btn"><ChevronLeft size={16} /> Volver</button><button onClick={() => window.print()} className="primary-btn"><Download size={16} /> Descargar PDF</button></div><OfficialActa acta={acta} /></div>;
}

function OfficialActa({ acta, compact = false }) {
    const firmas = syncFirmas(acta);
    return <div id="print-acta" className={`bg-white text-black shadow-sm ${compact ? 'w-[720px] p-6 text-[10px]' : 'mx-auto w-[816px] max-w-full p-8 text-[11px]'}`}><style>{`@media print{body *{visibility:hidden!important}.no-print{display:none!important}#print-acta,#print-acta *{visibility:visible!important}#print-acta{position:absolute;left:0;top:0;width:100%!important;max-width:none!important;box-shadow:none!important}@page{size:letter;margin:1.5cm}}#print-acta{font-family:Arial,sans-serif;letter-spacing:0}#print-acta table{border-collapse:collapse;width:100%;table-layout:fixed}#print-acta td,#print-acta th{border:1px solid #000;padding:4px 6px;vertical-align:top;word-break:break-word}#print-acta .sec{background:#d9d9d9;font-weight:bold;padding:4px 6px;border:1px solid #000;margin-top:6px}#print-acta .hdr{background:#d9d9d9;font-weight:bold}#print-acta .meta{background:#dbe5f1;font-weight:bold;text-align:center}`}</style><table><tbody><tr><td rowSpan={2} className="text-center align-middle" style={{ width: '25%' }}><img src={UPN_LOGO} alt="UPN" style={{ height: 66, objectFit: 'contain', margin: 'auto' }} /></td><td colSpan={2} className="text-center font-bold" style={{ fontSize: 14 }}>FORMATO</td></tr><tr><td colSpan={2} className="text-center font-bold">ACTA DE REUNIÓN / RESUMEN DE REUNIÓN</td></tr><tr><td className="meta">Código:<br />FOR023GDC</td><td className="meta">Versión: 03</td><td className="meta"></td></tr><tr><td className="meta">Fecha de Aprobación:<br />22-03-2012</td><td colSpan={2} className="meta">Página 1 de 1</td></tr></tbody></table><p className="my-2 text-center font-bold">Marque según corresponda (*):</p><p className="mb-2 text-center"><span className="border border-black px-2">{acta.tipo === 'ACTA' ? 'X' : ' '}</span> ACTA DE REUNIÓN&nbsp;&nbsp; <span className="border border-black px-2">{acta.tipo === 'RESUMEN' ? 'X' : ' '}</span> RESUMEN DE REUNIÓN</p><table><tbody><tr><td className="text-center font-bold">Acta / Resumen de Reunión No. {acta.numero || '___'} de {acta.total || '___'}</td></tr></tbody></table><Sec n="1" t="Información General" /><table><tbody><tr><td style={{ width: '22%' }}>Fecha</td><td>{acta.fecha}</td><td>Hora inicio:</td><td>{acta.hora_inicio}</td><td>Hora final:</td><td>{acta.hora_final}</td></tr><tr><td>Instancias / Dependencias:</td><td colSpan={5}>{acta.instancias}</td></tr><tr><td>Lugar:</td><td colSpan={5}>{acta.lugar}</td></tr></tbody></table><PeoplePrint n="2" title="Asistentes" rows={acta.asistentes} /><PeoplePrint n="3" title="Ausentes" rows={acta.ausentes} /><PeoplePrint n="4" title="Invitados" rows={acta.invitados} /><Sec n="5" t="Orden del Día" /><table><tbody><tr><td className="whitespace-pre-wrap" style={{ minHeight: 72 }}>{acta.orden_dia}</td></tr></tbody></table><Sec n="6" t="Desarrollo del Orden del Día" /><table><tbody><tr><td className="whitespace-pre-wrap" style={{ minHeight: 120 }}>{acta.desarrollo}</td></tr></tbody></table><Sec n="7" t="Compromisos" /><table><thead><tr><th className="hdr">Compromiso</th><th className="hdr">Responsable</th><th className="hdr">Fecha (dd-mm-aaaa)</th></tr></thead><tbody>{(acta.compromisos || []).map((c, i) => <tr key={i}><td>{c.compromiso}</td><td>{c.responsable}</td><td>{c.fecha}</td></tr>)}</tbody></table><Sec n="8" t="Próxima Convocatoria" /><table><tbody><tr><td className="whitespace-pre-wrap">{acta.proxima_convocatoria}</td></tr></tbody></table><Sec n="9" t="Anexos" /><table><tbody><tr><td className="whitespace-pre-wrap">{acta.anexos}</td></tr></tbody></table><Sec n="10" t="Firmas" /><table><thead><tr><th className="hdr">Nombre</th><th className="hdr">Firma</th><th className="hdr">Fecha</th></tr></thead><tbody>{firmas.map((f, i) => <tr key={i}><td>{f.nombre}</td><td>{f.firmado && f.firma?.startsWith('data:') ? <img src={f.firma} alt="Firma" style={{ maxHeight: 40, maxWidth: 140 }} /> : f.firmado ? 'Firmado' : 'Pendiente'}</td><td>{f.fecha || '-'}</td></tr>)}</tbody></table><p className="mt-3 text-[10px]"><b>(*) Acta de Reunión:</b> Reuniones que contemplan elaboración formal de actas. <b>Resumen de Reunión:</b> Se aplica en los demás casos.</p></div>;
}

function Sec({ n, t }) { return <div className="sec">{n}. {t}:</div>; }
function PeoplePrint({ n, title, rows = [] }) { return <><Sec n={n} t={title} /><table><thead><tr><th className="hdr">Nombres</th><th className="hdr">Cargo/Dependencia</th></tr></thead><tbody>{(rows.length ? rows : [{ nombre: 'N/A', cargo: '' }]).map((r, i) => <tr key={i}><td>{r.nombre}</td><td>{r.cargo}</td></tr>)}</tbody></table></>; }
function Field({ label, children }) { return <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}{children}</label>; }
function Empty({ text }) { return <p className="p-5 text-sm font-semibold text-slate-500">{text}</p>; }
