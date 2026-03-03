// hooks/useAttendanceReport.js
// Custom hook que encapsula todos los datos y la lógica de carga
// del reporte de asistencia de un curso.

import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

export function useAttendanceReport(courseId) {
    const [course, setCourse] = useState(null);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [studentReport, setStudentReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [courseRes, statsRes, historyRes, reportRes] = await Promise.all([
                api.get(`/academic/courses/${courseId}/`),
                api.get(`/academic/courses/${courseId}/attendance_stats/`),
                api.get(`/academic/courses/${courseId}/attendance_history/`),
                api.get(`/academic/courses/${courseId}/student_report/`),
            ]);
            setCourse(courseRes.data);
            setStats(statsRes.data);
            setHistory(historyRes.data);
            setStudentReport(reportRes.data);
        } catch (err) {
            console.error('Error cargando reporte:', err);
            setError('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [courseId]);

    // Promedio de asistencia del grupo
    const globalStats = useMemo(() => {
        if (!studentReport.length) return { avgRate: 0 };
        const avgRate = Math.round(
            studentReport.reduce((sum, s) => sum + s.attendance_rate, 0) / studentReport.length
        );
        return { avgRate };
    }, [studentReport]);

    return { course, stats, history, studentReport, loading, error, fetchData, globalStats };
}
