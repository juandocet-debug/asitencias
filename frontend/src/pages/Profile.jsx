/* eslint-disable */
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { User, Mail, Phone, Camera, Save, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
    const { updateUser } = useUser(); // Hook para actualizar el contexto global
    const [user, setUser] = useState({
        first_name: '',
        last_name: '',
        email: '', // Institucional (readonly)
        personal_email: '',
        phone_number: '',
        document_number: '', // Readonly
        role: '', // Readonly
        photo: null // URL or File
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/me/');
            setUser(response.data);
            if (response.data.photo) {
                setPreview(response.data.photo);
            }
        } catch (error) {
            console.error("Error cargando perfil:", error);
            setMessage({ type: 'error', text: 'No se pudo cargar la información del perfil.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUser(prev => ({ ...prev, photo: file })); // Guardamos el archivo real para enviarlo
            setPreview(URL.createObjectURL(file)); // Preview local
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('phone_number', user.phone_number || '');
        formData.append('personal_email', user.personal_email || '');

        // Solo enviamos la foto si es un archivo nuevo (File object)
        if (user.photo instanceof File) {
            formData.append('photo', user.photo);
        }

        try {
            const response = await api.patch('/users/me/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUser(response.data); // Actualizar con respuesta del servidor
            if (response.data.photo) {
                setPreview(response.data.photo); // 🔥 Actualizar preview con la URL de Cloudinary
            }
            updateUser(response.data); // 🔥 Actualizar el contexto global (esto actualiza el header/sidebar instantáneamente)
            setMessage({ type: 'success', text: '¡Perfil actualizado exitosamente!' });
        } catch (error) {
            console.error("Error actualizando:", error);
            setMessage({ type: 'error', text: 'Error al actualizar. Verifique los datos.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-upn-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Mi Perfil</h1>
                <p className="text-slate-500 mt-1">Administra tu información personal y de contacto.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Columna Izquierda: Tarjeta de Foto y Resumen */}
                <div className="md:col-span-1 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center"
                    >
                        <div className="relative group cursor-pointer">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100">
                                {preview ? (
                                    <img src={preview} alt="Foto de perfil" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>

                            {/* Overlay de cámara */}
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                <Camera size={24} />
                                <span className="sr-only">Cambiar foto</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                />
                            </label>

                            <div className="absolute bottom-1 right-1 bg-upn-600 rounded-full p-2 text-white border-2 border-white shadow-sm">
                                <Camera size={14} />
                            </div>
                        </div>

                        <h2 className="mt-4 text-xl font-bold text-slate-800">
                            {user.first_name} {user.last_name}
                        </h2>
                        <span className="mt-1 px-3 py-1 bg-upn-50 text-upn-700 text-xs font-bold rounded-full uppercase tracking-wide">
                            {user.role === 'ADMIN' ? 'Administrador' : user.role === 'TEACHER' ? 'Docente' : 'Estudiante'}
                        </span>

                        <div className="mt-6 w-full pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                            <div>
                                <span className="block text-2xl font-bold text-slate-800">--</span>
                                <span className="text-xs text-slate-400 font-medium uppercase">Clases</span>
                            </div>
                            <div>
                                <span className="block text-2xl font-bold text-slate-800">--%</span>
                                <span className="text-xs text-slate-400 font-medium uppercase">Asistencia</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Info de solo lectura */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-sm">
                        <div className="flex items-start gap-3">
                            <Shield className="text-blue-600 mt-0.5 shrink-0" size={18} />
                            <div>
                                <p className="font-bold text-blue-900">Datos Institucionales</p>
                                <p className="text-blue-700 mt-1 leading-relaxed">
                                    El nombre, documento y correo institucional son gestionados por la administración y no pueden cambiarse aquí.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Formulario Editable */}
                <div className="md:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Información Personal</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                            {message.text && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    <p className="font-medium">{message.text}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Readonly Fields */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-500">Nombres</label>
                                    <input
                                        type="text"
                                        value={user.first_name}
                                        disabled
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-500">Apellidos</label>
                                    <input
                                        type="text"
                                        value={user.last_name}
                                        disabled
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-500">Documento de Identidad</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={user.document_number || 'No registrado'}
                                            disabled
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-500">Correo Institucional</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={user.email}
                                            disabled
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                {/* Editable Fields */}
                                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-upn-600 font-semibold mb-4 bg-upn-50 inline-block px-3 py-1 rounded-lg">
                                        Datos de Contacto (Editables)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Teléfono / Celular</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-upn-600 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            name="phone_number"
                                            value={user.phone_number || ''}
                                            onChange={handleChange}
                                            placeholder="+57 300 000 0000"
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Correo Personal</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-upn-600 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            name="personal_email"
                                            value={user.personal_email || ''}
                                            onChange={handleChange}
                                            placeholder="ejemplo@gmail.com"
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading || saving}
                                    className="px-8 py-3 bg-upn-700 hover:bg-upn-800 text-white font-bold rounded-xl shadow-lg shadow-upn-700/20 flex items-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Guardar Cambios
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
