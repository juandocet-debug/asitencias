import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, UserPlus, BarChart3, Check } from 'lucide-react';

export default function ClassActionsBar({ course, isAdmin, courseId, onQr, onManage, onAttendance }) {
    const navigate = useNavigate();

    return (
        <div className="rounded-[2rem] border border-white/80 bg-white/95 p-4 shadow-[0_18px_50px_rgba(50,58,90,0.10)]">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[#eef4ff] px-4 py-3 ring-1 ring-blue-100">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#075df6]">Código</div>
                <div className="font-mono text-lg font-black tracking-widest text-[#172033]">{course.code}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
                <ActionButton onClick={onQr} icon={<QrCode size={18} />} className="border border-slate-200 bg-white text-slate-700 shadow-sm">
                    Código QR
                </ActionButton>

                {isAdmin && (
                    <ActionButton onClick={onManage} icon={<UserPlus size={18} />} className="bg-[#0aa36d] text-white shadow-lg shadow-emerald-200">
                        Gestionar
                    </ActionButton>
                )}

                <ActionButton onClick={() => navigate(`/classes/${courseId}/reports`)} icon={<BarChart3 size={18} />} className="bg-[#172033] text-white shadow-lg shadow-slate-200">
                    Ver Reportes
                </ActionButton>

                <ActionButton onClick={onAttendance} icon={<Check size={18} />} className="bg-gradient-to-br from-[#0b63ff] to-[#7657f6] text-white shadow-xl shadow-violet-200">
                    Llamar Asistencia
                </ActionButton>
            </div>
        </div>
    );
}

function ActionButton({ children, icon, onClick, className }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-black transition active:scale-[0.98] md:flex-1 ${className}`}
        >
            {icon}
            <span className="leading-tight">{children}</span>
        </button>
    );
}
