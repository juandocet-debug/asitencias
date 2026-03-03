// components/reports/AlertCard.jsx
// Tarjeta de alerta para un participante con 3 o más inasistencias.
// Muestra datos de contacto y enlaces para enviar email o llamar.

import React from 'react';
import { Mail, Phone } from 'lucide-react';

export default function AlertCard({ student, course, getMediaUrl }) {
    return (
        <div className="bg-white border border-red-100 rounded-xl p-5">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center overflow-hidden text-base font-semibold text-red-600 uppercase flex-shrink-0">
                    {student.photo ? (
                        <img src={getMediaUrl(student.photo)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        `${student.first_name?.[0]}${student.last_name?.[0]}`
                    )}
                </div>

                {/* Info */}
                <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{student.first_name} {student.last_name}</h4>
                    <p className="text-sm text-slate-500 mb-3">{student.document_number}</p>
                    <div className="flex gap-4 text-sm">
                        <span className="text-red-600 font-semibold">{student.absences} Fallas</span>
                        <span className="text-amber-600 font-semibold">{student.lates} Tardanzas</span>
                    </div>
                </div>
            </div>

            {/* Acciones de contacto */}
            <div className="flex gap-2 mt-4">
                {student.email && (
                    <a
                        href={`mailto:${student.email}?subject=Seguimiento de Asistencia - ${course?.name}&body=Estimado/a ${student.first_name},%0A%0AEste es un seguimiento respecto a su asistencia en la clase ${course?.name}. Actualmente tiene ${student.absences} fallas registradas.%0A%0APor favor comuníquese con nosotros.`}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                        <Mail size={16} /> Email
                    </a>
                )}
                {student.phone_number && (
                    <a
                        href={`tel:${student.phone_number}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-upn-600 hover:bg-upn-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                        <Phone size={16} /> Llamar
                    </a>
                )}
            </div>
        </div>
    );
}
