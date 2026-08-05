// hooks/useUsers.js
// Encapsula carga paginada de usuarios, catálogos, toasts y eliminación.

import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

const DEFAULT_STATS = {
    total: 0,
    students: 0,
    teachers: 0,
    coordinators: 0,
    admins: 0,
};

export function useUsers(initialRole = 'ALL') {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRole, setActiveRole] = useState(initialRole);
    const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
    const [stats, setStats] = useState(DEFAULT_STATS);
    const [faculties, setFaculties] = useState([]);
    const [allPrograms, setAllPrograms] = useState([]);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const fetchUsers = useCallback(async (options = {}) => {
        const nextPage = options.page ?? page;
        const nextSearch = options.searchTerm ?? searchTerm;
        const nextRole = options.activeRole ?? activeRole;

        try {
            setLoading(true);
            const res = await api.get('/users/', {
                params: {
                    page: nextPage,
                    page_size: 25,
                    search: nextSearch || undefined,
                    role: nextRole !== 'ALL' ? nextRole : undefined,
                },
            });
            const payload = res.data;
            setUsers(Array.isArray(payload) ? payload : payload.results || []);
            setPagination({
                count: Array.isArray(payload) ? payload.length : payload.count || 0,
                next: Array.isArray(payload) ? null : payload.next,
                previous: Array.isArray(payload) ? null : payload.previous,
            });
            setStats(payload.stats || DEFAULT_STATS);
        } catch {
            showToast('Error al cargar usuarios', 'error');
        } finally {
            setLoading(false);
        }
    }, [activeRole, page, searchTerm, showToast]);

    const fetchCatalogs = useCallback(async () => {
        try {
            const [facRes, progRes] = await Promise.all([
                api.get('/users/faculties/'),
                api.get('/users/programs/'),
            ]);
            setFaculties(facRes.data);
            setAllPrograms(progRes.data);
        } catch (e) {
            console.error('Error cargando catálogos:', e);
        }
    }, []);

    useEffect(() => {
        fetchCatalogs();
    }, [fetchCatalogs]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchUsers({ page, searchTerm, activeRole });
        }, 300);
        return () => clearTimeout(timeout);
    }, [activeRole, fetchUsers, page, searchTerm]);

    const handleDelete = async (userId) => {
        try {
            await api.delete(`/users/${userId}/`);
            showToast('Usuario eliminado correctamente', 'success');
            setDeleteConfirm(null);
            fetchUsers();
        } catch {
            showToast('Error al eliminar usuario', 'error');
        }
    };

    return {
        users, loading, faculties, allPrograms,
        page, setPage, searchTerm, setSearchTerm,
        activeRole, setActiveRole, pagination,
        toast, setToast, showToast,
        deleteConfirm, setDeleteConfirm,
        fetchUsers, handleDelete, stats,
    };
}
