// components/layout/JoinClassModal.jsx
// Modal para que un estudiante ingrese un código y se una a una clase (Gamer Theme).

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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div
                className="bg-[#10072e] border border-violet-300/35 rounded-[2rem] shadow-[0_0_50px_rgba(139,109,255,0.35)] w-full max-w-md p-6 text-white relative animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(139,109,255,0.3)]">
                            <Hash size={24} className="text-purple-300" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black italic text-white">Unirse a Clase</h3>
                            <p className="text-xs font-semibold text-purple-200/70">Ingresa el código de tu clase</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 text-purple-300/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Éxito */}
                {success && (
                    <div className="mb-6 p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 size={22} className="text-emerald-400 flex-shrink-0" />
                        <p className="text-sm font-bold text-emerald-200">{success}</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-4 p-4 bg-rose-950/80 border border-rose-500/40 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="text-rose-400 flex-shrink-0" />
                        <p className="text-sm font-bold text-rose-200">{error}</p>
                    </div>
                )}

                {/* Formulario */}
                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-purple-200/80 mb-2">Código de la Clase</label>
                            <input
                                type="text"
                                value={classCode}
                                onChange={e => setClassCode(e.target.value.toUpperCase())}
                                placeholder="Ej: AB12CD"
                                maxLength={8}
                                autoFocus
                                className="w-full px-4 py-4 bg-black/40 border-2 border-purple-500/40 rounded-2xl text-center font-mono text-2xl font-black tracking-widest text-purple-100 placeholder:text-purple-400/40 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all uppercase shadow-inner"
                            />
                            <p className="text-[11px] text-purple-300/60 mt-2 text-center">Código de 6 caracteres (letras y números)</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button" onClick={handleClose}
                                className="flex-1 py-3.5 border border-purple-800/40 text-purple-200 font-bold rounded-2xl bg-purple-950/40 hover:bg-purple-900/40 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !classCode.trim()}
                                className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                Unirme
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
