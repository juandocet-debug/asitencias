import React from 'react';

export default function AppStatCard({ title, value, icon: Icon, theme, detail, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative min-h-[9rem] overflow-hidden rounded-[1.7rem] bg-gradient-to-br ${theme.bg} p-4 text-left text-white shadow-xl shadow-slate-300/40 transition active:scale-[0.98]`}
        >
            <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/15" />
            <div className="absolute -bottom-8 left-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/22">
                        <Icon size={20} />
                    </div>
                    <span className="rounded-full bg-white/18 px-2 py-1 text-[10px] font-black">●</span>
                </div>
                <div>
                    <p className="text-2xl font-black leading-none">{value}</p>
                    <h3 className="mt-2 text-sm font-black">{title}</h3>
                    {detail && <p className="mt-1 text-[11px] font-semibold text-white/80">{detail}</p>}
                </div>
            </div>
        </button>
    );
}
