/* eslint-disable */
// components/practicas/ResumenEstudiantes.jsx
// Tabla de resumen de asistencia por estudiante con ordenamiento y búsqueda.

import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { STATUS_CFG, StatusDot } from './practicaUtils';

export default function ResumenEstudiantes({ resumen, seguimientos, onClickStudent }) {
    const [sortField, setSortField] = useState('full_name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');

    const sorted = [...resumen]
        .filter(s => !search || s.full_name.toLowerCase().includes(search.toLowerCase()) || s.document_number.includes(search))
        .sort((a, b) => {
            let va = a[sortField], vb = b[sortField];
            if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            return sortDir === 'asc' ? va - vb : vb - va;
        });

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const SortIcon = ({ field }) => sortField === field
        ? (sortDir === 'asc' ? <ChevronUp size={12} className="text-upn-500" /> : <ChevronDown size={12} className="text-upn-500" />)
        : <ChevronDown size={12} className="text-slate-300" />;

    if (resumen.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 text-center">
                <Users size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">Sin estudiantes inscritos</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar estudiante..."
                className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100"
            />

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Header tabla */}
                <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase">
                    <button onClick={() => toggleSort('full_name')} className="col-span-3 flex items-center gap-1 text-left hover:text-slate-600">Estudiante <SortIcon field="full_name" /></button>
                    <button onClick={() => toggleSort('present')} className="col-span-1 flex items-center justify-center gap-1 hover:text-slate-600">P <SortIcon field="present" /></button>
                    <button onClick={() => toggleSort('absent')} className="col-span-1 flex items-center justify-center gap-1 hover:text-slate-600">A <SortIcon field="absent" /></button>
                    <button onClick={() => toggleSort('late')} className="col-span-1 flex items-center justify-center gap-1 hover:text-slate-600">T <SortIcon field="late" /></button>
                    <button onClick={() => toggleSort('excused')} className="col-span-1 flex items-center justify-center gap-1 hover:text-slate-600">E <SortIcon field="excused" /></button>
                    <button onClick={() => toggleSort('attendance_pct')} className="col-span-2 flex items-center justify-center gap-1 hover:text-slate-600">% Asist. <SortIcon field="attendance_pct" /></button>
                    {seguimientos.slice(0, 3).map(seg => (
                        <div key={seg.id} className="col-span-1 text-center truncate" title={seg.date}>
                            {new Date(seg.date + 'T12:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })}
                        </div>
                    ))}
                    <div className="col-span-1 text-right">Det.</div>
                </div>

                {sorted.map((s, i) => {
                    const pct = s.attendance_pct;
                    const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                        <div key={s.id} className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                            <div className="col-span-3 flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-upn-100 flex items-center justify-center text-upn-700 font-bold text-xs flex-shrink-0">
                                    {s.photo ? <img src={s.photo} alt="" className="w-full h-full object-cover rounded-full" /> : s.full_name[0]}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800 text-sm truncate">{s.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{s.document_number}</p>
                                </div>
                            </div>
                            <div className="col-span-1 text-center"><span className="font-bold text-emerald-600 text-sm">{s.present}</span></div>
                            <div className="col-span-1 text-center"><span className="font-bold text-red-500 text-sm">{s.absent}</span></div>
                            <div className="col-span-1 text-center"><span className="font-bold text-amber-500 text-sm">{s.late}</span></div>
                            <div className="col-span-1 text-center"><span className="font-bold text-slate-400 text-sm">{s.excused}</span></div>
                            <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className={`text-xs font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</span>
                                </div>
                            </div>
                            {seguimientos.slice(0, 3).map(seg => {
                                const asist = seg.asistencias?.find(a => a.student === s.id);
                                return <div key={seg.id} className="col-span-1 flex justify-center"><StatusDot status={asist?.status} /></div>;
                            })}
                            <div className="col-span-1 flex justify-end">
                                <button onClick={() => onClickStudent(s)} className="p-1.5 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-lg transition-colors">
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Leyenda */}
                <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex gap-4 text-[10px] font-bold text-slate-400 uppercase">
                    {Object.entries(STATUS_CFG).map(([k, v]) => (
                        <span key={k} className="flex items-center gap-1">
                            <span className={`w-4 h-4 rounded-full ${v.bg} text-white flex items-center justify-center text-[9px]`}>{v.label}</span>
                            {v.full}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
