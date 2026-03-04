/* eslint-disable */
// components/register/SidebarInfo.jsx
// Panel izquierdo decorativo del registro (solo desktop) con stepper.

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const STEPS = ['Datos Personales', 'Foto Digital'];

export default function SidebarInfo({ step }) {
    return (
        <div className="hidden md:flex md:w-5/12 bg-upn-700 relative flex-col justify-center items-center text-white p-12 overflow-hidden">
            {/* Fondos decorativos */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] rounded-full bg-white blur-3xl" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-blue-400 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 text-center space-y-8"
            >
                <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-xl inline-block mb-4">
                    <img src="/upn-logo.png" alt="Logo UPN" className="h-48 object-contain filter drop-shadow-lg mx-auto bg-white rounded-xl p-4" />
                </div>
                <div className="space-y-4 max-w-lg mx-auto">
                    <h1 className="text-4xl font-bold tracking-tight leading-tight">Únete a la Comunidad</h1>
                    <p className="text-xl text-blue-100 font-medium tracking-wide uppercase">Registro de Estudiantes</p>
                </div>

                {/* Stepper */}
                <div className="mt-8 space-y-4 text-left w-full max-w-xs mx-auto text-blue-100 text-sm">
                    {STEPS.map((label, i) => {
                        const idx = i + 1;
                        const isActive = step === idx;
                        const isDone = step > idx;
                        return (
                            <div key={label} className={`p-4 rounded-xl border transition-all ${isActive ? 'bg-white/20 border-white/40' : 'border-white/10 opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`font-bold w-7 h-7 rounded-full flex items-center justify-center text-xs ${isDone || isActive ? 'bg-white text-upn-700' : 'bg-white/30'}`}>
                                        {isDone ? <CheckCircle2 size={16} /> : idx}
                                    </div>
                                    <span>{label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            <div className="absolute bottom-8 text-center text-xs text-blue-200">© 2026 Universidad Pedagógica Nacional</div>
        </div>
    );
}
