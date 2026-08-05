import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Filter, MoreVertical, Plus, RotateCcw } from 'lucide-react';
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
    const [archiveView, setArchiveView] = useState('active');
    const canManage = activeRole === 'ADMIN' || activeRole === 'TEACHER';

    useEffect(() => { fetchCourses(); }, [archiveView]);

    const fetchCourses = async () => {
        try {
            const archivedParam = archiveView === 'archived' ? 'true' : archiveView === 'all' ? 'all' : 'false';
            const { data } = await api.get(`/academic/courses/?archived=${archivedParam}`);
            setCourses(data);
        } catch {
            setCourses([]);
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
            await api.post(`/academic/courses/${id}/archive/`);
            fetchCourses();
            setDeleteModalOpen(false);
        } catch {
            alert('Error al archivar la clase');
        }
    };

    const handleRestore = async (id) => {
        try {
            await api.post(`/academic/courses/${id}/restore/`);
            fetchCourses();
        } catch {
            alert('Error al restaurar la clase');
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

            <ArchiveTabs value={archiveView} onChange={setArchiveView} />

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {filteredCourses.map(course => (
                    <CourseCard
                        key={course.id}
                        course={course}
                        canManage={canManage}
                        onClick={() => navigate(`/classes/${course.id}`)}
                        onEdit={handleEdit}
                        onDelete={(id) => { setItemToDelete(id); setDeleteModalOpen(true); }}
                        onRestore={handleRestore}
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
                title="Archivar clase"
                message="¿Quieres archivar esta clase? No se borran estudiantes, asistencias ni reportes; solo se oculta del listado principal."
                confirmText="Archivar"
            />
        </MobilePageFrame>
    );
}

function ArchiveTabs({ value, onChange }) {
    const tabs = [
        { id: 'active', label: 'Activas', icon: Filter },
        { id: 'archived', label: 'Archivadas', icon: Archive },
        { id: 'all', label: 'Todas', icon: RotateCcw },
    ];

    return (
        <div className="app-glass flex w-full gap-1 rounded-2xl p-1 sm:w-fit">
            {tabs.map(tab => {
                const Icon = tab.icon;
                const active = value === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition sm:flex-none ${active ? 'bg-white text-[#7657f6] shadow-sm' : 'text-slate-500'}`}
                    >
                        <Icon size={14} /> {tab.label}
                    </button>
                );
            })}
        </div>
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
