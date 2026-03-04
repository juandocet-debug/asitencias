/* eslint-disable */
// components/register/StepPersonalData.jsx
// Paso 1 del registro: datos personales, correos, teléfono y contraseña.

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, CreditCard, Smartphone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { InputGroup } from './registerUtils';

export default function StepPersonalData({ formData, onChange, onNext }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    return (
        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

            {/* Nombres y apellidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <InputGroup label="Primer Nombre" name="first_name" value={formData.first_name} onChange={onChange} required icon={<User className="h-4 w-4" />} />
                <InputGroup label="Segundo Nombre" name="second_name" value={formData.second_name} onChange={onChange} />
                <InputGroup label="Primer Apellido" name="last_name" value={formData.last_name} onChange={onChange} required />
                <InputGroup label="Segundo Apellido" name="second_lastname" value={formData.second_lastname} onChange={onChange} />
            </div>

            {/* Documento */}
            <div className="mb-5">
                <InputGroup
                    label="Número de Documento (DNI)"
                    name="document_number"
                    type="text"
                    inputMode="numeric"
                    value={formData.document_number}
                    onChange={onChange}
                    required
                    icon={<CreditCard className="h-4 w-4" />}
                    helper="Este será tu usuario para iniciar sesión."
                />
            </div>

            {/* Correos y teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <InputGroup label="Correo Institucional" name="institutional_email" type="email" value={formData.institutional_email} onChange={onChange} required icon={<Mail className="h-4 w-4" />} placeholder="usuario@upn.edu.co" />
                <InputGroup label="Correo Personal" name="email" type="email" value={formData.email} onChange={onChange} icon={<Mail className="h-4 w-4" />} helper="Para recuperación de contraseña" />
                <InputGroup label="Celular" name="phone_number" type="tel" value={formData.phone_number} onChange={onChange} icon={<Smartphone className="h-4 w-4" />} placeholder="300 123 4567" />
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                {[
                    { label: 'Contraseña *', field: 'password', show: showPassword, toggle: () => setShowPassword(p => !p) },
                    { label: 'Confirmar Contraseña *', field: 'password_confirm', show: showPasswordConfirm, toggle: () => setShowPasswordConfirm(p => !p) },
                ].map(({ label, field, show, toggle }) => (
                    <div key={field} className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">{label}</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-upn-600 transition-colors" />
                            <input
                                type={show ? 'text' : 'password'}
                                name={field}
                                value={formData[field]}
                                onChange={onChange}
                                required
                                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-upn-500/20 focus:border-upn-500 transition-all"
                                placeholder={field === 'password' ? 'Mín. 6 caracteres + carác. especial' : 'Repite tu contraseña'}
                            />
                            <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button type="button" onClick={onNext}
                className="w-full bg-upn-700 hover:bg-upn-800 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all">
                Continuar <ArrowRight size={20} />
            </button>
        </motion.div>
    );
}
