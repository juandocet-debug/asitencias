/* eslint-disable */
import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Eye, EyeOff, CreditCard } from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

const AGON_LOGO = 'https://i.ibb.co/B2w4Ymcf/Chat-GPT-Image-20-feb-2026-08-22-06-p-m.png';

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
        } catch (err) {
            const status = err?.response?.status;
            const isTimeout = err?.code === 'ECONNABORTED' || !err?.response;
            if (isTimeout) {
                setError('⏳ El servidor está despertando. Espera unos segundos e intenta de nuevo.');
            } else if (status === 401 || status === 400) {
                setError('Credenciales inválidas. Verifique su usuario y contraseña.');
            } else {
                setError('Error de conexión. Intenta de nuevo en un momento.');
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ══ Panel izquierdo — Azul AGON ══ */}
            <div
                className="hidden md:flex md:w-[45%] relative flex-col justify-center items-center gap-10 overflow-hidden px-10"
                style={{ background: 'linear-gradient(150deg, #001a6e 0%, #0047c8 60%, #0066f0 100%)' }}
            >
                {/* Círculos decorativos de fondo */}
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
                <div className="absolute top-10 -right-10 w-40 h-40 rounded-full bg-white/[0.07]" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/10" />
                <div className="absolute bottom-24 left-8 w-20 h-20 rounded-full bg-white/[0.08]" />
                <div className="absolute top-1/2 -right-6 w-28 h-28 rounded-full bg-white/[0.06]" />

                {/* Logo AGON en círculo grande — único elemento */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.65, type: 'spring', stiffness: 80 }}
                    className="relative z-10 flex flex-col items-center gap-6"
                >
                    <div className="w-72 h-72 rounded-full overflow-hidden flex items-center justify-center"
                        style={{ boxShadow: '0 0 0 14px rgba(255,255,255,0.18), 0 20px 70px rgba(0,0,0,0.5)' }}>
                        <img src={AGON_LOGO} alt="AGON" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center space-y-1.5">
                        <p className="text-white font-black text-3xl tracking-[0.15em]">AGON</p>
                        <p className="text-blue-200/75 text-xs font-semibold uppercase tracking-[0.22em]">
                            Control de Gestión Académica
                        </p>
                    </div>
                </motion.div>

                <p className="absolute bottom-5 text-white/20 text-[9px] tracking-widest uppercase z-10">
                    © 2026 · UPN-CIAR
                </p>
            </div>

            {/* ══ Panel derecho — Formulario ══ */}
            <div className="w-full md:w-[55%] flex items-center justify-center bg-white px-6 md:px-14 lg:px-20">
                <div className="w-full max-w-[400px]">

                    {/* Mobile */}
                    <div className="md:hidden mb-8 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full overflow-hidden shadow">
                            <img src={AGON_LOGO} alt="AGON" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="font-black text-blue-800 text-sm tracking-widest">AGON</p>
                            <p className="text-slate-400 text-xs">Control de Gestión Académica</p>
                        </div>
                    </div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>

                        <div className="mb-8">
                            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.25em] mb-1">AGON</p>
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
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all text-sm font-medium"
                                        placeholder="1234567890" inputMode="numeric" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all text-sm font-medium"
                                        placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600" /> Recordarme
                                </label>
                                <Link to="/forgot-password" className="text-blue-500 hover:text-blue-700 font-semibold text-xs">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 text-red-500 text-sm font-medium border border-red-100 flex gap-2">
                                    ⚠️ {error}
                                </div>
                            )}

                            <button type="submit" disabled={loading}
                                className="w-full py-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-1"
                                style={{ background: 'linear-gradient(135deg, #0038b0, #0062f0)', boxShadow: '0 6px 28px rgba(0,70,200,0.4)' }}>
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Conectando...
                                    </>
                                ) : (
                                    <>Iniciar sesión <ArrowRight className="h-4 w-4" /></>
                                )}
                            </button>

                            <p className="text-center text-slate-400 text-sm pt-1">
                                ¿No tienes cuenta?{' '}
                                <Link to={classCode ? `/register?code=${classCode}` : '/register'} className="text-blue-600 font-bold hover:underline">
                                    Regístrate
                                </Link>
                            </p>
                        </form>

                        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-center gap-2">
                            <span className="text-[11px] text-slate-400">Elaborado por <span className="font-semibold text-slate-500">Lic. Juan Ramírez</span> · © 2026</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
