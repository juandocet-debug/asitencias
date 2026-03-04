/* eslint-disable */
// components/tools/TabFacultades.jsx
// Listado + CRUD de facultades.

import React from 'react';
import { Plus, Building2 } from 'lucide-react';
import { ItemRow } from './toolsUi';

export default function TabFacultades({ faculties, programs, onNew, onEdit, onDelete }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Building2 size={20} className="text-upn-600" /> Facultades
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Las facultades agrupan uno o más programas académicos.</p>
                </div>
                <button onClick={onNew} className="bg-upn-600 hover:bg-upn-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-upn-600/20">
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
                        const count = programs.filter(p => p.faculty === f.id).length;
                        return (
                            <ItemRow
                                key={f.id}
                                icon={Building2}
                                iconBg="bg-upn-50"
                                iconColor="text-upn-600"
                                title={f.name}
                                meta={
                                    <>
                                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{f.code}</span>
                                        <span className="text-xs text-slate-400">{count} programa{count !== 1 ? 's' : ''}</span>
                                    </>
                                }
                                onEdit={() => onEdit(f)}
                                onDelete={() => onDelete({ ...f, _type: 'faculty' })}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
