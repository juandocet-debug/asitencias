import React from 'react';
import { Bell, Search } from 'lucide-react';

export default function MobileHero({ eyebrow = 'Good morning,', title, subtitle, action }) {
    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-white/70 p-5 shadow-[0_20px_60px_rgba(78,89,130,0.12)] backdrop-blur">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-200/60 blur-2xl" />
            <div className="absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-amber-200/60 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-slate-400">{eyebrow}</p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-[#172033]">{title}</h1>
                    {subtitle && <p className="mt-2 max-w-xl text-sm font-medium text-slate-500">{subtitle}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                    <button className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-slate-600 shadow-sm">
                        <Bell size={18} />
                        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#ff6868]" />
                    </button>
                    <button className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-600 shadow-sm">
                        <Search size={18} />
                    </button>
                </div>
            </div>
            {action && <div className="relative mt-5">{action}</div>}
        </div>
    );
}
