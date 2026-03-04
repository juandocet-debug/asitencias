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

// ── Utilidades de validación y errores ───────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    });

    // Leer código desde URL
    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) return;
        setFormData(p => ({ ...p, class_code: code }));
        if (!user && !localStorage.getItem('access_token')) {
            showToast('Regístrate para unirte a la clase. Si ya tienes cuenta, inicia sesión primero.', 'info');
        }
        showToast(`Código detectado: ${code}`, 'success');
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
        if (!EMAIL_RE.test(formData.institutional_email)) { showToast('Correo institucional inválido (ejemplo: usuario@upn.edu.co)', 'error'); return false; }
        if (formData.email.trim() && !EMAIL_RE.test(formData.email)) { showToast('Correo personal inválido', 'error'); return false; }
        if (!formData.password.trim()) { showToast('La contraseña es obligatoria', 'error'); return false; }
        if (formData.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return false; }
        if (!SPECIAL_RE.test(formData.password)) { setError('La contraseña debe contener al menos un carácter especial (!@#$%^&*...)'); return false; }
        if (formData.password !== formData.password_confirm) { showToast('Las contraseñas no coinciden', 'error'); return false; }
        return true;
    };

    // ── Envío del formulario ──────────────────────────────
    const handleSubmit = async (photo) => {
        setLoading(true); setError(null);
        const data = new FormData();
        data.append('first_name', formData.first_name.trim());
        data.append('second_name', formData.second_name.trim());
        data.append('last_name', formData.last_name.trim());
        data.append('second_lastname', formData.second_lastname.trim());
        data.append('document_number', formData.document_number.trim());
        data.append('personal_email', formData.email.trim());
        data.append('username', formData.institutional_email.trim());
        data.append('email', formData.institutional_email.trim());
        data.append('password', formData.password.trim());
        data.append('phone_number', formData.phone_number.trim());
        if (formData.class_code.trim()) data.append('class_code', formData.class_code.trim());
        if (photo) data.append('photo', photo);
        try {
            await api.post('/users/register/student/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowSuccess(true);
        } catch (err) {
            let msg = 'Error al conectar con el servidor.';
            const d = err.response?.data;
            if (d) {
                if (typeof d === 'string') msg = d;
                else if (d.detail) msg = d.detail;
                else if (d.username) msg = d.username[0]?.includes('already') ? 'Este correo institucional ya está registrado' : translateError('username', d.username[0]);
                else if (d.email) msg = d.email[0]?.includes('already') ? 'Este correo ya está en uso' : 'El correo no es válido';
                else if (d.document_number) msg = 'Este número de documento ya está registrado';
                else { const k = Object.keys(d)[0]; if (k) msg = translateError(k, d[k]); }
            }
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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row shadow-2xl overflow-hidden">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            {showSuccess && <SuccessModal onClose={() => { setShowSuccess(false); navigate('/login'); }} />}

            {/* Panel izquierdo */}
            <SidebarInfo step={step} />

            {/* Panel derecho — formulario */}
            <div className="w-full md:w-7/12 flex flex-col justify-center bg-white h-screen overflow-y-auto">
                <div className="w-full max-w-2xl mx-auto p-0 md:p-12 lg:p-16">

                    {/* Mobile header */}
                    <div className="md:hidden bg-upn-700 p-8 rounded-b-[3rem] shadow-xl relative overflow-hidden text-center text-white mb-8">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-[-50%] left-[-50%] w-[400px] h-[400px] rounded-full bg-white blur-3xl" />
                        </div>
                        <div className="relative z-10">
                            <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-lg">
                                <img src="/upn-logo.png" alt="Logo UPN Mobile" className="h-16 mx-auto object-contain" />
                            </div>
                            <h2 className="text-xl font-bold">Registro de Estudiantes</h2>
                            <p className="text-blue-200 text-xs font-medium tracking-widest uppercase mt-2">Licenciatura en Recreación</p>
                        </div>
                    </div>

                    <div className="px-6 md:px-0">
                        <Link to="/login" className="inline-flex items-center text-slate-400 hover:text-upn-700 mb-6 transition-colors group text-sm font-medium">
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Volver al Login
                        </Link>

                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                            {user ? 'Unirse a una Clase' : 'Crear Cuenta'}
                        </h2>
                        <p className="text-slate-500 mb-6 md:mb-8 text-sm md:text-base">
                            {user ? 'Ingresa el código que te dio tu profesor para unirse.' : 'Completa el formulario para registrarte en el sistema.'}
                        </p>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3 text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><span>{error}</span>
                            </div>
                        )}

                        {/* ── Usuario ya logueado ── */}
                        {user ? (
                            user.role === 'STUDENT' ? (
                                <form onSubmit={handleJoinClass} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-slate-700">Código de la Clase</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><BookOpen className="h-5 w-5" /></div>
                                            <input type="text" name="class_code" value={formData.class_code} onChange={handleChange}
                                                placeholder="Ej: MATH101" required
                                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-upn-500 focus:border-transparent transition-all font-mono tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal" />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">El código tiene letras y números.</p>
                                    </div>
                                    <button type="submit" disabled={loading}
                                        className="w-full bg-gradient-to-r from-upn-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                                        {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> Unirse ahora</>}
                                    </button>
                                </form>
                            ) : (
                                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
                                    <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
                                    <h4 className="font-bold text-slate-800 mb-2">Ya tienes una sesión activa</h4>
                                    <p className="text-sm text-slate-600 mb-4">Estás conectado como <strong>{user.role === 'TEACHER' ? 'Docente' : 'Administrador'}</strong>. Como docente no puedes registrarte como estudiante.</p>
                                    <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold">Ir a mi Dashboard</button>
                                </div>
                            )
                        ) : (
                            /* ── Registro multi-paso ── */
                            <form onSubmit={e => e.preventDefault()} className="space-y-4 md:space-y-6">
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <StepPersonalData
                                            formData={formData}
                                            onChange={handleChange}
                                            onNext={() => { if (validateStep1()) { setError(null); setStep(2); } }}
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
