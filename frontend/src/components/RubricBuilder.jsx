import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Save, Trash2, X } from 'lucide-react';

const DEFAULT_LEVELS = [1, 2, 3, 4, 5].map(value => ({ value, description: '' }));
const LEVEL_NAMES = { 1: 'Insuficiente', 2: 'Básico', 3: 'Adecuado', 4: 'Bueno', 5: 'Excelente' };

const newCriterion = () => ({ id: Date.now() + Math.random(), name: '', levels: DEFAULT_LEVELS.map(level => ({ ...level })) });

function CriterionEditor({ criterion, index, canRemove, onChange, onRemove }) {
    const [expanded, setExpanded] = useState(true);
    const updateLevel = (levelIndex, field, value) => onChange({ ...criterion, levels: criterion.levels.map((level, i) => i === levelIndex ? { ...level, [field]: value } : level) });
    const addLevel = () => onChange({ ...criterion, levels: [...criterion.levels, { value: (criterion.levels.at(-1)?.value || 0) + 1, description: '' }] });
    return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#7657f6] text-xs font-black text-white">{index + 1}</span>
            <input value={criterion.name} onChange={e => onChange({ ...criterion, name: e.target.value })} placeholder={`Nombre del criterio ${index + 1}`} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none" />
            <button type="button" onClick={() => setExpanded(value => !value)} className="icon-soft h-8 w-8"><ChevronDown className={expanded ? 'rotate-180' : ''} size={16} /></button>
            {canRemove && <button type="button" onClick={onRemove} className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>}
        </div>
        {expanded && <div className="space-y-2 p-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Niveles de logro</p>
            {criterion.levels.map((level, levelIndex) => <div key={levelIndex} className="grid gap-2 sm:grid-cols-[74px_1fr_auto]">
                <label className="grid place-items-center rounded-lg bg-slate-50 p-2 text-center"><span className="text-lg font-black text-[#7657f6]">{level.value}</span><span className="text-[10px] font-bold text-slate-500">{LEVEL_NAMES[level.value] || `Nivel ${level.value}`}</span><input type="number" min="1" max="10" value={level.value} onChange={e => updateLevel(levelIndex, 'value', Number(e.target.value))} className="mt-1 w-12 rounded border border-slate-200 text-center text-xs" /></label>
                <textarea value={level.description} onChange={e => updateLevel(levelIndex, 'description', e.target.value)} rows={2} placeholder="Describe qué debe demostrar el estudiante para alcanzar este nivel..." className="field resize-y text-sm" />
                {criterion.levels.length > 1 && <button type="button" onClick={() => onChange({ ...criterion, levels: criterion.levels.filter((_, i) => i !== levelIndex) })} className="self-start rounded-lg p-2 text-red-500 hover:bg-red-50"><X size={14} /></button>}
            </div>)}
            <button type="button" onClick={addLevel} className="text-xs font-black text-[#7657f6]">+ Agregar nivel</button>
        </div>}
    </div>;
}

export default function RubricBuilder({ initialRubric, onClose, onSave }) {
    const [title, setTitle] = useState(initialRubric?.title || '');
    const [description, setDescription] = useState(initialRubric?.description || '');
    const [evaluatorCount, setEvaluatorCount] = useState(initialRubric?.evaluator_count || 1);
    const [criteria, setCriteria] = useState(initialRubric?.criteria?.map(item => ({ id: item.id, name: item.name, levels: (item.levels || []).map(level => ({ value: level.value, description: level.description || '' })) })) || [newCriterion()]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const save = async event => {
        event.preventDefault();
        const validCriteria = criteria.filter(item => item.name.trim()).map((item, order) => ({ name: item.name.trim(), order, levels: item.levels.filter(level => level.value > 0).map(level => ({ value: level.value, description: level.description || '' })) }));
        if (!title.trim()) return setError('Escribe el título de la rúbrica.');
        if (!validCriteria.length) return setError('Agrega al menos un criterio con nombre.');
        setSaving(true);
        try { await onSave({ title: title.trim(), description, evaluator_count: evaluatorCount, criteria: validCriteria }); onClose(); } catch { setError('No se pudo guardar la rúbrica.'); } finally { setSaving(false); }
    };
    return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3 sm:p-6">
        <form onSubmit={save} className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between bg-[#164e63] px-4 py-3 text-white sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-widest text-cyan-200">Instrumento de evaluación</p><h2 className="text-lg font-black">{initialRubric ? 'Editar rúbrica' : 'Nueva rúbrica'}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10"><X size={18} /></button></header>
            <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
                {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p>}
                <div className="grid gap-3 sm:grid-cols-[1fr_100px]"><label className="grid gap-1 text-xs font-black uppercase text-slate-500">Título *<input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Evaluación del proyecto final" className="field normal-case" /></label><label className="grid gap-1 text-xs font-black uppercase text-slate-500">Evaluadores<input type="number" min="1" max="10" value={evaluatorCount} onChange={e => setEvaluatorCount(Number(e.target.value))} className="field" /></label></div>
                <label className="grid gap-1 text-xs font-black uppercase text-slate-500">Descripción general<textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Propósito de esta rúbrica..." className="field normal-case" /></label>
                <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black text-slate-800">Criterios y niveles</h3><button type="button" onClick={() => setCriteria(items => [...items, newCriterion()])} className="secondary-btn"><Plus size={15} /> Criterio</button></div>
                <div className="grid gap-3">{criteria.map((criterion, index) => <CriterionEditor key={criterion.id} criterion={criterion} index={index} canRemove={criteria.length > 1} onChange={value => setCriteria(items => items.map((item, i) => i === index ? value : item))} onRemove={() => setCriteria(items => items.filter((_, i) => i !== index))} />)}</div>
            </div>
            <footer className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 p-3 sm:p-4"><button type="button" onClick={onClose} className="secondary-btn">Cancelar</button><button disabled={saving} className="primary-btn"><Save size={15} /> {saving ? 'Guardando...' : 'Guardar rúbrica'}</button></footer>
        </form>
    </div>;
}
