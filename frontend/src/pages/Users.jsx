/* eslint-disable */
import React, { useState, useEffect } from 'react';
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

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRole, setActiveRole] = useState(searchParams.get('role') || 'ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Datos + acciones
    const {
        users, loading, faculties, allPrograms,
        toast, setToast, showToast,
        deleteConfirm, setDeleteConfirm,
        fetchUsers, handleDelete, stats,
    } = useUsers();

    // Sincronizar filtro de rol con la URL
    useEffect(() => {
        const roleParam = searchParams.get('role');
        setActiveRole(roleParam || 'ALL');
    }, [searchParams]);

    const handleRoleFilter = (role) => {
        setActiveRole(role);
        if (role === 'ALL') searchParams.delete('role');
        else searchParams.set('role', role);
        setSearchParams(searchParams, { replace: true });
    };

    const openCreateModal = () => { setEditingUser(null); setIsModalOpen(true); };
    const openEditModal = (user) => { setEditingUser(user); setIsModalOpen(true); };

    // Filtrar usuarios (depende de UI state → no va en el hook)
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.document_number?.includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = activeRole === 'ALL'
            || user.role === activeRole
            || (user.roles || []).includes(activeRole);
        return matchesSearch && matchesRole;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-upn-600" />
        </div>
    );

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Encabezado */}
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
                onSearch={setSearchTerm}
                activeRole={activeRole}
                onRoleChange={handleRoleFilter}
                stats={stats}
                resultCount={filteredUsers.length}
            />

            <UserTable
                users={filteredUsers}
                onEdit={openEditModal}
                onDelete={setDeleteConfirm}
            />

            {/* Modal crear/editar */}
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

            {/* Modal confirmar eliminación */}
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
