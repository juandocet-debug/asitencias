import React, { useEffect, useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import api from '../../services/api';
import { getMediaUrl } from '../../utils/dateUtils';
import MissionCampaignEditor from '../missions/MissionCampaignEditor';
import MissionPhonePreview from '../missions/MissionPhonePreview';
import { MissionList, ResourceForm } from '../missions/MissionResources';
import { initialMission, initialResource, missionToForm } from '../missions/missionDefaults';

export default function MissionManager({ courseId, showToast }) {
  const [missions, setMissions] = useState([]);
  const [missionForm, setMissionForm] = useState(initialMission);
  const [resourceForm, setResourceForm] = useState(initialResource);
  const [saving, setSaving] = useState(false);
  const [fontSize, setFontSize] = useState('normal');

  const activeMission = useMemo(() => missions.find((mission) => mission.is_active) || missions[0], [missions]);

  useEffect(() => { fetchMissions(); }, [courseId]);
  useEffect(() => { setMissionForm(missionToForm(activeMission)); }, [activeMission]);

  const fetchMissions = async () => {
    try {
      const { data } = await api.get(`/academic/missions/?course=${courseId}`);
      setMissions(Array.isArray(data) ? data : data.results || []);
    } catch {
      showToast?.('No se pudieron cargar las misiones', 'error');
    }
  };

  const saveMission = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = missionPayload(missionForm, courseId);
      if (activeMission) {
        await api.patch(`/academic/missions/${activeMission.id}/`, payload, formHeaders);
        showToast?.('Campaña gamer actualizada', 'success');
      } else {
        await api.post('/academic/missions/', payload, formHeaders);
        showToast?.('Campaña gamer creada', 'success');
      }
      await fetchMissions();
    } catch {
      showToast?.('No se pudo guardar la campaña', 'error');
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
      await api.post(`/academic/missions/${activeMission.id}/resources/`, payload, formHeaders);
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
    <section className="rounded-[1.8rem] bg-transparent font-['Montserrat'] text-white">
      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <MissionCampaignEditor
            form={missionForm}
            setForm={setMissionForm}
            saving={saving}
            onSubmit={saveMission}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
          <ResourceForm
            disabled={!activeMission}
            form={resourceForm}
            mission={activeMission}
            setForm={setResourceForm}
            saving={saving}
            onSubmit={addResource}
          />
        </div>
        <div className="sticky top-4">
          <MissionPhonePreview mission={activeMission} form={missionForm} fontSize={fontSize} />
          {activeMission && <MissionPreview mission={activeMission} />}
        </div>
      </div>
      <MissionList missions={missions} />
    </section>
  );
}

const formHeaders = { headers: { 'Content-Type': 'multipart/form-data' } };

function missionPayload(form, courseId) {
  const payload = new FormData();
  payload.append('course', courseId);
  Object.entries(form).forEach(([key, value]) => {
    if (value instanceof File || value === '' || typeof value === 'number') payload.append(key, value);
    else if (typeof value === 'string' && !value.startsWith('http')) payload.append(key, value);
  });
  return payload;
}

function MissionPreview({ mission }) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#ccff00]/20 bg-[#ccff00]/10 p-2 pr-4">
      <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-[#ccff00]/10">
        {mission.image ? <img src={getMediaUrl(mission.image)} alt="" className="h-full w-full object-cover" /> : <Package size={24} />}
      </div>
      <div>
        <p className="text-sm font-black">{mission.name}</p>
        <p className="text-xs text-violet-100/60">{mission.resources?.length || 0} recursos · grupos de {mission.group_size}</p>
      </div>
    </div>
  );
}
