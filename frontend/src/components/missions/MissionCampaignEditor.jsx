import React from 'react';
import { Image } from 'lucide-react';
import { Field, FileField, SubmitButton } from './MissionFields';

export default function MissionCampaignEditor({ form, setForm, saving, onSubmit, fontSize, setFontSize }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-[#ccff00]/30 bg-black/50 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#ccff00]">Editor de campaña gamer</h4>
          <p className="text-[10px] text-slate-400">Actualizaciones en vivo en el celular.</p>
        </div>
        <FontToggle fontSize={fontSize} setFontSize={setFontSize} />
      </div>

      <Field label="Título de la campaña" placeholder="Ej: Lukian the servant" value={form.name} maxLength={25} onChange={(value) => setForm({ ...form, name: value })} required />
      <Field label="Subtítulo hero" placeholder="Ej: The servant of two gods" value={form.hero_subtitle} maxLength={45} onChange={(value) => setForm({ ...form, hero_subtitle: value })} />
      <Field label="Historia / lore" placeholder="Cuenta el reto de la campaña..." value={form.lore_text} maxLength={180} onChange={(value) => setForm({ ...form, lore_text: value })} textarea />
      <Field label="Epílogo / reglas" placeholder="Objetivos o requisitos finales..." value={form.description} maxLength={150} onChange={(value) => setForm({ ...form, description: value })} textarea />

      <div className="grid gap-3 md:grid-cols-2">
        <FileField label="Portada hero" icon={<Image size={16} />} value={form.hero_image} accept="image/*" onChange={(file) => setForm({ ...form, hero_image: file })} onClear={() => setForm({ ...form, hero_image: null })} />
        <FileField label="Personaje / objeto" icon={<Image size={16} />} value={form.image} accept="image/*" onChange={(file) => setForm({ ...form, image: file })} onClear={() => setForm({ ...form, image: null })} />
      </div>

      <SubmitButton saving={saving} label="Guardar campaña gamer" />
    </form>
  );
}

function FontToggle({ fontSize, setFontSize }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 p-1">
      {['normal', 'small'].map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => setFontSize(size)}
          className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition ${fontSize === size ? 'bg-[#ccff00] text-slate-950' : 'text-slate-400 hover:text-white'}`}
        >
          {size === 'normal' ? 'Aa Normal' : 'aa Pequeña'}
        </button>
      ))}
    </div>
  );
}
