import React from 'react';
import { CheckCircle, FileText, X, XCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export default function ExcuseDetailModal({ excuse, getMediaUrl, onClose, onReview }) {
    const canReview = excuse.attendance_id || (excuse.has_excuse && excuse.excuse_status === 'PENDING');
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <h4 className="font-bold text-slate-800">Detalle de la Excusa</h4>
                    <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
                </div>
                <div className="space-y-6 p-8">
                    <InfoBlock label="Fecha de la falta">{formatDate(excuse.date)}</InfoBlock>
                    <InfoBlock label="Motivo / nota">
                        <span className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm italic text-slate-600">
                            "{excuse.excuse_note || 'Sin nota adjunta'}"
                        </span>
                    </InfoBlock>
                    {excuse.excuse_file && <ExcuseFile excuse={excuse} getMediaUrl={getMediaUrl} />}
                    {canReview && <ReviewActions excuse={excuse} onReview={onReview} />}
                </div>
            </div>
        </div>
    );
}

function InfoBlock({ label, children }) {
    return <div><p className="mb-1 text-xs font-bold uppercase text-slate-400">{label}</p><p className="font-bold text-slate-800">{children}</p></div>;
}

function ExcuseFile({ excuse, getMediaUrl }) {
    const url = getMediaUrl(excuse.excuse_file);
    const isImage = excuse.excuse_file.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);
    return (
        <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-400">Documento de soporte</p>
            <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {isImage ? <img src={url} className="h-auto max-h-[400px] w-full object-contain" alt="Soporte" /> : <FileLink url={url} />}
            </div>
        </div>
    );
}

function FileLink({ url }) {
    return (
        <div className="p-8 text-center">
            <FileText size={48} className="mx-auto mb-3 text-slate-400" />
            <p className="mb-4 text-sm font-bold text-slate-700">El documento es un PDF u otro formato</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-upn-600 px-4 py-2 text-sm font-bold text-white hover:bg-upn-700">Abrir documento</a>
        </div>
    );
}

function ReviewActions({ excuse, onReview }) {
    const id = excuse.attendance_id || excuse.id;
    return (
        <div className="flex gap-4 pt-4">
            <button onClick={() => onReview(id, 'REJECTED')} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 font-bold text-red-600 hover:bg-red-100"><XCircle size={18} /> Rechazar</button>
            <button onClick={() => onReview(id, 'APPROVED')} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"><CheckCircle size={18} /> Aprobar</button>
        </div>
    );
}
