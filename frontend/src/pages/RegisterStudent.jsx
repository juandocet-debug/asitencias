import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, ArrowRight, ArrowLeft, CheckCircle2,
    CreditCard, Smartphone, Camera, Upload, X, AlertCircle, Loader2, Lock, Eye, EyeOff
} from 'lucide-react';
import api from '../services/api';

// Toast Component
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-amber-500';
    const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

    return (
        <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-5 duration-300`}>
            <Icon size={20} />
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded p-1 transition-colors">
                <X size={16} />
            </button>
        </div>
    );
}

// Success Modal Component
function SuccessModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} className="text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Registro Exitoso!</h3>
                <p className="text-slate-500 mb-6">
                    Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión usando tu <strong>número de cédula</strong> y la <strong>contraseña</strong> que estableciste.
                </p>
                <button
                    onClick={onClose}
                    className="w-full bg-upn-700 hover:bg-upn-800 text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                    Ir a Iniciar Sesión <ArrowRight size={20} />
                </button>
            </motion.div>
        </div>
    );
}

export default function RegisterStudent() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'warning') => setToast({ message, type });

    // Form States
    const [formData, setFormData] = useState({
        first_name: '',
        second_name: '',
        last_name: '',
        second_lastname: '',
        document_number: '',
        email: '',
        institutional_email: '',
        phone_number: '',
        class_code: '',
        password: '',
        password_confirm: ''
    });

    // Password visibility states
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    // Photo States
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Read class code from URL on mount
    useEffect(() => {
        const codeFromUrl = searchParams.get('code');
        if (codeFromUrl) {
            setFormData(prev => ({ ...prev, class_code: codeFromUrl }));
            showToast(`Código de clase detectado: ${codeFromUrl}`, 'success');
        }
    }, [searchParams]);

    // Camera Logic
    const startCamera = async () => {
        try {
            setIsCameraOpen(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accediendo a la cámara:", err);
            showToast("No se pudo acceder a la cámara. Intenta subir una foto.", "error");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
    };

    const takePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                const file = new File([blob], "profile_photo.jpg", { type: "image/jpeg" });
                setPhoto(file);
                setPhotoPreview(URL.createObjectURL(file));
                stopCamera();
                showToast("¡Foto capturada con éxito!", "success");
            }, 'image/jpeg', 0.85);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Optimizar imagen antes de subir
            if (file.size > 5 * 1024 * 1024) {
                showToast("La imagen es muy grande. Máximo 5MB.", "error");
                return;
            }
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
            showToast("Imagen cargada correctamente", "success");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep1 = () => {
        if (!formData.first_name.trim()) {
            showToast("El primer nombre es obligatorio", "error");
            return false;
        }
        if (!formData.last_name.trim()) {
            showToast("El primer apellido es obligatorio", "error");
            return false;
        }
        if (!formData.document_number.trim()) {
            showToast("El número de documento es obligatorio", "error");
            return false;
        }
        if (!/^\d+$/.test(formData.document_number.trim())) {
            showToast("El documento debe contener solo números", "error");
            return false;
        }
        if (!formData.institutional_email.trim()) {
            showToast("El correo institucional es obligatorio", "error");
            return false;
        }
        // Validación de email con regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.institutional_email.trim())) {
            showToast("El correo institucional no tiene un formato válido (ejemplo: usuario@upn.edu.co)", "error");
            return false;
        }
        // Validar correo personal si se ingresó
        if (formData.email.trim() && !emailRegex.test(formData.email.trim())) {
            showToast("El correo personal no tiene un formato válido", "error");
            return false;
        }
        // Validar contraseña
        if (!formData.password.trim()) {
            showToast("La contraseña es obligatoria", "error");
            return false;
        }
        if (formData.password.length < 6) {
            showToast("La contraseña debe tener al menos 6 caracteres", "error");
            return false;
        }
        if (formData.password !== formData.password_confirm) {
            showToast("Las contraseñas no coinciden", "error");
            return false;
        }
        return true;
    };

    // Función para traducir errores del backend
    const translateError = (key, value) => {
        const errorMessages = {
            'Enter a valid email address.': 'Ingresa un correo electrónico válido',
            'This field is required.': 'Este campo es obligatorio',
            'This field may not be blank.': 'Este campo no puede estar vacío',
            'A user with that username already exists.': 'Este correo ya está registrado',
            'user with this document number already exists.': 'Este número de documento ya está registrado',
            'user with this email already exists.': 'Este correo ya está en uso',
            'Ensure this field has no more than': 'Este campo es demasiado largo',
        };

        const fieldNames = {
            'email': 'Correo electrónico',
            'username': 'Correo institucional',
            'document_number': 'Número de documento',
            'first_name': 'Primer nombre',
            'last_name': 'Primer apellido',
            'phone_number': 'Número de celular',
            'institutional_email': 'Correo institucional',
            'personal_email': 'Correo personal',
        };

        // Obtener el mensaje de error
        let errorText = Array.isArray(value) ? value[0] : value;

        // Buscar traducción
        for (const [en, es] of Object.entries(errorMessages)) {
            if (errorText.includes(en)) {
                errorText = es;
                break;
            }
        }

        // Obtener nombre del campo en español
        const fieldName = fieldNames[key] || key;

        return `${fieldName}: ${errorText}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

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
            await api.post('/users/register/student/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowSuccess(true);
        } catch (error) {
            console.error("Error en registro:", error);
            let errMsg = "Error al conectar con el servidor. Verifica tu conexión.";

            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errMsg = error.response.data;
                } else if (error.response.data.detail) {
                    errMsg = error.response.data.detail;
                } else if (error.response.data.username) {
                    const usernameErr = Array.isArray(error.response.data.username) ? error.response.data.username[0] : error.response.data.username;
                    if (usernameErr.includes('already exists') || usernameErr.includes('Enter a valid email')) {
                        errMsg = usernameErr.includes('already exists')
                            ? "Este correo institucional ya está registrado"
                            : "El correo institucional no es válido";
                    } else {
                        errMsg = translateError('username', usernameErr);
                    }
                } else if (error.response.data.email) {
                    const emailErr = Array.isArray(error.response.data.email) ? error.response.data.email[0] : error.response.data.email;
                    errMsg = emailErr.includes('already') ? "Este correo ya está en uso" : "El correo no es válido";
                } else if (error.response.data.document_number) {
                    errMsg = "Este número de documento ya está registrado";
                } else {
                    const keys = Object.keys(error.response.data);
                    if (keys.length > 0) {
                        errMsg = translateError(keys[0], error.response.data[keys[0]]);
                    }
                }
            }

            setError(errMsg);
            showToast(errMsg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccess(false);
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row shadow-2xl overflow-hidden">
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Success Modal */}
            {showSuccess && <SuccessModal onClose={handleSuccessClose} />}

            {/* Sección Izquierda - Informativa */}
            <div className="hidden md:flex md:w-5/12 bg-upn-700 relative flex-col justify-center items-center text-white p-12 overflow-hidden">
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
                        <h1 className="text-4xl font-bold tracking-tight leading-tight">
                            Únete a la Comunidad
                        </h1>
                        <p className="text-xl text-blue-100 font-medium tracking-wide uppercase">
                            Registro de Estudiantes
                        </p>
                    </div>
                    <div className="mt-8 space-y-4 text-left w-full max-w-xs mx-auto text-blue-100 text-sm">
                        <div className={`p-4 rounded-xl border transition-all ${step === 1 ? 'bg-white/20 border-white/40' : 'border-white/10 opacity-60'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`font-bold w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-white text-upn-700' : 'bg-white/30'}`}>
                                    {step > 1 ? <CheckCircle2 size={16} /> : '1'}
                                </div>
                                <span>Datos Personales</span>
                            </div>
                        </div>
                        <div className={`p-4 rounded-xl border transition-all ${step === 2 ? 'bg-white/20 border-white/40' : 'border-white/10 opacity-60'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`font-bold w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-white text-upn-700' : 'bg-white/30'}`}>2</div>
                                <span>Foto Digital</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="absolute bottom-8 text-center text-xs text-blue-200">
                    © 2026 Universidad Pedagógica Nacional
                </div>
            </div>

            {/* Sección Derecha - Formulario */}
            <div className="w-full md:w-7/12 flex flex-col justify-center bg-white h-screen overflow-y-auto">
                <div className="w-full max-w-2xl mx-auto p-6 md:p-12 lg:p-16">
                    <div className="md:hidden text-center mb-8">
                        <img src="https://i.ibb.co/C5SB6zj4/Identidad-UPN-25-vertical-azul-fondo-blanco.png" alt="Logo UPN Mobile" className="h-20 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-upn-900 leading-tight">Registro de Estudiantes</h2>
                    </div>

                    <Link to="/login" className="inline-flex items-center text-slate-400 hover:text-upn-700 mb-8 transition-colors group text-sm font-medium">
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Volver al Login
                    </Link>

                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Crear Cuenta</h2>
                    <p className="text-slate-500 mb-8">Complete el formulario para registrarse en el sistema.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                        <InputGroup label="Primer Nombre" name="first_name" value={formData.first_name} onChange={handleInputChange} required icon={<User className="h-4 w-4" />} />
                                        <InputGroup label="Segundo Nombre" name="second_name" value={formData.second_name} onChange={handleInputChange} />
                                        <InputGroup label="Primer Apellido" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
                                        <InputGroup label="Segundo Apellido" name="second_lastname" value={formData.second_lastname} onChange={handleInputChange} />
                                    </div>

                                    <div className="mb-5">
                                        <InputGroup
                                            label="Número de Documento (DNI)"
                                            name="document_number"
                                            type="text"
                                            inputMode="numeric"
                                            value={formData.document_number}
                                            onChange={handleInputChange}
                                            required
                                            icon={<CreditCard className="h-4 w-4" />}
                                            helper="Este será tu usuario para iniciar sesión."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                        <InputGroup label="Correo Institucional" name="institutional_email" type="email" value={formData.institutional_email} onChange={handleInputChange} required icon={<Mail className="h-4 w-4" />} placeholder="usuario@upn.edu.co" />
                                        <InputGroup label="Correo Personal" name="email" type="email" value={formData.email} onChange={handleInputChange} icon={<Mail className="h-4 w-4" />} helper="Para recuperación de contraseña" />
                                        <InputGroup label="Celular" name="phone_number" type="tel" value={formData.phone_number} onChange={handleInputChange} icon={<Smartphone className="h-4 w-4" />} placeholder="300 123 4567" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 ml-1">Contraseña *</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-upn-600 transition-colors" />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 transition-all"
                                                    placeholder="Mínimo 6 caracteres"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 ml-1">Confirmar Contraseña *</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-upn-600 transition-colors" />
                                                <input
                                                    type={showPasswordConfirm ? "text" : "password"}
                                                    name="password_confirm"
                                                    value={formData.password_confirm}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 transition-all"
                                                    placeholder="Repite tu contraseña"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (validateStep1()) {
                                                setStep(2);
                                            }
                                        }}
                                        className="w-full bg-upn-700 hover:bg-upn-800 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all"
                                    >
                                        Continuar <ArrowRight size={20} />
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <div className="flex flex-col items-center justify-center gap-6 mb-8">
                                        <div className="relative group w-full max-w-sm aspect-video bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors">
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                isCameraOpen ? (
                                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                                                ) : (
                                                    <div className="text-center p-6">
                                                        <Camera size={48} className="mx-auto text-slate-300 mb-2" />
                                                        <p className="text-sm text-slate-500 font-medium">Toma o sube una foto</p>
                                                    </div>
                                                )
                                            )}
                                            {photoPreview && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex gap-4">
                                            {isCameraOpen ? (
                                                <>
                                                    <button type="button" onClick={takePhoto} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md font-bold transition-colors flex items-center gap-2">
                                                        <Camera size={18} /> Capturar
                                                    </button>
                                                    <button type="button" onClick={stopCamera} className="px-6 py-2.5 bg-slate-500 hover:bg-slate-600 text-white rounded-lg shadow-md font-bold transition-colors flex items-center gap-2">
                                                        <X size={18} /> Cancelar
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button type="button" onClick={startCamera} className="px-6 py-2.5 bg-upn-600 hover:bg-upn-700 text-white rounded-lg shadow-md font-bold transition-colors flex items-center gap-2">
                                                        <Camera size={18} /> Usar Cámara
                                                    </button>
                                                    <label className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-md font-bold transition-colors flex items-center gap-2 cursor-pointer">
                                                        <Upload size={18} /> Subir Foto
                                                        <input type="file" className="hidden" accept="image/*" capture="user" onChange={handleFileUpload} />
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-upn-50 p-6 rounded-xl border border-upn-100 mb-8">
                                        <InputGroup
                                            label="Código de Clase (Opcional)"
                                            name="class_code"
                                            value={formData.class_code}
                                            onChange={(e) => setFormData({ ...formData, class_code: e.target.value.toUpperCase() })}
                                            placeholder="XXXXXX"
                                            className="font-mono text-center tracking-widest uppercase border-upn-200 focus:border-upn-500 bg-white text-lg"
                                            helper="Si tienes un código de clase, ingrésalo aquí para unirte automáticamente."
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 border border-red-100 font-medium text-sm flex items-start gap-3">
                                            <div className="mt-0.5"><AlertCircle size={18} /></div>
                                            <div>{error}</div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => { setStep(1); stopCamera(); setError(null); }}
                                            className="px-6 py-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-4 bg-upn-700 hover:bg-upn-800 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={20} className="animate-spin" /> Registrando...
                                                </>
                                            ) : (
                                                <>
                                                    Finalizar Registro <CheckCircle2 size={20} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            </div>
        </div >
    );
}

function InputGroup({ label, icon, helper, className, ...props }) {
    return (
        <div className="space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                {icon} {label}
            </label>
            <div className="relative group">
                <input
                    {...props}
                    className={`block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-600 transition-all font-medium ${className}`}
                />
            </div>
            {helper && <p className="text-xs text-slate-500 ml-1">{helper}</p>}
        </div>
    );
}
