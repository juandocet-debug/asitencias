import React from 'react';

/**
 * HeroAppStudent - Ajustado para que el fondo verde ocupe el 95% del contenedor hero horizontal y verticalmente,
 * conteniendo ampliamente todos los elementos dentro de la forma.
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

      {/* Tarjeta Hero ocupando 95% de la anchura y con altura generosa */}
      <div className="w-full flex justify-center">
        <div 
          className="relative w-[95%] min-h-[17.5rem] sm:min-h-[18.5rem] p-6 sm:p-8 text-slate-950 flex flex-col justify-between overflow-hidden shadow-2xl transition-all"
          style={{
            backgroundImage: `url('/src/assets/fondoHero.png')`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '2.5rem'
          }}
        >
          {/* Parte Superior: Título y descripción holgados */}
          <div className="relative z-10 pt-2 sm:pt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Canal Activo</h3>
              <span className="w-5 h-5 rounded-full border-2 border-slate-950 text-slate-950 text-xs font-black flex items-center justify-center">?</span>
            </div>

            <p className="text-xs sm:text-base font-extrabold text-slate-900/95 leading-relaxed max-w-[18rem] sm:max-w-[26rem]">
              Ubícate cerca a la cámara de tu aula para validar asistencia.
            </p>
          </div>

          {/* Parte Inferior: Franja traslúcida con avatares + personas activadas + botón perfectamente dentro del 95% */}
          <div className="relative z-10 mb-2 sm:mb-3 flex items-center justify-between gap-2 p-2 sm:p-2.5 px-4 sm:px-5 rounded-full bg-slate-950/15 backdrop-blur-md border border-slate-950/15">
            {/* Avatares y Contador */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center -space-x-2 shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-700 border-2 border-[#ccff00] overflow-hidden">
                  <img src={user?.photo || '/este-agon.png'} alt="user" className="w-full h-full object-cover" />
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-cyan-600 border-2 border-[#ccff00] flex items-center justify-center text-[11px] font-black text-white">
                  A
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 border-2 border-[#ccff00] flex items-center justify-center text-[11px] font-black text-white">
                  B
                </div>
              </div>

              <span className="text-xs sm:text-sm font-black text-slate-950 truncate">
                {points > 0 ? `${points}+ Activos` : '999+ personas activadas'}
              </span>
            </div>

            {/* Botón Activar */}
            <button
              onClick={onAction}
              className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-black shadow-lg shrink-0 transition active:scale-95"
            >
              <span>Activar</span>
              <span className="text-xs sm:text-sm">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
