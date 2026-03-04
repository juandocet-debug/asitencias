/* eslint-disable */
// components/tools/TabProgramas.jsx
// Listado + CRUD de programas académicos.

import React from 'react';
import { Plus, BookOpen, Building2, AlertTriangle } from 'lucide-react';
import { ItemRow } from './toolsUi';

export default function TabProgramas({ programs, faculties, onNew, onEdit, onDelete }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen size={20} className="text-upn-600" /> Programas Académicos
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Los programas se vinculan a una facultad y se asignan a usuarios.</p>
                </div>
                <button onClick={onNew} disabled={faculties.length === 0}
                    title={faculties.length === 0 ? 'Crea una facultad primero' : ''}
                    className="bg-upn-600 hover:bg-upn-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-upn-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
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
                        <ItemRow
                            key={p.id}
                            icon={BookOpen}
                            iconBg="bg-blue-50"
                            iconColor="text-blue-600"
                            title={p.name}
                            meta={
                                <>
                                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{p.code}</span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Building2 size={11} /> {p.faculty_name}
                                    </span>
                                </>
                            }
                            onEdit={() => onEdit(p)}
                            onDelete={() => onDelete({ ...p, _type: 'program' })}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
