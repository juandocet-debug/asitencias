import React from 'react';
import { ArrowLeft, Check, Download, Sparkles } from 'lucide-react';

export default function RubricPreviewPage({ rubric, onBack }) {
    const grade = rubric?.studentGrade;
    const scores = grade?.scores || {};
    return <div className="mx-auto max-w-6xl space-y-4 pb-6 sm:space-y-5">
        <header className="overflow-hidden rounded-[1.5rem] border border-cyan-200 bg-[#123b52] text-white shadow-lg shadow-cyan-900/10">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
                <button onClick={onBack} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20" aria-label="Volver"><ArrowLeft size={19} /></button>
                <div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200"><Sparkles size={12} /> Vista del estudiante</p><h1 className="mt-0.5 truncate text-lg font-black sm:text-2xl">{rubric.title}</h1></div>
                <button onClick={() => window.print()} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-cyan-400 px-3 py-2 text-xs font-black text-[#123b52] shadow-md shadow-cyan-950/20 transition hover:bg-cyan-300 sm:px-4 sm:text-sm"><Download size={15} /> <span className="hidden sm:inline">Descargar PDF</span><span className="sm:hidden">PDF</span></button>
            </div>
            <div className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-cyan-50/85">Aquí puedes consultar los criterios, niveles seleccionados y retroalimentación de tu evaluación.</p>
                {grade && <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 sm:min-w-36"><div><p className="text-[10px] font-black uppercase tracking-wider text-cyan-200">Nota final</p><p className="text-2xl font-black text-white">{grade.final_grade}</p></div><div className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-cyan-400 text-[#123b52]"><Check size={18} strokeWidth={3} /></div></div>}
            </div>
        </header>
        <main className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="border-b border-slate-100 pb-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">Instrumento de evaluación</p><h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">{rubric.title}</h2>{rubric.description && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{rubric.description}</p>}</div>
            <div className="mt-5 grid gap-4">{(rubric.criteria || []).map((criterion, index) => <section key={criterion.id} className="overflow-hidden rounded-2xl border border-slate-200"><div className="flex min-w-0 items-center gap-3 bg-slate-100 px-3 py-3 sm:px-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cyan-700 text-xs font-black text-white">{index + 1}</span><h3 className="min-w-0 flex-1 truncate font-black text-slate-800">{criterion.name}</h3>{scores[criterion.id] && <span className="shrink-0 rounded-lg bg-cyan-100 px-2 py-1 text-xs font-black text-cyan-800">Nivel {scores[criterion.id]}</span>}</div><div className="grid gap-2 p-2 sm:grid-cols-5 sm:gap-0 sm:p-0">{(criterion.levels || []).map(level => { const selected = Number(scores[criterion.id]) === level.value; return <div key={level.id || level.value} className={`relative min-w-0 rounded-xl p-3 sm:rounded-none sm:border-r sm:border-slate-200 sm:last:border-r-0 ${selected ? 'bg-cyan-50 ring-2 ring-inset ring-cyan-600' : 'bg-white'}`}><div className="flex items-center justify-between"><p className={`text-lg font-black ${selected ? 'text-cyan-700' : 'text-slate-400'}`}>{level.value}</p>{selected && <Check size={16} className="text-cyan-700" strokeWidth={3} />}</div><p className="mt-1 text-sm leading-snug text-slate-600">{level.description || 'Sin descripción'}</p></div>; })}</div></section>)}</div>
            {grade?.comments && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-amber-700">Retroalimentación</p><p className="mt-1 text-sm leading-relaxed text-slate-700">{grade.comments}</p></div>}
        </main>
    </div>;
}
