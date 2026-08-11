import React from 'react';
import fondoHero from '../../assets/fondoHero.png';

/**
 * HeroAppStudent - Componente héroe usando la imagen exacta fondoHero.png como fondo de la tarjeta.
 */
export default function HeroAppStudent({ user, stats, onAction }) {
  const points = stats?.points || 0;

  return (
    <div className="relative w-full font-sans tracking-tight">
      {/* Header Superior: HI + Badge + Bell */}
      <header className="flex items-center justify-between pb-3 px-1 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-black text-white tracking-tight">HI</span>
          <span className="text-xl font-bold text-white tracking-tight">Bienvenido</span>
          <div className="flex items-center px-3 py-1 rounded-full bg-[#ccff00] text-slate-950 font-extrabold text-xs shadow-md">
            <span>{user?.first_name || 'Estudiante'}</span>
          </div>
        </div>

        <button className="relative p-2.5 rounded-full bg-[#131424] border border-slate-800 text-white hover:scale-105 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
        </button>
      </header>

      {/* Tarjeta usando fondoHero.png como imagen de fondo exacta */}
      <div className="relative w-full text-slate-950 transition-all overflow-hidden rounded-[2.2rem]">
        {/* Imagen de fondo aislada para recortar espacios blancos */}
        <div className="relative w-full overflow-hidden rounded-[2.2rem]">
          <img 
            src={fondoHero} 
            alt="Fondo Hero" 
            className="w-full h-auto object-cover block"
          />

          {/* Contenido superpuesto dentro de la tarjeta usando coordenadas absolutas e index z-10 */}
          <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between z-10">
            <div>
              {/* Título de Canal y ? */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-950">Canal Activo</h3>
                <span className="w-4 h-4 rounded-full border border-slate-950 text-slate-950 text-[11px] font-bold flex items-center justify-center">?</span>
              </div>

              {/* Subtítulo */}
              <p className="text-xs sm:text-sm font-semibold text-slate-900/80 max-w-[18rem]">
                Ubícate cerca a la cámara de tu aula para validar asistencia.
              </p>
            </div>

            {/* Cápsula Traslúcida Horizontal Inferior */}
            <div className="flex items-center justify-between gap-2 p-1.5 px-3 rounded-full bg-slate-950/10 backdrop-blur-sm border border-slate-950/10">
              {/* Avatares Circulares */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center -space-x-2 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-purple-700 border-2 border-[#a6f500] overflow-hidden">
                    <img src={user?.photo || '/este-agon.png'} alt="user" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-cyan-600 border-2 border-[#a6f500] flex items-center justify-center text-[10px] font-bold text-white">
                    A
                  </div>
                  <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-[#a6f500] flex items-center justify-center text-[10px] font-bold text-white">
                    B
                  </div>
                </div>

                {/* Texto 999+ personas activadas */}
                <span className="text-xs font-extrabold text-slate-950 truncate">
                  {points > 0 ? `${points}+ Activos` : '999+ personas activadas'}
                </span>
              </div>

              {/* Botón "Activar ->" */}
              <button
                onClick={onAction}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-xs font-extrabold shadow-md shrink-0 transition active:scale-95"
              >
                <span>Activar</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
