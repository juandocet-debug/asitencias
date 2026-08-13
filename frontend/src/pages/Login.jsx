import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react';
import api, { setAccessToken } from '../services/api';
import { useUser } from '../context/UserContext';
import fondoHero from '../assets/FondoHero2.png';
import avatarGamer from '../assets/gamer_avatar_1.png';
import friendsSticker from '../assets/sticker_friends_neon.png';

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

    const handleSubmit = async event => {
        event.preventDefault();
        if (!username || !password) return;
        setError('');
        setLoading(true);
        try {
            const response = await api.post('/token/', { username, password });
            setAccessToken(response.data.access);
            localStorage.setItem('username', username);
            const userData = fetchUser ? await fetchUser() : null;
            if (userData?.requires_onboarding) navigate('/complete-profile');
            else navigate(classCode ? `/register?code=${classCode}` : '/dashboard');
        } catch (err) {
            const status = err?.response?.status;
            const disconnected = err?.code === 'ECONNABORTED' || !err?.response;
            if (disconnected) setError('No se pudo conectar. Revisa tu conexión e intenta de nuevo.');
            else if (status === 401 || status === 400) setError('Credenciales inválidas. Verifica tus datos.');
            else setError('No fue posible iniciar sesión. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen overflow-hidden bg-[#0c0918] font-['Montserrat'] text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(118,87,246,0.42),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(204,255,0,0.13),transparent_25%)]" />
            <BrandPanel />
            <main className="relative z-10 flex w-full items-center justify-center px-5 py-8 md:w-[55%] md:px-14 lg:px-20">
                <div className="w-full max-w-[420px]">
                    <MobileBrand />
                    <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-[2rem] border border-white/10 bg-[#171329]/90 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
                        <LoginHeader classCode={classCode} />
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <LoginField icon={User} label="Correo, usuario o cédula" value={username} onChange={setUsername} placeholder="correo@upn.edu.co o documento" autoComplete="username" />
                            <PasswordField value={password} onChange={setPassword} show={showPassword} toggle={() => setShowPassword(value => !value)} />
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-violet-200/45">Acceso seguro AGON</span>
                                <Link to="/forgot-password" className="text-xs font-black text-[#ccff00] hover:text-lime-200">¿Olvidaste tu contraseña?</Link>
                            </div>
                            {error && <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm font-bold text-red-300">{error}</div>}
                            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7657f6] to-[#9a6dff] py-4 text-sm font-black text-white shadow-[0_12px_32px_rgba(118,87,246,0.38)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                                {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Conectando...</> : <>Entrar a AGON <ArrowRight size={17} /></>}
                            </button>
                            <p className="text-center text-sm text-violet-200/55">¿Nuevo en la aventura?{' '}<Link to={classCode ? `/register?code=${classCode}` : '/register'} className="font-black text-[#ccff00] hover:underline">Crea tu perfil</Link></p>
                        </form>
                        <p className="mt-7 border-t border-white/10 pt-5 text-center text-[10px] font-semibold text-violet-200/35">UPN · Control de Gestión Académica · 2026</p>
                    </motion.section>
                </div>
            </main>
        </div>
    );
}

function BrandPanel() {
    return (
        <aside className="relative z-10 hidden w-[45%] items-center justify-center overflow-hidden px-10 md:flex">
            <img src={fondoHero} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#120b2b]/45 via-[#25104f]/70 to-[#090611]" />
            <motion.div initial={{ opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center">
                <div className="relative mx-auto flex h-64 w-64 items-center justify-center rounded-full border border-[#ccff00]/40 bg-[#140f27]/80 shadow-[0_0_70px_rgba(204,255,0,0.18)]">
                    <img src={avatarGamer} alt="Avatar AGON" className="h-[112%] w-[112%] object-contain drop-shadow-[0_24px_35px_rgba(0,0,0,0.8)]" />
                    <img src={friendsSticker} alt="" className="absolute -bottom-4 -right-10 h-24 w-24 object-contain drop-shadow-[0_12px_25px_rgba(204,255,0,0.35)]" />
                </div>
                <p className="mt-8 text-xs font-black uppercase tracking-[0.42em] text-[#ccff00]">Entra al juego</p>
                <h1 className="mt-2 text-5xl font-black tracking-[0.12em]">AGON</h1>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-200/70">Tu experiencia académica evoluciona</p>
            </motion.div>
        </aside>
    );
}

function MobileBrand() {
    return <div className="mb-5 md:hidden"><p className="text-xs font-black uppercase tracking-[0.35em] text-[#ccff00]">AGON</p><p className="mt-1 text-sm font-bold text-violet-200/60">Control de Gestión Académica</p></div>;
}

function LoginHeader({ classCode }) {
    return (
        <header className="mb-7">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ccff00]">Acceso de jugador</p>
            <h2 className="mt-2 text-[2rem] font-black leading-tight">Iniciar sesión</h2>
            {classCode ? <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-200">Clase: {classCode}</div> : <p className="mt-1 text-sm font-semibold text-violet-200/50">Continúa tus clases, misiones y logros.</p>}
        </header>
    );
}

function LoginField({ icon: Icon, label, value, onChange, ...props }) {
    return <label className="block space-y-1.5"><span className="text-xs font-black uppercase tracking-wider text-violet-200/65">{label}</span><span className="relative block"><Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300/55" /><input {...props} value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-violet-400/20 bg-white/[0.06] py-3.5 pl-11 pr-4 text-sm font-semibold text-white placeholder-violet-200/25 outline-none transition focus:border-[#ccff00]/70 focus:ring-2 focus:ring-[#ccff00]/10" /></span></label>;
}

function PasswordField({ value, onChange, show, toggle }) {
    return <label className="block space-y-1.5"><span className="text-xs font-black uppercase tracking-wider text-violet-200/65">Contraseña</span><span className="relative block"><Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300/55" /><input type={show ? 'text' : 'password'} value={value} onChange={event => onChange(event.target.value)} autoComplete="current-password" placeholder="••••••••" className="w-full rounded-xl border border-violet-400/20 bg-white/[0.06] py-3.5 pl-11 pr-12 text-sm font-semibold text-white placeholder-violet-200/25 outline-none transition focus:border-[#ccff00]/70 focus:ring-2 focus:ring-[#ccff00]/10" /><button type="button" onClick={toggle} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-300/55">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>;
}
