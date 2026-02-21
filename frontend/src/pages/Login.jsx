/* eslint-disable */
import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Eye, EyeOff, CreditCard } from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

const UPN_LOGO = 'https://i.ibb.co/C5SB6zj4/Identidad-UPN-25-vertical-azul-fondo-blanco.png';
const AGON_LOGO = 'https://i.ibb.co/WWbbDdhg/agonlogo.jpg';

export default function Login() {
    const { fetchUser } = useUser();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const classCode = searchParams.get('code');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return;
        setError('');
        setLoading(true);
        try {
            const response = await api.post('/token/', { username, password });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('username', username);
            if (fetchUser) await fetchUser();
            navigate(classCode ? `/register?code=${classCode}` : '/dashboard');
        } catch {
            setError('Credenciales inválidas. Verifique su usuario y contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ══ Panel izquierdo — Azul ══ */}
            <div
                className="hidden md:flex md:w-[45%] relative flex-col justify-center items-center overflow-hidden px-10"
                style={{ background: 'linear-gradient(155deg, #001d6e 0%, #0043c5 55%, #005fe8 100%)' }}
            >
                {/* Burbuja decorativa superior derecha */}
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.09) 0%, transparent 70%)' }} />
                {/* Burbuja decorativa inferior izquierda */}
                <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)' }} />

                <div className="relative z-10 flex flex-col items-center gap-10 w-full">

                    {/* Logo UPN — pequeño, limpio */}
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <div className="w-28 h-28 rounded-full bg-white shadow-2xl shadow-black/30 flex items-center justify-center">
                            <img src={UPN_LOGO} alt="UPN" className="w-20 h-20 object-contain" />
                        </div>
                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.35em]">
                            Universidad Pedagógica Nacional
                        </p>
                    </motion.div>

                    {/* Logo AGON — directo, sin caja */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.18, duration: 0.65, type: 'spring', stiffness: 80 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <img
                            src={AGON_LOGO}
                            alt="AGON"
                            className="w-64 h-28 object-contain rounded-3xl shadow-2xl shadow-black/40"
                            style={{ filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.35))' }}
                        />
                        <div className="text-center space-y-1">
                            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.3em]">
                                Sistema de Control Académico
                            </p>
                            <p className="text-white/35 text-[9px] uppercase tracking-widest">
                                Licenciatura en Recreación
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Copyright */}
                <p className="absolute bottom-5 text-white/20 text-[9px] tracking-widest uppercase z-10">
                    © 2026 · UPN-CIAR
                </p>
            </div>

            {/* ══ Panel derecho — Formulario ══ */}
            <div className="w-full md:w-[55%] flex items-center justify-center bg-white px-6 md:px-14 lg:px-20">
                <div className="w-full max-w-[400px]">

                    {/* Mobile header */}
                    <div className="md:hidden mb-8 flex items-center gap-3">
                        <img src={AGON_LOGO} alt="AGON" className="h-10 w-10 rounded-xl object-cover shadow" />
                        <div>
                            <p className="font-black text-blue-800 text-sm tracking-widest">AGON</p>
                            <p className="text-slate-400 text-xs">Gestión Académica · UPN</p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        {/* Título del form */}
                        <div className="mb-8">
                            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.25em] mb-2">AGON</p>
                            <h2 className="text-[2rem] font-black text-slate-900 leading-tight">Iniciar sesión</h2>
                            {classCode ? (
                                <div className="mt-3 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium border border-amber-100">
                                    Clase: <span className="font-bold">{classCode}</span>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm mt-1">Ingresa tu cédula y contraseña.</p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Número de Cédula</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all text-sm font-medium"
                                        placeholder="1234567890"
                                        inputMode="numeric"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all text-sm font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600" />
                                    Recordarme
                                </label>
                                <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 font-semibold text-xs transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 text-red-500 text-sm font-medium border border-red-100 flex items-center gap-2">
                                    ⚠️ {error}
                                </div>
                            )}

                            <button type="submit" disabled={loading}
                                className="w-full py-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                                style={{ background: 'linear-gradient(135deg, #0038b0, #005fe8)', boxShadow: '0 6px 28px rgba(0,63,200,0.38)' }}>
                                {loading ? 'Ingresando...' : 'Iniciar sesión'}
                                <ArrowRight className="h-4 w-4" />
                            </button>

                            <p className="text-center text-slate-400 text-sm pt-1">
                                ¿No tienes cuenta?{' '}
                                <Link to={classCode ? `/register?code=${classCode}` : '/register'}
                                    className="text-blue-700 font-bold hover:underline">
                                    Regístrate
                                </Link>
                            </p>
                        </form>

                        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
                            <img src={AGON_LOGO} alt="AGON" className="h-5 w-5 object-cover rounded-md opacity-40" />
                            <span className="text-[11px] text-slate-400">AGON · © 2026 Universidad Pedagógica Nacional</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
