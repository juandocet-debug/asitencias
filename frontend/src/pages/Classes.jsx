/* eslint-disable */
/**
 * Classes.jsx — Orquestador de la grilla de cursos.
 *
 * Componentes:
 *   CourseCard       → components/classes/CourseCard.jsx
 *   CourseFormModal  → components/classes/CourseFormModal.jsx
 *   ConfirmationModal → components/ConfirmationModal
 */
import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Filter, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';
import CourseCard from '../components/classes/CourseCard';
import CourseFormModal from '../components/classes/CourseFormModal';

const currentYear = new Date().getFullYear();
const today = new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
    name: '', color: 'blue', year: currentYear,
    period: 1, start_date: today, end_date: today,
};

export default function Classes() {
    const { activeRole } = useUser();
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

    const isAdmin = activeRole === 'ADMIN';
    const isTeacher = activeRole === 'TEACHER';
    const canManage = isAdmin || isTeacher;

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        try {
            const { data } = await api.get('/academic/courses/');
            setCourses(data);
        } catch (e) { console.error('Error fetching courses:', e); }
        finally { setLoading(false); }
    };

    const resetForm = () => { setFormData(EMPTY_FORM); setEditingId(null); };

    const openNewModal = () => { resetForm(); setIsModalOpen(true); };

    const handleEdit = (course) => {
        setFormData({ name: course.name, color: course.color || 'blue', year: course.year, period: course.period, start_date: course.start_date, end_date: course.end_date });
        setEditingId(course.id);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) { await api.put(`/academic/courses/${editingId}/`, formData); }
            else { await api.post('/academic/courses/', formData); }
            setIsModalOpen(false); resetForm(); fetchCourses();
        } catch (e) { console.error('Error saving course:', e); alert('Error al guardar la clase'); }
    };

    const handleDelete = async (id) => {
        try { await api.delete(`/academic/courses/${id}/`); fetchCourses(); setDeleteModalOpen(false); }
        catch (e) { console.error('Error deleting course:', e); alert('Error al eliminar la clase'); }
    };

    const confirmDelete = (id) => { setItemToDelete(id); setDeleteModalOpen(true); };

    // Cálculos de filtrado
    const availableYears = [...new Set(courses.map(c => c.year))].sort((a, b) => b - a);
    if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear);
    const filteredCourses = courses.filter(c =>
        selectedYear.toString() === 'Todos' || c.year.toString() === selectedYear.toString()
    );

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="text-upn-600" /> Gestión de Clases
                    </h2>
                    <p className="text-slate-500">Administra tus materias y periodos académicos</p>
                </div>

                <div className="flex gap-3">
                    {/* Filtro de año */}
                    <div className="relative">
                        <button onClick={() => setYearDropdownOpen(v => !v)}
                            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm hover:border-upn-500 hover:shadow-md transition-all group min-w-[140px] justify-between">
                            <div className="flex items-center gap-2 text-slate-600 group-hover:text-upn-700">
                                <Filter size={18} />
                                <span className="text-sm font-medium">Año:</span>
                                <span className="text-sm font-bold text-slate-800">{selectedYear}</span>
                            </div>
                            <MoreVertical size={16} className="text-slate-400 rotate-90" />
                        </button>
                        {yearDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setYearDropdownOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-full min-w-[140px] bg-white rounded-xl shadow-xl border border-slate-100 z-20 max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-200">
                                    <button onClick={() => { setSelectedYear('Todos'); setYearDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-upn-50 transition-colors ${selectedYear === 'Todos' ? 'text-upn-700 font-bold bg-upn-50' : 'text-slate-600'}`}>
                                        Todos
                                    </button>
                                    {availableYears.map(year => (
                                        <button key={year} onClick={() => { setSelectedYear(year); setYearDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-upn-50 transition-colors ${selectedYear === year ? 'text-upn-700 font-bold bg-upn-50' : 'text-slate-600'}`}>
                                            {year}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {canManage && (
                        <button onClick={openNewModal}
                            className="bg-upn-600 hover:bg-upn-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-upn-600/20 transition-all active:scale-95">
                            <Plus size={20} /> Nueva Clase
                        </button>
                    )}
                </div>
            </div>

            {/* Grid de cursos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {filteredCourses.map(course => (
                    <CourseCard
                        key={course.id}
                        course={course}
                        canManage={canManage}
                        onClick={() => navigate(`/classes/${course.id}`)}
                        onEdit={handleEdit}
                        onDelete={confirmDelete}
                    />
                ))}
            </div>

            {/* Estado vacío */}
            {!loading && filteredCourses.length === 0 && (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Filter size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No se encontraron clases</h3>
                    <p className="text-slate-500 mb-6">No hay clases registradas para el año seleccionado.</p>
                </div>
            )}

            {/* Modales */}
            <CourseFormModal
                open={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                editingId={editingId}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
            />
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={() => handleDelete(itemToDelete)}
                title="Eliminar Clase"
                message="¿Estás seguro de eliminar esta clase? Esta acción también borrará todas las asistencias asociadas."
                confirmText="Eliminar"
                isDestructive={true}
            />
        </div>
    );
}
