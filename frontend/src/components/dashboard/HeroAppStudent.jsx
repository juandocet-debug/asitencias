import React from 'react';
import fondoHero from '../../assets/FondoHero2.png';
import mano from '../../assets/mano.png';
import flor from '../../assets/flor2.png';
import epicSword from '../../assets/epic_sword.png';
import epicDragon from '../../assets/epic_dragon.png';
import epicRing from '../../assets/epic_ring.png';

export default function HeroAppStudent({ user, stats, onAction }) {
  return (
    <div className="relative w-full font-sans tracking-tight">
      <header className="relative z-10 flex items-center justify-start gap-2.5 px-1 pb-3 font-['Montserrat']">
        <span className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">BIENVENIDO</span>
        <div className="rounded-full bg-[#ccff00] px-3.5 py-1 text-xs sm:text-sm font-extrabold text-slate-950 shadow-md">
          {user?.first_name || 'Estudiante'}
        </div>
      </header>

      <div
        className="relative left-1/2 mb-5 h-[10.6rem] w-[95vw] max-w-[28.8rem] -translate-x-1/2 cursor-pointer overflow-visible sm:h-[12rem]"
        onClick={onAction}
      >
        <img
          src={fondoHero}
          alt="Fondo Hero"
          className="h-full w-full rounded-[2.2rem] object-fill shadow-[0_16px_34px_rgba(204,255,0,0.14)]"
        />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-start px-5 pb-4 pt-7 sm:px-7 sm:pt-9 font-['Montserrat']">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-base sm:text-xl font-black uppercase tracking-wider text-slate-950">
              {stats?.active_mission_title || 'CANAL ACTIVO'}
            </h3>
            <span className="grid h-4 w-4 place-items-center rounded-full border border-slate-950 text-[10px] font-black text-slate-950">?</span>
          </div>

          <div className="flex items-center gap-1.5 max-w-[15rem] sm:max-w-[21rem] mt-0.5">
            <img 
              src={flor} 
              alt="Flor" 
              className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" 
            />
            <p className="text-[11px] sm:text-xs font-medium leading-snug text-slate-900/90 font-['Inter']">
              {stats?.active_mission_description || 'Acerca tu dispositivo a otros'}
            </p>
          </div>
        </div>

        <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between gap-2 rounded-[1.8rem] border border-white/25 bg-white/20 p-2 px-3 backdrop-blur-md shadow-md sm:px-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center -space-x-2">
              <MissionBubble src={epicSword} alt="Espada" />
              <MissionBubble src={epicDragon} alt="Dragón" />
              <MissionBubble src={epicRing} alt="Runa" />
            </div>

            <span className="truncate text-[11px] font-black text-slate-950 sm:text-xs">
              {stats?.total_courses ? `${stats.total_courses} Clases Activas` : '999+ activados'}
            </span>
          </div>

          <button
            onClick={onAction}
            className="pointer-events-auto inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-slate-950 px-3 py-2 text-[11px] font-black text-white shadow-lg transition hover:bg-slate-900 active:scale-95 sm:px-4 sm:text-xs"
          >
            <span>ACTIVAR</span>
            <span className="text-xs font-bold">→</span>
          </button>
        </div>

        {/* Mano flotante Neón Gamer súper visible en la esquina superior derecha */}
        <div className="pointer-events-none absolute -top-8 right-2 z-30 h-24 w-24 sm:-top-11 sm:right-6 sm:h-28 sm:w-28">
          <img
            src={mano}
            alt="Mano"
            className="h-full w-full -rotate-6 animate-[bounce_3s_infinite_easeInOut] object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.85)]"
          />
        </div>
      </div>
    </div>
  );
}

function MissionBubble({ src, alt }) {
  return (
    <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-white bg-slate-950 shadow sm:h-8 sm:w-8">
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}
