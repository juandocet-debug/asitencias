import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, CheckCircle2, Eye, EyeOff, Loader2, Upload, X } from 'lucide-react';
import api, { getAccessToken, setAccessToken } from '../services/api';
import { useUser } from '../context/UserContext';
import fondoLogin from '../assets/fondoLogin.png';
import superiorLogo from '../assets/superior.png';

const SPECIAL_RE = /[^A-Za-z0-9]/;
const ONBOARDING_API_URL = import.meta.env.VITE_ONBOARDING_API_URL
    || 'https://agon-backend-production-c5d2.up.railway.app/api/users/onboarding/complete/';

export default function CompleteStudentProfile() {
    const { user, fetchUser } = useUser();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const classCode = searchParams.get('code')?.trim().toUpperCase() || '';
    const googleUser = Boolean(user?.google_connected);
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [phone, setPhone] = useState(user?.phone_number || '');
    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [secondName, setSecondName] = useState(user?.second_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [secondLastname, setSecondLastname] = useState(user?.second_lastname || '');
    const [personalEmail, setPersonalEmail] = useState(user?.personal_email || '');
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
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!googleUser) return;
        Promise.all([api.get('/users/faculties/'), api.get('/users/programs/')])
            .then(([facultyResponse, programResponse]) => {
                setFaculties(facultyResponse.data || []);
                setPrograms(programResponse.data || []);
            })
            .catch(() => setError('No pudimos cargar facultades y programas.'));
    }, [googleUser]);

    const filteredPrograms = useMemo(
        () => programs.filter(item => String(item.faculty) === String(faculty)),
        [faculty, programs],
    );

    const validate = () => {
        if (!googleUser) {
            if (!password || password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
            if (!/[A-Z]/.test(password)) return 'La contraseña debe tener una mayúscula.';
            if (!/[a-z]/.test(password)) return 'La contraseña debe tener una minúscula.';
            if (!SPECIAL_RE.test(password)) return 'La contraseña debe tener un carácter especial.';
            if (password !== passwordConfirm) return 'Las contraseñas no coinciden.';
        }
        if (googleUser && !firstName.trim()) return 'El primer nombre es obligatorio.';
        if (googleUser && !lastName.trim()) return 'El primer apellido es obligatorio.';
        if (!phone.trim()) return 'El número de celular es obligatorio.';
        if (googleUser && !/^\d+$/.test(documentNumber.trim())) return 'Ingresa un número de documento válido.';
        if (googleUser && (!faculty || !program)) return 'Selecciona tu facultad y programa.';
        if (googleUser && !photo && !user?.photo) return 'Toma o sube tu foto de perfil.';
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
        if (validation) return setError(validation);
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

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#050612] font-['Montserrat'] text-white">
            <img src={fondoLogin} alt="" className="absolute inset-0 h-full w-full object-cover object-[58%_center]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,18,0.96)_0%,rgba(9,7,24,0.86)_34%,rgba(9,7,24,0.42)_64%,rgba(5,6,18,0.28)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(118,87,246,0.30),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(204,255,0,0.10),transparent_22%)]" />

            <main className="relative z-10 flex min-h-screen items-center px-4 py-6 sm:px-8 lg:px-14">
                <form onSubmit={submit} className="grid w-full gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
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
                        <ReadOnlyData user={user} />
                    </motion.aside>

                    <motion.section initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-[#8f5cff]/45 bg-[#080716]/86 p-4 shadow-[0_0_0_1px_rgba(204,255,0,0.05),0_30px_90px_rgba(0,0,0,0.65),0_0_48px_rgba(118,87,246,0.22)] backdrop-blur-xl sm:p-6">
                        <span className="pointer-events-none absolute left-0 top-12 h-28 w-px bg-[#b875ff] shadow-[0_0_18px_#a855f7]" />
                        <span className="pointer-events-none absolute right-0 top-16 h-20 w-px bg-[#b875ff] shadow-[0_0_18px_#a855f7]" />
                        <header className="mb-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ccff00]">Completa la misión</p>
                            <h2 className="mt-2 text-2xl font-black">Datos finales</h2>
                            <p className="mt-1 text-sm font-semibold text-violet-200/50">{googleUser ? 'Puedes corregir los nombres que trajo Google antes de guardar.' : 'Asigna tu contraseña y confirma tu perfil.'}</p>
                        </header>

                        <div className="space-y-5">
                            <PhotoBox preview={preview} cameraActive={cameraActive} videoRef={videoRef} onStart={startCamera} onTake={takePhoto} onStop={stopCamera} onFile={handleFile} onClear={() => { setPreview(null); setPhoto(null); }} />
                            {googleUser && <GoogleProfileFields firstName={firstName} setFirstName={setFirstName} secondName={secondName} setSecondName={setSecondName} lastName={lastName} setLastName={setLastName} secondLastname={secondLastname} setSecondLastname={setSecondLastname} personalEmail={personalEmail} setPersonalEmail={setPersonalEmail} documentNumber={documentNumber} setDocumentNumber={setDocumentNumber} faculty={faculty} setFaculty={value => { setFaculty(value); setProgram(''); }} program={program} setProgram={setProgram} faculties={faculties} programs={filteredPrograms} />}
                            {!googleUser && <PasswordFields password={password} setPassword={setPassword} passwordConfirm={passwordConfirm} setPasswordConfirm={setPasswordConfirm} showPassword={showPassword} setShowPassword={setShowPassword} />}
                            <Field label="Número de celular"><input value={phone} onChange={event => setPhone(event.target.value)} className={fieldClass()} /></Field>
                            {error && <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</div>}
                            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7657f6] to-[#9a6dff] px-5 py-4 text-sm font-black text-white shadow-[0_12px_32px_rgba(118,87,246,0.38)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />} Completar activación <ArrowRight size={17} />
                            </button>
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

function ReadOnlyData({ user }) {
    const rows = [
        ['Primer nombre', user?.first_name],
        ['Primer apellido', user?.last_name],
        ['Documento', user?.document_number],
        ['Correo', user?.email],
    ];
    return <div className="mx-auto mt-6 grid max-w-sm gap-2 text-left sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded-xl border border-violet-300/15 bg-white/[0.04] px-4 py-3"><p className="text-[10px] font-black uppercase tracking-wide text-violet-200/40">{label}</p><p className="truncate text-sm font-black text-violet-50">{value || '—'}</p></div>)}</div>;
}

function PhotoBox({ preview, cameraActive, videoRef, onStart, onTake, onStop, onFile, onClear }) {
    return (
        <div className="space-y-3">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#ccff00]/35 bg-white/[0.04]">
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

function GoogleProfileFields({ firstName, setFirstName, secondName, setSecondName, lastName, setLastName, secondLastname, setSecondLastname, personalEmail, setPersonalEmail, documentNumber, setDocumentNumber, faculty, setFaculty, program, setProgram, faculties, programs }) {
    return (
        <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Primer nombre"><input value={firstName} onChange={event => setFirstName(event.target.value)} className={fieldClass()} /></Field>
                <Field label="Segundo nombre"><input value={secondName} onChange={event => setSecondName(event.target.value)} className={fieldClass()} /></Field>
                <Field label="Primer apellido"><input value={lastName} onChange={event => setLastName(event.target.value)} className={fieldClass()} /></Field>
                <Field label="Segundo apellido"><input value={secondLastname} onChange={event => setSecondLastname(event.target.value)} className={fieldClass()} /></Field>
            </div>
            <Field label="Correo personal"><input type="email" value={personalEmail} onChange={event => setPersonalEmail(event.target.value)} placeholder="opcional" className={fieldClass()} /></Field>
            <Field label="Número de documento"><input inputMode="numeric" value={documentNumber} onChange={event => setDocumentNumber(event.target.value.replace(/\D/g, ''))} className={fieldClass()} /></Field>
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
            <Field label="Nueva contraseña"><input type={type} value={password} onChange={event => setPassword(event.target.value)} className={fieldClass()} /></Field>
            <Field label="Confirmar contraseña"><input type={type} value={passwordConfirm} onChange={event => setPasswordConfirm(event.target.value)} className={fieldClass()} /></Field>
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center gap-2 text-xs font-black text-[#ccff00]">{showPassword ? <EyeOff size={14} /> : <Eye size={14} />} {showPassword ? 'Ocultar' : 'Ver'} contraseña</button>
            <p className="text-xs font-semibold text-violet-200/45">Debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un carácter especial.</p>
        </div>
    );
}
