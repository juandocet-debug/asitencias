import React from 'react';

export default function AppStatCard({ title, value, icon: Icon, theme, detail, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative min-h-[10rem] overflow-hidden rounded-[1.65rem] bg-gradient-to-br ${theme.bg} p-4 text-left text-white shadow-[0_16px_30px_rgba(82,90,130,0.18)] transition active:scale-[0.98] md:min-h-[9.5rem]`}
        >
            <div className="absolute -right-8 top-11 h-16 w-16 rounded-full bg-[#eef0f8]" />
            <div className="absolute -left-7 -top-7 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full border border-white/30 bg-white/10" />
            <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/25 shadow-sm backdrop-blur">
                        <Icon size={18} />
                    </div>
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[9px] font-black">i</span>
                </div>
                <div>
                    <h3 className="text-lg font-black leading-tight">{title}</h3>
                    <p className="mt-1 text-2xl font-black leading-none">{value}</p>
                    {detail && <p className="mt-2 max-w-[8.5rem] text-[10px] font-bold leading-tight text-white/80">{detail}</p>}
                </div>
            </div>
        </button>
    );
}
