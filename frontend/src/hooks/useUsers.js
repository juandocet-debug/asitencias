// hooks/useUsers.js
// Encapsula la carga de usuarios y catálogos, el toast, y la eliminación.
// El form (crear/editar) vive dentro de UserFormModal como estado local.

import { useState, useEffect } from 'react';
import api from '../services/api';

export function useUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [faculties, setFaculties] = useState([]);
    const [allPrograms, setAllPrograms] = useState([]);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchUsers();
        fetchCatalogs();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/');
            setUsers(res.data);
        } catch (error) {
            showToast('Error al cargar usuarios', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalogs = async () => {
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
    };

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

    // Estadísticas derivadas del listado
    const stats = {
        total: users.length,
        students: users.filter(u => u.role === 'STUDENT').length,
        teachers: users.filter(u => u.role === 'TEACHER').length,
        coordinators: users.filter(u => (u.roles || []).includes('COORDINATOR')).length,
        admins: users.filter(u => u.role === 'ADMIN').length,
    };

    return {
        users, loading, faculties, allPrograms,
        toast, setToast, showToast,
        deleteConfirm, setDeleteConfirm,
        fetchUsers, handleDelete,
        stats,
    };
}
