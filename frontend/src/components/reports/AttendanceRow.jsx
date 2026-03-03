// components/reports/AttendanceRow.jsx
// Fila de asistencia: muestra datos de un participante (foto, nombre, estadísticas)
// en la tabla del reporte. Hace clic para abrir el modal de detalle.

import React, { useState } from 'react';
import { Mail, FileText, Edit3, X } from 'lucide-react';

export default function AttendanceRow({ student, onClick, getMediaUrl }) {
    const [showPhoto, setShowPhoto] = useState(false);

    // Color del porcentaje según umbral
    const rateColor = student.attendance_rate >= 80 ? 'text-emerald-600'
        : student.attendance_rate >= 50 ? 'text-amber-600' : 'text-red-600';
    const rateBg = student.attendance_rate >= 80 ? 'bg-emerald-50'
        : student.attendance_rate >= 50 ? 'bg-amber-50' : 'bg-red-50';

    const handleEmailClick = (e) => {
        e.stopPropagation();
        window.location.href = `mailto:${student.email}`;
    };

    const handlePhotoClick = (e) => {
        e.stopPropagation();
        if (student.photo) setShowPhoto(true);
    };

    return (
        <>
            <div
                onClick={onClick}
                className="flex items-center gap-4 py-3 px-4 bg-white border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-all group"
            >
                {/* Avatar con ampliar foto */}
                <div
                    onClick={handlePhotoClick}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-sm font-semibold text-slate-500 uppercase flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-upn-300 transition-all"
                >
                    {student.photo ? (
                        <img src={getMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        `${student.first_name?.[0]}${student.last_name?.[0]}`
                    )}
                </div>

                {/* Nombre + correo */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 text-sm">
                            {student.first_name} {student.last_name}
                        </p>
                        {student.pending_excuses?.length > 0 && (
                            <div
                                className="bg-blue-600 text-[10px] text-white px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse"
                                title="Tiene excusas pendientes de revisión"
                            >
                                <FileText size={8} /> Revisar
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-slate-400 truncate">{student.email}</span>
                        <button
                            onClick={handleEmailClick}
                            className="p-0.5 text-slate-400 hover:text-upn-600 transition-colors"
                            title="Enviar correo"
                        >
                            <Mail size={12} />
                        </button>
                    </div>
                </div>

                {/* Contadores de asistencia */}
                <div className="hidden md:flex items-center gap-2">
                    <div className="text-center px-2.5 py-1 bg-emerald-50 rounded-lg min-w-[40px]">
                        <span className="text-sm font-bold text-emerald-600">{student.present}</span>
                        <p className="text-[9px] text-emerald-600 font-medium">Asist.</p>
                    </div>
                    <div className="text-center px-2.5 py-1 bg-amber-50 rounded-lg min-w-[40px]">
                        <span className="text-sm font-bold text-amber-600">{student.late}</span>
                        <p className="text-[9px] text-amber-600 font-medium">Tard.</p>
                    </div>
                    <div className="text-center px-2.5 py-1 bg-red-50 rounded-lg min-w-[40px]">
                        <span className="text-sm font-bold text-red-600">{student.absent}</span>
                        <p className="text-[9px] text-red-600 font-medium">Fallas</p>
                    </div>
                    {(student.excused || 0) > 0 && (
                        <div className="text-center px-2.5 py-1 bg-blue-50 rounded-lg min-w-[40px]">
                            <span className="text-sm font-bold text-blue-600">{student.excused}</span>
                            <p className="text-[9px] text-blue-600 font-medium">Exc.</p>
                        </div>
                    )}
                </div>

                {/* Porcentaje de asistencia */}
                <div className={`px-3 py-1.5 rounded-lg ${rateBg} min-w-[55px] text-center`}>
                    <span className={`text-sm font-bold ${rateColor}`}>{student.attendance_rate}%</span>
                </div>

                {/* Icono de editar al hover */}
                <div className="text-slate-300 group-hover:text-upn-600 transition-colors">
                    <Edit3 size={16} />
                </div>
            </div>

            {/* Modal para ampliar foto */}
            {showPhoto && student.photo && (
                <div
                    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowPhoto(false)}
                >
                    <div className="relative max-w-md">
                        <img
                            src={getMediaUrl(student.photo)}
                            alt={`${student.first_name} ${student.last_name}`}
                            className="rounded-2xl shadow-2xl max-h-[80vh] object-contain"
                        />
                        <button
                            onClick={() => setShowPhoto(false)}
                            className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-lg hover:bg-slate-100"
                        >
                            <X size={16} />
                        </button>
                        <p className="text-center text-white mt-3 font-medium">
                            {student.first_name} {student.last_name}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
