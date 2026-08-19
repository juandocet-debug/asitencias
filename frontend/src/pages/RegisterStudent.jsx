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
import axios from 'axios';
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
import fondoLogin from '../assets/fondoLogin.png';
import superiorLogo from '../assets/superior.png';

// ── Utilidades de validación y errores ───────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTITUTIONAL_EMAIL_RE = /^[^\s@]+@upn\.edu\.co$/i;
const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>]/;
const REGISTRATION_API_URL = import.meta.env.VITE_REGISTRATION_API_URL
    || 'https://agon-backend-production-c5d2.up.railway.app/api/users/register/student/';

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

function hasRegisteredConflict(err) {
    const d = err.response?.data;
    if (!d || typeof d === 'string') return false;
    const values = [];
    for (const key of ['document_number', 'email', 'username']) {
        const value = d[key];
        if (Array.isArray(value)) values.push(...value);
        else if (value) values.push(value);
    }
    return values.some(value => {
        const text = String(value).toLowerCase();
        return text.includes('registrado') || text.includes('already exists') || text.includes('already registered');
    });
}

function isDuplicateDocumentError(err) {
    const value = err.response?.data?.document_number;
    const text = Array.isArray(value) ? value.join(' ') : String(value || '');
    return text.toLowerCase().includes('registrado') || text.toLowerCase().includes('already');
}

// ════════════════════════════════════════════════════════
export default function RegisterStudent() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [step, setStep] = useState(1);
    const [registrationPage, setRegistrationPage] = useState(1);
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
        setError(null);
    };

    const syncPageValues = (values) => {
        if (!values || Object.keys(values).length === 0) return;
        setFormData(current => ({ ...current, ...values }));
        setError(null);
    };

    // ── Validación paso 1 ─────────────────────────────────
    const validateDocumentStep = (data = formData) => {
        if (!data.first_name.trim()) { showToast('El primer nombre es obligatorio', 'error'); return false; }
        if (!data.last_name.trim()) { showToast('El primer apellido es obligatorio', 'error'); return false; }
        if (!data.document_number.trim()) { showToast('El número de documento es obligatorio', 'error'); return false; }
        if (!/^\d+$/.test(data.document_number)) { showToast('El documento debe contener solo números', 'error'); return false; }
        return true;
    };

    const validateDocumentAndContinue = async (visibleValues = {}) => {
        const currentData = { ...formData, ...visibleValues };
        syncPageValues(visibleValues);
        if (!validateDocumentStep(currentData)) return false;
        setLoading(true);
        setError(null);
        try {
            await axios.post(REGISTRATION_API_URL, {
                document_number: currentData.document_number.trim(),
                document_check: true,
            });
            return true;
        } catch (err) {
            const duplicate = err.response?.status === 409 || isDuplicateDocumentError(err);
            const msg = duplicate
                ? 'No se puede continuar con este documento. Si ya tienes cuenta, inicia sesión.'
                : getRegistrationErrorMessage(err);
            setError(msg);
            showToast(msg, 'error');
            if (duplicate) {
                setTimeout(() => navigate(currentData.class_code.trim() ? `/login?code=${currentData.class_code.trim()}` : '/login'), 1800);
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    const validateStep1 = (data = formData) => {
        if (!data.first_name.trim()) { showToast('El primer nombre es obligatorio', 'error'); return false; }
        if (!data.last_name.trim()) { showToast('El primer apellido es obligatorio', 'error'); return false; }
        if (!data.document_number.trim()) { showToast('El número de documento es obligatorio', 'error'); return false; }
        if (!/^\d+$/.test(data.document_number)) { showToast('El documento debe contener solo números', 'error'); return false; }
        if (!data.institutional_email.trim()) { showToast('El correo institucional es obligatorio', 'error'); return false; }
        if (!INSTITUTIONAL_EMAIL_RE.test(data.institutional_email)) { showToast('Correo institucional inválido. Usa tu correo @upn.edu.co', 'error'); return false; }
        if (data.email.trim() && !EMAIL_RE.test(data.email)) { showToast('Correo personal inválido', 'error'); return false; }
        if (!data.password.trim()) { showToast('La contraseña es obligatoria', 'error'); return false; }
        if (data.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return false; }
        if (!SPECIAL_RE.test(data.password)) { setError('La contraseña debe contener al menos un carácter especial (!@#$%^&*...)'); return false; }
        if (data.password !== data.password_confirm) { showToast('Las contraseñas no coinciden', 'error'); return false; }
        return true;
    };

    const buildRegistrationData = ({ dryRun = false, photo = null, source = formData } = {}) => {
        const institutionalEmail = source.institutional_email.trim().toLowerCase();
        const data = new FormData();
        data.append('first_name', source.first_name.trim());
        data.append('second_name', source.second_name.trim());
        data.append('last_name', source.last_name.trim());
        data.append('second_lastname', source.second_lastname.trim());
        data.append('document_number', source.document_number.trim());
        data.append('personal_email', source.email.trim());
        data.append('username', institutionalEmail);
        data.append('email', institutionalEmail);
        data.append('password', source.password.trim());
        data.append('phone_number', source.phone_number.trim());
        if (source.faculty) data.append('faculty', source.faculty);
        if (source.program) data.append('program', source.program);
        if (source.class_code.trim()) data.append('class_code', source.class_code.trim());
        if (dryRun) data.append('dry_run', 'true');
        if (photo) data.append('photo', photo);
        return data;
    };

    const validateAndContinue = async (visibleValues = {}) => {
        const currentData = { ...formData, ...visibleValues };
        syncPageValues(visibleValues);
        if (!validateStep1(currentData)) return;
        setLoading(true); setError(null);
        try {
            await axios.post(REGISTRATION_API_URL, buildRegistrationData({ dryRun: true, source: currentData }));
            setStep(2);
        } catch (err) {
            const msg = isDuplicateDocumentError(err)
                ? 'Este número de documento ya está registrado. Inicia sesión en lugar de crear una cuenta nueva.'
                : getRegistrationErrorMessage(err);
            setError(msg);
            showToast(msg, 'error');
            if (hasRegisteredConflict(err)) {
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
            await axios.post(REGISTRATION_API_URL, buildRegistrationData({ photo }));
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
        <div className="relative min-h-screen overflow-hidden bg-[#050612] font-['Montserrat'] md:flex md:flex-row">
            <img src={fondoLogin} alt="" className="absolute inset-0 h-full w-full object-cover object-[62%_center] md:hidden" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,18,0.88),rgba(12,9,24,0.92))] md:hidden" />
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            {showSuccess && <SuccessModal onClose={() => { setShowSuccess(false); navigate('/login'); }} />}

            {/* Panel izquierdo */}
            <SidebarInfo step={step === 2 ? 5 : registrationPage} />

            {/* Panel derecho — formulario */}
            <div className="relative z-10 flex w-full flex-col bg-[radial-gradient(circle_at_90%_0%,rgba(204,255,0,0.10),transparent_28%),linear-gradient(145deg,#100c22,#060713)] md:h-screen md:w-7/12 md:overflow-hidden">
                <div className="mx-auto flex h-full w-full max-w-3xl flex-col p-0 md:p-6 lg:p-8">

                    {/* Mobile header */}
                    <div className="relative mb-5 overflow-hidden rounded-b-[2rem] border-b border-violet-400/25 bg-[#080716]/82 p-5 text-center text-white shadow-xl backdrop-blur-xl md:hidden">
                        <img src={superiorLogo} alt="AGON" className="mx-auto w-full max-w-[260px] drop-shadow-[0_0_24px_rgba(118,87,246,0.45)]" />
                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#ccff00]">Registro de estudiantes</p>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col px-4 pb-8 md:px-0 md:pb-0">
                        <Link to={formData.class_code.trim() ? `/login?code=${formData.class_code.trim()}` : '/login'} className="group mb-4 inline-flex items-center text-sm font-bold text-violet-200/55 transition-colors hover:text-[#ccff00]">
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Volver al Login
                        </Link>

                        <h2 className="mb-2 text-2xl font-black text-white md:text-3xl">
                            Crear cuenta
                        </h2>
                        <p className="mb-4 text-sm text-violet-200/55 md:text-base">
                            Completa tu perfil y entra a la experiencia AGON.
                        </p>

                        {error && (
                            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm font-bold text-red-300">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={e => e.preventDefault()} className="relative flex min-h-0 flex-1 flex-col justify-center space-y-4 overflow-hidden rounded-[1.75rem] border border-[#8f5cff]/40 bg-[#080716]/82 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.58),0_0_48px_rgba(118,87,246,0.18)] backdrop-blur-xl md:space-y-5 md:p-5">
                            <span className="pointer-events-none absolute left-0 top-10 h-24 w-px bg-[#b875ff] shadow-[0_0_18px_#a855f7]" />
                            <span className="pointer-events-none absolute right-0 top-14 h-16 w-px bg-[#b875ff] shadow-[0_0_18px_#a855f7]" />
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <StepPersonalData
                                        formData={formData}
                                        onChange={handleChange}
                                        onSyncPage={syncPageValues}
                                        onPageChange={setRegistrationPage}
                                        onDocumentNext={validateDocumentAndContinue}
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


