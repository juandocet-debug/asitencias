/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Mail, User, Upload, X, AlertTriangle, Check, Loader2, Shield, GraduationCap, BookOpen, Eye, EyeOff, Briefcase, Building2, ChevronDown } from 'lucide-react';
import api from '../services/api';

// Mapeo de roles a español
const ROLE_LABELS = {
    'STUDENT': 'Estudiante',
    'TEACHER': 'Docente',
    'PRACTICE_TEACHER': 'Prof. Prácticas',
    'COORDINATOR': 'Coordinador',
    'ADMIN': 'Administrador'
};

const ROLE_STYLES = {
    'STUDENT': 'bg-blue-100 text-blue-800 border-blue-200',
    'TEACHER': 'bg-purple-100 text-purple-800 border-purple-200',
    'PRACTICE_TEACHER': 'bg-teal-100 text-teal-800 border-teal-200',
    'COORDINATOR': 'bg-amber-100 text-amber-800 border-amber-200',
    'ADMIN': 'bg-upn-100 text-upn-800 border-upn-200'
};

const ROLE_ICONS = {
    'STUDENT': <GraduationCap size={14} />,
    'TEACHER': <BookOpen size={14} />,
    'PRACTICE_TEACHER': <Briefcase size={14} />,
    'COORDINATOR': <Briefcase size={14} />,
    'ADMIN': <Shield size={14} />
};

const COORDINATOR_TYPE_LABELS = {
    'PRACTICAS': 'Prácticas',
    'PROGRAMA': 'Programa',
    'INVESTIGACION': 'Investigación',
    'EXTENSION': 'Extensión',
};

export default function UsersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRole, setActiveRole] = useState(searchParams.get('role') || 'ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    // Catálogos
    const [faculties, setFaculties] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [allPrograms, setAllPrograms] = useState([]);

    // Sincronizar pestaña activa cuando cambie la URL (ej: navegación desde dashboard)
    useEffect(() => {
        const roleParam = searchParams.get('role');
        setActiveRole(roleParam || 'ALL');
    }, [searchParams]);

    const handleRoleFilter = (role) => {
        setActiveRole(role);
        if (role === 'ALL') {
            searchParams.delete('role');
        } else {
            searchParams.set('role', role);
        }
        setSearchParams(searchParams, { replace: true });
    };

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        email: '',
        role: 'STUDENT',
        roles: [],
        document_number: '',
        faculty: '',
        program: '',
        coordinator_profiles: [],
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
        fetchCatalogs();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            const errorMessage = error.response?.data?.detail || error.message || "Error al cargar usuarios";
            showToast(errorMessage, "error");
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
            setPrograms(progRes.data);
        } catch (e) {
            console.error('Error fetching catalogs:', e);
        }
    };

    // Filtrar programas cuando cambie la facultad seleccionada
    useEffect(() => {
        if (formData.faculty) {
            setPrograms(allPrograms.filter(p => String(p.faculty) === String(formData.faculty)));
        } else {
            setPrograms(allPrograms);
        }
    }, [formData.faculty, allPrograms]);

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            first_name: '',
            last_name: '',
            email: '',
            role: 'STUDENT',
            roles: [],
            document_number: '',
            faculty: '',
            program: '',
            coordinator_profiles: [],
        });
        setFormErrors({});
        setShowPassword(false);
        setEditingUser(null);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username || user.email,
            password: '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            role: user.role || 'STUDENT',
            roles: user.roles || [user.role || 'STUDENT'],
            document_number: user.document_number || '',
            faculty: user.faculty || '',
            program: user.program || '',
            coordinator_profiles: (user.coordinator_profiles || []).map(cp => ({
                coordinator_type: cp.coordinator_type,
                program: cp.program,
            })),
        });
        setIsModalOpen(true);
    };

    /**
     * Convierte los errores del backend (campo: [mensajes]) a un objeto plano
     * y muestra el primer error global como toast si no hay errores de campo.
     * Captura correctamente los errores de validación de contraseña de Django.
     */
    const handleApiErrors = (error) => {
        const data = error.response?.data;
        if (!data) {
            showToast('Error de red. Intenta de nuevo.', 'error');
            return;
        }

        const fieldErrors = {};
        let hasFieldErrors = false;
        // 'password' incluido explícitamente para capturar errores de Django validators
        const knownFields = ['username', 'password', 'first_name', 'last_name', 'email', 'document_number', 'role', 'faculty', 'program'];

        for (const key of knownFields) {
            if (data[key]) {
                fieldErrors[key] = Array.isArray(data[key]) ? data[key].join(' ') : String(data[key]);
                hasFieldErrors = true;
            }
        }

        if (hasFieldErrors) {
            setFormErrors(fieldErrors);
            // Si el único error es la contraseña, mensaje específico
            if (fieldErrors.password && Object.keys(fieldErrors).length === 1) {
                showToast(`Contraseña rechazada: ${fieldErrors.password}`, 'error');
            } else {
                showToast('Revisa los errores en el formulario.', 'error');
            }
        } else {
            const msg = data.error || data.detail || data.non_field_errors?.[0] || JSON.stringify(data).slice(0, 120);
            showToast(msg, 'error');
        }
    };

    // ── Multi-rol helpers ──

    const toggleRole = (role) => {
        setFormData(prev => {
            let newRoles = [...(prev.roles || [])];
            if (newRoles.includes(role)) {
                newRoles = newRoles.filter(r => r !== role);
            } else {
                newRoles.push(role);
            }
            // El rol principal es el primero de la lista (o el que cambie el select principal)
            const primaryRole = newRoles.includes(prev.role) ? prev.role : (newRoles[0] || 'STUDENT');
            return {
                ...prev,
                roles: newRoles,
                role: primaryRole,
                // Reset coordinator profiles si COORDINATOR se quita
                coordinator_profiles: newRoles.includes('COORDINATOR') ? prev.coordinator_profiles : [],
            };
        });
    };

    const addCoordinatorProfile = () => {
        setFormData(prev => ({
            ...prev,
            coordinator_profiles: [
                ...prev.coordinator_profiles,
                { coordinator_type: 'PRACTICAS', program: formData.program || (programs[0]?.id || '') }
            ]
        }));
    };

    const updateCoordinatorProfile = (index, field, value) => {
        setFormData(prev => {
            const updated = [...prev.coordinator_profiles];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, coordinator_profiles: updated };
        });
    };

    const removeCoordinatorProfile = (index) => {
        setFormData(prev => ({
            ...prev,
            coordinator_profiles: prev.coordinator_profiles.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});

        // Validación local de contraseña mínima
        if (!editingUser && formData.password.length < 8) {
            setFormErrors({ password: 'La contraseña debe tener al menos 8 caracteres.' });
            return;
        }

        // Validación local al editar: si pone contraseña, mínimo 8 chars
        if (editingUser && formData.password && formData.password.length < 8) {
            setFormErrors({ password: 'La contraseña debe tener al menos 8 caracteres.' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                faculty: formData.faculty || null,
                program: formData.program || null,
            };

            // CRÍTICO: al editar NUNCA enviar username para no sobreescribirlo
            // El username es el identificador de login y no debe cambiar desde este form
            if (editingUser) {
                delete payload.username;
            } else {
                // Solo al crear: construir username desde document_number o email
                payload.username = formData.document_number || formData.email || formData.username;
            }

            // Contraseña vacía al editar = no cambiar
            if (editingUser && !payload.password) {
                delete payload.password;
            }

            // Si el rol no incluye COORDINATOR, limpiar coordinator_profiles
            if (!(payload.roles || []).includes('COORDINATOR')) {
                payload.coordinator_profiles = [];
            }

            if (editingUser) {
                await api.patch(`/users/${editingUser.id}/`, payload);
                showToast('Usuario actualizado correctamente', 'success');
            } else {
                await api.post('/users/', payload);
                showToast('Usuario creado correctamente. Ya puede iniciar sesión.', 'success');
            }

            setIsModalOpen(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            console.error('Error al guardar usuario:', error.response?.data || error);
            handleApiErrors(error);
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

    // Estadísticas
    const stats = {
        total: users.length,
        students: users.filter(u => u.role === 'STUDENT').length,
        teachers: users.filter(u => u.role === 'TEACHER').length,
        coordinators: users.filter(u => (u.roles || []).includes('COORDINATOR')).length,
        admins: users.filter(u => u.role === 'ADMIN').length,
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
                    <p className="text-slate-500 mt-1">Administra estudiantes, docentes, coordinadores y administrativos.</p>
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-xl">
                        <User size={20} className="text-slate-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                        <p className="text-xs text-slate-500 font-medium">Total</p>
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
                    <div className="p-3 bg-amber-100 rounded-xl">
                        <Briefcase size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-amber-600">{stats.coordinators}</p>
                        <p className="text-xs text-slate-500 font-medium">Coordinadores</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-upn-100 rounded-xl">
                        <Shield size={20} className="text-upn-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-upn-600">{stats.admins}</p>
                        <p className="text-xs text-slate-500 font-medium">Admins</p>
                    </div>
                </div>
            </div>

            {/* Search + Filtros de rol */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, documento o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100"
                    />
                </div>

                <div className="flex gap-1.5 flex-wrap">
                    {[
                        { key: 'ALL', label: 'Todos', count: users.length, icon: <User size={13} />, style: 'bg-slate-700 text-white', plain: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
                        { key: 'STUDENT', label: 'Estudiantes', count: stats.students, icon: <GraduationCap size={13} />, style: 'bg-blue-600 text-white', plain: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                        { key: 'TEACHER', label: 'Docentes', count: stats.teachers, icon: <BookOpen size={13} />, style: 'bg-purple-600 text-white', plain: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                        { key: 'COORDINATOR', label: 'Coordinadores', count: stats.coordinators, icon: <Briefcase size={13} />, style: 'bg-amber-600 text-white', plain: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                        { key: 'ADMIN', label: 'Admins', count: stats.admins, icon: <Shield size={13} />, style: 'bg-upn-600 text-white', plain: 'bg-upn-50 text-upn-700 hover:bg-upn-100' },
                    ].map(({ key, label, count, icon, style, plain }) => (
                        <button
                            key={key}
                            onClick={() => handleRoleFilter(key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeRole === key ? style : plain
                                }`}
                        >
                            {icon}
                            {label}
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeRole === key ? 'bg-white/20' : 'bg-slate-200/60'
                                }`}>{count}</span>
                        </button>
                    ))}
                </div>

                {activeRole !== 'ALL' && (
                    <span className="text-xs text-slate-400">
                        Mostrando {filteredUsers.length} resultado(s)
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Documento</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol(es)</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Programa</th>
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
                                            <div className="flex flex-wrap gap-1">
                                                {(user.roles && user.roles.length > 0 ? user.roles : [user.role]).map(r => (
                                                    <span key={r} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${ROLE_STYLES[r] || 'bg-slate-100 text-slate-800'}`}>
                                                        {ROLE_ICONS[r]}
                                                        {ROLE_LABELS[r] || r}
                                                    </span>
                                                ))}
                                                {/* Badges de tipo de coordinación */}
                                                {user.coordinator_profiles?.map((cp, i) => (
                                                    <span key={`cp-${i}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                        {COORDINATOR_TYPE_LABELS[cp.coordinator_type] || cp.coordinator_type}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="text-sm text-slate-600">
                                                {user.program_name || <span className="text-slate-300">—</span>}
                                            </div>
                                            {user.faculty_name && (
                                                <div className="text-[11px] text-slate-400">{user.faculty_name}</div>
                                            )}
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
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* Modal Create/Edit User                                    */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">

                            {/* Nombres */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nombre *</label>
                                    <input
                                        required
                                        placeholder="Ej: Juan"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 ${formErrors.first_name ? 'border-red-400 bg-red-50' : 'border-slate-200'
                                            }`}
                                    />
                                    {formErrors.first_name && <p className="text-xs text-red-500 mt-1">{formErrors.first_name}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Apellido *</label>
                                    <input
                                        required
                                        placeholder="Ej: Pérez"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 ${formErrors.last_name ? 'border-red-400 bg-red-50' : 'border-slate-200'
                                            }`}
                                    />
                                    {formErrors.last_name && <p className="text-xs text-red-500 mt-1">{formErrors.last_name}</p>}
                                </div>
                            </div>

                            {/* Documento y Rol principal */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">N° Documento *</label>
                                    <input
                                        required
                                        placeholder="Ej: 1234567890"
                                        value={formData.document_number}
                                        onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                                        className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 ${formErrors.document_number ? 'border-red-400 bg-red-50' : 'border-slate-200'
                                            }`}
                                    />
                                    {formErrors.document_number && <p className="text-xs text-red-500 mt-1">{formErrors.document_number}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Rol principal</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => {
                                            const newRole = e.target.value;
                                            setFormData(prev => {
                                                let newRoles = [...(prev.roles || [])];
                                                // Quitar el rol anterior si ya no aplica
                                                if (prev.role !== newRole && !newRoles.includes(newRole)) {
                                                    newRoles.push(newRole);
                                                }
                                                return { ...prev, role: newRole, roles: newRoles };
                                            });
                                        }}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500"
                                    >
                                        <option value="STUDENT">Estudiante</option>
                                        <option value="TEACHER">Docente</option>
                                        <option value="PRACTICE_TEACHER">Profesor de Prácticas</option>
                                        <option value="COORDINATOR">Coordinador</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            {/* ── Multi-Rol: chips de roles adicionales ── */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Roles activos</label>
                                <div className="flex flex-wrap gap-2">
                                    {['STUDENT', 'TEACHER', 'PRACTICE_TEACHER', 'COORDINATOR', 'ADMIN'].map(r => {
                                        const active = (formData.roles || []).includes(r);
                                        return (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => toggleRole(r)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${active
                                                    ? `${ROLE_STYLES[r]} ring-2 ring-offset-1 ring-current/20`
                                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {ROLE_ICONS[r]}
                                                {ROLE_LABELS[r]}
                                                {active && <Check size={12} className="ml-0.5" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[11px] text-slate-400">Un usuario puede tener varios roles simultáneamente.</p>
                            </div>

                            {/* ── Facultad y Programa ── */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Building2 size={12} /> Facultad
                                    </label>
                                    <select
                                        value={formData.faculty}
                                        onChange={(e) => setFormData({ ...formData, faculty: e.target.value, program: '' })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500"
                                    >
                                        <option value="">— Seleccionar —</option>
                                        {faculties.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <BookOpen size={12} /> Programa
                                    </label>
                                    <select
                                        value={formData.program}
                                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500"
                                        disabled={!formData.faculty}
                                    >
                                        <option value="">— Seleccionar —</option>
                                        {programs.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    {!formData.faculty && <p className="text-[11px] text-slate-400">Selecciona primero una facultad</p>}
                                </div>
                            </div>

                            {/* ── Sección de Coordinación (solo si COORDINATOR está activo) ── */}
                            {(formData.roles || []).includes('COORDINATOR') && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                            <Briefcase size={16} /> Asignaciones de Coordinación
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={addCoordinatorProfile}
                                            className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Agregar
                                        </button>
                                    </div>

                                    {formData.coordinator_profiles.length === 0 && (
                                        <p className="text-xs text-amber-600 italic">
                                            Haz clic en "Agregar" para asignar un tipo de coordinación.
                                        </p>
                                    )}

                                    {formData.coordinator_profiles.map((cp, idx) => (
                                        <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded-lg border border-amber-200">
                                            <div className="flex-1 space-y-1.5">
                                                <label className="text-[11px] font-bold text-amber-700 uppercase">Tipo</label>
                                                <select
                                                    value={cp.coordinator_type}
                                                    onChange={(e) => updateCoordinatorProfile(idx, 'coordinator_type', e.target.value)}
                                                    className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                                >
                                                    {Object.entries(COORDINATOR_TYPE_LABELS).map(([k, v]) => (
                                                        <option key={k} value={k}>{v}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                <label className="text-[11px] font-bold text-amber-700 uppercase">Programa</label>
                                                <select
                                                    value={cp.program}
                                                    onChange={(e) => updateCoordinatorProfile(idx, 'program', e.target.value)}
                                                    className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                                                >
                                                    <option value="">— Seleccionar —</option>
                                                    {allPrograms.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCoordinatorProfile(idx)}
                                                className="mt-6 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Correo */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Correo Institucional</label>
                                <input
                                    type="email"
                                    placeholder="usuario@upn.edu.co"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 ${formErrors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'
                                        }`}
                                />
                                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">
                                    {editingUser ? 'Nueva Contraseña (vacío = sin cambio)' : 'Contraseña *'}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required={!editingUser}
                                        minLength={!editingUser ? 8 : undefined}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`w-full px-3 py-2 pr-10 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 ${formErrors.password ? 'border-red-400 bg-red-50' : 'border-slate-200'
                                            }`}
                                        placeholder={editingUser ? '••••••••' : 'Mínimo 8 caracteres'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                                {!editingUser && !formErrors.password && (
                                    <p className="text-xs text-slate-400">El usuario iniciará sesión con su N° de documento y esta contraseña.</p>
                                )}
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
