import React, { useState } from 'react';
import { FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import api from '../../services/api';

export default function DirectoryImportModal({ onClose, onImported }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        if (!file) return setError('Selecciona un archivo Excel.');
        setLoading(true);
        setError('');
        const data = new FormData();
        data.append('file', file);
        try {
            const response = await api.post('/users/directory/import/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(response.data);
            onImported?.();
        } catch (err) {
            setError(err.response?.data?.error || 'No se pudo importar el directorio.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <form onSubmit={submit} className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Directorio activo</p>
                        <h3 className="text-xl font-black text-slate-800">Cargar estudiantes</h3>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500"><X size={18} /></button>
                </div>
                <div className="space-y-5 p-6">
                    <div className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-700">
                        Columnas esperadas: primer nombre, primer apellido, segundo apellido, número de documento y correo electrónico.
                    </div>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:bg-slate-100">
                        <FileSpreadsheet className="mb-3 text-emerald-600" size={42} />
                        <span className="font-black text-slate-700">{file ? file.name : 'Seleccionar archivo .xlsx'}</span>
                        <span className="mt-1 text-xs font-semibold text-slate-400">El sistema compara correo y documento antes de crear/actualizar.</span>
                        <input type="file" accept=".xlsx,.xlsm" className="hidden" onChange={event => setFile(event.target.files?.[0] || null)} />
                    </label>
                    {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}
                    {result && <ImportResult result={result} />}
                    <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-4 font-black text-white disabled:opacity-60">
                        {loading ? <Loader2 className="animate-spin" /> : <Upload size={18} />} Importar directorio
                    </button>
                </div>
            </form>
        </div>
    );
}

function ImportResult({ result }) {
    return (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm">
            <p className="font-black text-emerald-700">Importación procesada</p>
            <p className="mt-1 font-semibold text-emerald-700">Creados: {result.created} · Actualizados: {result.updated} · Omitidos: {result.skipped}</p>
            {result.errors?.length > 0 && (
                <ul className="mt-3 max-h-28 list-disc overflow-auto pl-5 text-xs font-semibold text-amber-700">
                    {result.errors.map(item => <li key={item}>{item}</li>)}
                </ul>
            )}
        </div>
    );
}
