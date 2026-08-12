import React from 'react';
import { Link2, Package, Youtube } from 'lucide-react';
import { getMediaUrl } from '../../utils/dateUtils';
import { Field, FileField, SubmitButton } from './MissionFields';
import { initialResource } from './missionDefaults';

export function ResourceForm({ disabled, form, mission, setForm, saving, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-sm font-black text-[#ccff00]">{mission ? `Recursos para ${mission.name}` : 'Crea una misión primero'}</p>
      <Field label="Título recurso" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required disabled={disabled} />
      <select
        value={form.resource_type}
        disabled={disabled}
        onChange={(event) => setForm({ ...form, resource_type: event.target.value })}
        className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold outline-none focus:border-[#ccff00]"
      >
        <option value="YOUTUBE">YouTube</option>
        <option value="READING">Lectura</option>
        <option value="LINK">Enlace</option>
        <option value="FILE">Archivo</option>
      </select>
      <Field label="URL" value={form.url} onChange={(value) => setForm({ ...form, url: value })} disabled={disabled} icon={<Youtube size={16} />} />
      <FileField label="Archivo opcional" icon={<Link2 size={16} />} disabled={disabled} value={form.file} onChange={(file) => setForm({ ...form, file })} onClear={() => setForm(initialResource)} />
      <SubmitButton saving={saving} disabled={disabled} label="Agregar recurso" />
    </form>
  );
}

export function MissionList({ missions }) {
  if (!missions.length) {
    return (
      <div className="mt-4 rounded-3xl border border-dashed border-[#ccff00]/25 bg-[#ccff00]/5 p-5 text-sm font-bold text-violet-100/70">
        Aún no hay misiones. Crea la primera y luego agrega videos, lecturas, archivos e inventario.
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {missions.map((mission) => (
        <article key={mission.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
          <div className="flex items-center gap-3 p-3">
            <MissionThumb mission={mission} />
            <div className="min-w-0">
              <h4 className="truncate text-sm font-black text-white">{mission.name}</h4>
              <p className="text-xs font-bold text-violet-100/55">{mission.resources?.length || 0} recursos · grupo {mission.group_size}</p>
            </div>
          </div>
          {mission.inventory_name && (
            <div className="border-t border-white/10 px-3 py-2 text-xs font-black text-[#ccff00]">
              Premio: {mission.inventory_name}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function MissionThumb({ mission }) {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#ccff00]/10 text-[#ccff00]">
      {mission.image ? <img src={getMediaUrl(mission.image)} alt="" className="h-full w-full object-cover" /> : <Package size={24} />}
    </div>
  );
}
