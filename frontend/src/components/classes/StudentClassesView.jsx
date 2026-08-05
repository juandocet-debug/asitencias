import React from 'react';
import { Archive, Filter, MoreVertical, RotateCcw, Sparkles } from 'lucide-react';

const tones = [
    'border-violet-300/55 from-violet-500/35 text-violet-100 shadow-violet-500/20',
    'border-amber-300/55 from-amber-500/35 text-amber-100 shadow-amber-500/20',
    'border-emerald-300/55 from-emerald-500/35 text-emerald-100 shadow-emerald-500/20',
    'border-rose-300/55 from-rose-500/35 text-rose-100 shadow-rose-500/20',
];

export default function StudentClassesView({ courses, loading, selectedYear, availableYears, archiveView, yearOpen, setYearOpen, setSelectedYear, setArchiveView, onOpen }) {
    return (
        <section className="relative min-h-full overflow-hidden bg-[#050219] px-4 pb-28 pt-5 text-white md:px-8 md:pb-10">
            <GameBackdrop />
            <div className="relative mx-auto w-full max-w-md space-y-5 md:max-w-6xl">
                <header className="relative overflow-hidden rounded-[2.2rem] border border-violet-300/35 bg-[#10072e]/90 p-5 shadow-[0_0_60px_rgba(118,87,246,0.32)]">
                    <HudCorners />
                    <p className="text-[11px] font-black uppercase tracking-[0.32em] text-violet-200">Mapa de misiones</p>
                    <h1 className="mt-2 text-4xl font-black italic leading-none drop-shadow-[0_0_16px_rgba(139,109,255,0.9)]">Mis clases</h1>
                    <p className="mt-3 text-sm font-semibold text-violet-100/70">Elige una misión, revisa tu progreso y marca asistencia cuando el portal esté abierto.</p>
                </header>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <YearSelector selectedYear={selectedYear} availableYears={availableYears} open={yearOpen} setOpen={setYearOpen} setSelectedYear={setSelectedYear} />
                    <ArchiveTabs value={archiveView} onChange={setArchiveView} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {courses.map((course, index) => <ClassQuest key={course.id} course={course} index={index} onOpen={() => onOpen(course)} />)}
                </div>

                {!loading && courses.length === 0 && <EmptyClasses />}
            </div>
        </section>
    );
}

function ClassQuest({ course, index, onOpen }) {
    const tone = tones[index % tones.length];
    const archived = Boolean(course.is_archived);
    return (
        <button onClick={onOpen} className={`group relative min-h-[13rem] overflow-hidden rounded-[2rem] border bg-gradient-to-br ${tone} to-black/30 p-5 text-left shadow-2xl transition active:scale-[0.98] ${archived ? 'opacity-60 grayscale' : ''}`}>
            <HudCorners small />
            <div className="absolute -right-14 top-12 h-32 w-32 rounded-full bg-white/10 blur-xl transition group-hover:scale-125" />
            <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                    <div className="grid h-16 w-16 place-items-center rounded-[1.35rem] border border-white/35 bg-black/30 text-3xl shadow-[0_0_22px_currentColor]">✦</div>
                    <span className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-black">#{course.code}</span>
                </div>
                <div>
                    <h2 className="line-clamp-2 text-2xl font-black italic leading-tight text-white">{course.name}</h2>
                    <p className="mt-2 text-xs font-bold text-white/70">Temporada {course.year}-{course.period}</p>
                    {archived && <span className="mt-3 inline-flex rounded-xl bg-white/15 px-3 py-1 text-[10px] font-black">Archivada</span>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <span className="rounded-2xl border border-white/20 bg-black/20 px-3 py-2 text-center text-xs font-black">Entrar</span>
                    <span className="rounded-2xl bg-white px-3 py-2 text-center text-xs font-black text-[#7657f6]">Ver progreso</span>
                </div>
            </div>
        </button>
    );
}

function ArchiveTabs({ value, onChange }) {
    const tabs = [
        { id: 'active', label: 'Activas', icon: Filter },
        { id: 'archived', label: 'Archivo', icon: Archive },
        { id: 'all', label: 'Todas', icon: RotateCcw },
    ];
    return (
        <div className="flex rounded-2xl border border-violet-300/25 bg-black/25 p-1">
            {tabs.map(tab => {
                const Icon = tab.icon;
                const active = value === tab.id;
                return (
                    <button key={tab.id} onClick={() => onChange(tab.id)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition sm:flex-none ${active ? 'bg-violet-500 text-white shadow-[0_0_18px_rgba(139,109,255,.45)]' : 'text-violet-100/60'}`}>
                        <Icon size={14} /> {tab.label}
                    </button>
                );
            })}
        </div>
    );
}

function YearSelector({ selectedYear, availableYears, open, setOpen, setSelectedYear }) {
    return (
        <div className="relative">
            <button onClick={() => setOpen(value => !value)} className="flex items-center gap-2 rounded-2xl border border-violet-300/25 bg-black/25 px-4 py-3 text-sm font-black text-violet-100">
                <Sparkles size={16} /> Temporada: {selectedYear} <MoreVertical size={16} className="rotate-90 opacity-60" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-violet-300/25 bg-[#10072e] p-1 shadow-2xl">
                        {['Todos', ...availableYears].map(year => (
                            <button key={year} onClick={() => { setSelectedYear(year); setOpen(false); }} className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-violet-100 hover:bg-violet-500/20">{year}</button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function EmptyClasses() {
    return (
        <div className="rounded-[2rem] border border-violet-300/25 bg-black/25 p-10 text-center text-violet-100/70">
            <p className="text-5xl">✦</p>
            <h3 className="mt-3 text-xl font-black text-white">Sin misiones disponibles</h3>
            <p className="mt-1 text-sm font-semibold">No hay clases para esta temporada.</p>
        </div>
    );
}

function GameBackdrop() {
    return (
        <>
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_7%,rgba(139,109,255,0.42),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(255,198,76,0.18),transparent_24%),linear-gradient(180deg,#120934_0%,#06021a_52%,#03010d_100%)]" />
            <div className="pointer-events-none fixed inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(139,109,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(139,109,255,.35)_1px,transparent_1px)] [background-size:42px_42px]" />
        </>
    );
}

function HudCorners({ small = false }) {
    const size = small ? 'h-4 w-4' : 'h-6 w-6';
    return (
        <>
            <span className={`absolute left-3 top-3 ${size} border-l border-t border-violet-300/50`} />
            <span className={`absolute right-3 top-3 ${size} border-r border-t border-violet-300/50`} />
            <span className={`absolute bottom-3 left-3 ${size} border-b border-l border-violet-300/50`} />
            <span className={`absolute bottom-3 right-3 ${size} border-b border-r border-violet-300/50`} />
        </>
    );
}
