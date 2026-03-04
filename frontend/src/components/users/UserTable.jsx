// components/users/UserTable.jsx
// Tabla de usuarios con foto, nombre, roles, programa y acciones.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Edit2, Trash2, BarChart2 } from 'lucide-react';
import { ROLE_LABELS, ROLE_STYLES, ROLE_ICONS, COORDINATOR_TYPE_LABELS } from '../../constants/userRoles';
import { getMediaUrl } from '../../utils/dateUtils';

function RoleBadge({ role }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${ROLE_STYLES[role] || 'bg-slate-100 text-slate-800'}`}>
            {ROLE_ICONS[role]}
            {ROLE_LABELS[role] || role}
        </span>
    );
}

function CoordBadge({ type }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {COORDINATOR_TYPE_LABELS[type] || type}
        </span>
    );
}

export default function UserTable({ users, onEdit, onDelete }) {
    const navigate = useNavigate();
    if (!users.length) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
                No se encontraron usuarios
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            {['Usuario', 'Documento', 'Rol(es)', 'Programa', 'Estado', 'Acciones'].map((h, i) => (
                                <th key={i} className={`${i === 3 ? 'hidden lg:table-cell' : ''} ${i === 5 ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider`}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                {/* Avatar + nombre */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden flex-shrink-0">
                                            {user.photo
                                                ? <img src={getMediaUrl(user.photo)} alt="" className="w-full h-full object-cover" />
                                                : <span>{user.first_name?.[0]}{user.last_name?.[0]}</span>
                                            }
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{user.first_name} {user.last_name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <Mail size={12} /> {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Documento */}
                                <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                    {user.document_number || 'N/A'}
                                </td>

                                {/* Roles */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {(user.roles?.length > 0 ? user.roles : [user.role]).map(r => (
                                            <RoleBadge key={r} role={r} />
                                        ))}
                                        {user.coordinator_profiles?.map((cp, i) => (
                                            <CoordBadge key={i} type={cp.coordinator_type} />
                                        ))}
                                    </div>
                                </td>

                                {/* Programa */}
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <div className="text-sm text-slate-600">{user.program_name || <span className="text-slate-300">—</span>}</div>
                                    {user.faculty_name && <div className="text-[11px] text-slate-400">{user.faculty_name}</div>}
                                </td>

                                {/* Estado */}
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5" />
                                        Activo
                                    </span>
                                </td>

                                {/* Acciones */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => navigate(`/students/${user.id}`)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Ver asistencia"
                                        >
                                            <BarChart2 size={16} />
                                        </button>
                                        <button onClick={() => onEdit(user)} className="p-2 text-slate-400 hover:text-upn-600 hover:bg-upn-50 rounded-lg transition-colors" title="Editar">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => onDelete(user)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
