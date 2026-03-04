/* eslint-disable */
// components/admin/adminDashboardUi.jsx
// Primitivos de UI del AdminDashboard: KpiCard, ChartCard, ProgressBar, CustomTooltip, SysBadge.

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

// ── Contador animado ─────────────────────────────────────
export function KpiCard({ title, value, subtitle, icon: Icon, color, trend, trendValue, delay = 0, onClick }) {
    const [displayed, setDisplayed] = useState(0);
    const numericValue = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
    const suffix = String(value).includes('%') ? '%' : '';

    useEffect(() => {
        let start = null;
        const duration = 900;
        const timeoutId = setTimeout(() => {
            const step = (timestamp) => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setDisplayed(Math.floor(eased * numericValue));
                if (progress < 1) requestAnimationFrame(step);
                else setDisplayed(numericValue);
            };
            requestAnimationFrame(step);
        }, delay);
        return () => clearTimeout(timeoutId);
    }, [numericValue, delay]);

    const isPositive = trend === 'up';
    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    const isClickable = Boolean(onClick);

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm transition-all duration-300 group relative overflow-hidden
                ${isClickable
                    ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:ring-2 hover:ring-blue-200 active:scale-[0.98]'
                    : 'hover:shadow-md'
                }`}
        >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6 ${color}`} />
            <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                    <Icon size={22} className={`${color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex items-center gap-1">
                    {trendValue !== undefined && (
                        <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            <TrendIcon size={12} />{trendValue}%
                        </span>
                    )}
                    {isClickable && <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />}
                </div>
            </div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-800 tabular-nums">
                {numericValue % 1 !== 0 ? numericValue.toFixed(1) : displayed}{suffix}
            </h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            {isClickable && <p className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 mt-2 font-semibold transition-opacity">Ver detalle →</p>}
        </div>
    );
}

// ── Tarjeta contenedora de gráfica ───────────────────────
export function ChartCard({ title, subtitle, children, className = '', onClick }) {
    const isClickable = Boolean(onClick);
    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className} ${isClickable ? 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-blue-100 transition-all' : ''}`}
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="text-base font-bold text-slate-800">{title}</h4>
                    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                {isClickable && (
                    <span className="text-xs text-blue-500 font-bold flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                        Ver todo <ChevronRight size={13} />
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

// ── Barra de progreso clickeable ─────────────────────────
export function ProgressBar({ value, color = 'bg-blue-500', label, sublabel, onClick }) {
    const isClickable = Boolean(onClick);
    return (
        <div onClick={onClick} className={`space-y-1 rounded-xl p-2 -mx-2 transition-all ${isClickable ? 'cursor-pointer hover:bg-slate-50 hover:ring-1 hover:ring-slate-200' : ''}`}>
            <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 truncate max-w-[180px]">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{value}%</span>
                    {isClickable && <ChevronRight size={14} className="text-slate-300" />}
                </div>
            </div>
            {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
            <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full transition-all duration-700 ease-out`} style={{ width: `${Math.min(value, 100)}%` }} />
            </div>
        </div>
    );
}

// ── Tooltip personalizado para Recharts ──────────────────
export const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-2xl border border-slate-700">
            <p className="font-bold text-slate-200 mb-1">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
                    <span className="text-slate-300">{p.name}:</span>
                    <span className="font-bold">{p.value}{p.name?.includes('Asistencia') ? '%' : ''}</span>
                </div>
            ))}
        </div>
    );
};

// ── Badge de estado del sistema ──────────────────────────
export function SysBadge({ ok, label }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {ok ? <CheckCircle size={13} /> : <XCircle size={13} />}{label}
        </div>
    );
}
