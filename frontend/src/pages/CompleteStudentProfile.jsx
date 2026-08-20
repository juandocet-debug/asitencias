import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Eye, EyeOff, Loader2, Upload, X } from 'lucide-react';
import api, { getAccessToken, setAccessToken } from '../services/api';
import { useUser } from '../context/UserContext';
import fondoLogin from '../assets/fondoLogin.png';
import superiorLogo from '../assets/superior.png';

const SPECIAL_RE = /[^A-Za-z0-9]/;
const UPN_EMAIL_RE = /@upn\.edu\.co$/i;
const ONBOARDING_API_URL = import.meta.env.VITE_ONBOARDING_API_URL
    || 'https://agon-backend-production-c5d2.up.railway.app/api/users/onboarding/complete/';

export default function CompleteStudentProfile() {
    const { user, fetchUser } = useUser();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const classCode = searchParams.get('code')?.trim().toUpperCase() || '';
    const googleUser = Boolean(user?.google_connected);
    const googleEmailAsPersonal = googleUser && user?.email && !UPN_EMAIL_RE.test(user.email) ? user.email : '';
    const [step, setStep] = useState(1);
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [phone, setPhone] = useState(user?.phone_number || '');
    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [secondName, setSecondName] = useState(user?.second_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [secondLastname, setSecondLastname] = useState(user?.second_lastname || '');
    const [personalEmail, setPersonalEmail] = useState(user?.personal_email || googleEmailAsPersonal);
    const [documentNumber, setDocumentNumber] = useState(user?.document_number || '');
    const [faculty, setFaculty] = useState(user?.faculty || '');
    const [program, setProgram] = useState(user?.program || '');
    const [faculties, setFaculties] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(user?.photo || null);
    const [showPassword, setShowPassword] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingDocument, setCheckingDocument] = useState(false);
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const steps = googleUser
        ? ['Documento', 'Identidad', 'Contacto', 'Programa', 'Foto']
        : ['Seguridad', 'Contacto', 'Foto'];

    const totalSteps = steps.length;
    const currentStepName = steps[step - 1];

    useEffect(() => {
        if (!googleUser) return;
        Promise.all([api.get('/users/faculties/'), api.get('/users/programs/')])
            .then(([facultyResponse, programResponse]) => {
                setFaculties(facultyResponse.data || []);
                setPrograms(programResponse.data || []);
            })
            .catch(() => setError('No pudimos cargar facultades y programas.'));
    }, [googleUser]);

    useEffect(() => {
        if (!user) return;
        setPhone(value => value || user.phone_number || '');
        setFirstName(value => value || user.first_name || '');
        setSecondName(value => value || user.second_name || '');
        setLastName(value => value || user.last_name || '');
        setSecondLastname(value => value || user.second_lastname || '');
        setDocumentNumber(value => value || user.document_number || '');
        setFaculty(value => value || user.faculty || '');
        setProgram(value => value || user.program || '');
        setPersonalEmail(value => value || user.personal_email || googleEmailAsPersonal || '');
        setPreview(value => value || user.photo || null);
    }, [user, googleEmailAsPersonal]);

    const filteredPrograms = useMemo(
        () => programs.filter(item => String(item.faculty) === String(faculty)),
        [faculty, programs],
    );

    const validatePassword = () => {
        if (!password || password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
        if (!/[A-Z]/.test(password)) return 'La contraseña debe tener una mayúscula.';
        if (!/[a-z]/.test(password)) return 'La contraseña debe tener una minúscula.';
        if (!SPECIAL_RE.test(password)) return 'La contraseña debe tener un carácter especial.';
        if (password !== passwordConfirm) return 'Las contraseñas no coinciden.';
        return '';
    };

    const validateStep = (stepName = currentStepName) => {
        if (stepName === 'Documento') {
            if (!/^\d+$/.test(documentNumber.trim())) return 'Ingresa un número de documento válido.';
        }
        if (stepName === 'Identidad') {
            if (!firstName.trim()) return 'El primer nombre es obligatorio.';
            if (!lastName.trim()) return 'El primer apellido es obligatorio.';
        }
        if (stepName === 'Contacto' && !phone.trim()) return 'El número de celular es obligatorio.';
        if (stepName === 'Programa' && (!faculty || !program)) return 'Selecciona tu facultad y programa.';
        if (stepName === 'Seguridad') return validatePassword();
        if (stepName === 'Foto' && googleUser && !photo && !user?.photo) return 'Toma o sube tu foto de perfil.';
        return '';
    };

    const validateDirectoryDocument = async () => {
        if (!googleUser || currentStepName !== 'Documento') return '';
        setCheckingDocument(true);
        try {
            const response = await api.post('/users/directory/claim-google-document/', {
                document_number: documentNumber.trim(),
            });
            if (response.data?.access) setAccessToken(response.data.access);
            if (response.data?.claimed) {
                const updatedUser = await fetchUser();
                if (!updatedUser) return 'Tu cuenta fue vinculada, pero no pudimos cargar tu perfil. Vuelve a intentarlo.';
                if (classCode) {
                    try {
                        await api.post('/users/join-class/', { class_code: classCode });
                    } catch (joinError) {
                        if (!String(joinError?.response?.data?.error || '').includes('inscrito')) throw joinError;
                    }
                }
                navigate('/dashboard');
                return 'CLAIMED';
            }
            return '';
        } catch (err) {
            return err.response?.data?.error || 'Cédula no encontrada en el directorio autorizado.';
        } finally {
            setCheckingDocument(false);
        }
    };

    const validate = () => {
        const validations = googleUser
            ? ['Documento', 'Identidad', 'Contacto', 'Programa', 'Foto']
            : ['Seguridad', 'Contacto', 'Foto'];
        for (const item of validations) {
            const validation = validateStep(item);
            if (validation) return validation;
        }
        return '';
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraActive(true);
        } catch {
            setError('No se pudo acceder a la cámara. Puedes subir una foto.');
        }
    };

    const stopCamera = () => {
        videoRef.current?.srcObject?.getTracks().forEach(track => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraActive(false);
    };

    const takePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(blob => {
            const file = new File([blob], 'profile_photo.jpg', { type: 'image/jpeg' });
            setPhoto(file);
            setPreview(URL.createObjectURL(file));
            stopCamera();
        }, 'image/jpeg', 0.85);
    };

    const handleFile = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return setError('La foto no puede superar 5 MB.');
        setPhoto(file);
        setPreview(URL.createObjectURL(file));
    };

    const submit = async (event) => {
        event.preventDefault();
        const validation = validate();
        if (validation) {
            const invalidIndex = steps.findIndex(item => validateStep(item) === validation);
            if (invalidIndex >= 0) setStep(invalidIndex + 1);
            return setError(validation);
        }
        setLoading(true);
        setError('');
        const data = new FormData();
        data.append('password', password);
        data.append('password_confirm', passwordConfirm);
        data.append('phone_number', phone.trim());
        if (googleUser) {
            data.append('first_name', firstName.trim());
            data.append('second_name', secondName.trim());
            data.append('last_name', lastName.trim());
            data.append('second_lastname', secondLastname.trim());
            data.append('personal_email', personalEmail.trim());
            data.append('document_number', documentNumber.trim());
            data.append('faculty', faculty);
            data.append('program', program);
        }
        if (photo) data.append('photo', photo);
        try {
            const response = await axios.post(ONBOARDING_API_URL, data, {
                headers: { Authorization: `Bearer ${getAccessToken()}` },
            });
            if (response.data?.access) setAccessToken(response.data.access);
            const updatedUser = await fetchUser();
            if (!updatedUser) {
                setError('Tu cuenta quedó activada, pero no pudimos cargar tu perfil. Vuelve a intentarlo en unos segundos.');
                return;
            }
            if (classCode) {
                try {
                    await api.post('/users/join-class/', { class_code: classCode });
                } catch (joinError) {
                    if (!String(joinError?.response?.data?.error || '').includes('inscrito')) throw joinError;
                }
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'No se pudo completar la activación.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = async (event) => {
        event.preventDefault();
        const validation = validateStep();
        if (validation) return setError(validation);
        const directoryValidation = await validateDirectoryDocument();
        if (directoryValidation === 'CLAIMED') return;
        if (directoryValidation) return setError(directoryValidation);
        setError('');
        setStep(value => Math.min(value + 1, totalSteps));
    };

    const previousStep = () => {
        setError('');
        setStep(value => Math.max(value - 1, 1));
    };

    const renderCurrentStep = () => {
        if (currentStepName === 'Documento') {
            return <DocumentGate documentNumber={documentNumber} setDocumentNumber={setDocumentNumber} googleEmail={user?.email} />;
        }
        if (currentStepName === 'Identidad') {
            return <IdentityFields firstName={firstName} setFirstName={setFirstName} secondName={secondName} setSecondName={setSecondName} lastName={lastName} setLastName={setLastName} secondLastname={secondLastname} setSecondLastname={setSecondLastname} />;
        }
        if (currentStepName === 'Contacto') {
            return <ContactFields personalEmail={personalEmail} setPersonalEmail={setPersonalEmail} phone={phone} setPhone={setPhone} googleUser={googleUser} />;
        }
        if (currentStepName === 'Programa') {
            return <ProgramFields faculty={faculty} setFaculty={value => { setFaculty(value); setProgram(''); }} program={program} setProgram={setProgram} faculties={faculties} programs={filteredPrograms} />;
        }
        if (currentStepName === 'Seguridad') {
            return <PasswordFields password={password} setPassword={setPassword} passwordConfirm={passwordConfirm} setPasswordConfirm={setPasswordConfirm} showPassword={showPassword} setShowPassword={setShowPassword} />;
        }
        return <PhotoBox preview={preview} cameraActive={cameraActive} videoRef={videoRef} onStart={startCamera} onTake={takePhoto} onStop={stopCamera} onFile={handleFile} onClear={() => { setPreview(null); setPhoto(null); }} />;
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#050612] font-['Montserrat'] text-white">
            <img src={fondoLogin} alt="" className="absolute inset-0 h-full w-full object-cover object-[58%_center]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,18,0.96)_0%,rgba(9,7,24,0.86)_34%,rgba(9,7,24,0.42)_64%,rgba(5,6,18,0.28)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(118,87,246,0.30),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(204,255,0,0.10),transparent_22%)]" />

            <main className="relative z-10 flex min-h-screen items-center px-4 py-6 sm:px-8 lg:px-14">
                <form onSubmit={step === totalSteps ? submit : nextStep} className="grid w-full gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
                    <motion.aside initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="mx-auto w-full max-w-[430px] text-center lg:max-w-[460px]">
                        <motion.img
                            src={superiorLogo}
                            alt="AGON"
                            className="mx-auto w-full max-w-[330px] drop-shadow-[0_0_32px_rgba(118,87,246,0.48)]"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: [1, 1.018, 1] }}
                            transition={{ opacity: { duration: 0.45 }, scale: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' } }}
                        />
                        <p className="mt-3 text-[11px] font-black uppercase tracking-[0.38em] text-[#ccff00]">Perfil de jugador</p>
                        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Activa tu cuenta</h1>
                        <p className="mx-auto mt-3 max-w-sm text-sm font-semibold text-violet-100/60">Completa tus datos, toma tu foto y entra a la experiencia AGON.</p>
                        <StepTrail steps={steps} currentStep={step} />
                    </motion.aside>

                    <motion.section initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-[#8f5cff]/45 bg-[#080716]/86 p-4 shadow-[0_0_0_1px_rgba(204,255,0,0.05),0_30px_90px_rgba(0,0,0,0.65),0_0_48px_rgba(118,87,246,0.22)] backdrop-blur-xl sm:p-6">
                        <span className="pointer-events-none absolute left-0 top-12 h-28 w-px bg-[#b875ff] shadow-[0_0_18px_#a855f7]" />
                        <span className="pointer-events-none absolute right-0 top-16 h-20 w-px bg-[#b875ff] shadow-[0_0_18px_#a855f7]" />
                        <header className="mb-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ccff00]">Paso {step} de {totalSteps}</p>
                                    <h2 className="mt-2 text-2xl font-black">{currentStepName}</h2>
                                </div>
                                <div className="h-2 w-28 overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full rounded-full bg-[#ccff00] transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
                                </div>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-violet-200/50">{currentStepName === 'Documento' ? 'Primero validamos tu cédula. Si ya tienes cuenta antigua, entras de una vez.' : googleUser ? 'Puedes corregir lo que trajo Google antes de guardar.' : 'Asigna tu contraseña y confirma tu perfil.'}</p>
                        </header>

                        <div className="space-y-5">
                            <motion.div
                                key={currentStepName}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22 }}
                                className="rounded-2xl border border-white/70 bg-black/10 p-4 sm:p-5"
                            >
                                {renderCurrentStep()}
                            </motion.div>

                            {error && <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</div>}

                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={previousStep} disabled={step === 1 || loading} className="flex items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/[0.03] px-5 py-4 text-sm font-black text-white transition hover:bg-white/[0.08] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35">
                                    <ArrowLeft size={17} /> Atrás
                                </button>
                                <button disabled={loading || checkingDocument} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7657f6] to-[#9a6dff] px-5 py-4 text-sm font-black text-white shadow-[0_12px_32px_rgba(118,87,246,0.38)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                                    {loading || checkingDocument ? <Loader2 className="animate-spin" /> : step === totalSteps ? <CheckCircle2 size={20} /> : null}
                                    {checkingDocument ? 'Validando...' : step === totalSteps ? 'Completar' : 'Siguiente'}
                                    <ArrowRight size={17} />
                                </button>
                            </div>
                        </div>
                    </motion.section>
                    <canvas ref={canvasRef} className="hidden" />
                </form>
            </main>
        </div>
    );
}

function fieldClass() {
    return 'w-full rounded-xl border border-violet-400/20 bg-white/[0.06] px-4 py-3.5 text-sm font-semibold text-white outline-none transition placeholder:text-violet-200/25 focus:border-[#ccff00]/70 focus:ring-2 focus:ring-[#ccff00]/10';
}

function labelClass() {
    return 'text-xs font-black uppercase tracking-wider text-violet-200/65';
}

function StepTrail({ steps, currentStep }) {
    return (
        <div className="mx-auto mt-7 grid max-w-sm gap-3 text-left">
            {steps.map((item, index) => {
                const number = index + 1;
                const active = number === currentStep;
                const done = number < currentStep;
                return (
                    <button
                        key={item}
                        type="button"
                        className={`flex items-center gap-4 rounded-xl border px-4 py-3 text-sm font-black transition ${active ? 'border-[#ccff00]/80 bg-[#ccff00]/10 text-white shadow-[0_0_28px_rgba(204,255,0,0.12)]' : 'border-white/10 bg-white/[0.035] text-violet-100/55'}`}
                        aria-current={active ? 'step' : undefined}
                        tabIndex={-1}
                    >
                        <span className={`grid h-8 w-8 place-items-center rounded-full text-xs ${active || done ? 'bg-[#ccff00] text-slate-950' : 'bg-white/12 text-white/55'}`}>{done ? '✓' : number}</span>
                        {item}
                    </button>
                );
            })}
        </div>
    );
}

function PhotoBox({ preview, cameraActive, videoRef, onStart, onTake, onStop, onFile, onClear }) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#ccff00]">Foto de perfil</h3>
            <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#ccff00]/35 bg-white/[0.04] sm:h-72">
                {preview ? <img src={preview} alt="Foto" className="h-full w-full object-cover" /> : <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${cameraActive ? '' : 'hidden'}`} />}
                {!preview && !cameraActive && <div className="px-4 text-center text-sm font-bold text-violet-200/45">Toma o sube tu foto de perfil</div>}
                {preview && <button type="button" onClick={onClear} className="absolute right-3 top-3 rounded-full bg-red-500 p-2 text-white"><X size={16} /></button>}
            </div>
            <div className="flex flex-wrap gap-2">
                {cameraActive ? <><button type="button" onClick={onTake} className="rounded-xl bg-[#ccff00] px-4 py-2 text-sm font-black text-slate-950">Capturar</button><button type="button" onClick={onStop} className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-black text-white">Cancelar</button></> : <button type="button" onClick={onStart} className="flex items-center gap-2 rounded-xl bg-[#ccff00] px-4 py-2 text-sm font-black text-slate-950"><Camera size={16} /> Cámara</button>}
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-black text-white"><Upload size={16} /> Subir<input type="file" accept="image/*" className="hidden" onChange={onFile} /></label>
            </div>
        </div>
    );
}

function DocumentGate({ documentNumber, setDocumentNumber, googleEmail }) {
    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-[#ccff00]/25 bg-[#ccff00]/10 px-4 py-3 text-sm font-bold text-[#e8ff9a]">
                Estás entrando con {googleEmail || 'Google'}. Escribe tu cédula para validar si ya tienes cuenta antigua o si estás en el directorio autorizado.
            </div>
            <Field label="Número de documento">
                <input
                    autoFocus
                    inputMode="numeric"
                    value={documentNumber}
                    onChange={event => setDocumentNumber(event.target.value.replace(/\D/g, ''))}
                    placeholder="Ej: 1013098347"
                    className={`${fieldClass()} text-lg tracking-wide`}
                />
            </Field>
            <p className="text-xs font-semibold text-violet-200/45">
                Si la cédula pertenece a una cuenta antigua, vincularemos este Gmail una sola vez y entrarás directamente.
            </p>
        </div>
    );
}

function IdentityFields({ firstName, setFirstName, secondName, setSecondName, lastName, setLastName, secondLastname, setSecondLastname }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#ccff00]">Identidad</h3>
            <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Primer nombre"><input value={firstName} onChange={event => setFirstName(event.target.value)} className={fieldClass()} /></Field>
                <Field label="Segundo nombre"><input value={secondName} onChange={event => setSecondName(event.target.value)} placeholder="Si tienes" className={fieldClass()} /></Field>
                <Field label="Primer apellido"><input value={lastName} onChange={event => setLastName(event.target.value)} className={fieldClass()} /></Field>
                <Field label="Segundo apellido"><input value={secondLastname} onChange={event => setSecondLastname(event.target.value)} placeholder="Si tienes" className={fieldClass()} /></Field>
            </div>
        </div>
    );
}

function ContactFields({ personalEmail, setPersonalEmail, phone, setPhone, googleUser }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#ccff00]">Contacto</h3>
            {googleUser && <Field label="Correo personal"><input type="email" value={personalEmail} onChange={event => setPersonalEmail(event.target.value)} placeholder="opcional" className={fieldClass()} /></Field>}
            <Field label="Número de celular"><input inputMode="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="300 123 4567" className={fieldClass()} /></Field>
        </div>
    );
}

function ProgramFields({ faculty, setFaculty, program, setProgram, faculties, programs }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#ccff00]">Programa académico</h3>
            <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Facultad">
                    <select value={faculty} onChange={event => setFaculty(event.target.value)} className={fieldClass()}>
                        <option value="">Selecciona tu facultad</option>
                        {faculties.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                </Field>
                <Field label="Programa">
                    <select value={program} onChange={event => setProgram(event.target.value)} disabled={!faculty} className={fieldClass()}>
                        <option value="">Selecciona tu programa</option>
                        {programs.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                </Field>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return <label className="block space-y-2"><span className={labelClass()}>{label}</span>{children}</label>;
}

function PasswordFields({ password, setPassword, passwordConfirm, setPasswordConfirm, showPassword, setShowPassword }) {
    const type = showPassword ? 'text' : 'password';
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#ccff00]">Seguridad</h3>
            <Field label="Nueva contraseña"><input type={type} value={password} onChange={event => setPassword(event.target.value)} className={fieldClass()} /></Field>
            <Field label="Confirmar contraseña"><input type={type} value={passwordConfirm} onChange={event => setPasswordConfirm(event.target.value)} className={fieldClass()} /></Field>
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center gap-2 text-xs font-black text-[#ccff00]">{showPassword ? <EyeOff size={14} /> : <Eye size={14} />} {showPassword ? 'Ocultar' : 'Ver'} contraseña</button>
            <p className="text-xs font-semibold text-violet-200/45">Debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un carácter especial.</p>
        </div>
    );
}
