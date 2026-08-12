import React, { useEffect, useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import api from '../../services/api';
import { getMediaUrl } from '../../utils/dateUtils';
import MissionCampaignEditor from '../missions/MissionCampaignEditor';
import MissionPhonePreview from '../missions/MissionPhonePreview';
import { initialMission, missionToForm } from '../missions/missionDefaults';

export default function MissionManager({ courseId, showToast }) {
  const [missions, setMissions] = useState([]);
  const [missionForm, setMissionForm] = useState(initialMission);
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

  return (
    <section className="rounded-[1.8rem] bg-transparent font-['Montserrat'] text-white">
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(20rem,0.44fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4 xl:sticky xl:top-4">
          <MissionCampaignEditor
            form={missionForm}
            setForm={setMissionForm}
            saving={saving}
            onSubmit={saveMission}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
        </div>
        <div className="min-w-0 xl:sticky xl:top-4">
          <MissionPhonePreview mission={activeMission} form={missionForm} fontSize={fontSize} />
          {activeMission && <MissionPreview mission={activeMission} />}
        </div>
      </div>
    </section>
  );
}

const formHeaders = { headers: { 'Content-Type': 'multipart/form-data' } };

function missionPayload(form, courseId) {
  const payload = new FormData();
  const fileFields = new Set(['image', 'hero_image']);
  payload.append('course', courseId);
  Object.entries(form).forEach(([key, value]) => {
    if (fileFields.has(key)) {
      if (value instanceof File) payload.append(key, value);
      else if (value === null || value === '') payload.append(key, '');
      return;
    }
    if (value instanceof File || value === '' || typeof value === 'number') payload.append(key, value);
    else if (typeof value === 'string' && !value.startsWith('http')) payload.append(key, value);
  });
  return payload;
}

function MissionPreview({ mission }) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2 pr-4">
      <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-[#ccff00]/10">
        {mission.image_url || mission.image ? <img src={getMediaUrl(mission.image_url || mission.image)} alt="" className="h-full w-full object-cover" /> : <Package size={24} />}
      </div>
      <div>
        <p className="text-sm font-black">{mission.name}</p>
        <p className="text-xs text-violet-100/60">{mission.resources?.length || 0} recursos · grupos de {mission.group_size}</p>
      </div>
    </div>
  );
}
