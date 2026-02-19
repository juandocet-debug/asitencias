/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar, Users, X, Save, Eye, BookOpen, Filter, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';

const COLOR_PALETTE = {
    blue: { gradient: 'linear-gradient(135deg, #3b82f6, #4f46e5)', lightBg: '#eff6ff', color: '#1d4ed8', label: 'Azul' },
    violet: { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', lightBg: '#f5f3ff', color: '#6d28d9', label: 'Violeta' },
    emerald: { gradient: 'linear-gradient(135deg, #10b981, #0d9488)', lightBg: '#ecfdf5', color: '#047857', label: 'Esmeralda' },
    amber: { gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)', lightBg: '#fffbeb', color: '#b45309', label: 'Ámbar' },
    rose: { gradient: 'linear-gradient(135deg, #f43f5e, #ec4899)', lightBg: '#fff1f2', color: '#be123c', label: 'Rosa' },
    cyan: { gradient: 'linear-gradient(135deg, #06b6d4, #0284c7)', lightBg: '#ecfeff', color: '#0e7490', label: 'Cian' },
};

export default function Classes() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Form State
    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        name: '',
        color: 'blue',
        year: currentYear,
        period: 1,
        start_date: today,
        end_date: today
    });

    const [editingId, setEditingId] = useState(null);

    // Filter State
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

    const isAdmin = user?.role === 'ADMIN';
    const isTeacher = user?.role === 'TEACHER';
    const canManage = isAdmin || isTeacher;

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/academic/courses/');
            setCourses(response.data);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/academic/courses/${editingId}/`, formData);
            } else {
                await api.post('/academic/courses/', formData);
            }
            setIsModalOpen(false);
            resetForm();
            fetchCourses();
        } catch (error) {
            console.error("Error saving course:", error);
            alert("Error al guardar la clase");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            color: 'blue',
            year: currentYear,
            period: 1,
            start_date: today,
            end_date: today
        });
        setEditingId(null);
    }

    const handleEdit = (course) => {
        setFormData({
            name: course.name,
            color: course.color || 'blue',
            year: course.year,
            period: course.period,
            start_date: course.start_date,
            end_date: course.end_date
        });
        setEditingId(course.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/academic/courses/${id}/`);
            fetchCourses();
            setDeleteModalOpen(false);
        } catch (error) {
            console.error("Error deleting course:", error);
            alert("Error al eliminar la clase");
        }
    };

    const confirmDelete = (id) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const openNewModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    // Filtrado de cursos
    const filteredCourses = courses.filter(course => {
        // Convertir a string para comparación segura
        return selectedYear.toString() === 'Todos' || course.year.toString() === selectedYear.toString();
    });

    // Generar lista de años únicos para el filtro
    const availableYears = [...new Set(courses.map(c => c.year))].sort((a, b) => b - a);
    if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear);

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="text-upn-600" /> Gestión de Clases
                    </h2>
                    <p className="text-slate-500">Administra tus materias y periodos académicos</p>
                </div>

                <div className="flex gap-3">
                    {/* Filtro de Año Custom */}
                    <div className="relative">
                        <button
                            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm hover:border-upn-500 hover:shadow-md transition-all group min-w-[140px] justify-between"
                        >
                            <div className="flex items-center gap-2 text-slate-600 group-hover:text-upn-700">
                                <Filter size={18} />
                                <span className="text-sm font-medium">Año:</span>
                                <span className="text-sm font-bold text-slate-800">{selectedYear}</span>
                            </div>
                            <MoreVertical size={16} className="text-slate-400 rotate-90" />
                        </button>

                        {isYearDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsYearDropdownOpen(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-full min-w-[140px] bg-white rounded-xl shadow-xl border border-slate-100 z-20 max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                                    <button
                                        onClick={() => { setSelectedYear('Todos'); setIsYearDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-upn-50 transition-colors ${selectedYear === 'Todos' ? 'text-upn-700 font-bold bg-upn-50' : 'text-slate-600'}`}
                                    >
                                        Todos
                                    </button>
                                    {availableYears.map(year => (
                                        <button
                                            key={year}
                                            onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-upn-50 transition-colors ${selectedYear === year ? 'text-upn-700 font-bold bg-upn-50' : 'text-slate-600'}`}
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {canManage && (
                        <button
                            onClick={openNewModal}
                            className="bg-upn-600 hover:bg-upn-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-upn-600/20 transition-all active:scale-95"
                        >
                            <Plus size={20} /> Nueva Clase
                        </button>
                    )}
                </div>
            </div>

            {/* Grid de Clases */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {filteredCourses.map((course) => {
                    const studentCount = course.students ? course.students.length : 0;
                    const p = COLOR_PALETTE[course.color] || COLOR_PALETTE.blue;

                    return (
                        <div key={course.id}
                            className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1 group overflow-hidden cursor-pointer"
                            onClick={() => navigate(`/classes/${course.id}`)}
                        >
                            {/* Card Header */}
                            <div className="relative px-5 py-5 overflow-hidden" style={{ background: p.gradient }}>
                                {/* Decorative */}
                                <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8" style={{ background: 'rgba(255,255,255,0.12)' }}></div>
                                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full translate-y-6 -translate-x-4" style={{ background: 'rgba(255,255,255,0.08)' }}></div>

                                <div className="relative flex items-start justify-between">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl border shadow-lg"
                                            style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
                                            {course.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-base leading-tight drop-shadow-sm" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {course.name}
                                            </h3>
                                            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{course.year}-{course.period}</span>
                                        </div>
                                    </div>

                                    {canManage && (
                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(course); }}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors"
                                                style={{ background: 'rgba(255,255,255,0.2)' }}
                                                title="Editar"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); confirmDelete(course.id); }}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors hover:bg-red-500/80"
                                                style={{ background: 'rgba(255,255,255,0.2)' }}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="px-5 py-4 space-y-3.5">
                                {/* Code chip */}
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                                        style={{ background: p.lightBg, color: p.color }}>
                                        <span style={{ opacity: 0.6 }}>#</span> {course.code}
                                    </span>
                                    <span className="text-slate-400 font-medium" style={{ fontSize: '11px' }}>
                                        {course.start_date && new Date(course.start_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                                        {course.end_date && ` — ${new Date(course.end_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}`}
                                    </span>
                                </div>

                                {/* Students count */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: p.lightBg }}>
                                            <Users size={15} style={{ color: p.color }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{studentCount}</p>
                                            <p className="text-slate-400" style={{ fontSize: '10px', marginTop: '-2px' }}>Estudiantes</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 group-hover:shadow-md transition-shadow"
                                        style={{ background: p.lightBg, color: p.color }}>
                                        <Eye size={13} /> Ver
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {
                !loading && filteredCourses.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 col-span-full">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Filter size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No se encontraron clases</h3>
                        <p className="text-slate-500 mb-6">No hay clases registradas para el año seleccionado.</p>
                    </div>
                )
            }

            {/* Modal Formulario */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                        <div className="bg-white rounded-2xl w-full max-w-md relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-800">
                                    {editingId ? 'Editar Clase' : 'Nueva Clase'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">Nombre de la Clase</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 transition-all font-medium"
                                        placeholder="Ej. Taller de Recreación I"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Año</label>
                                        <input
                                            type="number"
                                            min="2026"
                                            max="2060"
                                            required
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Periodo</label>
                                        <select
                                            value={formData.period}
                                            onChange={(e) => setFormData({ ...formData, period: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 transition-all font-medium appearance-none cursor-pointer"
                                        >
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Fecha Inicio</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Fecha Fin</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Color Picker */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Color de la Clase</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.entries(COLOR_PALETTE).map(([key, val]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color: key })}
                                                className="relative w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                                                style={{
                                                    background: val.gradient,
                                                    boxShadow: formData.color === key ? `0 0 0 3px white, 0 0 0 5px ${val.color}` : 'none',
                                                    transform: formData.color === key ? 'scale(1.1)' : 'scale(1)',
                                                }}
                                                title={val.label}
                                            >
                                                {formData.color === key && (
                                                    <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-upn-600 hover:bg-upn-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-upn-600/20 flex items-center gap-2 transform active:scale-95 transition-all"
                                    >
                                        <Save size={18} /> {editingId ? 'Guardar Cambios' : 'Crear Clase'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Modal de Confirmación */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={() => handleDelete(itemToDelete)}
                title="Eliminar Clase"
                message="¿Estás seguro de eliminar esta clase? Esta acción también borrará todas las asistencias asociadas."
                confirmText="Eliminar"
                isDestructive={true}
            />
        </div >
    );
}
