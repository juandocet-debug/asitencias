/* eslint-disable */
// components/practicas/TabDocentes.jsx
// Tab de consulta de docentes asociados al programa.

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, UserCheck } from 'lucide-react';
import api from '../../services/api';
import { EmptyState } from './practicasUi';

const ROLE_LABEL = { TEACHER: 'Docente', PRACTICE_TEACHER: 'Prof. Práctica' };

export default function TabDocentes({ programId, showToast }) {
    const [docentes, setDocentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = useCallback(async (q = '') => {
        setLoading(true);
        try {
            const r = await api.get(`/practicas/docentes/?program=${programId}${q ? `&q=${encodeURIComponent(q)}` : ''}`);
            setDocentes(r.data);
        } catch { showToast('Error', 'error'); }
        finally { setLoading(false); }
    }, [programId]);

    useEffect(() => { if (programId) load(); }, [load]);

    return (
        <div className="space-y-5">
            <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={search}
                    onChange={e => { setSearch(e.target.value); load(e.target.value); }}
                    placeholder="Buscar docente por nombre, cédula o correo..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-100" />
            </div>

            {loading
                ? <div className="flex justify-center py-24"><Loader2 className="animate-spin w-8 h-8 text-upn-500" /></div>
                : docentes.length === 0
                    ? <EmptyState icon={UserCheck} title="Sin docentes" subtitle="Verifica que los docentes tengan asignado este programa o facultad." />
                    : <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">{docentes.length} docente(s)</span>
                        </div>
                        {docentes.map((d, i) => (
                            <div key={d.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-upn-100 flex items-center justify-center flex-shrink-0">
                                    {d.photo ? <img src={d.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-upn-700 font-bold text-sm">{d.full_name[0]}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 truncate text-sm">{d.full_name}</p>
                                    <p className="text-xs text-slate-400">{d.email}</p>
                                </div>
                                <div className="flex gap-1.5">
                                    {(d.roles?.length > 0 ? d.roles : [d.role]).filter(r => ROLE_LABEL[r]).map(r => (
                                        <span key={r} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border
                                            ${r === 'PRACTICE_TEACHER' ? 'bg-upn-50 text-upn-700 border-upn-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                                            {ROLE_LABEL[r]}
                                        </span>
                                    ))}
                                </div>
                                <span className="font-mono text-xs text-slate-300 hidden lg:block">{d.document_number}</span>
                            </div>
                        ))}
                    </div>
            }
        </div>
    );
}
