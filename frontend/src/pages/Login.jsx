import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react';
import api, { setAccessToken } from '../services/api';
import { useUser } from '../context/UserContext';
import fondoLogin from '../assets/fondoLogin.png';
import superiorLogo from '../assets/superior.png';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const MotionSection = motion.section;
const MotionDiv = motion.div;

export default function Login() {
    const { fetchUser } = useUser();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTraditional, setShowTraditional] = useState(!GOOGLE_CLIENT_ID);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const classCode = searchParams.get('code');

    const joinClassFromCode = useCallback(async () => {
        if (!classCode) return null;
        try {
            const response = await api.post('/users/join-class/', { class_code: classCode });
            return response.data?.course || null;
        } catch (joinError) {
            const message = String(joinError?.response?.data?.error || joinError?.response?.data?.detail || '');
            if (message.toLowerCase().includes('inscrito')) return null;
            throw new Error(message || 'No pudimos unirte a esta clase.');
        }
    }, [classCode]);

    const finishLogin = useCallback(async (access, savedUsername = '') => {
        setAccessToken(access);
        if (savedUsername) localStorage.setItem('username', savedUsername);
        const userData = fetchUser ? await fetchUser() : null;
        if (!userData) throw new Error('PROFILE_NOT_AVAILABLE');
        if (userData.requires_onboarding) {
            navigate(classCode ? `/complete-profile?code=${encodeURIComponent(classCode)}` : '/complete-profile');
        } else {
            const course = await joinClassFromCode();
            navigate(course?.id ? `/classes/${course.id}` : '/dashboard');
        }
    }, [classCode, fetchUser, joinClassFromCode, navigate]);

    const handleGoogleCredential = useCallback(async credential => {
        if (!credential) return;
        setError('');
        setLoading(true);
        try {
            const response = await api.post('/users/auth/google/', { credential });
            await finishLogin(response.data.access);
        } catch (err) {
            if (err.message === 'PROFILE_NOT_AVAILABLE') {
                setError('Google confirmó tu acceso, pero no pudimos cargar tu perfil. Intenta nuevamente.');
            } else {
                setError(err?.response?.data?.detail || 'No fue posible ingresar con Google.');
            }
        } finally {
            setLoading(false);
        }
    }, [finishLogin]);

    const handleSubmit = async event => {
        event.preventDefault();
        if (!username || !password) return;
        setError('');
        setLoading(true);
        try {
            const response = await api.post('/token/', { username, password });
            await finishLogin(response.data.access, username);
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
        <div className="relative min-h-screen overflow-hidden bg-[#050612] font-['Montserrat'] text-white">
            <img src={fondoLogin} alt="" className="absolute inset-0 h-full w-full object-cover object-[62%_center]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,18,0.95)_0%,rgba(8,7,24,0.83)_28%,rgba(8,7,24,0.28)_52%,rgba(5,6,18,0.18)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_17%_18%,rgba(118,87,246,0.28),transparent_28%),radial-gradient(circle_at_34%_68%,rgba(204,255,0,0.06),transparent_22%)]" />

            <main className="relative z-10 flex min-h-screen w-full items-center px-4 py-6 sm:px-8 lg:px-16">
                <div className="w-full max-w-[430px]">
                    <MotionSection initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="relative overflow-hidden rounded-[1.75rem] border border-[#8f5cff]/55 bg-[#080716]/82 p-6 shadow-[0_0_0_1px_rgba(204,255,0,0.05),0_30px_90px_rgba(0,0,0,0.65),0_0_48px_rgba(118,87,246,0.28)] backdrop-blur-xl sm:p-8">
                        <span className="pointer-events-none absolute left-0 top-10 h-24 w-px bg-[#b875ff] shadow-[0_0_18px_#a855f7]" />
                        <span className="pointer-events-none absolute right-0 top-14 h-16 w-px bg-[#b875ff] shadow-[0_0_18px_#a855f7]" />
                        <MotionDiv
                            className="mb-6 flex justify-center"
                            initial={{ opacity: 0, y: -16, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: [1, 1.018, 1] }}
                            transition={{ opacity: { duration: 0.45 }, y: { duration: 0.45 }, scale: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' } }}
                        >
                            <img src={superiorLogo} alt="AGON" className="w-full max-w-[330px] drop-shadow-[0_0_30px_rgba(118,87,246,0.42)]" />
                        </MotionDiv>
                        <LoginHeader classCode={classCode} />
                        {GOOGLE_CLIENT_ID && (
                            <div className="space-y-3">
                                <GoogleSignInButton clientId={GOOGLE_CLIENT_ID} onCredential={handleGoogleCredential} disabled={loading} />
                                <p className="text-center text-[11px] font-bold text-violet-200/45">Usa tu cuenta institucional @upn.edu.co</p>
                                {error && <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm font-bold text-red-300">{error}</div>}
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-violet-200/35">
                                    <span className="h-px flex-1 bg-white/12" /> o <span className="h-px flex-1 bg-white/12" />
                                </div>
                                <button type="button" onClick={() => setShowTraditional(value => !value)} className="w-full rounded-xl border border-white/12 bg-white/[0.04] py-3 text-xs font-black text-violet-100 transition hover:bg-white/[0.08]">
                                    {showTraditional ? 'Ocultar acceso con contraseña' : 'Ingresar con usuario o contraseña'}
                                </button>
                            </div>
                        )}
                        {showTraditional && <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <LoginField icon={User} label="Correo, usuario o cédula" value={username} onChange={setUsername} placeholder="correo@upn.edu.co o documento" autoComplete="username" />
                            <PasswordField value={password} onChange={setPassword} show={showPassword} toggle={() => setShowPassword(value => !value)} />
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-violet-200/45">Acceso seguro AGON</span>
                                <Link to="/forgot-password" className="text-xs font-black text-[#ccff00] hover:text-lime-200">¿Olvidaste tu contraseña?</Link>
                            </div>
                            {error && !GOOGLE_CLIENT_ID && <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm font-bold text-red-300">{error}</div>}
                            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7657f6] to-[#9a6dff] py-4 text-sm font-black text-white shadow-[0_12px_32px_rgba(118,87,246,0.38)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                                {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Conectando...</> : <>Entrar a AGON <ArrowRight size={17} /></>}
                            </button>
                            <div className="flex items-center gap-4 pt-1 text-center text-sm text-violet-200/55">
                                <span className="h-px flex-1 bg-white/18" />
                                <p>¿Nuevo en la aventura?{' '}<Link to={classCode ? `/register?code=${classCode}` : '/register'} className="font-black text-[#ccff00] hover:underline">Crea tu perfil</Link></p>
                                <span className="h-px flex-1 bg-white/18" />
                            </div>
                        </form>}
                        <p className="mt-7 border-t border-white/10 pt-5 text-center text-[10px] font-semibold text-violet-200/35">UPN · Control de Gestión Académica · 2026</p>
                    </MotionSection>
                </div>
            </main>
        </div>
    );
}

function LoginHeader({ classCode }) {
    return (
        <header className="mb-7">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ccff00]">{classCode ? 'Continuar con Google' : 'Acceso de jugador'}</p>
            <h2 className="mt-2 text-[2rem] font-black leading-tight">Iniciar sesión</h2>
            {classCode ? <div className="mt-3 rounded-xl border border-[#ccff00]/25 bg-[#ccff00]/10 px-4 py-2 text-sm font-bold text-lime-100">Clase: {classCode}. Usa tu correo institucional para unirte.</div> : <p className="mt-1 text-sm font-semibold text-violet-200/50">Continúa tus clases, misiones y logros.</p>}
        </header>
    );
}

function LoginField({ icon: Icon, label, value, onChange, ...props }) {
    return <label className="block space-y-1.5"><span className="text-xs font-black uppercase tracking-wider text-violet-200/65">{label}</span><span className="relative block">{React.createElement(Icon, { className: 'absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300/55' })}<input {...props} value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-violet-400/20 bg-white/[0.06] py-3.5 pl-11 pr-4 text-sm font-semibold text-white placeholder-violet-200/25 outline-none transition focus:border-[#ccff00]/70 focus:ring-2 focus:ring-[#ccff00]/10" /></span></label>;
}

function PasswordField({ value, onChange, show, toggle }) {
    return <label className="block space-y-1.5"><span className="text-xs font-black uppercase tracking-wider text-violet-200/65">Contraseña</span><span className="relative block"><Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300/55" /><input type={show ? 'text' : 'password'} value={value} onChange={event => onChange(event.target.value)} autoComplete="current-password" placeholder="••••••••" className="w-full rounded-xl border border-violet-400/20 bg-white/[0.06] py-3.5 pl-11 pr-12 text-sm font-semibold text-white placeholder-violet-200/25 outline-none transition focus:border-[#ccff00]/70 focus:ring-2 focus:ring-[#ccff00]/10" /><button type="button" onClick={toggle} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-300/55">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>;
}
