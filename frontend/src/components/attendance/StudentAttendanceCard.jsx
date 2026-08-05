import React from 'react';
import { statusConfig } from './statusConfig';

export default function StudentAttendanceCard({ student, status, onToggle, getMediaUrl }) {
    const conf = statusConfig[status] || statusConfig.PRESENT;

    return (
        <button
            type="button"
            onClick={() => onToggle(student.id)}
            className={`w-full rounded-[1.6rem] border-2 p-3 text-left transition active:scale-[0.98] ${conf.bg} ${conf.border} ${conf.text}`}
        >
            <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 flex-shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md">
                    {student.photo
                        ? <img src={getMediaUrl(student.photo)} alt="" className="h-full w-full object-cover" />
                        : <span className="text-sm font-black opacity-60">{student.first_name?.[0]}{student.last_name?.[0]}</span>}
                </div>

                <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-black leading-tight">{student.first_name} {student.last_name}</h4>
                    <p className="mt-0.5 truncate text-[11px] font-bold opacity-60">{student.document_number}</p>
                </div>

                <div className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl text-lg font-black shadow-sm ${conf.badge}`}>
                    {conf.icon}
                </div>
            </div>
        </button>
    );
}
