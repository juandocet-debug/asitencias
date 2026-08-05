/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, MoreVertical, Plus } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';
import CourseCard from '../components/classes/CourseCard';
import CourseFormModal from '../components/classes/CourseFormModal';
import MobilePageFrame from '../components/mobile/MobilePageFrame';
import MobileHero from '../components/mobile/MobileHero';
import SoftCard from '../components/mobile/SoftCard';

const currentYear = new Date().getFullYear();
const today = new Date().toISOString().split('T')[0];
const EMPTY_FORM = { name: '', color: 'blue', year: currentYear, period: 1, start_date: today, end_date: today };

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
    const canManage = activeRole === 'ADMIN' || activeRole === 'TEACHER';

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        try {
            const { data } = await api.get('/academic/courses/');
            setCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => { setFormData(EMPTY_FORM); setEditingId(null); };
    const openNewModal = () => { resetForm(); setIsModalOpen(true); };

    const handleEdit = (course) => {
        setFormData({
            name: course.name,
            color: course.color || 'blue',
            year: course.year,
            period: course.period,
            start_date: course.start_date,
            end_date: course.end_date,
        });
        setEditingId(course.id);
        setIsModalOpen(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            if (editingId) await api.put(`/academic/courses/${editingId}/`, formData);
            else await api.post('/academic/courses/', formData);
            setIsModalOpen(false);
            resetForm();
            fetchCourses();
        } catch {
            alert('Error al guardar la clase');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/academic/courses/${id}/`);
            fetchCourses();
            setDeleteModalOpen(false);
        } catch {
            alert('Error al eliminar la clase');
        }
    };

    const availableYears = [...new Set(courses.map(course => course.year))].sort((a, b) => b - a);
    if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear);
    const filteredCourses = courses.filter(course => selectedYear === 'Todos' || String(course.year) === String(selectedYear));

    return (
        <MobilePageFrame>
            <MobileHero
                eyebrow="Académico"
                title="Clases"
                subtitle="Materias, periodos, estudiantes y asistencia en una interfaz tipo app."
                action={<HeaderActions canManage={canManage} onCreate={openNewModal} />}
            />

            <YearFilter
                selectedYear={selectedYear}
                availableYears={availableYears}
                open={yearDropdownOpen}
                setOpen={setYearDropdownOpen}
                setSelectedYear={setSelectedYear}
            />

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {filteredCourses.map(course => (
                    <CourseCard
                        key={course.id}
                        course={course}
                        canManage={canManage}
                        onClick={() => navigate(`/classes/${course.id}`)}
                        onEdit={handleEdit}
                        onDelete={(id) => { setItemToDelete(id); setDeleteModalOpen(true); }}
                    />
                ))}
            </div>

            {!loading && filteredCourses.length === 0 && <EmptyCourses />}

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
                isDestructive
            />
        </MobilePageFrame>
    );
}

function HeaderActions({ canManage, onCreate }) {
    if (!canManage) return null;
    return (
        <button onClick={onCreate} className="flex items-center gap-2 rounded-2xl bg-[#7657f6] px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-300/50">
            <Plus size={19} /> Nueva clase
        </button>
    );
}

function YearFilter({ selectedYear, availableYears, open, setOpen, setSelectedYear }) {
    return (
        <div className="relative w-fit">
            <button onClick={() => setOpen(value => !value)} className="app-glass flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-700">
                <Filter size={18} /> Año: {selectedYear} <MoreVertical size={16} className="rotate-90 text-slate-400" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 z-20 mt-2 w-40 overflow-hidden rounded-2xl bg-white p-1 shadow-2xl">
                        {['Todos', ...availableYears].map(year => (
                            <button key={year} onClick={() => { setSelectedYear(year); setOpen(false); }} className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-600 hover:bg-violet-50">
                                {year}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function EmptyCourses() {
    return (
        <SoftCard className="py-16 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-slate-50 text-slate-400">
                <Filter size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-700">No se encontraron clases</h3>
            <p className="text-sm font-semibold text-slate-500">No hay clases registradas para el año seleccionado.</p>
        </SoftCard>
    );
}
