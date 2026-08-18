import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import fondoLogin from '../../assets/fondoLogin.png';
import superiorLogo from '../../assets/superior.png';

const STEPS = ['Identidad', 'Contacto', 'Programa', 'Seguridad', 'Foto'];

export default function SidebarInfo({ step }) {
    return (
        <aside className="relative hidden overflow-hidden bg-[#050612] p-10 text-white md:flex md:w-5/12 md:flex-col md:items-center md:justify-center">
            <img src={fondoLogin} alt="" className="absolute inset-0 h-full w-full object-cover object-[38%_center] opacity-85" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,18,0.92),rgba(12,9,24,0.82)),radial-gradient(circle_at_42%_28%,rgba(118,87,246,0.28),transparent_34%)]" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full text-center">
                <motion.img
                    src={superiorLogo}
                    alt="AGON"
                    className="mx-auto mb-5 w-full max-w-[330px] drop-shadow-[0_0_32px_rgba(118,87,246,0.45)]"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: [1, 1.018, 1] }}
                    transition={{ opacity: { duration: 0.45 }, scale: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' } }}
                />
                <p className="text-xs font-black uppercase tracking-[0.4em] text-[#ccff00]">Crea tu perfil</p>
                <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight">Únete a la aventura</h1>
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.24em] text-violet-200/75">Registro de estudiantes</p>
                <div className="mx-auto mt-9 max-w-xs space-y-3 text-left text-sm text-violet-100">
                    {STEPS.map((label, index) => {
                        const number = index + 1;
                        const active = step === number;
                        const done = number < step;
                        return (
                            <div key={label} className={`rounded-xl border p-4 transition ${active ? 'border-[#ccff00]/45 bg-[#ccff00]/10 shadow-[0_0_20px_rgba(204,255,0,0.09)]' : 'border-violet-300/15 bg-white/[0.03] opacity-65'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${active || done ? 'bg-[#ccff00] text-slate-950' : 'bg-white/20'}`}>{done ? <CheckCircle2 size={16} /> : number}</div>
                                    <span className="font-bold">{label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
            <p className="absolute bottom-8 text-xs text-violet-200/40">© 2026 Universidad Pedagógica Nacional</p>
        </aside>
    );
}
