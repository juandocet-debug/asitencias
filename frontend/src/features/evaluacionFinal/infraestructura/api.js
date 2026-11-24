import api from '../../../services/api';

export async function loadEvaluation(courseId) {
    const [plan, library, evaluations, grades] = await Promise.all([
        api.get(`/records/courses/${courseId}/final-evaluation/`),
        api.get('/records/rubrics/'),
        api.get('/records/evaluations/', { params: { course: courseId } }),
        api.get('/records/grades/', { params: { course: courseId } }),
    ]);
    return { plan: plan.data, library: library.data, evaluations: evaluations.data, grades: grades.data };
}

export async function saveWeights(courseId, weights) {
    await api.put(`/records/courses/${courseId}/final-evaluation/`, weights);
}

export async function saveGrade(evaluation, student, scores, comments, average) {
    await api.post('/records/grades/save-batch/', {
        evaluation, student, scores, comments, final_grade: Number(average.toFixed(2)),
    });
}
