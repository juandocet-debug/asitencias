/* eslint-disable */
import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Eye, EyeOff, CreditCard } from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

const UPN_LOGO = 'https://i.ibb.co/C5SB6zj4/Identidad-UPN-25-vertical-azul-fondo-blanco.png';
const AGON_IMG = 'https://i.ibb.co/7NNjZJ44/Chat-GPT-Image-20-feb-2026-06-33-06-p-m.png';

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
            if (classCode) {
                navigate(`/register?code=${classCode}`);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError('Credenciales inválidas. Verifique su usuario y contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex overflow-hidden">

            {/* ── Panel izquierdo — Azul UPN ── */}
            <div className="hidden md:flex md:w-[45%] relative flex-col justify-center items-center overflow-hidden"
                style={{ background: 'linear-gradient(145deg, #003d99 0%, #0055cc 50%, #0068e1 100%)' }}>

                {/* Óvalo grande fondo — superior izquierdo */}
                <div className="absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full"
                    style={{ background: 'rgba(255,255,255,0.07)' }} />

                {/* Óvalo mediano — inferior derecho */}
                <div className="absolute -bottom-20 -right-16 w-[300px] h-[300px] rounded-full"
                    style={{ background: 'rgba(255,255,255,0.07)' }} />

                {/* Óvalo pequeño flotante */}
                <div className="absolute top-[55%] left-[-60px] w-[180px] h-[180px] rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)' }} />

                {/* Contenido central */}
                <div className="relative z-10 flex flex-col items-center gap-8 px-12 text-white text-center">

                    {/* Óvalo con logo UPN */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="w-36 h-36 rounded-full bg-white shadow-2xl flex items-center justify-center"
                        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}
                    >
                        <img src={UPN_LOGO} alt="Logo UPN" className="w-24 h-24 object-contain" />
                    </motion.div>

                    {/* Texto central */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="space-y-2"
                    >
                        <h1 className="text-3xl font-black tracking-tight">BIENVENIDO</h1>
                        <p className="text-blue-200 font-semibold text-sm uppercase tracking-widest">
                            Sistema de Gestión Académica
                        </p>
                        <p className="text-white/60 text-xs leading-relaxed max-w-[220px] mx-auto">
                            Licenciatura en Recreación · Universidad Pedagógica Nacional
                        </p>
                    </motion.div>

                    {/* Óvalo con logo del sistema AGON */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35, duration: 0.6 }}
                        className="w-28 h-28 rounded-full bg-white/15 border-2 border-white/30 shadow-xl flex items-center justify-center backdrop-blur-sm"
                    >
                        <img src={AGON_IMG} alt="Logo AGON" className="w-20 h-20 object-contain" />
                    </motion.div>

                    {/* Badge activo */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                        AGON · Activo
                    </motion.div>
                </div>
            </div>

            {/* ── Panel derecho — Formulario ── */}
            <div className="w-full md:w-[55%] flex items-center justify-center bg-white px-6 md:px-12 lg:px-20">
                <div className="w-full max-w-md">

                    {/* Header mobile */}
                    <div className="md:hidden mb-8 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center">
                            <img src={UPN_LOGO} alt="UPN" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <p className="font-black text-blue-800 text-sm">AGON</p>
                            <p className="text-slate-400 text-xs">Gestión Académica · UPN</p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.5 }}
                    >
                        {/* Título */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-900 mb-1">Iniciar sesión</h2>
                            {classCode ? (
                                <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium border border-amber-100 mt-3">
                                    Clase: <span className="font-bold">{classCode}</span>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">Ingresa tu número de cédula y contraseña para continuar.</p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Cédula */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Número de Cédula</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <CreditCard className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-medium"
                                        placeholder="1234567890"
                                        inputMode="numeric"
                                    />
                                </div>
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-sm font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Recordarme / Olvidé contraseña */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-blue-600" />
                                    <span className="text-slate-500">Recordarme</span>
                                </label>
                                <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2">
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            {/* Botón principal */}
                            <button type="submit" disabled={loading}
                                className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #0050c8, #0068e1)', boxShadow: '0 4px 20px rgba(0,80,200,0.35)' }}>
                                {loading ? 'Ingresando...' : 'Iniciar sesión'}
                                <ArrowRight className="h-4 w-4" />
                            </button>

                            {/* Registro */}
                            <p className="text-center text-slate-500 text-sm pt-1">
                                ¿No tienes cuenta?{' '}
                                <Link to={classCode ? `/register?code=${classCode}` : '/register'}
                                    className="text-blue-700 font-bold hover:underline">
                                    Regístrate como Estudiante
                                </Link>
                            </p>
                        </form>

                        {/* Footer */}
                        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
                            <img src={AGON_IMG} alt="AGON" className="h-6 object-contain opacity-60" />
                            <span className="text-xs">AGON · © 2026 Universidad Pedagógica Nacional</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
