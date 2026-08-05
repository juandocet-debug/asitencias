import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, History, Loader2, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import api from '../../services/api';

export default function DirectoryImportModal({ onClose, onImported }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState('');

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const response = await api.get('/users/directory/imports/');
            setHistory(response.data || []);
        } catch {
            setError('No se pudo cargar el histórico.');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => { loadHistory(); }, []);

    const submit = async (event) => {
        event.preventDefault();
        if (!file) return setError('Selecciona un archivo Excel antes de importar.');
        setLoading(true);
        setError('');
        const data = new FormData();
        data.append('file', file);
        try {
            const response = await api.post('/users/directory/import/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(response.data);
            setFile(null);
            await loadHistory();
            onImported?.();
        } catch (err) {
            setError(err.response?.data?.error || 'No se pudo importar el directorio.');
        } finally {
            setLoading(false);
        }
    };

    const deleteBatch = async (batch) => {
        const action = batch.is_reverted ? 'eliminar del histórico' : 'revertir';
        if (!window.confirm(`¿Deseas ${action} la carga "${batch.file_name}"?`)) return;
        setLoading(true);
        try {
            await api.delete(`/users/directory/imports/${batch.id}/`);
            await loadHistory();
            onImported?.();
        } catch (err) {
            setError(err.response?.data?.error || 'No se pudo procesar la carga.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                <Header onClose={onClose} />
                <div className="grid max-h-[78vh] gap-5 overflow-y-auto p-6 lg:grid-cols-[1fr_1fr]">
                    <ImportForm file={file} setFile={setFile} loading={loading} onSubmit={submit} />
                    <HistoryPanel loading={historyLoading} history={history} onDelete={deleteBatch} />
                    {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 lg:col-span-2">{error}</div>}
                    {result && <ImportResult result={result} />}
                </div>
            </div>
        </div>
    );
}

function Header({ onClose }) {
    return (
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Directorio activo</p>
                <h3 className="text-xl font-black text-slate-800">Cargar estudiantes</h3>
            </div>
            <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500"><X size={18} /></button>
        </div>
    );
}

function ImportForm({ file, setFile, loading, onSubmit }) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-700">
                Columnas: primer nombre, primer apellido, segundo apellido, número de documento y correo electrónico.
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:bg-slate-100">
                <FileSpreadsheet className="mb-3 text-emerald-600" size={42} />
                <span className="font-black text-slate-700">{file ? file.name : 'Seleccionar archivo .xlsx'}</span>
                <span className="mt-1 text-xs font-semibold text-slate-400">La carga queda registrada y se puede revertir.</span>
                <input type="file" accept=".xlsx,.xlsm" className="hidden" onChange={event => setFile(event.target.files?.[0] || null)} />
            </label>
            <button disabled={loading || !file} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-4 font-black text-white disabled:opacity-60">
                {loading ? <Loader2 className="animate-spin" /> : <Upload size={18} />} Importar directorio
            </button>
        </form>
    );
}

function HistoryPanel({ loading, history, onDelete }) {
    return (
        <div className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 font-black text-slate-800"><History size={18} /> Histórico de cargas</div>
            {loading && <div className="text-sm font-bold text-blue-600">Cargando histórico...</div>}
            {!loading && history.length === 0 && <div className="text-sm font-semibold text-slate-400">Aún no hay cargas registradas.</div>}
            <div className="max-h-80 space-y-3 overflow-auto pr-1">
                {history.map(batch => <HistoryItem key={batch.id} batch={batch} onDelete={onDelete} />)}
            </div>
        </div>
    );
}

function HistoryItem({ batch, onDelete }) {
    return (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="line-clamp-1 font-black text-slate-700">{batch.file_name}</p>
                    <p className="text-xs font-semibold text-slate-400">{new Date(batch.created_at).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[11px] font-black ${batch.is_reverted ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                    {batch.is_reverted ? 'Revertida' : 'Activa'}
                </span>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500">
                {batch.created_count} creados · {batch.updated_count} actualizados · {batch.skipped_count} omitidos
            </p>
            {!batch.is_reverted ? (
                <button type="button" onClick={() => onDelete(batch)} className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600">
                    <RotateCcw size={14} /> Revertir carga
                </button>
            ) : (
                <button type="button" onClick={() => onDelete(batch)} className="mt-3 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
                    <Trash2 size={14} /> Eliminar del histórico
                </button>
            )}
        </div>
    );
}

function ImportResult({ result }) {
    return (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm lg:col-span-2">
            <p className="font-black text-emerald-700">Importación procesada #{result.batch_id}</p>
            <p className="mt-1 font-semibold text-emerald-700">Creados: {result.created} · Actualizados: {result.updated} · Omitidos: {result.skipped}</p>
            {result.errors?.length > 0 && (
                <ul className="mt-3 max-h-28 list-disc overflow-auto pl-5 text-xs font-semibold text-amber-700">
                    {result.errors.map(item => <li key={item}>{item}</li>)}
                </ul>
            )}
        </div>
    );
}
