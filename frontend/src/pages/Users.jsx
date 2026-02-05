import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, User, Upload, X, AlertTriangle, Check, Loader2, Shield, GraduationCap, BookOpen } from 'lucide-react';
import api from '../services/api';

// Mapeo de roles a español
const ROLE_LABELS = {
    'STUDENT': 'Estudiante',
    'TEACHER': 'Docente',
    'ADMIN': 'Administrador'
};

const ROLE_STYLES = {
    'STUDENT': 'bg-blue-100 text-blue-800 border-blue-200',
    'TEACHER': 'bg-purple-100 text-purple-800 border-purple-200',
    'ADMIN': 'bg-upn-100 text-upn-800 border-upn-200'
};

const ROLE_ICONS = {
    'STUDENT': <GraduationCap size={14} />,
    'TEACHER': <BookOpen size={14} />,
    'ADMIN': <Shield size={14} />
};

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        email: '',
        role: 'STUDENT',
        document_number: ''
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Media URL helper
    const getMediaUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `http://127.0.0.1:8000${path.startsWith('/') ? '' : '/'}${path}`;
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            const errorMessage = error.response?.data?.detail || error.message || "Error al cargar usuarios";
            showToast(errorMessage, "error");

            // Si es error de autenticación (401), redirigir al login si es necesario
            if (error.response?.status === 401) {
                // Opcional: manejar logout
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            first_name: '',
            last_name: '',
            email: '',
            role: 'STUDENT',
            document_number: ''
        });
        setEditingUser(null);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username || user.email,
            password: '', // No mostramos la contraseña
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            role: user.role || 'STUDENT',
            document_number: user.document_number || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingUser) {
                // Actualizar usuario existente
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password; // No enviar contraseña vacía

                await api.patch(`/users/${editingUser.id}/`, updateData);
                showToast("Usuario actualizado correctamente", "success");
            } else {
                // Crear nuevo usuario
                await api.post('/users/', formData);
                showToast("Usuario creado correctamente", "success");
            }

            setIsModalOpen(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            console.error("Error:", error);
            showToast(editingUser ? "Error al actualizar usuario" : "Error al crear usuario", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (userId) => {
        try {
            await api.delete(`/users/${userId}/`);
            showToast("Usuario eliminado correctamente", "success");
            setDeleteConfirm(null);
            fetchUsers();
        } catch (error) {
            console.error("Error deleting:", error);
            showToast("Error al eliminar usuario", "error");
        }
    };

    const filteredUsers = users.filter(user =>
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.document_number?.includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Estadísticas
    const stats = {
        total: users.length,
        students: users.filter(u => u.role === 'STUDENT').length,
        teachers: users.filter(u => u.role === 'TEACHER').length,
        admins: users.filter(u => u.role === 'ADMIN').length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-upn-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100]`}>
                    {toast.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
                    <span className="font-medium">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="hover:bg-white/20 rounded p-1"><X size={16} /></button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <User className="text-upn-600" /> Gestión de Usuarios
                    </h2>
                    <p className="text-slate-500 mt-1">Administra estudiantes, docentes y administrativos.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <Upload size={18} /> Carga Masiva
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-upn-600 hover:bg-upn-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-upn-600/20"
                    >
                        <Plus size={18} /> Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-xl">
                        <User size={20} className="text-slate-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                        <p className="text-xs text-slate-500 font-medium">Total Usuarios</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <GraduationCap size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-blue-600">{stats.students}</p>
                        <p className="text-xs text-slate-500 font-medium">Estudiantes</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <BookOpen size={20} className="text-purple-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-purple-600">{stats.teachers}</p>
                        <p className="text-xs text-slate-500 font-medium">Docentes</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-upn-100 rounded-xl">
                        <Shield size={20} className="text-upn-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-upn-600">{stats.admins}</p>
                        <p className="text-xs text-slate-500 font-medium">Administradores</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, documento o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Documento</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {/* Avatar con foto */}
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                                                    {user.photo ? (
                                                        <img
                                                            src={getMediaUrl(user.photo)}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>{user.first_name?.[0]}{user.last_name?.[0]}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{user.first_name} {user.last_name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Mail size={12} /> {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                            {user.document_number || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${ROLE_STYLES[user.role] || 'bg-slate-100 text-slate-800'}`}>
                                                {ROLE_ICONS[user.role]}
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                                                Activo
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(user)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Create/Edit User */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
                                    <input
                                        required
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Apellido</label>
                                    <input
                                        required
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value, username: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Documento</label>
                                    <input
                                        value={formData.document_number}
                                        onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Rol</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500"
                                    >
                                        <option value="STUDENT">Estudiante</option>
                                        <option value="TEACHER">Docente</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">
                                    {editingUser ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500"
                                    placeholder={editingUser ? '••••••••' : ''}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-upn-600 text-white rounded-xl text-sm font-bold hover:bg-upn-700 transition-colors shadow-lg shadow-upn-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Confirmar Eliminación */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar Usuario?</h3>
                            <p className="text-slate-500 mb-6">
                                ¿Estás seguro de eliminar a <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong>?
                                Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm.id)}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} /> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
