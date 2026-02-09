import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Eye, EyeOff, CreditCard } from 'lucide-react';
import api from '../services/api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return;

        setError('');
        setLoading(true);

        try {
            // Petición real al backend
            const response = await api.post('/token/', { username, password });

            // Guardar tokens
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('username', username);

            // Redirigir
            navigate('/dashboard');
        } catch (err) {
            console.error("Login error:", err);
            setError('Credenciales inválidas. Verifique su usuario y contraseña.');
        } finally {
            setLoading(false);
        }
    };

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
                            Sistema de Control de Gestión Académica
                        </h1>
                        <p className="text-xl text-blue-100 font-medium tracking-wide uppercase">
                            Licenciatura en Recreación
                        </p>
                    </div>
                </motion.div>
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
                            <h2 className="text-xl font-bold leading-tight">Gestión Académica</h2>
                            <p className="text-blue-200 text-xs font-medium tracking-widest uppercase mt-2">Licenciatura en Recreación</p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="text-center md:text-left mb-10">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Iniciar sesión</h2>
                            <p className="text-slate-500">Ingrese su número de cédula y contraseña.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
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

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Contraseña</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-upn-600 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
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
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 animate-pulse">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-upn-700 hover:bg-upn-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-upn-700/30 hover:shadow-upn-700/40 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] text-base disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Ingresando...' : 'Iniciar sesión'} <ArrowRight className="h-5 w-5" />
                            </button>

                            <div className="text-center pt-4">
                                <p className="text-slate-500 text-sm">
                                    ¿No tienes cuenta?{' '}
                                    <Link to="/register" className="text-upn-700 font-bold hover:underline">
                                        Regístrate como Estudiante
                                    </Link>
                                </p>
                            </div>
                        </form>

                        <div className="mt-12 text-center">
                            <p className="text-xs text-slate-400">
                                © 2026 Universidad Pedagógica Nacional
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
