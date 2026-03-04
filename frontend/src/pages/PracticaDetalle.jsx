/* eslint-disable */
/**
 * PracticaDetalle.jsx
 * Orquestador — carga de datos + enrutamiento de vistas.
 * Lógica de tabla   → ResumenEstudiantes.jsx
 * Historial visitas → HistorialVisitas.jsx
 * Modal alumno      → HistorialAlumnoModal.jsx
 * Modal nueva visita→ NuevoSeguimientoModal.jsx
 * Primitivos        → practicaUtils.jsx
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, ClipboardCheck, MapPin, BookOpen, Hash, UserCheck, Loader2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { PracticaToast } from '../components/practicas/practicaUtils';
import ResumenEstudiantes from '../components/practicas/ResumenEstudiantes';
import HistorialVisitas from '../components/practicas/HistorialVisitas';
import HistorialAlumnoModal from '../components/practicas/HistorialAlumnoModal';
import NuevoSeguimientoModal from '../components/practicas/NuevoSeguimientoModal';

export default function PracticaDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [practica, setPractica] = useState(null);
    const [students, setStudents] = useState([]);
    const [resumen, setResumen] = useState([]);
    const [seguimientos, setSeguimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [activeView, setActiveView] = useState('resumen'); // 'resumen' | 'historial'
    const [newSegModal, setNewSegModal] = useState(false);
    const [studentModal, setStudentModal] = useState(null);

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 4500);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [pR, sR, segR, resR] = await Promise.all([
                api.get(`/practicas/practicas/${id}/`),
                api.get(`/practicas/practicas/${id}/students/`),
                api.get(`/practicas/seguimientos/?practica=${id}`),
                api.get(`/practicas/practicas/${id}/resumen-asistencia/`),
            ]);
            setPractica(pR.data);
            setStudents(sR.data.students || []);
            setSeguimientos(segR.data);
            setResumen(resR.data);
        } catch { showToast('Error al cargar', 'error'); }
        finally { setLoading(false); }
    }, [id, showToast]);

    useEffect(() => { load(); }, [load]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-upn-500 w-10 h-10 mb-4" />
            <p className="text-slate-400 font-medium">Cargando práctica...</p>
        </div>
    );

    if (!practica) return (
        <div className="flex flex-col items-center justify-center py-32">
            <AlertTriangle size={40} className="text-red-300 mb-4" />
            <p className="text-slate-500 font-medium">Práctica no encontrada</p>
            <button onClick={() => navigate('/coordinator/practicas')} className="mt-4 text-upn-600 font-semibold text-sm">
                ← Volver a Prácticas
            </button>
        </div>
    );

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <PracticaToast toast={toast} onClose={() => setToast(null)} />

            {/* Header */}
            <div>
                <button onClick={() => navigate('/coordinator/practicas')}
                    className="flex items-center gap-2 text-slate-400 hover:text-upn-600 text-sm font-semibold mb-4 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold text-upn-500 uppercase tracking-wider mb-0.5">Seguimiento</p>
                        <h1 className="text-3xl font-black text-slate-900">{practica.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-slate-500">
                            <span>{practica.year} · {practica.period === 1 ? '1er' : '2do'} sem.</span>
                            {practica.profesor_info && (
                                <span className="flex items-center gap-1.5">
                                    <UserCheck size={13} className="text-violet-400" /> {practica.profesor_info.full_name}
                                </span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border
                                ${practica.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {practica.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>
                    </div>
                    <button onClick={() => setNewSegModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-upn-600 hover:bg-upn-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-upn-600/20 transition-all">
                        <Plus size={16} /> Nueva Visita
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Estudiantes', value: students.length, icon: Users, color: 'upn' },
                    { label: 'Visitas', value: seguimientos.length, icon: ClipboardCheck, color: 'violet' },
                    { label: 'Sitios', value: practica.sitios_detail?.length || 0, icon: MapPin, color: 'blue' },
                    { label: 'Objetivos', value: practica.objetivos_detail?.length || 0, icon: BookOpen, color: 'emerald' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
                        <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center mb-3`}>
                            <Icon size={20} className={`text-${color}-500`} />
                        </div>
                        <p className="text-2xl font-black text-slate-800">{value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Código QR Strip */}
            <div className="bg-upn-50 border border-upn-200 rounded-2xl px-6 py-4 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-upn-400 uppercase mb-0.5">Código de inscripción</p>
                    <p className="font-mono font-black text-2xl text-upn-900 tracking-widest">{practica.code}</p>
                </div>
                <Hash size={32} className="text-upn-200" />
            </div>

            {/* Tab switcher */}
            <div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
                    {[{ key: 'resumen', label: '📊 Resumen alumnos' }, { key: 'historial', label: '📋 Historial visitas' }].map(v => (
                        <button key={v.key} onClick={() => setActiveView(v.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
                                ${activeView === v.key ? 'bg-white shadow text-upn-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                            {v.label}
                        </button>
                    ))}
                </div>

                {activeView === 'resumen' && <ResumenEstudiantes resumen={resumen} seguimientos={seguimientos} onClickStudent={setStudentModal} />}
                {activeView === 'historial' && <HistorialVisitas seguimientos={seguimientos} students={students} onUpdated={load} showToast={showToast} />}
            </div>

            {/* Modales */}
            {newSegModal && (
                <NuevoSeguimientoModal
                    practicaId={id} students={students} sitios={practica.sitios_detail || []}
                    onClose={() => setNewSegModal(false)}
                    onCreated={() => { setNewSegModal(false); load(); showToast('Visita registrada ✓'); }}
                    showToast={showToast}
                />
            )}
            {studentModal && (
                <HistorialAlumnoModal
                    practica={practica} student={studentModal}
                    onClose={() => setStudentModal(null)} showToast={showToast}
                />
            )}
        </div>
    );
}
