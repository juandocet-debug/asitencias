import React from 'react';
import { Sparkles } from 'lucide-react';
import { getMediaUrl } from '../../utils/dateUtils';

export default function MissionPhonePreview({ mission, form, fontSize }) {
  const data = form.name ? form : (mission || form);
  const title = data?.name || 'Título de campaña';
  const subtitle = data?.hero_subtitle || 'Subtítulo de la campaña';

  return (
    <div className="relative mx-auto w-full max-w-[30rem] overflow-hidden rounded-[3rem] border-4 border-[#ccff00]/45 bg-[#070919] p-4 font-['Montserrat'] text-white shadow-[0_0_80px_rgba(204,255,0,0.32)]">
      <div className="absolute left-1/2 top-2 z-30 h-4 w-28 -translate-x-1/2 rounded-full border border-slate-700 bg-slate-800" />

      <div className="relative mt-3 flex h-[22rem] flex-col justify-end overflow-hidden rounded-[2rem] border border-[#ccff00]/35 bg-slate-900 p-5 text-center shadow-xl">
        <PreviewImage value={data?.hero_image} fallback={<Sparkles className="text-[#ccff00]" size={72} />} />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070919] via-[#070919]/45 to-transparent" />
        <div className="relative z-20 space-y-2 pb-2">
          <h2 className={`${fontSize === 'small' ? 'text-2xl' : 'text-3xl'} max-h-24 overflow-hidden break-words font-black uppercase leading-tight tracking-wider text-white drop-shadow-[0_4px_14px_rgba(0,0,0,1)]`}>
            {title}
          </h2>
          <p className="max-h-12 overflow-hidden break-words text-xs font-extrabold uppercase leading-snug tracking-widest text-[#ccff00]">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex min-h-[20rem] flex-col justify-end overflow-hidden rounded-[2rem] border border-slate-800 bg-[#0a0d24] text-left shadow-inner">
        {data?.image && (
          <div className="absolute inset-0 z-0 h-full w-full">
            <img src={previewSrc(data.image)} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d24] via-[#0a0d24]/78 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d24] via-transparent to-transparent" />
          </div>
        )}
        <div className="relative z-20 max-w-[74%] space-y-4 p-5">
          <TextBlock title="Lore / Historia" text={data?.lore_text || 'Escribe la historia o introducción del desafío aquí...'} highlight />
          <TextBlock title="Epílogo" text={data?.description || 'Objetivos y reglas de la misión...'} />
        </div>
      </div>
    </div>
  );
}

function PreviewImage({ value, fallback }) {
  if (!value) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(204,255,0,0.22)_0%,rgba(9,5,30,0.96)_100%)]">
        {fallback}
      </div>
    );
  }
  return <img src={previewSrc(value)} alt="" className="absolute inset-0 h-full w-full object-cover" />;
}

function TextBlock({ title, text, highlight }) {
  return (
    <div>
      <h4 className={`text-[10px] font-black uppercase tracking-wider ${highlight ? 'text-[#ccff00]' : 'text-slate-400'}`}>{title}</h4>
      <p className="mt-1 break-words text-xs font-semibold leading-relaxed text-slate-200">{text}</p>
    </div>
  );
}

function previewSrc(value) {
  return value instanceof File ? URL.createObjectURL(value) : getMediaUrl(value);
}
