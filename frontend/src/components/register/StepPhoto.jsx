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
                <div className="relative group w-full max-w-sm aspect-video bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors">
                    {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : isCameraOpen ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                    ) : (
                        <div className="text-center p-6">
                            <Camera size={48} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-sm text-slate-500 font-medium">Toma o sube una foto</p>
                        </div>
                    )}
                    {photoPreview && (
                        <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors">
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex gap-4">
                    {isCameraOpen ? (
                        <>
                            <button type="button" onClick={takePhoto} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2"><Camera size={18} /> Capturar</button>
                            <button type="button" onClick={stopCamera} className="px-6 py-2.5 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"><X size={18} /> Cancelar</button>
                        </>
                    ) : (
                        <>
                            <button type="button" onClick={startCamera} className="px-6 py-2.5 bg-upn-600 hover:bg-upn-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2"><Camera size={18} /> Usar Cámara</button>
                            <label className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-colors flex items-center gap-2 cursor-pointer">
                                <Upload size={18} /> Subir Foto
                                <input type="file" className="hidden" accept="image/*" capture="user" onChange={handleFileUpload} />
                            </label>
                        </>
                    )}
                </div>
            </div>

            {/* Código de clase (opcional) */}
            <div className="bg-upn-50 p-6 rounded-xl border border-upn-100 mb-8">
                <InputGroup
                    label="Código de Clase (Opcional)"
                    name="class_code"
                    value={formData.class_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, class_code: e.target.value.toUpperCase() }))}
                    placeholder="XXXXXX"
                    className="font-mono text-center tracking-widest uppercase border-upn-200 focus:border-upn-500 bg-white text-lg"
                    helper="Si tienes un código de clase, ingrésalo aquí para unirte automáticamente."
                />
            </div>

            {error && (
                <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 border border-red-100 font-medium text-sm flex items-start gap-3">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />{error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => { onBack(); stopCamera(); }}
                    className="px-6 py-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                    Atrás
                </button>
                <button type="button" onClick={handleSubmit} disabled={loading}
                    className="px-6 py-4 bg-upn-700 hover:bg-upn-800 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                    {loading ? <><Loader2 size={20} className="animate-spin" /> Registrando...</> : <>Finalizar Registro <CheckCircle2 size={20} /></>}
                </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </motion.div>
    );
}
