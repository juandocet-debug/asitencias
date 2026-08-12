import React, { useState } from 'react';
import chatSticker from '../../assets/chat_sticker_neon (2).png';
import friendsSticker from '../../assets/sticker_friends_neon.png';
import locationSticker from '../../assets/sticker_location_neon.png';
import tutorialSticker from '../../assets/sticker_tutorial_neon.png';
import avatarGamer1 from '../../assets/gamer_avatar_1.png';
import { getMediaUrl } from '../../utils/dateUtils';

export default function SquadGridSection({ missionSummary, onOpenSquads, stats, navigate, user }) {
  const [missionOpen, setMissionOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(null);
  const mission = missionSummary?.mission || null;
  const online = missionSummary?.online || { count: 0, students: [] };
  const completed = missionSummary?.completed || { count: 0, total: 0, missions: [] };
  const inventory = missionSummary?.inventory || { count: 0, items: [] };
  const level = Math.max(1, Math.floor((stats?.points || 0) / 300) + 1);

  return (
    <>
      <div className="my-5 grid grid-cols-[1.05fr_0.95fr] gap-3.5 font-['Montserrat']">
        <GroupMissionCard
          mission={mission}
          online={online}
          onOpen={() => (mission ? setMissionOpen(true) : onOpenSquads())}
        />
        <div className="flex flex-col gap-3">
          <MiniMission title="Mi perfil" value={`Nivel ${level}`} detail="Crear avatar" sticker={friendsSticker} tone="lime" onClick={() => setPanelOpen('profile')} />
          <MiniMission title="Misiones" value={`${completed.count}/${completed.total}`} detail="Completadas" sticker={locationSticker} tone="emerald" onClick={() => setPanelOpen('missions')} />
          <MiniMission title="Inventario" value={inventory.count} detail="Objetos" sticker={tutorialSticker} tone="amber" onClick={() => setPanelOpen('inventory')} />
        </div>
      </div>

      {missionOpen && <MissionModal mission={mission} online={online} onClose={() => setMissionOpen(false)} />}
      {panelOpen && (
        <PlayerPanel
          type={panelOpen}
          user={user}
          stats={stats}
          completed={completed}
          inventory={inventory}
          onClose={() => setPanelOpen(null)}
          onProfile={() => navigate('/profile')}
        />
      )}
    </>
  );
}

function GroupMissionCard({ mission, online, onOpen }) {
  const title = mission?.name || 'Misiones en Grupo';
  const subtitle = mission?.description || 'Organiza actividades y partidas';
  const onlineCount = online?.count || 0;

  return (
    <div className="group relative flex min-h-[13.25rem] flex-col justify-between overflow-visible rounded-[1.6rem] border border-[#ccff00]/18 bg-[#071419] p-4 shadow-2xl transition hover:border-[#ccff00]/35 font-['Montserrat']">
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#ccff00]/10 blur-2xl" />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0 pr-9">
          <h3 className="text-sm font-black uppercase leading-tight tracking-wide text-white sm:text-base">{title}</h3>
          <p className="mt-1 line-clamp-3 text-[10px] font-medium leading-snug text-slate-400">{subtitle}</p>
        </div>
        <div className="absolute -right-2 -top-5 z-30 h-12 w-12 transform transition duration-300 group-hover:scale-110">
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
  const visible = students.slice(0, 4);
  const avatars = visible.length ? visible : [{ id: 'fallback-player', photo: avatarGamer1 }];

  return (
    <div className="relative z-10 my-2 flex items-center -space-x-2">
      {avatars.map((student, index) => (
        <div key={student.id || index} className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#ccff00] bg-slate-950 shadow">
          <img
            src={student.photo ? getMediaUrl(student.photo) : avatarGamer1}
            alt={student.full_name || `Jugador ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

function MiniMission({ title, value, detail, sticker, tone = 'lime', onClick }) {
  const tones = {
    lime: 'border-[#ccff00]/20 from-[#071419] to-[#122511] text-[#ccff00]',
    emerald: 'border-emerald-300/20 from-[#061916] to-[#102a23] text-emerald-300',
    amber: 'border-amber-300/20 from-[#171109] to-[#2a1e0d] text-amber-300',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[4.6rem] overflow-hidden rounded-[1.15rem] border bg-gradient-to-br p-3 text-left shadow-xl transition duration-200 hover:-translate-y-0.5 active:scale-95 ${tones[tone] || tones.lime}`}
    >
      <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/5 blur-xl" />
      {sticker && <img src={sticker} alt="" className="absolute right-1 top-2 h-9 w-9 object-contain drop-shadow-[0_10px_18px_rgba(204,255,0,0.28)] transition group-hover:scale-110" />}
      <div className="relative z-10 pr-9">
        <p className="text-[9px] font-black uppercase leading-tight tracking-wide text-white">{title}</p>
        <p className="mt-1 text-sm font-black leading-none">{value}</p>
        <p className="mt-0.5 text-[10px] font-black leading-tight">{detail}</p>
      </div>
    </button>
  );
}

function PlayerPanel({ type, user, stats, completed, inventory, onClose, onProfile }) {
  const titleMap = { profile: 'Mi perfil', missions: 'Misiones completadas', inventory: 'Inventario' };
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/75 p-3 backdrop-blur-md sm:items-center sm:justify-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-[2rem] border border-[#ccff00]/25 bg-[#08091d] p-5 text-white shadow-[0_0_60px_rgba(124,76,255,0.45)]" onClick={event => event.stopPropagation()}>
        <PanelHeader title={titleMap[type]} onClose={onClose} />
        {type === 'profile' && <ProfilePanel user={user} stats={stats} onProfile={onProfile} />}
        {type === 'missions' && <MissionsPanel completed={completed} />}
        {type === 'inventory' && <InventoryPanel inventory={inventory} />}
      </div>
    </div>
  );
}

function PanelHeader({ title, onClose }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#ccff00]">Panel gamer</p>
        <h3 className="mt-1 text-2xl font-black">{title}</h3>
      </div>
      <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-2 text-sm font-black">×</button>
    </div>
  );
}

function ProfilePanel({ user, stats, onProfile }) {
  const level = Math.max(1, Math.floor((stats?.points || 0) / 300) + 1);
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-4">
        <img src={user?.photo ? getMediaUrl(user.photo) : avatarGamer1} alt="" className="h-20 w-20 rounded-3xl border-2 border-[#ccff00] object-cover" />
        <div>
          <p className="text-xl font-black">{user?.first_name || 'Jugador'} {user?.last_name || ''}</p>
          <p className="text-sm font-bold text-[#ccff00]">Nivel {level} · {stats?.points || 0} XP</p>
          <p className="mt-1 text-xs text-slate-400">Avatar tomado desde tu perfil. Pronto podrás elegir estilo/rol visual.</p>
        </div>
      </div>
      <button onClick={onProfile} className="mt-4 w-full rounded-full bg-[#ccff00] px-4 py-3 text-sm font-black text-slate-950">Editar perfil</button>
    </div>
  );
}

function MissionsPanel({ completed }) {
  const missions = completed?.missions || [];
  return (
    <InfoPanel title={`${completed?.count || 0}/${completed?.total || 0} completadas`}>
      {missions.length ? missions.map(item => (
        <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="font-black">{item.name}</p>
          <p className="text-xs text-slate-400">{item.course}</p>
        </div>
      )) : <p className="text-sm text-slate-400">Aún no has completado misiones.</p>}
    </InfoPanel>
  );
}

function InventoryPanel({ inventory }) {
  const items = inventory?.items || [];
  return (
    <InfoPanel title={`${inventory?.count || 0} objetos`}>
      {items.length ? items.map(item => (
        <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <img src={item.image ? getMediaUrl(item.image) : tutorialSticker} alt="" className="h-12 w-12 rounded-2xl object-cover" />
          <div>
            <p className="font-black">{item.name}</p>
            <p className="text-xs text-slate-400">{item.description || item.mission_name}</p>
          </div>
        </div>
      )) : <p className="text-sm text-slate-400">Completa misiones para ganar objetos.</p>}
    </InfoPanel>
  );
}

function MissionModal({ mission, online, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/75 p-3 backdrop-blur-md sm:items-center sm:justify-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-[2rem] border border-[#ccff00]/25 bg-[#08091d] p-5 text-white shadow-[0_0_60px_rgba(124,76,255,0.45)]" onClick={event => event.stopPropagation()}>
        <PanelHeader title={mission.name} onClose={onClose} />
        <p className="text-sm text-slate-300">{mission.description || 'Sin descripción registrada.'}</p>
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
            {(mission.resources || []).length ? mission.resources.map(resource => (
              <a key={resource.id} href={resource.url || getMediaUrl(resource.file)} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 bg-black/20 p-3 text-sm font-bold text-slate-100">
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
    <section className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-black uppercase text-[#ccff00]">{title}</p>
      {children}
    </section>
  );
}
