/* eslint-disable */
// components/classDetails/StudentListSection.jsx
// Tabla de estudiantes que ve el PROFESOR. Incluye búsqueda propia.
// Al hacer clic en el avatar → onSelectStudent(student) para abrir el modal de foto.

import React, { useState, useMemo } from 'react';
import { Users, Search, QrCode, Award, Trash2 } from 'lucide-react';

export default function StudentListSection({ students = [], onSelectStudent, getMediaUrl }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return students;
        const t = searchTerm.toLowerCase();
        return students.filter(s =>
            s.first_name?.toLowerCase().includes(t) ||
            s.last_name?.toLowerCase().includes(t) ||
            s.document_number?.includes(t)
        );
    }, [students, searchTerm]);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header con búsqueda */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users className="text-upn-600" /> Lista de Estudiantes
                </h3>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Buscar estudiante..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100" />
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            {['#', 'Estudiante', 'Contacto', 'Estado', 'Acciones'].map((h, i) => (
                                <th key={h} className={`px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}${i === 0 ? ' w-10' : ''}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length > 0 ? filtered.map((student, index) => (
                            <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-slate-400 font-medium">{index + 1}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => onSelectStudent(student)}
                                            className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 uppercase border-2 border-white shadow-md overflow-hidden hover:ring-2 hover:ring-upn-400 transition-all flex-shrink-0">
                                            {student.photo
                                                ? <img src={getMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
                                                : <span>{student.first_name?.[0]}{student.last_name?.[0]}</span>}
                                        </button>
                                        <div>
                                            <p className="font-bold text-slate-800">{student.first_name} {student.last_name}</p>
                                            <p className="text-xs text-slate-500 font-mono">ID: {student.document_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col text-sm text-slate-600">
                                        <span>{student.email}</span>
                                        <span className="text-xs text-slate-400">{student.phone_number || 'Sin Celular'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Activo</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Ver Insignias">
                                            <Award size={18} />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <QrCode size={32} className="text-slate-300" />
                                        <p>{searchTerm ? 'No se encontraron resultados' : 'No hay estudiantes inscritos aún.'}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
