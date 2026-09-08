import React, { useMemo, useState } from 'react';
import { Check, Save, X } from 'lucide-react';

export default function RubricGradingModal({ evaluation, student, existing, onClose, onSave }) {
    const criteria = evaluation?.rubric_detail?.criteria || [];
    const [scores, setScores] = useState(existing?.scores || {});
    const [comments, setComments] = useState(existing?.comments || '');
    const [saving, setSaving] = useState(false);
    const average = useMemo(() => {
        const values = criteria.map(item => Number(scores[item.id])).filter(value => value > 0);
        return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
    }, [criteria, scores]);
    const save = async () => {
        setSaving(true);
        try { await onSave(scores, comments, average); onClose(); } finally { setSaving(false); }
    };
    return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3 sm:p-6">
        <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between bg-[#1e1b4b] px-4 py-3 text-white sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-widest text-violet-200">Calificación por rúbrica</p><h2 className="text-lg font-black">{student?.first_name} {student?.last_name}</h2><p className="text-xs text-violet-100">{evaluation?.rubric_detail?.title}</p></div><button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10"><X size={18} /></button></header>
            <div className="space-y-4 overflow-y-auto p-4 sm:p-6">{criteria.map((criterion, index) => <section key={criterion.id} className="rounded-xl border border-slate-200 p-3"><div className="mb-3 flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#7657f6] text-xs font-black text-white">{index + 1}</span><h3 className="text-sm font-black text-slate-800">{criterion.name}</h3></div><div className="grid gap-2 sm:grid-cols-5">{(criterion.levels || []).map(level => { const selected = Number(scores[criterion.id]) === level.value; return <button type="button" key={level.id || level.value} onClick={() => setScores(current => ({ ...current, [criterion.id]: level.value }))} className={`min-h-24 rounded-lg border-2 p-2 text-left transition ${selected ? 'border-[#7657f6] bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-200'}`}><div className="flex items-center justify-between"><span className="text-lg font-black text-[#7657f6]">{level.value}</span>{selected && <Check size={15} className="text-[#7657f6]" />}</div><p className="mt-1 text-xs font-medium text-slate-600">{level.description || 'Sin descripción'}</p></button>; })}</div></section>)}<label className="grid gap-1 text-xs font-black uppercase text-slate-500">Comentario<textarea value={comments} onChange={e => setComments(e.target.value)} rows={3} className="field normal-case" placeholder="Retroalimentación para el estudiante..." /></label></div>
            <footer className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 p-3 sm:p-4"><p className="text-sm font-black text-slate-700">Promedio: <span className="text-[#7657f6]">{average ? average.toFixed(2) : 'Pendiente'}</span></p><div className="flex gap-2"><button onClick={onClose} className="secondary-btn">Cancelar</button><button onClick={save} disabled={saving || !criteria.length} className="primary-btn"><Save size={15} /> {saving ? 'Guardando...' : 'Guardar calificación'}</button></div></footer>
        </div>
    </div>;
}
