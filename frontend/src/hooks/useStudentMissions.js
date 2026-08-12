import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const emptyMissionSummary = {
  mission: null,
  online: { count: 0, students: [] },
  completed: { count: 0, total: 0, missions: [] },
  inventory: { count: 0, items: [] },
};

export function useStudentMissions(enabled = true) {
  const [missionSummary, setMissionSummary] = useState(emptyMissionSummary);
  const [loadingMission, setLoadingMission] = useState(false);

  const fetchMissionSummary = useCallback(async () => {
    if (!enabled) return;
    setLoadingMission(true);
    try {
      const { data } = await api.get('/academic/missions/student-summary/');
      setMissionSummary({
        mission: data.mission || null,
        online: data.online || { count: 0, students: [] },
        completed: data.completed || { count: 0, total: 0, missions: [] },
        inventory: data.inventory || { count: 0, items: [] },
      });
    } catch {
      setMissionSummary(emptyMissionSummary);
    } finally {
      setLoadingMission(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchMissionSummary();
  }, [fetchMissionSummary]);

  const progress = useMemo(() => {
    const completed = missionSummary.completed?.count || 0;
    const total = missionSummary.completed?.total || 0;
    return total ? `${completed}/${total}` : '0/0';
  }, [missionSummary.completed]);

  return { missionSummary, loadingMission, missionProgress: progress, refreshMissionSummary: fetchMissionSummary };
}
