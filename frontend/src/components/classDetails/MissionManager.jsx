import React, { useEffect, useMemo, useState } from 'react';
import { Image, Link2, Loader2, Plus, ShieldCheck, Youtube } from 'lucide-react';
import api from '../../services/api';
import { getMediaUrl } from '../../utils/dateUtils';

const initialMission = {
  name: '',
  description: '',
  group_size: 4,
  inventory_name: '',
  inventory_description: '',
  image: null,
};

const initialResource = { title: '', resource_type: 'YOUTUBE', url: '', file: null };

export default function MissionManager({ courseId, showToast }) {
  const [missions, setMissions] = useState([]);
  const [missionForm, setMissionForm] = useState(initialMission);
  const [resourceForm, setResourceForm] = useState(initialResource);
  const [saving, setSaving] = useState(false);

  const activeMission = useMemo(() => missions.find((mission) => mission.is_active) || missions[0], [missions]);

  useEffect(() => {
    fetchMissions();
  }, [courseId]);

  const fetchMissions = async () => {
    try {
      const { data } = await api.get(`/academic/missions/?course=${courseId}`);
      setMissions(Array.isArray(data) ? data : data.results || []);
    } catch {
      showToast?.('No se pudieron cargar las misiones', 'error');
    }
  };

  const createMission = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('course', courseId);
      Object.entries(missionForm).forEach(([key, value]) => {
        if (value !== null && value !== '') payload.append(key, value);
      });
      await api.post('/academic/missions/', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMissionForm(initialMission);
      await fetchMissions();
      showToast?.('Misión creada para la clase', 'success');
    } catch {
      showToast?.('No se pudo crear la misión', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addResource = async (event) => {
    event.preventDefault();
    if (!activeMission) return;
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(resourceForm).forEach(([key, value]) => {
        if (value !== null && value !== '') payload.append(key, value);
      });
      await api.post(`/academic/missions/${activeMission.id}/resources/`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResourceForm(initialResource);
      await fetchMissions();
      showToast?.('Recurso agregado a la misión', 'success');
    } catch {
      showToast?.('No se pudo agregar el recurso', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-[#ccff00]/20 bg-[#08091d] p-5 text-white shadow-[0_0_45px_rgba(124,76,255,0.18)]">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#ccff00]">Control de misiones</p>
          <h3 className="text-2xl font-black">Actividades, recursos e inventario</h3>
        </div>
        {activeMission && <MissionPreview mission={activeMission} />}
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <MissionForm form={missionForm} setForm={setMissionForm} saving={saving} onSubmit={createMission} />
        <ResourceForm
          disabled={!activeMission}
          form={resourceForm}
          mission={activeMission}
          setForm={setResourceForm}
          saving={saving}
          onSubmit={addResource}
        />
      </div>
    </section>
  );
}

function MissionPreview({ mission }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 pr-4">
      <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-[#ccff00]/10">
        {mission.image ? <img src={getMediaUrl(mission.image)} alt="" className="h-full w-full object-cover" /> : <ShieldCheck size={24} />}
      </div>
      <div>
        <p className="text-sm font-black">{mission.name}</p>
        <p className="text-xs text-slate-400">{mission.resources?.length || 0} recursos · grupos de {mission.group_size}</p>
      </div>
    </div>
  );
}

function MissionForm({ form, setForm, saving, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
      <Field label="Nombre de misión" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
      <Field label="Descripción" value={form.description} onChange={(value) => setForm({ ...form, description: value })} textarea />
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Tamaño grupo" type="number" value={form.group_size} onChange={(value) => setForm({ ...form, group_size: value })} min="1" />
        <FileField label="Imagen" icon={<Image size={16} />} onChange={(file) => setForm({ ...form, image: file })} />
      </div>
      <Field label="Inventario/recompensa" value={form.inventory_name} onChange={(value) => setForm({ ...form, inventory_name: value })} />
      <Field label="Detalle inventario" value={form.inventory_description} onChange={(value) => setForm({ ...form, inventory_description: value })} textarea />
      <SubmitButton saving={saving} label="Crear misión" />
    </form>
  );
}

function ResourceForm({ disabled, form, mission, setForm, saving, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-black text-[#ccff00]">{mission ? `Recursos para ${mission.name}` : 'Crea una misión primero'}</p>
      <Field label="Título recurso" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required disabled={disabled} />
      <select
        value={form.resource_type}
        disabled={disabled}
        onChange={(event) => setForm({ ...form, resource_type: event.target.value })}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold outline-none focus:border-[#ccff00]"
      >
        <option value="YOUTUBE">YouTube</option>
        <option value="READING">Lectura</option>
        <option value="LINK">Enlace</option>
        <option value="FILE">Archivo</option>
      </select>
      <Field label="URL" value={form.url} onChange={(value) => setForm({ ...form, url: value })} disabled={disabled} icon={<Youtube size={16} />} />
      <FileField label="Archivo opcional" icon={<Link2 size={16} />} disabled={disabled} onChange={(file) => setForm({ ...form, file })} />
      <SubmitButton saving={saving} disabled={disabled} label="Agregar recurso" />
    </form>
  );
}

function Field({ disabled, icon, label, textarea, onChange, ...props }) {
  const Input = textarea ? 'textarea' : 'input';
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase text-slate-300">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 focus-within:border-[#ccff00]">
        {icon}
        <Input
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 w-full bg-transparent py-3 text-sm font-bold outline-none disabled:opacity-50"
          {...props}
        />
      </div>
    </label>
  );
}

function FileField({ disabled, icon, label, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase text-slate-300">{label}</span>
      <span className="flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm font-bold">
        {icon} Seleccionar
        <input disabled={disabled} type="file" className="hidden" onChange={(event) => onChange(event.target.files?.[0] || null)} />
      </span>
    </label>
  );
}

function SubmitButton({ disabled, saving, label }) {
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
