/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Loader2, AlertTriangle, Building2, BookOpen, Wrench, ChevronRight } from 'lucide-react';
import api from '../services/api';

export default function ToolsPage() {
    const [activeTab, setActiveTab] = useState('faculties');
    const [faculties, setFaculties] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(''); // 'faculty' | 'program'
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Form state
    const [formData, setFormData] = useState({ name: '', code: '', faculty: '' });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [facRes, progRes] = await Promise.all([
                api.get('/users/faculties/'),
                api.get('/users/programs/'),
            ]);
            setFaculties(facRes.data);
            setPrograms(progRes.data);
        } catch (e) {
            showToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── CRUD Facultades ──

    const openFacultyModal = (item = null) => {
        setModalType('faculty');
        setEditingItem(item);
        setFormData(item ? { name: item.name, code: item.code } : { name: '', code: '' });
        setModalOpen(true);
    };

    const saveFaculty = async () => {
        if (!formData.name.trim()) return;
        setSaving(true);
        try {
            if (editingItem) {
                await api.put(`/users/faculties/${editingItem.id}/`, formData);
                showToast('Facultad actualizada');
            } else {
                await api.post('/users/faculties/', formData);
                showToast('Facultad creada');
            }
            setModalOpen(false);
            fetchAll();
        } catch (e) {
            const msg = e.response?.data?.name?.[0] || e.response?.data?.code?.[0] || 'Error al guardar';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteFaculty = async (id) => {
        try {
            await api.delete(`/users/faculties/${id}/`);
            showToast('Facultad eliminada');
            setDeleteConfirm(null);
            fetchAll();
        } catch (e) {
            showToast('No se puede eliminar — tiene programas o usuarios asociados', 'error');
        }
    };

    // ── CRUD Programas ──

    const openProgramModal = (item = null) => {
        setModalType('program');
        setEditingItem(item);
        setFormData(item
            ? { name: item.name, code: item.code, faculty: item.faculty || '' }
            : { name: '', code: '', faculty: faculties[0]?.id || '' }
        );
        setModalOpen(true);
    };

    const saveProgram = async () => {
        if (!formData.name.trim() || !formData.faculty) return;
        setSaving(true);
        try {
            if (editingItem) {
                await api.put(`/users/programs/${editingItem.id}/`, formData);
                showToast('Programa actualizado');
            } else {
                await api.post('/users/programs/', formData);
                showToast('Programa creado');
            }
            setModalOpen(false);
            fetchAll();
        } catch (e) {
            const msg = e.response?.data?.name?.[0] || e.response?.data?.code?.[0] || 'Error al guardar';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteProgram = async (id) => {
        try {
            await api.delete(`/users/programs/${id}/`);
            showToast('Programa eliminado');
            setDeleteConfirm(null);
            fetchAll();
        } catch (e) {
            showToast('No se puede eliminar — tiene usuarios o coordinadores asociados', 'error');
        }
    };

    // ── Handlers genéricos ──

    const handleSave = () => {
        if (modalType === 'faculty') saveFaculty();
        else saveProgram();
    };

    const handleDelete = () => {
        if (!deleteConfirm) return;
        if (deleteConfirm._type === 'faculty') deleteFaculty(deleteConfirm.id);
        else deleteProgram(deleteConfirm.id);
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
                        <Wrench className="text-upn-600" /> Herramientas
                    </h2>
                    <p className="text-slate-500 mt-1">Gestiona facultades y programas académicos del sistema.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('faculties')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'faculties'
                        ? 'bg-upn-600 text-white shadow-lg shadow-upn-600/20'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    <Building2 size={18} />
                    Facultades
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'faculties' ? 'bg-white/20' : 'bg-slate-100'}`}>
                        {faculties.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('programs')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'programs'
                        ? 'bg-upn-600 text-white shadow-lg shadow-upn-600/20'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    <BookOpen size={18} />
                    Programas
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'programs' ? 'bg-white/20' : 'bg-slate-100'}`}>
                        {programs.length}
                    </span>
                </button>
            </div>

            {/* ═══════════════════════════ FACULTADES ═══════════════════════════ */}
            {activeTab === 'faculties' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Building2 size={20} className="text-upn-600" /> Facultades
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">Las facultades agrupan uno o más programas académicos.</p>
                        </div>
                        <button
                            onClick={() => openFacultyModal()}
                            className="bg-upn-600 hover:bg-upn-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-upn-600/20"
                        >
                            <Plus size={16} /> Nueva Facultad
                        </button>
                    </div>

                    {faculties.length === 0 ? (
                        <div className="p-12 text-center">
                            <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium">No hay facultades creadas aún.</p>
                            <p className="text-slate-300 text-sm mt-1">Crea la primera para empezar a organizar los programas.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {faculties.map(f => {
                                const progCount = programs.filter(p => p.faculty === f.id).length;
                                return (
                                    <div key={f.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-upn-50 flex items-center justify-center">
                                                <Building2 size={22} className="text-upn-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{f.name}</h4>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{f.code}</span>
                                                    <span className="text-xs text-slate-400">
                                                        {progCount} programa{progCount !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openFacultyModal(f)}
                                                className="p-2 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ ...f, _type: 'faculty' })}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════ PROGRAMAS ═══════════════════════════ */}
            {activeTab === 'programs' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <BookOpen size={20} className="text-upn-600" /> Programas Académicos
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">Los programas se vinculan a una facultad y se asignan a usuarios.</p>
                        </div>
                        <button
                            onClick={() => openProgramModal()}
                            className="bg-upn-600 hover:bg-upn-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-upn-600/20"
                            disabled={faculties.length === 0}
                            title={faculties.length === 0 ? 'Crea una facultad primero' : ''}
                        >
                            <Plus size={16} /> Nuevo Programa
                        </button>
                    </div>

                    {faculties.length === 0 ? (
                        <div className="p-12 text-center">
                            <AlertTriangle size={48} className="mx-auto text-amber-300 mb-4" />
                            <p className="text-slate-400 font-medium">Primero debes crear al menos una Facultad.</p>
                        </div>
                    ) : programs.length === 0 ? (
                        <div className="p-12 text-center">
                            <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium">No hay programas creados aún.</p>
                            <p className="text-slate-300 text-sm mt-1">Los programas se vinculan a una facultad.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {programs.map(p => (
                                <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <BookOpen size={22} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{p.name}</h4>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{p.code}</span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Building2 size={11} /> {p.faculty_name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openProgramModal(p)}
                                            className="p-2 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm({ ...p, _type: 'program' })}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════ Modal Crear/Editar ═══════════════════ */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingItem ? 'Editar' : 'Crear'} {modalType === 'faculty' ? 'Facultad' : 'Programa'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Nombre *</label>
                                <input
                                    autoFocus
                                    placeholder={modalType === 'faculty' ? 'Ej: Facultad de Educación Física' : 'Ej: Licenciatura en Recreación'}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Código</label>
                                <input
                                    placeholder={modalType === 'faculty' ? 'Ej: FEF' : 'Ej: LR'}
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500"
                                    maxLength={10}
                                />
                                <p className="text-[11px] text-slate-400">Abreviatura corta para identificar rápidamente.</p>
                            </div>

                            {modalType === 'program' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Building2 size={12} /> Facultad *
                                    </label>
                                    <select
                                        value={formData.faculty}
                                        onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500"
                                    >
                                        <option value="">— Seleccionar —</option>
                                        {faculties.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !formData.name.trim()}
                                    className="flex-1 px-4 py-2.5 bg-upn-600 text-white rounded-xl text-sm font-bold hover:bg-upn-700 transition-colors shadow-lg shadow-upn-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {editingItem ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ Modal Confirmar Eliminación ═══════ */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">
                                ¿Eliminar {deleteConfirm._type === 'faculty' ? 'Facultad' : 'Programa'}?
                            </h3>
                            <p className="text-slate-500 mb-1">
                                <strong>{deleteConfirm.name}</strong>
                            </p>
                            <p className="text-xs text-slate-400 mb-6">
                                {deleteConfirm._type === 'faculty'
                                    ? 'Se eliminarán todos los programas asociados.'
                                    : 'Los usuarios vinculados perderán esta asignación.'}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
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
