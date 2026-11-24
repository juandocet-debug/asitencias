import { useState } from 'react';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';

import RubricGradingPage from '../../../pages/RubricGradingPage';
import { useFinalEvaluation } from '../aplicacion/useFinalEvaluation';
import { totalWeight } from '../dominio/ponderacion';
import * as repository from './api';

export default function FinalEvaluationPanel({ course, evaluatorId, onClose }) {
    const state = useFinalEvaluation(course.id, repository);
    const { data, error, busy, attendance, setAttendance, rubrics, setRubrics, save, reload } = state;
    const [selectedRubric, setSelectedRubric] = useState('');
    const [target, setTarget] = useState(null);
    const [gradeError, setGradeError] = useState('');

    if (target) return <div className="space-y-3">
        {gradeError && <p role="alert" className="text-sm font-semibold text-red-700">{gradeError}</p>}
        <RubricGradingPage
            evaluation={target.evaluation} student={target.student} existing={target.grade}
            requireComplete
            onBack={() => { setTarget(null); setGradeError(''); }}
            onSave={async (scores, comments, average) => {
                try {
                    await repository.saveGrade(target.evaluation.id, target.student.id, scores, comments, average);
                    setGradeError('');
                    setTarget(null);
                    reload();
                } catch {
                    setGradeError('No se pudo guardar la calificación. Tus selecciones siguen disponibles.');
                }
            }}
        />
    </div>;

    const library = new Map((data?.library || []).map(rubric => [String(rubric.id), rubric]));
    for (const evaluation of data?.evaluations || []) {
        library.set(String(evaluation.rubric), evaluation.rubric_detail);
    }
    const students = new Map((course.students || []).map(student => [student.id, student]));
    const total = totalWeight(attendance, rubrics);

    return <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6">
        <header className="flex items-center gap-3">
            <button type="button" onClick={onClose} aria-label="Volver a la clase" className="icon-soft"><ArrowLeft size={20} /></button>
            <div><h2 className="text-xl font-black text-[#172033]">Evaluación final</h2><p className="text-sm text-slate-600">{course.name}</p></div>
        </header>
        {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
        {!data && !error && <p role="status">Cargando evaluación…</p>}
        {!data && error && <button type="button" className="secondary-btn" onClick={reload}>Reintentar</button>}
        {data && <>
            <form className="space-y-3" onSubmit={event => { event.preventDefault(); void save(); }}>
                <h3 className="font-bold text-[#172033]">Ponderación</h3>
                <Weight label="Asistencia" value={attendance} onChange={setAttendance} min={0} />
                {Object.entries(rubrics).map(([id, weight]) => <div key={id} className="flex items-end gap-2">
                    <Weight label={library.get(id)?.title || `Rúbrica ${id}`} value={weight}
                        onChange={value => setRubrics(current => ({ ...current, [id]: value }))} min={0.01} />
                    <button type="button" className="icon-soft" aria-label={`Quitar ${library.get(id)?.title || id} de la ponderación`} onClick={() => {
                        setRubrics(current => Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)));
                    }}><X size={17} /></button>
                </div>)}
                <div className="flex flex-wrap items-end gap-2">
                    <label className="grid grow gap-1 text-sm font-semibold text-slate-700">Rúbrica existente
                        <select className="field" value={selectedRubric} onChange={event => setSelectedRubric(event.target.value)}>
                            <option value="">Selecciona una rúbrica</option>
                            {[...library].filter(([id]) => !(id in rubrics)).map(([id, rubric]) =>
                                <option key={id} value={id}>{rubric.title}</option>)}
                        </select>
                    </label>
                    <button type="button" className="secondary-btn" disabled={!selectedRubric || selectedRubric in rubrics} onClick={() => {
                        setRubrics(current => ({ ...current, [selectedRubric]: '' }));
                        setSelectedRubric('');
                    }}><Plus size={16} /> Agregar</button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">Total: <strong>{total} %</strong> de 100 %</p>
                    <button className="primary-btn" disabled={busy || total !== 100}><Save size={16} /> {busy ? 'Guardando…' : 'Guardar pesos'}</button>
                </div>
            </form>
            <div className="overflow-x-auto">
                <h3 className="mb-2 font-bold text-[#172033]">Resultados guardados</h3>
                {!data.plan.results.length && <p className="text-sm text-slate-600">Guarda la ponderación para ver los resultados del curso.</p>}
                {data.plan.results.length > 0 && <table className="w-full text-left text-sm">
                    <thead className="bg-[#f0edff] text-[#2a2147]"><tr><th className="p-2">Estudiante</th><th className="p-2">Asistencia</th>
                        {Object.keys(data.plan.rubric_weights).map(id => <th key={id} className="p-2">{library.get(id)?.title || 'Rúbrica'}</th>)}
                        <th className="p-2">Nota final / 5</th>
                    </tr></thead>
                    <tbody>{data.plan.results.map(result => {
                        const student = students.get(result.student);
                        if (!student) return null;
                        return <tr key={result.student} className="border-b border-slate-100">
                            <th className="p-2">{student.first_name} {student.last_name}</th>
                            <td className="p-2">{result.attendance_rate == null ? 'Sin sesiones' : `${result.attendance_rate} %`}</td>
                            {Object.keys(data.plan.rubric_weights).map(id => {
                                const evaluation = data.evaluations.find(item => String(item.rubric) === id);
                                const grade = result.rubrics.find(item => item.evaluation === evaluation?.id)?.grade;
                                const existing = data.grades.find(item => item.evaluation === evaluation?.id && item.student === student.id && item.evaluator === evaluatorId);
                                return <td key={id} className="p-2">{evaluation ? <button type="button" className="secondary-btn"
                                    aria-label={`Calificar a ${student.first_name} en ${library.get(id)?.title || 'rúbrica'}`}
                                    onClick={() => setTarget({ evaluation, student, grade: existing })}>
                                    {grade == null ? 'Calificar' : Number(grade).toFixed(2)}
                                </button> : 'Pendiente'}</td>;
                            })}
                            <td className="p-2 font-bold">{result.final_grade == null ? 'Pendiente' : Number(result.final_grade).toFixed(2)}</td>
                        </tr>;
                    })}</tbody>
                </table>}
            </div>
        </>}
    </section>;
}

function Weight({ label, value, onChange, min }) {
    return <label className="grid w-full max-w-sm gap-1 text-sm font-semibold text-slate-700">
        {label} (%)
        <input className="field" type="number" required min={min} max="100" step="0.01" value={value}
            onChange={event => onChange(event.target.value)} />
    </label>;
}
