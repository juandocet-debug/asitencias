// hooks/useAttendanceReport.js
// Custom hook que encapsula todos los datos y la lógica de carga
// del reporte de asistencia de un curso.
//
// Dos modos de recarga:
//   - fetchData() → carga inicial con spinner (loading=true)
//   - refresh()   → recarga silenciosa SIN spinner (para usar tras editar sesiones)

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../services/api';

export function useAttendanceReport(courseId) {
    const [course, setCourse] = useState(null);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [studentReport, setStudentReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);   // spinner suave opcional
    const [error, setError] = useState(null);

    // Ref del courseId para evitar closures viejas en callbacks
    const courseIdRef = useRef(courseId);
    useEffect(() => { courseIdRef.current = courseId; }, [courseId]);

    // ── Función interna de fetch (sin cambiar loading) ──────────────────
    const _doFetch = useCallback(async (cid) => {
        const [courseRes, statsRes, historyRes, reportRes] = await Promise.all([
            api.get(`/academic/courses/${cid}/`),
            api.get(`/academic/courses/${cid}/attendance_stats/`),
            api.get(`/academic/courses/${cid}/attendance_history/`),
            api.get(`/academic/courses/${cid}/student_report/`),
        ]);
        setCourse(courseRes.data);
        setStats(statsRes.data);
        setHistory(historyRes.data);
        setStudentReport(reportRes.data);
    }, []);

    // ── Carga inicial — muestra spinner completo ─────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            await _doFetch(courseIdRef.current);
        } catch (err) {
            console.error('Error cargando reporte:', err);
            setError('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }, [_doFetch]);

    // ── Recarga silenciosa — NO pon loading=true (tabla sigue visible) ───
    const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await _doFetch(courseIdRef.current);
        } catch (err) {
            console.error('Error al refrescar reporte:', err);
        } finally {
            setRefreshing(false);
        }
    }, [_doFetch]);

    useEffect(() => { fetchData(); }, [courseId]);   // eslint-disable-line

    // Promedio de asistencia del grupo
    const globalStats = useMemo(() => {
        if (!studentReport.length) return { avgRate: 0 };
        const avgRate = Math.round(
            studentReport.reduce((sum, s) => sum + s.attendance_rate, 0) / studentReport.length
        );
        return { avgRate };
    }, [studentReport]);

    return {
        course, stats, history, studentReport,
        loading, refreshing, error,
        fetchData, refresh, globalStats,
    };
}
