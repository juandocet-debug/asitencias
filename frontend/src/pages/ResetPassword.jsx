/* eslint-disable */
import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== passwordConfirm) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await api.post('/users/password-reset-confirm/', { token, password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            console.error("Password reset confirm error:", err);
            setError(err.response?.data?.error || 'El enlace es inválido o ha expirado. Solicita uno nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={48} className="text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Enlace Inválido</h3>
                    <p className="text-slate-500 mb-6">
                        El enlace de recuperación no es válido. Por favor solicita uno nuevo.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="w-full bg-upn-700 hover:bg-upn-800 text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                        Solicitar Nuevo Enlace
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
                >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={48} className="text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Contraseña Actualizada!</h3>
                    <p className="text-slate-500 mb-6">
                        Tu contraseña ha sido cambiada exitosamente. Serás redirigido al login...
                    </p>
                    <Link
                        to="/login"
                        className="w-full bg-upn-700 hover:bg-upn-800 text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={20} /> Ir al Login
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-lg">
                            <img
                                src="https://i.ibb.co/C5SB6zj4/Identidad-UPN-25-vertical-azul-fondo-blanco.png"
                                alt="Logo UPN"
                                className="h-20 mx-auto object-contain"
                            />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Nueva Contraseña</h2>
                        <p className="text-slate-500">Ingresa tu nueva contraseña</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Nueva Contraseña</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-upn-600 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-600 transition-all font-medium"
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Confirmar Contraseña</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-upn-600 transition-colors" />
                                </div>
                                <input
                                    type={showPasswordConfirm ? "text" : "password"}
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-600 transition-all font-medium"
                                    placeholder="Repite tu contraseña"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                                <AlertCircle size={18} />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-upn-700 hover:bg-upn-800 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                    Cambiar Contraseña
                                </>
                            )}
                        </button>

                        <Link to="/login" className="block text-center text-sm text-slate-500 hover:text-upn-700 transition-colors">
                            Volver al Login
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
}
