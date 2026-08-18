/* eslint-disable */
/**
 * RegisterStudent.jsx — Orquestador del flujo de registro multi-paso.
 *
 * Componentes:
 *   SidebarInfo      → components/register/SidebarInfo.jsx
 *   StepPersonalData → components/register/StepPersonalData.jsx
 *   StepPhoto        → components/register/StepPhoto.jsx
 *   Toast            → components/register/registerUtils.jsx
 *   SuccessModal     → components/register/registerUtils.jsx
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle, CheckCircle2, BookOpen, Loader2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import { Toast, SuccessModal } from '../components/register/registerUtils';
import SidebarInfo from '../components/register/SidebarInfo';
import StepPersonalData from '../components/register/StepPersonalData';
import StepPhoto from '../components/register/StepPhoto';
import MobilePageFrame from '../components/mobile/MobilePageFrame';

// ── Utilidades de validación y errores ───────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTITUTIONAL_EMAIL_RE = /^[^\s@]+@upn\.edu\.co$/i;
const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>]/;

const ERR_MAP = {
    'Enter a valid email address.': 'Ingresa un correo electrónico válido',
    'This field is required.': 'Este campo es obligatorio',
    'This field may not be blank.': 'Este campo no puede estar vacío',
    'A user with that username already exists.': 'Este correo ya está registrado',
    'user with this document number already exists.': 'Este número de documento ya está registrado',
    'user with this email already exists.': 'Este correo ya está en uso',
};
const FIELD_NAMES = {
    email: 'Correo electrónico', username: 'Correo institucional',
    document_number: 'Número de documento', first_name: 'Primer nombre',
    last_name: 'Primer apellido', phone_number: 'Número de celular',
    institutional_email: 'Correo institucional', personal_email: 'Correo personal',
};

function translateError(key, value) {
    let text = Array.isArray(value) ? value[0] : value;
    for (const [en, es] of Object.entries(ERR_MAP)) {
        if (text.includes(en)) { text = es; break; }
    }
    return `${FIELD_NAMES[key] || key}: ${text}`;
}

function getRegistrationErrorMessage(err) {
    let msg = 'Error al conectar con el servidor.';
    const d = err.response?.data;
    if (d) {
        if (typeof d === 'string') msg = d;
        else if (d.detail) msg = d.detail;
        else if (d.username) msg = d.username[0]?.includes('registrado') || d.username[0]?.includes('already') ? 'Este correo institucional ya está registrado. Inicia sesión en lugar de crear una cuenta nueva.' : translateError('username', d.username[0]);
        else if (d.email) msg = d.email[0]?.includes('registrado') || d.email[0]?.includes('already') ? 'Este correo institucional ya está registrado. Inicia sesión en lugar de crear una cuenta nueva.' : (Array.isArray(d.email) ? d.email[0] : d.email);
        else if (d.document_number) msg = 'Este número de documento ya está registrado. Inicia sesión en lugar de crear una cuenta nueva.';
        else if (d.class_code) msg = Array.isArray(d.class_code) ? d.class_code[0] : d.class_code;
        else { const k = Object.keys(d)[0]; if (k) msg = translateError(k, d[k]); }
    }
    return msg;
}

// ════════════════════════════════════════════════════════
export default function RegisterStudent() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'warning') => setToast({ message, type }), []);

    const [formData, setFormData] = useState({
        first_name: '', second_name: '', last_name: '', second_lastname: '',
        document_number: '', email: '', institutional_email: '',
        phone_number: '', class_code: '', password: '', password_confirm: '',
        faculty: '', program: '',
    });

    // Leer código desde URL
    useEffect(() => {
        const code = searchParams.get('code')?.trim().toUpperCase();
        if (!code) return;
        setFormData(p => ({ ...p, class_code: code }));
        if (!user) {
            showToast('Completa el registro para quedar vinculado a esta clase.', 'info');
        }
    }, [searchParams, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    // ── Validación paso 1 ─────────────────────────────────
    const validateStep1 = () => {
        if (!formData.first_name.trim()) { showToast('El primer nombre es obligatorio', 'error'); return false; }
        if (!formData.last_name.trim()) { showToast('El primer apellido es obligatorio', 'error'); return false; }
        if (!formData.document_number.trim()) { showToast('El número de documento es obligatorio', 'error'); return false; }
        if (!/^\d+$/.test(formData.document_number)) { showToast('El documento debe contener solo números', 'error'); return false; }
        if (!formData.institutional_email.trim()) { showToast('El correo institucional es obligatorio', 'error'); return false; }
        if (!INSTITUTIONAL_EMAIL_RE.test(formData.institutional_email)) { showToast('Correo institucional inválido. Usa tu correo @upn.edu.co', 'error'); return false; }
        if (formData.email.trim() && !EMAIL_RE.test(formData.email)) { showToast('Correo personal inválido', 'error'); return false; }
        if (!formData.password.trim()) { showToast('La contraseña es obligatoria', 'error'); return false; }
        if (formData.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return false; }
        if (!SPECIAL_RE.test(formData.password)) { setError('La contraseña debe contener al menos un carácter especial (!@#$%^&*...)'); return false; }
        if (formData.password !== formData.password_confirm) { showToast('Las contraseñas no coinciden', 'error'); return false; }
        return true;
    };

    const buildRegistrationData = ({ dryRun = false, photo = null } = {}) => {
        const institutionalEmail = formData.institutional_email.trim().toLowerCase();
        const data = new FormData();
        data.append('first_name', formData.first_name.trim());
        data.append('second_name', formData.second_name.trim());
        data.append('last_name', formData.last_name.trim());
        data.append('second_lastname', formData.second_lastname.trim());
        data.append('document_number', formData.document_number.trim());
        data.append('personal_email', formData.email.trim());
        data.append('username', institutionalEmail);
        data.append('email', institutionalEmail);
        data.append('password', formData.password.trim());
        data.append('phone_number', formData.phone_number.trim());
        if (formData.faculty) data.append('faculty', formData.faculty);
        if (formData.program) data.append('program', formData.program);
        if (formData.class_code.trim()) data.append('class_code', formData.class_code.trim());
        if (dryRun) data.append('dry_run', 'true');
        if (photo) data.append('photo', photo);
        return data;
    };

    const validateAndContinue = async () => {
        if (!validateStep1()) return;
        setLoading(true); setError(null);
        try {
            await api.post('/users/register/student/', buildRegistrationData({ dryRun: true }), { headers: { 'Content-Type': 'multipart/form-data' } });
            setStep(2);
        } catch (err) {
            const msg = getRegistrationErrorMessage(err);
            setError(msg);
            showToast(msg, 'error');
            if (err.response?.data?.document_number || err.response?.data?.email || err.response?.data?.username) {
                setTimeout(() => navigate(formData.class_code.trim() ? `/login?code=${formData.class_code.trim()}` : '/login'), 1800);
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Envío del formulario ──────────────────────────────
    const handleSubmit = async (photo) => {
        setLoading(true); setError(null);
        try {
            await api.post('/users/register/student/', buildRegistrationData({ photo }), { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowSuccess(true);
        } catch (err) {
            const msg = getRegistrationErrorMessage(err);
            setError(msg); showToast(msg, 'error');
        } finally { setLoading(false); }
    };

    // ── Flujo "unirse a clase" para usuario ya logueado ──
    const handleJoinClass = async (e) => {
        e.preventDefault();
        if (!formData.class_code.trim()) { showToast('Ingresa el código', 'error'); return; }
        setLoading(true); setError(null);
        try {
            await api.post('/users/join-class/', { class_code: formData.class_code.trim() });
            showToast('¡Te has unido a la clase exitosamente!', 'success');
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err) {
            const msg = err.response?.data?.detail || err.response?.data?.error || 'Código de clase inválido';
            setError(msg); showToast(msg, 'error');
        } finally { setLoading(false); }
    };

    if (user) {
        return (
            <MobilePageFrame>
                {toast && <Toast {...toast} onClose={() => setToast(null)} />}
                <div className="pt-4">
                    <button onClick={() => navigate('/dashboard')} className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-slate-500 shadow-sm ring-1 ring-slate-100">
                        <ArrowLeft size={16} /> Volver al panel
                    </button>

                    <section className="overflow-hidden rounded-[2.2rem] bg-white shadow-[0_18px_50px_rgba(50,58,90,0.10)] ring-1 ring-white/80">
                        <div className="bg-gradient-to-br from-[#8b6dff] to-[#7657f6] p-6 text-white">
                            <div className="mb-10 grid h-14 w-14 place-items-center rounded-2xl bg-white/20">
                                <BookOpen size={26} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.35em] text-white/70">Clase</p>
                            <h1 className="mt-2 text-3xl font-black leading-tight">Agregarme a una clase</h1>
                            <p className="mt-3 text-sm font-semibold text-white/75">Ingresa el código que te dio tu profesor.</p>
                        </div>

                        {user.role === 'STUDENT' ? (
                            <form onSubmit={handleJoinClass} className="space-y-5 p-5">
                                {error && (
                                    <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
                                        {error}
                                    </div>
                                )}
                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Código de clase</span>
                                    <input
                                        type="text"
                                        name="class_code"
                                        value={formData.class_code}
                                        onChange={handleChange}
                                        placeholder="Ej: MATH101"
                                        required
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center font-black uppercase tracking-[0.25em] text-slate-900 outline-none focus:border-[#7657f6] focus:ring-4 focus:ring-violet-100"
                                    />
                                </label>
                                <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-4 text-base font-black text-white shadow-xl shadow-slate-300/60 disabled:opacity-70">
                                    {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> Unirme con código</>}
                                </button>
                            </form>
                        ) : (
                            <div className="p-5">
                                <div className="rounded-2xl bg-amber-50 p-5 text-center text-sm font-semibold text-amber-700">
                                    Esta acción es solo para estudiantes.
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </MobilePageFrame>
        );
    }

    return (
        <div className="min-h-screen overflow-hidden bg-[#0c0918] font-['Montserrat'] md:flex md:flex-row">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            {showSuccess && <SuccessModal onClose={() => { setShowSuccess(false); navigate('/login'); }} />}

            {/* Panel izquierdo */}
            <SidebarInfo step={step} />

            {/* Panel derecho — formulario */}
            <div className="relative flex w-full flex-col bg-[radial-gradient(circle_at_90%_0%,rgba(204,255,0,0.12),transparent_28%),linear-gradient(145deg,#171329,#0c0918)] md:h-screen md:w-7/12 md:overflow-y-auto">
                <div className="w-full max-w-3xl mx-auto p-0 md:p-10 lg:p-12">

                    {/* Mobile header */}
                    <div className="relative mb-5 overflow-hidden rounded-b-[2.2rem] border-b border-[#ccff00]/20 bg-[#1a1432] p-6 text-center text-white shadow-xl md:hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-[-50%] left-[-50%] w-[400px] h-[400px] rounded-full bg-white blur-3xl" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.38em] text-[#ccff00]">Nuevo jugador</p>
                            <h2 className="mt-2 text-2xl font-black">Registro de Estudiantes</h2>
                            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-violet-200/70">Licenciatura en Recreación</p>
                        </div>
                    </div>

                    <div className="px-4 pb-8 md:px-0">
                        <Link to={formData.class_code.trim() ? `/login?code=${formData.class_code.trim()}` : '/login'} className="group mb-4 inline-flex items-center text-sm font-bold text-violet-200/55 transition-colors hover:text-[#ccff00]">
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Volver al Login
                        </Link>

                        <h2 className="mb-2 text-2xl font-black text-white md:text-3xl">
                            Crear cuenta
                        </h2>
                        <p className="mb-5 text-sm text-violet-200/55 md:text-base">
                            Completa tu perfil y entra a la experiencia AGON.
                        </p>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3 text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={e => e.preventDefault()} className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.96] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)] md:space-y-6 md:p-6">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <StepPersonalData
                                        formData={formData}
                                        onChange={handleChange}
                                        onNext={validateAndContinue}
                                        loading={loading}
                                    />
                                )}
                                {step === 2 && (
                                    <StepPhoto
                                        formData={formData}
                                        setFormData={setFormData}
                                        onBack={() => setStep(1)}
                                        onSubmit={handleSubmit}
                                        loading={loading}
                                        error={error}
                                        showToast={showToast}
                                    />
                                )}
                            </AnimatePresence>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}


