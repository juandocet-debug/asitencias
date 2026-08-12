import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

export function useStudentMissions(enabled = true) {
  const [missionSummary, setMissionSummary] = useState({ mission: null, online: { count: 0, students: [] } });
  const [loadingMission, setLoadingMission] = useState(false);

  const fetchMissionSummary = useCallback(async () => {
    if (!enabled) return;
    setLoadingMission(true);
    try {
      const { data } = await api.get('/academic/missions/student-summary/');
      setMissionSummary({
        mission: data.mission || null,
        online: data.online || { count: 0, students: [] },
      });
    } catch {
      setMissionSummary({ mission: null, online: { count: 0, students: [] } });
    } finally {
      setLoadingMission(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchMissionSummary();
  }, [fetchMissionSummary]);

  return { missionSummary, loadingMission, refreshMissionSummary: fetchMissionSummary };
}
