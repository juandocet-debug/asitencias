/* eslint-disable */
import React from 'react';
import { Edit2, Eye, Trash2, Users } from 'lucide-react';

export const COLOR_PALETTE = {
    blue: { gradient: 'linear-gradient(135deg, #7aa7ff, #6f8cff)', lightBg: '#eef4ff', color: '#5273e8', label: 'Azul' },
    violet: { gradient: 'linear-gradient(135deg, #8b6dff, #7657f6)', lightBg: '#f0edff', color: '#654ae9', label: 'Violeta' },
    emerald: { gradient: 'linear-gradient(135deg, #6bd47f, #4cbe6d)', lightBg: '#ebfaef', color: '#279550', label: 'Esmeralda' },
    amber: { gradient: 'linear-gradient(135deg, #ffd260, #ffb948)', lightBg: '#fff7df', color: '#c98a07', label: 'Ámbar' },
    rose: { gradient: 'linear-gradient(135deg, #ff7b73, #ff5d67)', lightBg: '#fff0ef', color: '#e9545b', label: 'Rosa' },
    cyan: { gradient: 'linear-gradient(135deg, #7ad8ff, #56b6f7)', lightBg: '#ecfeff', color: '#0e7490', label: 'Cian' },
};

export default function CourseCard({ course, canManage, onEdit, onDelete, onClick }) {
    const palette = COLOR_PALETTE[course.color] || COLOR_PALETTE.violet;
    const studentCount = course.students?.length ?? 0;

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer overflow-hidden rounded-[1.7rem] border border-white/80 bg-white shadow-[0_16px_35px_rgba(82,90,130,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
            <div className="relative min-h-[8.8rem] overflow-hidden px-4 py-4" style={{ background: palette.gradient }}>
                <div className="absolute -right-8 top-12 h-16 w-16 rounded-full bg-[#eef0f8]" />
                <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute bottom-3 right-3 h-5 w-5 rounded-full border border-white/35 bg-white/10" />

                <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="mb-4 grid h-9 w-9 place-items-center rounded-xl bg-white/25 text-lg font-black text-white shadow-sm backdrop-blur">
                            {course.name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="line-clamp-2 text-lg font-black leading-tight text-white drop-shadow-sm">{course.name}</h3>
                        <span className="text-[11px] font-bold text-white/80">{course.year}-{course.period}</span>
                    </div>

                    {canManage && (
                        <div className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                            <button onClick={event => { event.stopPropagation(); onEdit(course); }} className="grid h-8 w-8 place-items-center rounded-xl bg-white/20 text-white" title="Editar">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={event => { event.stopPropagation(); onDelete(course.id); }} className="grid h-8 w-8 place-items-center rounded-xl bg-white/20 text-white hover:bg-red-500/80" title="Eliminar">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3.5 px-4 py-4">
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black" style={{ background: palette.lightBg, color: palette.color }}>
                        <span className="opacity-60">#</span> {course.code}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                        {course.start_date && new Date(course.start_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: palette.lightBg }}>
                            <Users size={15} style={{ color: palette.color }} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800">{studentCount}</p>
                            <p className="-mt-0.5 text-[10px] font-bold text-slate-400">Estudiantes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black" style={{ background: palette.lightBg, color: palette.color }}>
                        <Eye size={13} /> Ver
                    </div>
                </div>
            </div>
        </div>
    );
}
