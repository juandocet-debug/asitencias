/* eslint-disable */
// components/register/StepPhoto.jsx
// Paso 2 del registro: captura/subida de foto + código de clase + botón de envío.

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { InputGroup } from './registerUtils';

export default function StepPhoto({ formData, setFormData, onBack, onSubmit, loading, error, showToast }) {
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const startCamera = async () => {
        try {
            setIsCameraOpen(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
            showToast('No se pudo acceder a la cámara. Intenta subir una foto.', 'error');
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
        setIsCameraOpen(false);
    };

    const takePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
            const file = new File([blob], 'profile_photo.jpg', { type: 'image/jpeg' });
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
            stopCamera();
            showToast('¡Foto capturada con éxito!', 'success');
        }, 'image/jpeg', 0.85);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('La imagen es muy grande. Máximo 5MB.', 'error'); return; }
        setPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
        showToast('Imagen cargada correctamente', 'success');
    };

    const handleSubmit = () => onSubmit(photo);

    return (
        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

            {/* Vista de cámara / preview */}
            <div className="flex flex-col items-center gap-6 mb-8">
                <div className="relative group flex aspect-video w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-violet-400/30 bg-white/[0.06] transition-colors hover:bg-white/[0.08]">
                    {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : isCameraOpen ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                    ) : (
                        <div className="text-center p-6">
                            <Camera size={48} className="mx-auto mb-2 text-violet-200/35" />
                            <p className="text-sm font-bold text-violet-100/60">Toma o sube una foto</p>
                        </div>
                    )}
                    {photoPreview && (
                        <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                            className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600">
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex gap-4">
                    {isCameraOpen ? (
                        <>
                            <button type="button" onClick={takePhoto} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition-colors hover:bg-emerald-700"><Camera size={18} /> Capturar</button>
                            <button type="button" onClick={stopCamera} className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-5 py-3 font-bold text-violet-100 transition-colors hover:bg-white/[0.1]"><X size={18} /> Cancelar</button>
                        </>
                    ) : (
                        <>
                            <button type="button" onClick={startCamera} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7657f6] to-[#9a6dff] px-5 py-3 font-bold text-white shadow-[0_12px_32px_rgba(118,87,246,0.28)] transition hover:brightness-110"><Camera size={18} /> Usar Cámara</button>
                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-5 py-3 font-bold text-violet-100 transition-colors hover:bg-white/[0.1]">
                                <Upload size={18} /> Subir Foto
                                <input type="file" className="hidden" accept="image/*" capture="user" onChange={handleFileUpload} />
                            </label>
                        </>
                    )}
                </div>
            </div>

            {/* Código de clase (opcional) */}
            <div className="mb-8 rounded-2xl border border-violet-400/18 bg-[#0e0b1d]/72 p-5 shadow-[0_14px_34px_rgba(0,0,0,0.24)]">
                <InputGroup
                    label="Código de Clase (Opcional)"
                    name="class_code"
                    value={formData.class_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, class_code: e.target.value.toUpperCase() }))}
                    placeholder="XXXXXX"
                    className="text-center font-mono text-lg uppercase tracking-widest"
                    helper="Si tienes un código de clase, ingrésalo aquí para unirte automáticamente."
                />
            </div>

            {error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm font-bold text-red-300">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />{error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => { onBack(); stopCamera(); }}
                    className="rounded-xl border border-white/12 bg-white/[0.04] px-6 py-4 font-bold text-violet-100 transition-colors hover:bg-white/[0.08]">
                    Atrás
                </button>
                <button type="button" onClick={handleSubmit} disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7657f6] to-[#9a6dff] px-6 py-4 font-bold text-white shadow-[0_12px_32px_rgba(118,87,246,0.32)] transition hover:brightness-110 disabled:opacity-70">
                    {loading ? <><Loader2 size={20} className="animate-spin" /> Registrando...</> : <>Finalizar Registro <CheckCircle2 size={20} /></>}
                </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </motion.div>
    );
}
