/* eslint-disable */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setError('');
        setLoading(true);

        try {
            await api.post('/users/password-reset/', { email });
            setSuccess(true);
        } catch (err) {
            console.error("Password reset error:", err);
            setError(err.response?.data?.error || 'Error al enviar el correo. Verifica que el correo personal esté registrado.');
        } finally {
            setLoading(false);
        }
    };

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
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Correo Enviado!</h3>
                    <p className="text-slate-500 mb-6">
                        Hemos enviado un enlace de recuperación a tu correo personal. Por favor revisa tu bandeja de entrada y sigue las instrucciones.
                    </p>
                    <Link
                        to="/login"
                        className="w-full bg-upn-700 hover:bg-upn-800 text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={20} /> Volver al Login
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row shadow-2xl overflow-hidden">
            {/* Sección Izquierda - Informativa */}
            <div className="hidden md:flex md:w-1/2 bg-upn-700 relative flex-col justify-center items-center text-white p-12 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] rounded-full bg-white blur-3xl"></div>
                    <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-blue-400 blur-3xl"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 text-center space-y-8"
                >
                    <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-xl inline-block mb-4">
                        <img
                            src="https://i.ibb.co/C5SB6zj4/Identidad-UPN-25-vertical-azul-fondo-blanco.png"
                            alt="Logo UPN"
                            className="h-48 object-contain filter drop-shadow-lg mx-auto bg-white rounded-xl p-4"
                        />
                    </div>

                    <div className="space-y-4 max-w-lg mx-auto">
                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                            Recuperación de Contraseña
                        </h1>
                        <p className="text-xl text-blue-100 font-medium tracking-wide uppercase">
                            Sistema de Gestión Académica
                        </p>
                    </div>
                </motion.div>

                <div className="absolute bottom-8 text-center text-xs text-blue-200">
                    © 2026 Universidad Pedagógica Nacional
                </div>
            </div>

            {/* Sección Derecha - Formulario */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="md:hidden mb-8 -mt-6 -mx-6 bg-upn-700 p-8 rounded-b-[3rem] shadow-xl relative overflow-hidden text-center text-white">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-[-50%] left-[-50%] w-[400px] h-[400px] rounded-full bg-white blur-3xl"></div>
                        </div>
                        <div className="relative z-10">
                            <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-lg">
                                <img
                                    src="https://i.ibb.co/C5SB6zj4/Identidad-UPN-25-vertical-azul-fondo-blanco.png"
                                    alt="Logo UPN Mobile"
                                    className="h-20 mx-auto object-contain"
                                />
                            </div>
                            <h2 className="text-xl font-bold leading-tight">Recuperar Contraseña</h2>
                            <p className="text-blue-200 text-xs font-medium tracking-widest uppercase mt-2">Gestión Académica</p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Link to="/login" className="inline-flex items-center text-slate-400 hover:text-upn-700 mb-8 transition-colors group text-sm font-medium">
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Volver al Login
                        </Link>

                        <div className="text-center md:text-left mb-10">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">¿Olvidaste tu contraseña?</h2>
                            <p className="text-slate-500">Ingresa tu correo personal y te enviaremos un enlace para recuperarla.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Correo Personal</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-upn-600 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-600 transition-all font-medium"
                                        placeholder="tucorreo@gmail.com"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-slate-500 ml-1">Debe ser el correo personal registrado en tu cuenta.</p>
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
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        Enviar Enlace de Recuperación
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
