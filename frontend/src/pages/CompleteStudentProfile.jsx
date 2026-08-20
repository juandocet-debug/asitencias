import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, CheckCircle2, Eye, EyeOff, Loader2, Upload, X } from 'lucide-react';
import api, { getAccessToken, setAccessToken } from '../services/api';
import { useUser } from '../context/UserContext';

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
        <div className="min-h-screen bg-slate-100 px-4 py-8">
            <form onSubmit={submit} className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                <div className="bg-gradient-to-r from-blue-700 to-indigo-600 px-8 py-8 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">AGON</p>
                    <h1 className="mt-2 text-3xl font-black">Activa tu cuenta institucional</h1>
                    <p className="mt-2 text-sm text-blue-100">Verifica tus datos, asigna contraseña, celular y foto.</p>
                </div>
                <div className="grid gap-8 p-6 md:grid-cols-[1fr_0.9fr] md:p-8">
                    <ReadOnlyData user={user} />
                    <div className="space-y-5">
                        <PhotoBox preview={preview} cameraActive={cameraActive} videoRef={videoRef} onStart={startCamera} onTake={takePhoto} onStop={stopCamera} onFile={handleFile} onClear={() => { setPreview(null); setPhoto(null); }} />
                        {googleUser && <GoogleProfileFields firstName={firstName} setFirstName={setFirstName} secondName={secondName} setSecondName={setSecondName} lastName={lastName} setLastName={setLastName} secondLastname={secondLastname} setSecondLastname={setSecondLastname} personalEmail={personalEmail} setPersonalEmail={setPersonalEmail} documentNumber={documentNumber} setDocumentNumber={setDocumentNumber} faculty={faculty} setFaculty={value => { setFaculty(value); setProgram(''); }} program={program} setProgram={setProgram} faculties={faculties} programs={filteredPrograms} />}
                        {!googleUser && <PasswordFields password={password} setPassword={setPassword} passwordConfirm={passwordConfirm} setPasswordConfirm={setPasswordConfirm} showPassword={showPassword} setShowPassword={setShowPassword} />}
                        <label className="block space-y-2">
                            <span className="text-sm font-black text-slate-600">Número de celular</span>
                            <input value={phone} onChange={event => setPhone(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-blue-500" />
                        </label>
                        {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}
                        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-4 font-black text-white shadow-lg shadow-blue-200 disabled:opacity-60">
                            {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />} Completar activación
                        </button>
                    </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
            </form>
        </div>
    );
}

function ReadOnlyData({ user }) {
    const rows = [
        ['Primer nombre', user?.first_name],
        ['Segundo nombre', user?.second_name || ''],
        ['Primer apellido', user?.last_name],
        ['Segundo apellido', user?.second_lastname || ''],
        ['Documento', user?.document_number],
        ['Correo', user?.email],
    ];
    return <div className="space-y-4">{rows.map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className="font-black text-slate-800">{value || '—'}</p></div>)}</div>;
}

function PhotoBox({ preview, cameraActive, videoRef, onStart, onTake, onStop, onFile, onClear }) {
    return (
        <div className="space-y-3">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50">
                {preview ? <img src={preview} alt="Foto" className="h-full w-full object-cover" /> : <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${cameraActive ? '' : 'hidden'}`} />}
                {!preview && !cameraActive && <div className="text-center text-sm font-bold text-slate-400">Toma o sube tu foto de perfil</div>}
                {preview && <button type="button" onClick={onClear} className="absolute right-3 top-3 rounded-full bg-red-500 p-2 text-white"><X size={16} /></button>}
            </div>
            <div className="flex flex-wrap gap-2">
                {cameraActive ? <><button type="button" onClick={onTake} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Capturar</button><button type="button" onClick={onStop} className="rounded-xl bg-slate-600 px-4 py-2 text-sm font-black text-white">Cancelar</button></> : <button type="button" onClick={onStart} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white"><Camera size={16} /> Cámara</button>}
                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-black text-white"><Upload size={16} /> Subir<input type="file" accept="image/*" className="hidden" onChange={onFile} /></label>
            </div>
        </div>
    );
}

function GoogleProfileFields({ firstName, setFirstName, secondName, setSecondName, lastName, setLastName, secondLastname, setSecondLastname, personalEmail, setPersonalEmail, documentNumber, setDocumentNumber, faculty, setFaculty, program, setProgram, faculties, programs }) {
    const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-blue-500';
    return (
        <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-2">
                    <span className="text-sm font-black text-slate-600">Primer nombre</span>
                    <input value={firstName} onChange={event => setFirstName(event.target.value)} className={fieldClass} />
                </label>
                <label className="block space-y-2">
                    <span className="text-sm font-black text-slate-600">Segundo nombre</span>
                    <input value={secondName} onChange={event => setSecondName(event.target.value)} className={fieldClass} />
                </label>
                <label className="block space-y-2">
                    <span className="text-sm font-black text-slate-600">Primer apellido</span>
                    <input value={lastName} onChange={event => setLastName(event.target.value)} className={fieldClass} />
                </label>
                <label className="block space-y-2">
                    <span className="text-sm font-black text-slate-600">Segundo apellido</span>
                    <input value={secondLastname} onChange={event => setSecondLastname(event.target.value)} className={fieldClass} />
                </label>
            </div>
            <label className="block space-y-2">
                <span className="text-sm font-black text-slate-600">Correo personal</span>
                <input type="email" value={personalEmail} onChange={event => setPersonalEmail(event.target.value)} placeholder="opcional" className={fieldClass} />
            </label>
            <label className="block space-y-2">
                <span className="text-sm font-black text-slate-600">Número de documento</span>
                <input inputMode="numeric" value={documentNumber} onChange={event => setDocumentNumber(event.target.value.replace(/\D/g, ''))} className={fieldClass} />
            </label>
            <label className="block space-y-2">
                <span className="text-sm font-black text-slate-600">Facultad</span>
                <select value={faculty} onChange={event => setFaculty(event.target.value)} className={fieldClass}>
                    <option value="">Selecciona tu facultad</option>
                    {faculties.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
            </label>
            <label className="block space-y-2">
                <span className="text-sm font-black text-slate-600">Programa</span>
                <select value={program} onChange={event => setProgram(event.target.value)} disabled={!faculty} className={fieldClass}>
                    <option value="">Selecciona tu programa</option>
                    {programs.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
            </label>
        </div>
    );
}

function PasswordFields({ password, setPassword, passwordConfirm, setPasswordConfirm, showPassword, setShowPassword }) {
    const type = showPassword ? 'text' : 'password';
    return (
        <div className="space-y-3">
            <label className="block space-y-2"><span className="text-sm font-black text-slate-600">Nueva contraseña</span><input type={type} value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-blue-500" /></label>
            <label className="block space-y-2"><span className="text-sm font-black text-slate-600">Confirmar contraseña</span><input type={type} value={passwordConfirm} onChange={event => setPasswordConfirm(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-blue-500" /></label>
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center gap-2 text-xs font-black text-blue-600">{showPassword ? <EyeOff size={14} /> : <Eye size={14} />} {showPassword ? 'Ocultar' : 'Ver'} contraseña</button>
            <p className="text-xs font-semibold text-slate-400">Debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un carácter especial.</p>
        </div>
    );
}
