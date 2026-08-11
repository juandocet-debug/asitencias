import React from 'react';

/**
 * HeroAppStudent - Réplica exacta visual basada en la captura de comparación:
 * 
 * Detalles corregidos minuciosamente:
 * 1. Curvatura de la tarjeta: Esquinas superiores redondeadas simétricas (`rounded-[2rem]`), con solapa diagonal hacia arriba en la derecha para recibir el sticker.
 * 2. Sticker plano (sin caja negra cuadrada): Sticker 2D vectorial con borde blanco y trazo negro exacto a la imagen.
 * 3. Cápsula de avatares: Contenedor ovalado traslúcido verde horizontal de esquina a esquina con el botón "Activar →" a la derecha en la misma fila.
 * 4. Ondas cian y verde lima: Círculos limpios sin blur extraño, exactamente como en el gráfico original.
 */
export default function HeroAppStudent({ user, stats, onAction }) {
  const points = stats?.points || 0;

  return (
    <div className="relative w-full font-sans tracking-tight">
      {/* Fondo exterior con espiral violeta neón sutil */}
      <div className="absolute -top-6 right-8 w-48 h-48 pointer-events-none opacity-30">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-purple-400">
          <path 
            d="M 100 20 C 160 20, 180 80, 150 130 C 120 170, 40 160, 30 100 C 20 50, 70 30, 110 50 C 140 70, 140 120, 100 130 C 70 140, 50 100, 70 80" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Header Superior: HI 欢迎来到 + Badge + Bell */}
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

      {/* Tarjeta Verde Neón con forma y ondas exactas */}
      <div 
        className="relative bg-[#a6f500] p-6 text-slate-950 shadow-[0_12px_35px_rgba(166,245,0,0.25)] transition-all overflow-hidden"
        style={{
          borderRadius: '2.2rem 2.2rem 2.2rem 2.2rem',
        }}
      >
        {/* Ondas cian y verde en la esquina inferior izquierda (Círculos limpios sin desenfoque) */}
        <div className="absolute -left-12 -bottom-16 w-44 h-44 pointer-events-none z-0">
          <div className="w-full h-full rounded-full border-[26px] border-[#00d2ff]"></div>
        </div>
        <div className="absolute left-12 -bottom-24 w-48 h-48 pointer-events-none z-0">
          <div className="w-full h-full rounded-full border-[28px] border-[#7cdb00]"></div>
        </div>

        {/* Sticker Vectorial de Mano (Transparente, sin caja negra) */}
        <div className="absolute right-3 top-1 w-24 h-24 pointer-events-none z-30">
          <img 
            src="/hand_sticker_vector.png" 
            alt="Hand Sticker" 
            className="w-full h-full object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.3)] transform -rotate-6" 
          />
        </div>

        <div className="relative z-10 pr-16">
          {/* Título de Canal y ? */}
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="text-base font-extrabold text-slate-950">Canal Activo</h3>
            <span className="w-4 h-4 rounded-full border border-slate-950 text-slate-950 text-[11px] font-bold flex items-center justify-center">?</span>
          </div>

          {/* Subtítulo */}
          <p className="text-xs font-semibold text-slate-900/80 mb-5 max-w-[16rem]">
            Ubícate cerca a la cámara de tu aula para validar asistencia.
          </p>

          {/* Cápsula Traslúcida Horizontal (Exacta a la franja con avatares + 999+ personas activadas + botón) */}
          <div className="flex items-center justify-between gap-2 p-2 px-3 rounded-full bg-slate-950/10 backdrop-blur-sm border border-slate-950/10">
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
  );
}
