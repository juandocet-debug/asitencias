import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CreditCard, Eye, EyeOff, Lock } from 'lucide-react';
import api, { setAccessToken } from '../services/api';
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

    const handleSubmit = async (event) => {
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
            const isTimeout = err?.code === 'ECONNABORTED' || !err?.response;
            if (isTimeout) setError('No se pudo conectar con el servicio. Revisa tu conexión e intenta de nuevo.');
            else if (status === 401 || status === 400) setError('Credenciales inválidas. Verifique su usuario y contraseña.');
            else setError('Error de conexión. Intenta de nuevo en un momento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            <BrandPanel />
            <div className="flex w-full flex-col items-center justify-center gap-3 bg-white px-6 md:w-[55%] md:px-14 lg:px-20">
                <div className="w-full max-w-[400px]">
                    <MobileBrand />
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
                        <LoginHeader classCode={classCode} />
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <LoginInput icon={CreditCard} label="Número de cédula" value={username} onChange={setUsername} placeholder="1234567890" inputMode="numeric" />
                            <PasswordInput value={password} onChange={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} />
                            <LoginOptions classCode={classCode} />
                            {error && <ErrorMessage message={error} />}
                            <SubmitButton loading={loading} />
                            <RegisterLink classCode={classCode} />
                        </form>
                        <FooterCredit />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function BrandPanel() {
    return (
        <div className="relative hidden flex-col items-center justify-center gap-10 overflow-hidden px-10 md:flex md:w-[45%]" style={{ background: 'linear-gradient(150deg, #001a6e 0%, #0047c8 60%, #0066f0 100%)' }}>
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
            <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-white/[0.07]" />
            <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/10" />
            <div className="absolute bottom-24 left-8 h-20 w-20 rounded-full bg-white/[0.08]" />
            <div className="absolute -right-6 top-1/2 h-28 w-28 rounded-full bg-white/[0.06]" />
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, type: 'spring', stiffness: 80 }} className="relative z-10 flex flex-col items-center gap-6">
                <div className="flex h-72 w-72 items-center justify-center overflow-hidden rounded-full" style={{ boxShadow: '0 0 0 14px rgba(255,255,255,0.18), 0 20px 70px rgba(0,0,0,0.5)' }}>
                    <img src={AGON_LOGO} alt="AGON" className="h-full w-full object-cover" />
                </div>
                <div className="space-y-1.5 text-center">
                    <p className="text-3xl font-black tracking-[0.15em] text-white">AGON</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200/75">Control de Gestión Académica</p>
                </div>
            </motion.div>
            <p className="absolute bottom-5 z-10 text-[9px] uppercase tracking-widest text-white/20">© 2026 · UPN-CIAR</p>
        </div>
    );
}

function MobileBrand() {
    return (
        <div className="mb-8 flex items-center gap-3 md:hidden">
            <div className="h-11 w-11 overflow-hidden rounded-full shadow">
                <img src={AGON_LOGO} alt="AGON" className="h-full w-full object-cover" />
            </div>
            <div>
                <p className="text-sm font-black tracking-widest text-blue-800">AGON</p>
                <p className="text-xs text-slate-400">Control de Gestión Académica</p>
            </div>
        </div>
    );
}

function LoginHeader({ classCode }) {
    return (
        <div className="mb-8">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-blue-500">AGON</p>
            <h2 className="text-[2rem] font-black leading-tight text-slate-900">Iniciar sesión</h2>
            {classCode ? (
                <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                    Clase: <span className="font-bold">{classCode}</span>
                </div>
            ) : <p className="mt-1 text-sm text-slate-400">Ingresa tu cédula y contraseña.</p>}
        </div>
    );
}

function LoginInput({ icon: Icon, label, value, onChange, placeholder, inputMode }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>
            <div className="relative">
                <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-300 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25" placeholder={placeholder} inputMode={inputMode} />
            </div>
        </div>
    );
}

function PasswordInput({ value, onChange, showPassword, setShowPassword }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contraseña</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm font-medium text-slate-900 placeholder-slate-300 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}

function LoginOptions() {
    return (
        <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-slate-500">
                <input type="checkbox" className="h-4 w-4 rounded accent-blue-600" /> Recordarme
            </label>
            <Link to="/forgot-password" className="text-xs font-semibold text-blue-500 hover:text-blue-700">¿Olvidaste tu contraseña?</Link>
        </div>
    );
}

function ErrorMessage({ message }) {
    return <div className="flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-500">⚠️ {message}</div>;
}

function SubmitButton({ loading }) {
    return (
        <button type="submit" disabled={loading} className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #0038b0, #0062f0)', boxShadow: '0 6px 28px rgba(0,70,200,0.4)' }}>
            {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Conectando...</> : <>Iniciar sesión <ArrowRight className="h-4 w-4" /></>}
        </button>
    );
}

function RegisterLink({ classCode }) {
    return (
        <p className="pt-1 text-center text-sm text-slate-400">
            ¿No tienes cuenta?{' '}
            <Link to={classCode ? `/register?code=${classCode}` : '/register'} className="font-bold text-blue-600 hover:underline">Regístrate</Link>
        </p>
    );
}

function FooterCredit() {
    return (
        <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-5">
            <span className="text-[11px] text-slate-400">Elaborado por <span className="font-semibold text-slate-500">Lic. Juan Ramírez</span> · © 2026</span>
        </div>
    );
}
