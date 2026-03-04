// components/reports/ManageStudentsModal.jsx
// Modal para que el ADMIN agregue o quite usuarios de una clase directamente.
// No requiere código de acceso — el admin selecciona del listado global.

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, UserPlus, UserMinus, Loader2, Users, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { getMediaUrl } from '../../utils/dateUtils';

function Avatar({ user }) {
    return (
        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 text-slate-500 font-bold text-sm">
            {user.photo
                ? <img src={getMediaUrl(user.photo)} alt="" className="w-full h-full object-cover" />
                : <span>{user.first_name?.[0]}{user.last_name?.[0]}</span>
            }
        </div>
    );
}

export default function ManageStudentsModal({ courseId, courseName, onClose, onUpdate, showToast }) {
    const [allUsers, setAllUsers] = useState([]);
    const [enrolled, setEnrolled] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState(null); // user_id procesándose

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [usersRes, courseRes] = await Promise.all([
                    api.get('/users/'),
                    api.get(`/academic/courses/${courseId}/`),
                ]);
                setAllUsers(usersRes.data);
                const enrolledIds = (courseRes.data.students || []).map(s => s.id || s);
                setEnrolled(new Set(enrolledIds));
            } catch {
                showToast('Error al cargar datos', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [courseId]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return allUsers;
        const t = searchTerm.toLowerCase();
        return allUsers.filter(u =>
            u.first_name?.toLowerCase().includes(t) ||
            u.last_name?.toLowerCase().includes(t) ||
            u.document_number?.includes(t)
        );
    }, [allUsers, searchTerm]);

    const handleAdd = async (user) => {
        setProcessing(user.id);
        try {
            await api.post(`/academic/courses/${courseId}/add_student/`, { user_id: user.id });
            setEnrolled(prev => new Set([...prev, user.id]));
            showToast(`${user.first_name} ${user.last_name} agregado`, 'success');
            onUpdate?.();
        } catch (e) {
            showToast(e.response?.data?.error || 'Error al agregar', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const handleRemove = async (user) => {
        setProcessing(user.id);
        try {
            await api.delete(`/academic/courses/${courseId}/remove_student/`, { data: { user_id: user.id } });
            setEnrolled(prev => { const s = new Set(prev); s.delete(user.id); return s; });
            showToast(`${user.first_name} ${user.last_name} quitado`, 'success');
            onUpdate?.();
        } catch (e) {
            showToast(e.response?.data?.error || 'Error al quitar', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const enrolledList = filteredUsers.filter(u => enrolled.has(u.id));
    const availableList = filteredUsers.filter(u => !enrolled.has(u.id));

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Gestionar Participantes</h3>
                        <p className="text-sm text-slate-500">{courseName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                </div>

                {/* Buscador */}
                <div className="px-6 py-3 border-b border-slate-100 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text" placeholder="Buscar por nombre o documento..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upn-500/20"
                        />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-upn-600" size={28} /></div>
                    ) : (
                        <>
                            {/* Matriculados */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle size={16} className="text-emerald-600" />
                                    <h4 className="text-sm font-bold text-slate-700">En la clase ({enrolledList.length})</h4>
                                </div>
                                {enrolledList.length === 0
                                    ? <p className="text-xs text-slate-400 italic">Nadie matriculado aún</p>
                                    : enrolledList.map(user => (
                                        <div key={user.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <Avatar user={user} />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{user.first_name} {user.last_name}</p>
                                                    <p className="text-xs text-slate-400">{user.document_number}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(user)}
                                                disabled={processing === user.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {processing === user.id ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={12} />}
                                                Quitar
                                            </button>
                                        </div>
                                    ))
                                }
                            </div>

                            {/* Disponibles */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Users size={16} className="text-slate-500" />
                                    <h4 className="text-sm font-bold text-slate-700">Disponibles ({availableList.length})</h4>
                                </div>
                                {availableList.length === 0
                                    ? <p className="text-xs text-slate-400 italic">Todos los usuarios ya están en la clase</p>
                                    : availableList.map(user => (
                                        <div key={user.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <Avatar user={user} />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{user.first_name} {user.last_name}</p>
                                                    <p className="text-xs text-slate-400">{user.document_number} · {(user.roles || [user.role]).join(', ')}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAdd(user)}
                                                disabled={processing === user.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-upn-700 bg-upn-50 hover:bg-upn-100 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {processing === user.id ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                                                Agregar
                                            </button>
                                        </div>
                                    ))
                                }
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
