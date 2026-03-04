/* eslint-disable */
// components/layout/JoinClassModal.jsx
// Modal para que un estudiante ingrese un código y se una a una clase.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Hash, CheckCircle2, AlertCircle, Loader2, Plus } from 'lucide-react';
import api from '../../services/api';

export default function JoinClassModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [classCode, setClassCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen) return null;

    const reset = () => { setClassCode(''); setError(''); setSuccess(''); };

    const handleClose = () => { reset(); onClose(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!classCode.trim()) return;
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await api.post('/users/join-class/', { class_code: classCode.trim().toUpperCase() });
            setSuccess(res.data?.message || '¡Te uniste a la clase exitosamente!');
            setClassCode('');
            setTimeout(() => { handleClose(); navigate('/classes'); }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'Código inválido o ya estás inscrito.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-upn-100 flex items-center justify-center">
                            <Hash size={24} className="text-upn-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Unirse a Clase</h3>
                            <p className="text-xs text-slate-500">Ingresa el código que te dio tu profesor</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Éxito */}
                {success && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0" />
                        <p className="text-sm font-semibold text-emerald-700">{success}</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                        <p className="text-sm font-semibold text-red-600">{error}</p>
                    </div>
                )}

                {/* Formulario */}
                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Código de la Clase</label>
                            <input
                                type="text"
                                value={classCode}
                                onChange={e => setClassCode(e.target.value.toUpperCase())}
                                placeholder="Ej: AB12CD"
                                maxLength={8}
                                autoFocus
                                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center font-mono text-2xl font-black tracking-widest text-upn-900 placeholder:text-slate-300 placeholder:font-sans placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-upn-500 focus:ring-4 focus:ring-upn-100 transition-all uppercase"
                            />
                            <p className="text-xs text-slate-400 mt-2 text-center">El código tiene 6 caracteres entre letras y números</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button" onClick={handleClose}
                                className="flex-1 py-3.5 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !classCode.trim()}
                                className="flex-1 py-3.5 bg-upn-600 hover:bg-upn-700 text-white font-bold rounded-2xl shadow-lg shadow-upn-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <><Loader2 size={18} className="animate-spin" /> Uniendo...</> : <><Plus size={18} /> Unirse</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
