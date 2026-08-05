/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { AlertCircle, Camera, CheckCircle, Mail, Phone, Save, Shield, User } from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

const inputClass = 'w-full rounded-2xl border border-violet-300/25 bg-black/25 px-4 py-3 text-white outline-none placeholder:text-violet-100/35 focus:ring-4 focus:ring-violet-300/20 disabled:cursor-not-allowed disabled:text-violet-100/45';

export default function Profile() {
    const { updateUser } = useUser();
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [preview, setPreview] = useState(null);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/me/');
            setUser(response.data);
            if (response.data.photo) setPreview(response.data.photo);
        } catch {
            setMessage({ type: 'error', text: 'No se pudo cargar la información del perfil.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setUser(prev => ({ ...prev, photo: file }));
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        const formData = new FormData();
        formData.append('second_name', user.second_name || '');
        formData.append('phone_number', user.phone_number || '');
        formData.append('personal_email', user.personal_email || '');
        if (user.photo instanceof File) formData.append('photo', user.photo);
        try {
            const response = await api.patch('/users/me/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setUser(response.data);
            if (response.data.photo) setPreview(response.data.photo);
            updateUser(response.data);
            setMessage({ type: 'success', text: '¡Perfil actualizado exitosamente!' });
        } catch {
            setMessage({ type: 'error', text: 'Error al actualizar. Verifica los datos.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <GameLoading />;

    return (
        <section className="relative min-h-full overflow-hidden bg-[#050219] px-4 pb-28 pt-5 text-white md:px-8 md:pb-10">
            <GameBackdrop />
            <div className="relative mx-auto w-full max-w-md space-y-5 md:max-w-5xl">
                <header className="relative overflow-hidden rounded-[2.2rem] border border-violet-300/35 bg-[#10072e]/90 p-5 shadow-[0_0_60px_rgba(118,87,246,0.32)]">
                    <HudCorners />
                    <p className="text-[11px] font-black uppercase tracking-[0.32em] text-violet-200">Ficha de jugador</p>
                    <h1 className="mt-2 text-4xl font-black italic leading-none drop-shadow-[0_0_16px_rgba(139,109,255,0.9)]">Mi perfil</h1>
                    <p className="mt-3 text-sm font-semibold text-violet-100/70">Actualiza tu foto y datos de contacto para mantener tu identidad activa.</p>
                </header>

                <div className="grid gap-5 md:grid-cols-[0.9fr_1.3fr]">
                    <PlayerCard user={user} preview={preview} onPhotoChange={handlePhotoChange} />
                    <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-[2rem] border border-violet-300/30 bg-[#0d0828]/92 p-5 shadow-[0_0_38px_rgba(118,87,246,0.22)]">
                        <HudCorners />
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-violet-300">Datos editables</p>
                        <h2 className="mt-1 text-2xl font-black italic">Configuración personal</h2>
                        {message.text && <MessageBox message={message} />}
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <Field label="Nombres"><input value={user.first_name || ''} disabled className={inputClass} /></Field>
                            <Field label="Segundo nombre"><input name="second_name" value={user.second_name || ''} onChange={handleChange} placeholder="Si tienes" className={inputClass} /></Field>
                            <Field label="Apellidos"><input value={user.last_name || ''} disabled className={inputClass} /></Field>
                            <Field label="Documento"><IconInput icon={User} value={user.document_number || 'No registrado'} disabled /></Field>
                            <Field label="Correo institucional"><IconInput icon={Mail} value={user.email || ''} disabled /></Field>
                            <Field label="Celular"><IconInput icon={Phone} name="phone_number" value={user.phone_number || ''} onChange={handleChange} placeholder="+57 300 000 0000" /></Field>
                            <Field label="Correo personal"><IconInput icon={Mail} type="email" name="personal_email" value={user.personal_email || ''} onChange={handleChange} placeholder="ejemplo@gmail.com" /></Field>
                        </div>
                        <div className="mt-6 rounded-2xl border border-blue-300/25 bg-blue-500/10 p-4 text-sm text-blue-100">
                            <div className="flex gap-3"><Shield size={18} className="mt-0.5 shrink-0" /><p><b>Datos institucionales:</b> nombre, documento y correo institucional los gestiona la administración.</p></div>
                        </div>
                        <button type="submit" disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(139,109,255,0.45)] disabled:opacity-60">
                            {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save size={18} />}
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}

function PlayerCard({ user, preview, onPhotoChange }) {
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-amber-300/35 bg-[#1c102c]/95 p-6 text-center shadow-[0_0_42px_rgba(245,181,64,0.24)]">
            <HudCorners />
            <div className="relative mx-auto h-36 w-36">
                <div className="absolute inset-0 rounded-[2rem] bg-amber-300/30 blur-2xl" />
                <div className="relative h-36 w-36 overflow-hidden rounded-[2rem] border-4 border-white/15 bg-black/25">
                    {preview ? <img src={preview} alt="Foto de perfil" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-violet-100/45"><User size={54} /></div>}
                </div>
                <label className="absolute -bottom-2 -right-2 grid h-12 w-12 cursor-pointer place-items-center rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_0_22px_rgba(139,109,255,.55)]">
                    <Camera size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={onPhotoChange} />
                </label>
            </div>
            <h2 className="mt-6 text-2xl font-black italic">{user.first_name} {user.last_name}</h2>
            <span className="mt-2 inline-flex rounded-full border border-amber-300/35 bg-amber-300/15 px-4 py-1 text-xs font-black uppercase text-amber-100">{user.role === 'ADMIN' ? 'Administrador' : user.role === 'TEACHER' ? 'Docente' : 'Estudiante'}</span>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                <MiniStat value="--" label="Clases" />
                <MiniStat value="--%" label="Asistencia" />
            </div>
        </section>
    );
}

function Field({ label, children }) {
    return <label className="space-y-2 text-sm font-black text-violet-100/72">{label}{children}</label>;
}

function IconInput({ icon: Icon, ...props }) {
    return (
        <div className="relative">
            <Icon className="absolute left-3.5 top-3.5 text-violet-200/50" size={18} />
            <input {...props} className={`${inputClass} pl-10`} />
        </div>
    );
}

function MiniStat({ value, label }) {
    return <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-2xl font-black italic">{value}</p><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">{label}</p></div>;
}

function MessageBox({ message }) {
    const ok = message.type === 'success';
    return (
        <div className={`mt-5 flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold ${ok ? 'border-emerald-300/35 bg-emerald-500/10 text-emerald-100' : 'border-rose-300/35 bg-rose-500/10 text-rose-100'}`}>
            {ok ? <CheckCircle size={20} /> : <AlertCircle size={20} />} {message.text}
        </div>
    );
}

function GameLoading() {
    return (
        <section className="relative grid min-h-full place-items-center overflow-hidden bg-[#050219] px-6 py-24 text-white">
            <GameBackdrop />
            <div className="relative rounded-[2rem] border border-violet-300/35 bg-[#10072e]/90 p-8 text-center shadow-[0_0_55px_rgba(118,87,246,0.38)]">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.6rem] border border-violet-300/45 bg-black/25 text-3xl shadow-[0_0_24px_rgba(139,109,255,0.55)]"><span className="animate-pulse">✦</span></div>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.28em] text-violet-300">Cargando perfil</p>
            </div>
        </section>
    );
}

function GameBackdrop() {
    return (
        <>
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_7%,rgba(139,109,255,0.42),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(255,198,76,0.18),transparent_24%),linear-gradient(180deg,#120934_0%,#06021a_52%,#03010d_100%)]" />
            <div className="pointer-events-none fixed inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(139,109,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(139,109,255,.35)_1px,transparent_1px)] [background-size:42px_42px]" />
        </>
    );
}

function HudCorners() {
    return (
        <>
            <span className="absolute left-3 top-3 h-6 w-6 border-l border-t border-violet-300/50" />
            <span className="absolute right-3 top-3 h-6 w-6 border-r border-t border-violet-300/50" />
            <span className="absolute bottom-3 left-3 h-6 w-6 border-b border-l border-violet-300/50" />
            <span className="absolute bottom-3 right-3 h-6 w-6 border-b border-r border-violet-300/50" />
        </>
    );
}
