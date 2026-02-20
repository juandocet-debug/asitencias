/* eslint-disable */
import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Eye, EyeOff, CreditCard } from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

const UPN_LOGO = '/upn-logo.png';
const AGON_IMG = '/este-agon.png';

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
            console.error('Login error:', err);
            setError('Credenciales inválidas. Verifique su usuario y contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row shadow-2xl overflow-hidden">

            {/* ── Panel izquierdo — Desktop ───────────────────────────────── */}
            <div className="hidden md:flex md:w-1/2 bg-upn-700 relative flex-col justify-between items-center text-white p-10 overflow-hidden">

                {/* Fondos decorativos */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/10 blur-3xl" />
                </div>

                {/* ── Sección superior: logo UPN oficial ── */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 text-center pt-4 w-full"
                >
                    <div className="inline-block bg-white rounded-2xl px-6 py-4 shadow-2xl shadow-black/20">
                        <img src={UPN_LOGO} alt="Logo UPN" className="h-24 object-contain mx-auto" />
                    </div>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">
                        Universidad Pedagógica Nacional
                    </p>
                </motion.div>

                {/* ── Sección central: título ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className="relative z-10 text-center space-y-2 px-4"
                >
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight leading-snug">
                        Sistema de Control de<br />Gestión Académica
                    </h1>
                    <p className="text-blue-200/80 font-medium tracking-[0.2em] uppercase text-xs">
                        Licenciatura en Recreación
                    </p>
                </motion.div>

                {/* ── Sección inferior: AGON en tarjeta blanca ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6, type: 'spring', stiffness: 100 }}
                    className="relative z-10 w-full pb-2"
                >
                    {/* Etiqueta "Desarrollado con" */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-white/15" />
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.25em]">Desarrollado con</span>
                        <div className="flex-1 h-px bg-white/15" />
                    </div>

                    {/* Tarjeta blanca AGON */}
                    <div className="bg-white rounded-3xl shadow-2xl shadow-black/25 overflow-hidden">
                        {/* Cabecera de la tarjeta */}
                        <div className="bg-gradient-to-r from-upn-600 to-blue-500 px-5 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black tracking-[0.25em] text-white uppercase">AGON</p>
                                <p className="text-[10px] text-blue-100/90 font-medium mt-0.5">Tu asistente académico inteligente</p>
                            </div>
                            {/* Indicador activo */}
                            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                <span className="text-[10px] text-white font-bold">Activo</span>
                            </div>
                        </div>

                        {/* Mascota sobre fondo blanco */}
                        <div className="bg-white flex items-end justify-center pt-2 pb-0 relative overflow-hidden">
                            {/* Sombra suave debajo de la mascota */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-200/50 blur-xl rounded-full" />
                            <img
                                src={AGON_IMG}
                                alt="AGON — Mascota del sistema"
                                className="relative h-44 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500 cursor-default"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Panel derecho — Formulario ─────────────────────────────── */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-white">
                <div className="w-full max-w-md space-y-8">

                    {/* Mobile header — ambos logos en fila */}
                    <div className="md:hidden mb-6 -mt-6 -mx-6 bg-upn-700 px-6 py-5 rounded-b-[2.5rem] shadow-xl relative overflow-hidden text-white">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute top-[-50%] left-[-50%] w-[400px] h-[400px] rounded-full bg-white blur-3xl" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            {/* UPN */}
                            <div className="bg-white p-2 rounded-xl shadow-md flex-shrink-0">
                                <img src={UPN_LOGO} alt="UPN" className="h-12 object-contain" />
                            </div>
                            {/* Texto */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold leading-tight">Gestión Académica</p>
                                <p className="text-blue-200 text-[10px] tracking-widest uppercase mt-0.5">Licenciatura en Recreación</p>
                            </div>
                            {/* Mascota */}
                            <img
                                src={AGON_IMG}
                                alt="ESTE AGON"
                                className="h-16 object-contain drop-shadow-lg flex-shrink-0"
                            />
                        </div>
                    </div>

                    {/* Formulario */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="text-center md:text-left mb-10">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Iniciar sesión</h2>
                            {classCode ? (
                                <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium border border-amber-100 mb-2">
                                    Inicia sesión para unirte a la clase: <span className="font-bold">{classCode}</span>
                                </div>
                            ) : (
                                <p className="text-slate-500">Ingrese su número de cédula y contraseña.</p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Cédula */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Número de Cédula</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <CreditCard className="h-5 w-5 text-slate-400 group-focus-within:text-upn-600 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-600 transition-all font-medium"
                                        placeholder="1234567890"
                                        inputMode="numeric"
                                    />
                                </div>
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Contraseña</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-upn-600 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-600 transition-all font-medium"
                                        placeholder="••••••••"
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

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-upn-600 focus:ring-upn-500" />
                                    <span className="text-slate-600">Recordarme</span>
                                </label>
                                <Link to="/forgot-password" className="text-upn-600 hover:text-upn-700 font-semibold transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2">
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-upn-700 hover:bg-upn-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-upn-700/30 hover:shadow-upn-700/40 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] text-base disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Ingresando...' : 'Iniciar sesión'} <ArrowRight className="h-5 w-5" />
                            </button>

                            <div className="text-center pt-2">
                                <p className="text-slate-500 text-sm">
                                    ¿No tienes cuenta?{' '}
                                    <Link to={classCode ? `/register?code=${classCode}` : '/register'} className="text-upn-700 font-bold hover:underline">
                                        Regístrate como Estudiante
                                    </Link>
                                </p>
                            </div>
                        </form>

                        {/* Footer con ESTE AGON pegueño en desktop */}
                        <div className="mt-10 flex items-center justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                            <img src={AGON_IMG} alt="AGON" className="h-8 object-contain" />
                            <p className="text-xs text-slate-400">
                                AGON · © 2026 Universidad Pedagógica Nacional
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
