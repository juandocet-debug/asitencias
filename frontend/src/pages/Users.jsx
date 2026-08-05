/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, User, Upload, Loader2 } from 'lucide-react';

import { useUsers } from '../hooks/useUsers';
import Toast from '../components/ui/Toast';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import UserStatsBar from '../components/users/UserStatsBar';
import UserFilterBar from '../components/users/UserFilterBar';
import UserTable from '../components/users/UserTable';
import UserFormModal from '../components/users/UserFormModal';

export default function UsersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const {
        users, loading, faculties, allPrograms,
        page, setPage, searchTerm, setSearchTerm,
        activeRole, setActiveRole, pagination,
        toast, setToast, showToast,
        deleteConfirm, setDeleteConfirm,
        fetchUsers, handleDelete, stats,
    } = useUsers(searchParams.get('role') || 'ALL');

    useEffect(() => {
        const roleParam = searchParams.get('role');
        setActiveRole(roleParam || 'ALL');
        setPage(1);
    }, [searchParams, setActiveRole, setPage]);

    const handleRoleFilter = (role) => {
        setActiveRole(role);
        setPage(1);
        if (role === 'ALL') searchParams.delete('role');
        else searchParams.set('role', role);
        setSearchParams(searchParams, { replace: true });
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        setPage(1);
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-upn-600" />
        </div>
    );

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <User className="text-upn-600" /> Gestión de Usuarios
                    </h2>
                    <p className="text-slate-500 mt-1">Administra estudiantes, docentes, coordinadores y administrativos.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <Upload size={18} /> Carga Masiva
                    </button>
                    <button onClick={openCreateModal} className="bg-upn-600 hover:bg-upn-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-upn-600/20">
                        <Plus size={18} /> Nuevo Usuario
                    </button>
                </div>
            </div>

            <UserStatsBar stats={stats} />

            <UserFilterBar
                searchTerm={searchTerm}
                onSearch={handleSearch}
                activeRole={activeRole}
                onRoleChange={handleRoleFilter}
                stats={stats}
                resultCount={pagination.count}
            />

            <UserTable
                users={users}
                onEdit={openEditModal}
                onDelete={setDeleteConfirm}
            />

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                <span>Página {page} · {pagination.count} usuario(s)</span>
                <div className="flex gap-2">
                    <button
                        disabled={!pagination.previous}
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        className="rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Anterior
                    </button>
                    <button
                        disabled={!pagination.next}
                        onClick={() => setPage(prev => prev + 1)}
                        className="rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <UserFormModal
                    editingUser={editingUser}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={(type, message) => {
                        showToast(message, type);
                        if (type === 'success') fetchUsers();
                    }}
                    faculties={faculties}
                    allPrograms={allPrograms}
                />
            )}

            {deleteConfirm && (
                <DeleteConfirmModal
                    title="¿Eliminar Usuario?"
                    description={`¿Estás seguro de eliminar a ${deleteConfirm.first_name} ${deleteConfirm.last_name}? Esta acción no se puede deshacer.`}
                    onConfirm={() => handleDelete(deleteConfirm.id)}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}
        </div>
    );
}
