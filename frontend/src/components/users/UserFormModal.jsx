// components/users/UserFormModal.jsx
// Modal de creación y edición de usuarios.
// Maneja su propio estado de formulario, validaciones y envío al backend.

import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2, Check, Plus, Trash2, Briefcase, Building2, BookOpen } from 'lucide-react';
import api from '../../services/api';
import { ROLE_LABELS, ROLE_STYLES, ROLE_ICONS, COORDINATOR_TYPE_LABELS } from '../../constants/userRoles';

const INITIAL_FORM = {
    username: '', password: '', first_name: '', last_name: '',
    email: '', role: 'STUDENT', roles: [], document_number: '',
    faculty: '', program: '', coordinator_profiles: [],
};

export default function UserFormModal({ editingUser, onClose, onSuccess, faculties, allPrograms }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    // Programas filtrados por la facultad seleccionada en el form
    const [programs, setPrograms] = useState(allPrograms);

    // Cargar datos del usuario si estamos editando
    useEffect(() => {
        if (editingUser) {
            setFormData({
                username: editingUser.username || editingUser.email,
                password: '',
                first_name: editingUser.first_name || '',
                last_name: editingUser.last_name || '',
                email: editingUser.email || '',
                role: editingUser.role || 'STUDENT',
                roles: editingUser.roles || [editingUser.role || 'STUDENT'],
                document_number: editingUser.document_number || '',
                faculty: editingUser.faculty || '',
                program: editingUser.program || '',
                coordinator_profiles: (editingUser.coordinator_profiles || []).map(cp => ({
                    coordinator_type: cp.coordinator_type,
                    program: cp.program,
                })),
            });
        } else {
            setFormData(INITIAL_FORM);
        }
    }, [editingUser]);

    // Filtrar programas cuando cambia la facultad seleccionada
    useEffect(() => {
        if (formData.faculty) {
            setPrograms(allPrograms.filter(p => String(p.faculty) === String(formData.faculty)));
        } else {
            setPrograms(allPrograms);
        }
    }, [formData.faculty, allPrograms]);

    // ── Helpers de multi-rol ──────────────────────────────────────────────

    const toggleRole = (role) => {
        setFormData(prev => {
            let newRoles = [...(prev.roles || [])];
            if (newRoles.includes(role)) {
                newRoles = newRoles.filter(r => r !== role);
            } else {
                newRoles.push(role);
            }
            const primaryRole = newRoles.includes(prev.role) ? prev.role : (newRoles[0] || 'STUDENT');
            return {
                ...prev, roles: newRoles, role: primaryRole,
                coordinator_profiles: newRoles.includes('COORDINATOR') ? prev.coordinator_profiles : [],
            };
        });
    };

    const addCoordinatorProfile = () => {
        setFormData(prev => ({
            ...prev,
            coordinator_profiles: [
                ...prev.coordinator_profiles,
                { coordinator_type: 'PRACTICAS', program: formData.program || (programs[0]?.id || '') },
            ],
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

    // ── Manejo de errores del backend ─────────────────────────────────────

    const handleApiErrors = (error) => {
        const data = error.response?.data;
        if (!data) { onSuccess?.('error', 'Error de red. Intenta de nuevo.'); return; }

        const knownFields = ['username', 'password', 'first_name', 'last_name', 'email', 'document_number', 'role', 'faculty', 'program'];
        const fieldErrors = {};
        let hasFieldErrors = false;

        for (const key of knownFields) {
            if (data[key]) {
                fieldErrors[key] = Array.isArray(data[key]) ? data[key].join(' ') : String(data[key]);
                hasFieldErrors = true;
            }
        }

        if (hasFieldErrors) {
            setFormErrors(fieldErrors);
            const msg = fieldErrors.password && Object.keys(fieldErrors).length === 1
                ? `Contraseña rechazada: ${fieldErrors.password}`
                : 'Revisa los errores en el formulario.';
            onSuccess?.('error', msg);
        } else {
            const msg = data.error || data.detail || data.non_field_errors?.[0] || JSON.stringify(data).slice(0, 120);
            onSuccess?.('error', msg);
        }
    };

    // ── Submit ────────────────────────────────────────────────────────────

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});

        // Validaciones locales de contraseña
        if (!editingUser && formData.password.length < 8) {
            setFormErrors({ password: 'La contraseña debe tener al menos 8 caracteres.' });
            return;
        }
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

            if (editingUser) {
                delete payload.username; // NUNCA sobreescribir el username al editar
            } else {
                payload.username = formData.document_number || formData.email || formData.username;
            }

            if (editingUser && !payload.password) delete payload.password;
            if (!(payload.roles || []).includes('COORDINATOR')) payload.coordinator_profiles = [];

            if (editingUser) {
                await api.patch(`/users/${editingUser.id}/`, payload);
                onSuccess?.('success', 'Usuario actualizado correctamente');
            } else {
                await api.post('/users/', payload);
                onSuccess?.('success', 'Usuario creado correctamente. Ya puede iniciar sesión.');
            }
            onClose();
        } catch (error) {
            console.error('Error al guardar usuario:', error.response?.data || error);
            handleApiErrors(error);
        } finally {
            setSaving(false);
        }
    };

    // ── Helper de campo ───────────────────────────────────────────────────
    const field = (label, content, key) => (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
            {content}
            {formErrors[key] && <p className="text-xs text-red-500 mt-1">{formErrors[key]}</p>}
        </div>
    );

    const inputClass = (key) =>
        `w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 ${formErrors[key] ? 'border-red-400 bg-red-50' : 'border-slate-200'}`;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Encabezado */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                    <h3 className="text-lg font-bold text-slate-800">
                        {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Nombres */}
                    <div className="grid grid-cols-2 gap-4">
                        {field('Nombre *',
                            <input required placeholder="Ej: Juan" value={formData.first_name}
                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                className={inputClass('first_name')} />, 'first_name')}
                        {field('Apellido *',
                            <input required placeholder="Ej: Pérez" value={formData.last_name}
                                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                className={inputClass('last_name')} />, 'last_name')}
                    </div>

                    {/* Documento + Rol principal */}
                    <div className="grid grid-cols-2 gap-4">
                        {field('N° Documento *',
                            <input required placeholder="Ej: 1234567890" value={formData.document_number}
                                onChange={e => setFormData({ ...formData, document_number: e.target.value })}
                                className={inputClass('document_number')} />, 'document_number')}
                        {field('Rol principal',
                            <select value={formData.role}
                                onChange={e => {
                                    const newRole = e.target.value;
                                    setFormData(prev => {
                                        let newRoles = [...(prev.roles || [])];
                                        if (!newRoles.includes(newRole)) newRoles.push(newRole);
                                        return { ...prev, role: newRole, roles: newRoles };
                                    });
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20">
                                <option value="STUDENT">Estudiante</option>
                                <option value="TEACHER">Docente</option>
                                <option value="PRACTICE_TEACHER">Profesor de Prácticas</option>
                                <option value="COORDINATOR">Coordinador</option>
                                <option value="ADMIN">Administrador</option>
                            </select>, 'role')}
                    </div>

                    {/* Multi-rol chips */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Roles activos</label>
                        <div className="flex flex-wrap gap-2">
                            {['STUDENT', 'TEACHER', 'PRACTICE_TEACHER', 'COORDINATOR', 'ADMIN'].map(r => {
                                const active = (formData.roles || []).includes(r);
                                return (
                                    <button key={r} type="button" onClick={() => toggleRole(r)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${active ? `${ROLE_STYLES[r]} ring-2 ring-offset-1 ring-current/20` : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}>
                                        {ROLE_ICONS[r]} {ROLE_LABELS[r]} {active && <Check size={12} className="ml-0.5" />}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-slate-400">Un usuario puede tener varios roles simultáneamente.</p>
                    </div>

                    {/* Facultad + Programa */}
                    <div className="grid grid-cols-2 gap-4">
                        {field(<><Building2 size={12} className="inline mr-1" />Facultad</>,
                            <select value={formData.faculty}
                                onChange={e => setFormData({ ...formData, faculty: e.target.value, program: '' })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20">
                                <option value="">— Seleccionar —</option>
                                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>, 'faculty')}
                        {field(<><BookOpen size={12} className="inline mr-1" />Programa</>,
                            <>
                                <select value={formData.program} disabled={!formData.faculty}
                                    onChange={e => setFormData({ ...formData, program: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 disabled:opacity-50">
                                    <option value="">— Seleccionar —</option>
                                    {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                {!formData.faculty && <p className="text-[11px] text-slate-400 mt-1">Selecciona primero una facultad</p>}
                            </>, 'program')}
                    </div>

                    {/* Sección Coordinación */}
                    {(formData.roles || []).includes('COORDINATOR') && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                    <Briefcase size={16} /> Asignaciones de Coordinación
                                </h4>
                                <button type="button" onClick={addCoordinatorProfile}
                                    className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                    <Plus size={14} /> Agregar
                                </button>
                            </div>
                            {formData.coordinator_profiles.length === 0 && (
                                <p className="text-xs text-amber-600 italic">Haz clic en "Agregar" para asignar un tipo de coordinación.</p>
                            )}
                            {formData.coordinator_profiles.map((cp, idx) => (
                                <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded-lg border border-amber-200">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[11px] font-bold text-amber-700 uppercase">Tipo</label>
                                        <select value={cp.coordinator_type} onChange={e => updateCoordinatorProfile(idx, 'coordinator_type', e.target.value)}
                                            className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                                            {Object.entries(COORDINATOR_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[11px] font-bold text-amber-700 uppercase">Programa</label>
                                        <select value={cp.program} onChange={e => updateCoordinatorProfile(idx, 'program', e.target.value)}
                                            className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                                            <option value="">— Seleccionar —</option>
                                            {allPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <button type="button" onClick={() => removeCoordinatorProfile(idx)}
                                        className="mt-6 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Correo */}
                    {field('Correo Institucional',
                        <input type="email" placeholder="usuario@upn.edu.co" value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className={inputClass('email')} />, 'email')}

                    {/* Contraseña */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                            {editingUser ? 'Nueva Contraseña (vacío = sin cambio)' : 'Contraseña *'}
                        </label>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} required={!editingUser}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className={`${inputClass('password')} pr-10`}
                                placeholder={editingUser ? '••••••••' : 'Mínimo 8 caracteres'} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                        {!editingUser && !formErrors.password && (
                            <p className="text-xs text-slate-400">El usuario iniciará sesión con su N° de documento y esta contraseña.</p>
                        )}
                    </div>

                    {/* Acciones */}
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 px-4 py-2.5 bg-upn-600 text-white rounded-xl text-sm font-bold hover:bg-upn-700 transition-colors shadow-lg shadow-upn-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving && <Loader2 size={16} className="animate-spin" />}
                            {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
