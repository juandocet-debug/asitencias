import React from 'react';
import { Loader2, Plus } from 'lucide-react';
import { getMediaUrl } from '../../utils/dateUtils';

export function Field({ disabled, icon, label, textarea, onChange, maxLength, ...props }) {
  const Input = textarea ? 'textarea' : 'input';
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase text-violet-100/75">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 focus-within:border-[#ccff00]">
        {icon}
        <Input
          disabled={disabled}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 w-full bg-transparent py-3 text-sm font-bold outline-none disabled:opacity-50"
          {...props}
        />
      </div>
    </label>
  );
}

export function FileField({ disabled, icon, label, value, onChange, onClear, accept }) {
  const isFile = value instanceof File;
  const hasValue = value !== null && value !== '';

  if (hasValue) {
    return (
      <div className="block">
        <span className="mb-1 block text-xs font-black uppercase text-violet-100/75">{label}</span>
        <div className="flex min-h-12 items-center justify-between rounded-2xl border border-[#ccff00]/40 bg-black/60 p-2 px-3">
          <div className="flex min-w-0 items-center gap-2">
            {accept?.includes('image') && (
              <img src={isFile ? URL.createObjectURL(value) : getMediaUrl(value)} alt="" className="h-8 w-8 shrink-0 rounded-lg border border-[#ccff00]/30 object-cover" />
            )}
            <span className="truncate text-[11px] font-bold text-slate-300">{isFile ? value.name : 'Archivo guardado'}</span>
          </div>
          {onClear && (
            <button type="button" disabled={disabled} onClick={onClear} className="rounded-xl bg-rose-500/10 px-2.5 py-1 text-[9px] font-black uppercase text-rose-400">
              Quitar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase text-violet-100/75">{label}</span>
      <span className="flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 text-sm font-bold hover:border-[#ccff00]/40">
        {icon} <span className="text-slate-400">Seleccionar archivo</span>
        <input disabled={disabled} type="file" accept={accept} className="hidden" onChange={(event) => onChange(event.target.files?.[0] || null)} />
      </span>
    </label>
  );
}

export function SubmitButton({ disabled, saving, label }) {
  return (
    <button
      disabled={disabled || saving}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_22px_rgba(204,255,0,0.35)] disabled:opacity-50"
    >
      {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
      {label}
    </button>
  );
}
