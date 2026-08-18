import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight, BookOpen, Building2, CreditCard, Eye,
    EyeOff, Loader2, Lock, Mail, Smartphone, User,
} from 'lucide-react';
import { InputGroup } from './registerUtils';
import api from '../../services/api';

export default function StepPersonalData({ formData, onChange, onNext, loading = false }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [faculties, setFaculties] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [page, setPage] = useState(1);

    useEffect(() => {
        Promise.all([api.get('/users/faculties/'), api.get('/users/programs/')])
            .then(([facRes, progRes]) => {
                setFaculties(facRes.data || []);
                setPrograms(progRes.data || []);
            })
            .catch(() => {});
    }, []);

    const filteredPrograms = useMemo(() => {
        if (!formData.faculty) return [];
        return programs.filter(program => String(program.faculty) === String(formData.faculty));
    }, [formData.faculty, programs]);

    const pageTitles = ['Identidad', 'Contacto', 'Programa', 'Seguridad'];
    const back = () => setPage(current => Math.max(1, current - 1));
    const next = () => setPage(current => Math.min(4, current + 1));

    return (
        <motion.div key="step1" className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ccff00]">Paso {page} de 4</p>
                    <h3 className="mt-1 text-xl font-black text-white">{pageTitles[page - 1]}</h3>
                </div>
                <div className="flex gap-1.5">
                    {pageTitles.map((title, index) => (
                        <span key={title} className={`h-2 w-8 rounded-full ${page === index + 1 ? 'bg-[#ccff00]' : 'bg-white/12'}`} />
                    ))}
                </div>
            </div>

            <AnimateStep page={page}>
                {page === 1 && (
                    <RegisterSection title="Identidad">
                        <InputGroup label="Primer nombre" name="first_name" value={formData.first_name} onChange={onChange} required icon={<User className="h-4 w-4" />} />
                        <InputGroup label="Segundo nombre" name="second_name" value={formData.second_name} onChange={onChange} placeholder="Si tienes" />
                        <InputGroup label="Primer apellido" name="last_name" value={formData.last_name} onChange={onChange} required />
                        <InputGroup label="Segundo apellido" name="second_lastname" value={formData.second_lastname} onChange={onChange} />
                        <InputGroup label="Documento" name="document_number" type="text" inputMode="numeric" value={formData.document_number} onChange={onChange} required icon={<CreditCard className="h-4 w-4" />} />
                    </RegisterSection>
                )}
                {page === 2 && (
                    <RegisterSection title="Contacto y clase">
                        <InputGroup label="Correo institucional" name="institutional_email" type="email" value={formData.institutional_email} onChange={onChange} required icon={<Mail className="h-4 w-4" />} placeholder="usuario@upn.edu.co" />
                        <InputGroup label="Correo personal" name="email" type="email" value={formData.email} onChange={onChange} icon={<Mail className="h-4 w-4" />} />
                        <InputGroup label="Celular" name="phone_number" type="tel" value={formData.phone_number} onChange={onChange} icon={<Smartphone className="h-4 w-4" />} placeholder="300 123 4567" />
                        <InputGroup label="Código de clase" name="class_code" value={formData.class_code} onChange={onChange} icon={<BookOpen className="h-4 w-4" />} placeholder="Opcional" className="uppercase tracking-widest" />
                    </RegisterSection>
                )}
                {page === 3 && (
                    <RegisterSection title="Programa académico">
                        <SelectField icon={<Building2 className="h-4 w-4" />} label="Facultad" name="faculty" value={formData.faculty} onChange={onChange} options={faculties} placeholder="Seleccionar facultad" />
                        <SelectField icon={<BookOpen className="h-4 w-4" />} label="Programa" name="program" value={formData.program} onChange={onChange} options={filteredPrograms} placeholder={formData.faculty ? 'Seleccionar programa' : 'Primero elige facultad'} disabled={!formData.faculty} />
                    </RegisterSection>
                )}
                {page === 4 && (
                    <RegisterSection title="Seguridad">
                        <PasswordField label="Contraseña" field="password" value={formData.password} onChange={onChange} show={showPassword} toggle={() => setShowPassword(p => !p)} />
                        <PasswordField label="Confirmar contraseña" field="password_confirm" value={formData.password_confirm} onChange={onChange} show={showPasswordConfirm} toggle={() => setShowPasswordConfirm(p => !p)} />
                    </RegisterSection>
                )}
            </AnimateStep>

            <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={back} disabled={page === 1 || loading} className="rounded-xl border border-white/12 bg-white/[0.04] py-3 font-bold text-violet-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-35">
                    Atrás
                </button>
                {page < 4 ? (
                    <button type="button" onClick={next} disabled={loading} className="rounded-xl bg-gradient-to-r from-[#7657f6] to-[#9a6dff] py-3 font-bold text-white shadow-[0_12px_32px_rgba(118,87,246,0.32)] transition hover:brightness-110 disabled:opacity-70">
                        Siguiente
                    </button>
                ) : (
                    <button type="button" onClick={onNext} disabled={loading} className="rounded-xl bg-gradient-to-r from-[#7657f6] to-[#9a6dff] py-3 font-bold text-white shadow-[0_12px_32px_rgba(118,87,246,0.32)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
                        <span className="flex items-center justify-center gap-3">
                            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Validando</> : <>Foto <ArrowRight size={20} /></>}
                        </span>
                    </button>
                )}
            </div>
        </motion.div>
    );
}

function AnimateStep({ page, children }) {
    return (
        <motion.div key={page} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.22 }}>
            {children}
        </motion.div>
    );
}

function RegisterSection({ title, children }) {
    return (
        <section className="min-h-[300px] rounded-2xl border border-violet-400/18 bg-[#0e0b1d]/72 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.24)]">
            <h3 className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#ccff00]">{title}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
        </section>
    );
}

function SelectField({ label, icon, options, placeholder, ...props }) {
    return (
        <div className="w-full space-y-1.5">
            <label className="ml-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-violet-100/75">{icon} {label}</label>
            <select {...props} className="block w-full rounded-xl border border-violet-400/20 bg-[#151126] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#ccff00]/70 focus:ring-2 focus:ring-[#ccff00]/10 disabled:text-violet-200/35">
                <option value="">{placeholder}</option>
                {options.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
        </div>
    );
}

function PasswordField({ label, field, value, onChange, show, toggle }) {
    return (
        <div className="space-y-1.5">
            <label className="ml-1 text-[11px] font-black uppercase tracking-[0.12em] text-violet-100/75">{label}</label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-200/55" />
                <input type={show ? 'text' : 'password'} name={field} value={value} onChange={onChange} required className="w-full rounded-xl border border-violet-400/20 bg-white/[0.06] py-3 pl-10 pr-10 text-sm font-semibold text-white placeholder-violet-200/32 outline-none transition focus:border-[#ccff00]/70 focus:ring-2 focus:ring-[#ccff00]/10" placeholder={field === 'password' ? 'Mín. 6 + carácter especial' : 'Repite contraseña'} />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-200/60">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
        </div>
    );
}
