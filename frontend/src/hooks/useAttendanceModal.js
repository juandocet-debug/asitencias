// hooks/useAttendanceModal.js
// Encapsula toda la lógica del modal de asistencia:
// - Cargar sesión existente al cambiar fecha (API GET session_attendance)
// - Toggle de estado, marcar todos, conteos
// - Guardar mediante bulk_create (update_or_create en backend)

import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';

const STUDENTS_PER_PAGE = 20;

export function useAttendanceModal({ isOpen, courseId, students, initialDate }) {
    const today = new Date().toISOString().split('T')[0];

    // ── Core state ──────────────────────────────────────────────────
    const [mode, setMode] = useState('manual');
    const [attendanceDate, setDateState] = useState(today);
    const [attendanceData, setAttendanceData] = useState({});
    const [timeRanges, setTimeRanges] = useState({
        present: { start: '07:00', end: '07:20' },
        late: { start: '07:20', end: '07:40' },
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [clockTick, setClockTick] = useState(0);

    // ── Session loading state ────────────────────────────────────────
    const [savingAttendance, setSavingAttendance] = useState(false);
    const [loadingSession, setLoadingSession] = useState(false);
    const [isExistingSession, setIsExistingSession] = useState(false);

    // ── Reset on open (or when initialDate changes) ─────────────────
    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1);
            setSearchTerm('');
            setMode('manual');
            setDateState(initialDate || today);
        }
    }, [isOpen, initialDate]);  // eslint-disable-line

    // ── Load existing session when date or courseId changes ──────────
    useEffect(() => {
        if (!isOpen || !courseId || !attendanceDate) return;

        let cancelled = false;
        const load = async () => {
            setLoadingSession(true);
            try {
                const res = await api.get(
                    `/academic/attendance/session_attendance/?course_id=${courseId}&date=${attendanceDate}`
                );
                if (cancelled) return;
                const existing = res.data; // { "student_id": "STATUS", ... }
                const hasExisting = Object.keys(existing).length > 0;
                setIsExistingSession(hasExisting);

                // Pre-cargar: existente si hay, PRESENT si es nueva fecha
                const newData = {};
                students.forEach(s => {
                    newData[s.id] = existing[String(s.id)] || 'PRESENT';
                });
                setAttendanceData(newData);
            } catch {
                if (cancelled) return;
                // Fallback: todos en PRESENT
                const newData = {};
                students.forEach(s => { newData[s.id] = 'PRESENT'; });
                setAttendanceData(newData);
                setIsExistingSession(false);
            } finally {
                if (!cancelled) { setLoadingSession(false); setCurrentPage(1); }
            }
        };
        load();
        return () => { cancelled = true; };
    }, [isOpen, courseId, attendanceDate]);         // eslint-disable-line

    // ── Clock for auto mode ──────────────────────────────────────────
    useEffect(() => {
        if (mode !== 'auto' || !isOpen) return;
        const interval = setInterval(() => setClockTick(t => t + 1), 10000);
        return () => clearInterval(interval);
    }, [mode, isOpen]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    // ── Time helpers ─────────────────────────────────────────────────
    const getCurrentTime = () => {
        const n = new Date();
        return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
    };

    const getAutoStatus = useCallback(() => {
        const ct = getCurrentTime();
        if (ct >= timeRanges.present.start && ct < timeRanges.present.end) return 'PRESENT';
        if (ct >= timeRanges.late.start && ct < timeRanges.late.end) return 'LATE';
        return 'ABSENT';
    }, [timeRanges]);

    // ── Filter + Paginate ────────────────────────────────────────────
    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return students;
        const t = searchTerm.toLowerCase();
        return students.filter(s =>
            s.first_name?.toLowerCase().includes(t) ||
            s.last_name?.toLowerCase().includes(t) ||
            s.document_number?.includes(t)
        );
    }, [students, searchTerm]);

    const totalPages = Math.ceil(filtered.length / STUDENTS_PER_PAGE);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * STUDENTS_PER_PAGE;
        return filtered.slice(start, start + STUDENTS_PER_PAGE);
    }, [filtered, currentPage]);

    // ── Toggle ───────────────────────────────────────────────────────
    const toggleStatus = useCallback((studentId) => {
        if (mode === 'auto') {
            setAttendanceData(prev => {
                const cur = prev[studentId];
                return (cur === 'PRESENT' || cur === 'LATE')
                    ? { ...prev, [studentId]: 'ABSENT' }
                    : { ...prev, [studentId]: getAutoStatus() };
            });
        } else {
            setAttendanceData(prev => {
                const cur = prev[studentId] || 'PRESENT';
                const nxt = cur === 'PRESENT' ? 'ABSENT' : (cur === 'ABSENT' ? 'LATE' : 'PRESENT');
                return { ...prev, [studentId]: nxt };
            });
        }
    }, [mode, getAutoStatus]);

    const markAll = useCallback((status) => {
        const newData = {};
        students.forEach(s => { newData[s.id] = status; });
        setAttendanceData(newData);
    }, [students]);

    // ── Counts ───────────────────────────────────────────────────────
    const counts = useMemo(() => {
        const vals = Object.values(attendanceData);
        return {
            present: vals.filter(v => v === 'PRESENT').length,
            absent: vals.filter(v => v === 'ABSENT').length,
            late: vals.filter(v => v === 'LATE').length,
        };
    }, [attendanceData]);

    // ── Save ─────────────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        setSavingAttendance(true);
        try {
            await api.post('/academic/attendance/bulk_create/', {
                course_id: courseId,
                date: attendanceDate,
                attendances: Object.keys(attendanceData).map(id => ({
                    student_id: parseInt(id),
                    status: attendanceData[id],
                })),
            });
        } finally {
            setSavingAttendance(false);
        }
    }, [courseId, attendanceDate, attendanceData]);

    // ── Public date setter ────────────────────────────────────────────
    const setAttendanceDate = useCallback((date) => {
        setDateState(date);
    }, []);

    return {
        // Data
        attendanceData,
        // Date
        attendanceDate, setAttendanceDate, isExistingSession, loadingSession,
        // Mode
        mode, setMode,
        // Time ranges
        timeRanges, setTimeRanges,
        // Search / Pagination
        searchTerm, setSearchTerm, currentPage, setCurrentPage,
        filtered, paginated, totalPages,
        // Actions
        toggleStatus, markAll, counts,
        // Save
        savingAttendance, handleSave,
        // Auto mode clock
        getCurrentTime, getAutoStatus,
    };
}
