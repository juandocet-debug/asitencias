// components/classDetails/ClassActionsBar.jsx
// Barra de acciones del profesor/admin en la vista de clase.
// Muestra el código, botón QR, Gestionar (solo admin), Reportes y Llamar Asistencia.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, UserPlus, BarChart3, Check } from 'lucide-react';

export default function ClassActionsBar({ course, isAdmin, courseId, onQr, onManage, onAttendance }) {
    const navigate = useNavigate();
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Código */}
            <div className="flex items-center gap-3 bg-upn-50 px-4 py-2 rounded-xl border border-upn-100 w-full md:w-auto">
                <div className="text-upn-600 font-bold text-sm">CÓDIGO:</div>
                <div className="font-mono text-xl font-black text-upn-900 tracking-wider">{course.code}</div>
            </div>
            {/* Botones */}
            <div className="flex gap-2 w-full md:w-auto flex-wrap">
                <button onClick={onQr}
                    className="flex-1 md:flex-none justify-center bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
                    <QrCode size={18} /> Código QR
                </button>
                {isAdmin && (
                    <button onClick={onManage}
                        className="flex-1 md:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                        <UserPlus size={18} /> Gestionar
                    </button>
                )}
                <button onClick={() => navigate(`/classes/${courseId}/reports`)}
                    className="flex-1 md:flex-none justify-center bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                    <BarChart3 size={18} /> Ver Reportes
                </button>
                <button onClick={onAttendance}
                    className="flex-1 md:flex-none justify-center bg-upn-600 hover:bg-upn-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-upn-600/20">
                    <Check size={18} /> Llamar Asistencia
                </button>
            </div>
        </div>
    );
}
