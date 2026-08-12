import React, { useState } from 'react';
import chatSticker from '../../assets/chat_sticker_neon (2).png';
import friendsSticker from '../../assets/sticker_friends_neon.png';
import locationSticker from '../../assets/sticker_location_neon.png';
import tutorialSticker from '../../assets/sticker_tutorial_neon.png';
import avatarGamer1 from '../../assets/gamer_avatar_1.png';
import avatarGamer2 from '../../assets/gamer_avatar_2.png';
import epicSword from '../../assets/epic_sword.png';
import epicDragon from '../../assets/epic_dragon.png';
import { getMediaUrl } from '../../utils/dateUtils';

export default function SquadGridSection({ missionSummary, onOpenSquads, stats, navigate }) {
  const [missionOpen, setMissionOpen] = useState(false);
  const mission = missionSummary?.mission || null;
  const online = missionSummary?.online || { count: 0, students: [] };

  return (
    <>
      <div className="my-5 grid grid-cols-[1.18fr_0.82fr] gap-3.5 font-['Montserrat']">
        <GroupMissionCard
          mission={mission}
          online={online}
          onOpen={() => (mission ? setMissionOpen(true) : onOpenSquads())}
        />

        <div className="flex flex-col gap-3">
          <MiniMission
            title="Asistencia global"
            value={`${stats?.attendance_rate || 0}%`}
            detail="Promedio"
            sticker={friendsSticker}
            tone="lime"
            onClick={() => navigate('/classes')}
          />
          <MiniMission
            title="Faltas registradas"
            value={stats?.total_absences || 0}
            detail="Inasistencias"
            sticker={locationSticker}
            tone="emerald"
            onClick={() => navigate('/my-absences')}
          />
          <MiniMission
            title="Puntos y nivel"
            value={`${stats?.points || 0} Pts`}
            detail={`${stats?.stars || 0} ★`}
            sticker={tutorialSticker}
            tone="amber"
            onClick={() => navigate('/classes')}
          />
        </div>
      </div>

      {missionOpen && <MissionModal mission={mission} online={online} onClose={() => setMissionOpen(false)} />}
    </>
  );
}

function GroupMissionCard({ mission, online, onOpen }) {
  const title = mission?.name || 'Misiones en Grupo';
  const subtitle = mission?.description || 'Organiza actividades y partidas';
  const onlineCount = online?.count || 0;

  return (
    <div className="group relative flex min-h-[14rem] flex-col justify-between overflow-visible rounded-[1.6rem] border border-[#ccff00]/18 bg-[#071419] p-4 shadow-2xl transition hover:border-[#ccff00]/35 font-['Montserrat']">
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#ccff00]/10 blur-2xl" />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0 pr-8">
          <h3 className="text-sm font-black uppercase leading-tight tracking-wide text-white sm:text-base">{title}</h3>
          <p className="mt-1 line-clamp-3 text-[10px] font-medium leading-snug text-slate-400">{subtitle}</p>
        </div>

        <div className="absolute -right-6 -top-7 z-30 h-16 w-16 transform transition duration-300 group-hover:scale-110">
          <img
            src={mission?.image ? getMediaUrl(mission.image) : chatSticker}
            alt=""
            className="h-full w-full rounded-2xl object-contain drop-shadow-[0_10px_20px_rgba(204,255,0,0.55)]"
          />
        </div>
      </div>

      <AvatarStack students={online?.students || []} />

      <div className="relative z-10 my-1 flex items-center justify-between px-1 text-[11px] font-bold text-[#ccff00]">
        <span>{onlineCount} amigos en línea</span>
        <span className="text-xs font-bold text-slate-400">&gt;</span>
      </div>

      <button
        onClick={onOpen}
        className="relative z-10 mt-1 flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#ccff00] px-2.5 py-2.5 text-[11px] font-black text-slate-950 shadow-[0_0_16px_rgba(204,255,0,0.35)] transition hover:bg-[#b8e600] active:scale-95"
      >
        <span>{mission ? 'VER MISIÓN' : 'VER CLASES'}</span>
        <span className="text-xs font-bold">→</span>
      </button>
    </div>
  );
}

function AvatarStack({ students }) {
  const fallbacks = [avatarGamer1, avatarGamer2, epicSword, epicDragon];
  const visible = students.slice(0, 4);
  const avatars = visible.length ? visible : fallbacks.map((photo, id) => ({ id, photo }));

  return (
    <div className="relative z-10 my-2 flex items-center -space-x-2">
      {avatars.map((student, index) => (
        <div key={student.id || index} className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#ccff00] bg-slate-950 shadow">
          <img
            src={student.photo ? getMediaUrl(student.photo) : fallbacks[index]}
            alt={student.full_name || `Jugador ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

function MissionModal({ mission, online, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/75 p-3 backdrop-blur-md sm:items-center sm:justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[2rem] border border-[#ccff00]/25 bg-[#08091d] p-5 text-white shadow-[0_0_60px_rgba(124,76,255,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#ccff00]">Misión activa</p>
            <h3 className="mt-1 text-2xl font-black">{mission.name}</h3>
            <p className="mt-2 text-sm text-slate-300">{mission.description || 'Sin descripción registrada.'}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-2 text-sm font-black">×</button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <InfoPill label="Amigos en línea" value={online?.count || 0} />
          <InfoPill label="Grupo sugerido" value={`${mission.group_size || 4}`} />
        </div>

        <InfoPanel title="Inventario">
          <p className="font-black">{mission.inventory_name || 'Recompensa por definir'}</p>
          <p className="text-xs text-slate-400">{mission.inventory_description || 'El profesor aún no agregó detalle del objeto.'}</p>
        </InfoPanel>

        <InfoPanel title="Recursos">
          <div className="space-y-2">
            {(mission.resources || []).length ? mission.resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url || getMediaUrl(resource.file)}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-white/10 bg-black/20 p-3 text-sm font-bold text-slate-100"
              >
                {resource.title}
                <span className="ml-2 text-[10px] uppercase text-[#ccff00]">{resource.resource_type}</span>
              </a>
            )) : <p className="text-sm text-slate-400">Aún no hay lecturas o videos cargados.</p>}
          </div>
        </InfoPanel>
      </div>
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#ccff00]/20 bg-[#ccff00]/10 p-3">
      <p className="text-[10px] font-black uppercase text-slate-300">{label}</p>
      <p className="text-2xl font-black text-[#ccff00]">{value}</p>
    </div>
  );
}

function InfoPanel({ title, children }) {
  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="mb-2 text-xs font-black uppercase text-[#ccff00]">{title}</p>
      {children}
    </section>
  );
}
