import React from 'react';

/**
 * HeroAppStudent - Limpiado por completo.
 * Muestra únicamente la tarjeta verde de fondoHero.png al 95% de ancho, sin ningún texto ni barra inferior.
 */
export default function HeroAppStudent({ user, stats, onAction }) {
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

      {/* Tarjeta Hero totalmente limpia mostrando solo la imagen de fondo verde al 95% */}
      <div className="w-full flex justify-center">
        <div 
          className="relative w-[95%] min-h-[14rem] sm:min-h-[16rem] overflow-hidden shadow-2xl transition-all border-4 border-red-500 cursor-pointer"
          onClick={onAction}
          style={{
            backgroundImage: `url('/src/assets/fondoHero.png')`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '2.5rem'
          }}
        />
      </div>
    </div>
  );
}
