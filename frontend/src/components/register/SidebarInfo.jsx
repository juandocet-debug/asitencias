import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import fondoHero from '../../assets/FondoHero2.png';
import avatarGamer from '../../assets/gamer_avatar_1.png';

const STEPS = ['Datos personales', 'Foto y vinculación'];

export default function SidebarInfo({ step }) {
    return (
        <aside className="relative hidden overflow-hidden bg-[#0c0918] p-12 text-white md:flex md:w-5/12 md:flex-col md:items-center md:justify-center">
            <img src={fondoHero} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-45" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#160d35]/45 via-[#241147]/75 to-[#090611]" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full text-center">
                <div className="mx-auto mb-6 grid h-48 w-48 place-items-center rounded-full border border-[#ccff00]/35 bg-[#151026]/80 shadow-[0_0_60px_rgba(204,255,0,0.16)]">
                    <img src={avatarGamer} alt="Avatar AGON" className="h-[112%] w-[112%] object-contain drop-shadow-2xl" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.4em] text-[#ccff00]">Crea tu perfil</p>
                <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight">Únete a la aventura</h1>
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.24em] text-violet-200/75">Registro de estudiantes</p>
                <div className="mx-auto mt-9 max-w-xs space-y-3 text-left text-sm text-violet-100">
                    {STEPS.map((label, index) => {
                        const number = index + 1;
                        const active = step === number;
                        const done = step > number;
                        return (
                            <div key={label} className={`rounded-xl border p-4 transition ${active ? 'border-[#ccff00]/45 bg-[#ccff00]/10 shadow-[0_0_20px_rgba(204,255,0,0.09)]' : 'border-white/10 opacity-60'}`}>
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
