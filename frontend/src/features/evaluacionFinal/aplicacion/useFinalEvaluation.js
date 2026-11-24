import { useCallback, useEffect, useState } from 'react';

export function useFinalEvaluation(courseId, repository) {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [version, setVersion] = useState(0);
    const [attendance, setAttendance] = useState('100');
    const [rubrics, setRubrics] = useState({});

    useEffect(() => {
        let current = true;
        repository.loadEvaluation(courseId).then(next => {
            if (!current) return;
            setData(next);
            setAttendance(next.plan.attendance_weight ?? '100');
            setRubrics(next.plan.rubric_weights);
            setError('');
        }).catch(() => {
            if (current) setError('No se pudo cargar la evaluación final.');
        });
        return () => { current = false; };
    }, [courseId, repository, version]);

    const reload = useCallback(() => setVersion(value => value + 1), []);
    async function save() {
        setBusy(true);
        setError('');
        try {
            await repository.saveWeights(courseId, { attendance_weight: attendance, rubric_weights: rubrics });
            reload();
        } catch (failure) {
            const response = failure.response?.data;
            setError(response?.non_field_errors?.[0] || response?.rubric_weights?.[0] || 'No se pudieron guardar los pesos.');
        } finally {
            setBusy(false);
        }
    }

    return { data, error, busy, attendance, setAttendance, rubrics, setRubrics, save, reload };
}
