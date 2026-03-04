/* eslint-disable */
/**
 * Tools.jsx — Orquestador de la gestión de Facultades y Programas.
 *
 * Componentes:
 *   TabFacultades → components/tools/TabFacultades.jsx
 *   TabProgramas  → components/tools/TabProgramas.jsx
 *   Toast, DeleteModal, CrudModal → components/tools/toolsUi.jsx
 */
import React, { useState, useEffect } from 'react';
import { Loader2, Building2, BookOpen, Wrench } from 'lucide-react';
import api from '../services/api';
import { Toast, DeleteModal, CrudModal } from '../components/tools/toolsUi';
import TabFacultades from '../components/tools/TabFacultades';
import TabProgramas from '../components/tools/TabProgramas';

export default function ToolsPage() {
    const [activeTab, setActiveTab] = useState('faculties');
    const [faculties, setFaculties] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');    // 'faculty' | 'program'
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '', faculty: '' });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [facRes, progRes] = await Promise.all([api.get('/users/faculties/'), api.get('/users/programs/')]);
            setFaculties(facRes.data);
            setPrograms(progRes.data);
        } catch { showToast('Error al cargar datos', 'error'); }
        finally { setLoading(false); }
    };

    // ── Abrir modal ──────────────────────────────────────
    const openModal = (type, item = null) => {
        setModalType(type);
        setEditingItem(item);
        if (type === 'faculty') {
            setFormData(item ? { name: item.name, code: item.code } : { name: '', code: '' });
        } else {
            setFormData(item
                ? { name: item.name, code: item.code, faculty: item.faculty || '' }
                : { name: '', code: '', faculty: faculties[0]?.id || '' }
            );
        }
        setModalOpen(true);
    };

    // ── Guardar ──────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.name.trim()) return;
        if (modalType === 'program' && !formData.faculty) return;
        setSaving(true);
        const isFaculty = modalType === 'faculty';
        const endpoint = isFaculty ? '/users/faculties/' : '/users/programs/';
        try {
            if (editingItem) {
                await api.put(`${endpoint}${editingItem.id}/`, formData);
                showToast(`${isFaculty ? 'Facultad' : 'Programa'} actualizado`);
            } else {
                await api.post(endpoint, formData);
                showToast(`${isFaculty ? 'Facultad' : 'Programa'} creado`);
            }
            setModalOpen(false);
            fetchAll();
        } catch (e) {
            showToast(e.response?.data?.name?.[0] || e.response?.data?.code?.[0] || 'Error al guardar', 'error');
        } finally { setSaving(false); }
    };

    // ── Eliminar ─────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteConfirm) return;
        const isFaculty = deleteConfirm._type === 'faculty';
        const endpoint = isFaculty ? '/users/faculties/' : '/users/programs/';
        try {
            await api.delete(`${endpoint}${deleteConfirm.id}/`);
            showToast(`${isFaculty ? 'Facultad' : 'Programa'} eliminado`);
            setDeleteConfirm(null);
            fetchAll();
        } catch {
            showToast(isFaculty
                ? 'No se puede eliminar — tiene programas o usuarios asociados'
                : 'No se puede eliminar — tiene usuarios o coordinadores asociados', 'error');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-upn-600" />
        </div>
    );

    const TABS = [
        { id: 'faculties', label: 'Facultades', icon: Building2, count: faculties.length },
        { id: 'programs', label: 'Programas', icon: BookOpen, count: programs.length },
    ];

    return (
        <div className="space-y-6">
            <Toast toast={toast} onClose={() => setToast(null)} />

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
                {TABS.map(({ id, label, icon: Icon, count }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all
                            ${activeTab === id ? 'bg-upn-600 text-white shadow-lg shadow-upn-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                        <Icon size={18} />
                        {label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === id ? 'bg-white/20' : 'bg-slate-100'}`}>{count}</span>
                    </button>
                ))}
            </div>

            {/* Contenido */}
            {activeTab === 'faculties' && (
                <TabFacultades
                    faculties={faculties}
                    programs={programs}
                    onNew={() => openModal('faculty')}
                    onEdit={f => openModal('faculty', f)}
                    onDelete={setDeleteConfirm}
                />
            )}
            {activeTab === 'programs' && (
                <TabProgramas
                    programs={programs}
                    faculties={faculties}
                    onNew={() => openModal('program')}
                    onEdit={p => openModal('program', p)}
                    onDelete={setDeleteConfirm}
                />
            )}

            {/* Modales */}
            <CrudModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                type={modalType}
                editing={editingItem}
                formData={formData}
                setFormData={setFormData}
                faculties={faculties}
                saving={saving}
                onSave={handleSave}
            />
            <DeleteModal
                item={deleteConfirm}
                onCancel={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
