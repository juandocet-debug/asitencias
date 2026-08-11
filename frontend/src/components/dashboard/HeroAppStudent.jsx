import React from 'react';

/**
 * HeroAppStudent - Componente héroe réplica exacta píxel por píxel del diseño de referencia:
 * 
 * Detalles anatómicos exactos:
 * 1. Fondo exterior oscuro con espirales violeta neón detrás del banner.
 * 2. Recorte de la tarjeta (Clip-path trapoidales/asimétricas): Esquina superior derecha con declive hacia abajo y esquina inferior derecha curvada.
 * 3. Patrón de ondas cian y amarillo verdoso en la parte inferior izquierda del banner.
 * 4. Píldora traslúcida verde interna para la fila de avatares ("999+ Activados").
 * 5. Botón de cápsula negro ultra redondeado con flecha horizontal "Activar →".
 * 6. Sticker 3D de mano flotante en la esquina superior derecha del borde inclinado.
 */
export default function HeroAppStudent({ user, stats, onAction }) {
  const points = stats?.points || 0;

  return (
    <div className="relative w-full font-sans tracking-tight">
      {/* Fondo exterior con líneas en espiral violeta neón (Atrás del banner) */}
      <div className="absolute -top-10 -right-4 w-56 h-56 pointer-events-none opacity-40">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-purple-500">
          <path 
            d="M 100 20 C 160 20, 180 80, 150 130 C 120 170, 40 160, 30 100 C 20 50, 70 30, 110 50 C 140 70, 140 120, 100 130 C 70 140, 50 100, 70 80" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Header Superior: HI 欢迎来到 + Avatar + Campana */}
      <header className="flex items-center justify-between pb-3 px-1 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-black text-white">HI</span>
          <span className="text-xl font-extrabold text-white">Bienvenido</span>
          {/* Tag estilo icono recortado amarillo/negro */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ccff00] text-slate-950 font-black text-xs shadow-md">
            <span>{user?.first_name || 'Estudiante'}</span>
          </div>
        </div>

        <button className="relative p-2.5 rounded-full bg-slate-900/90 border border-slate-800 text-white hover:scale-105 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
        </button>
      </header>

      {/* Banner Principal con Recorte Asimétrico (Clip Path Trapezoidal exacto a la imagen) */}
      <div 
        className="relative bg-[#ccff00] p-6 text-slate-950 shadow-[0_15px_40px_rgba(204,255,0,0.3)] transition-all overflow-hidden"
        style={{
          clipPath: 'polygon(0% 0%, 82% 3%, 100% 12%, 97% 88%, 88% 100%, 0% 100%)',
          borderRadius: '2.2rem'
        }}
      >
        {/* Recorte Visual de Ondas Circulares Cian (#00c8ff) y Amarillo-Verde en la esquina inferior izquierda */}
        <div className="absolute -left-10 -bottom-12 w-48 h-48 pointer-events-none z-0">
          <div className="w-full h-full rounded-full border-[28px] border-[#00c8ff] opacity-95"></div>
        </div>
        <div className="absolute left-10 -bottom-20 w-44 h-44 pointer-events-none z-0">
          <div className="w-full h-full rounded-full border-[24px] border-[#aee600] opacity-80"></div>
        </div>

        {/* Sticker 3D de Mano Superpuesto exactamente en el borde inclinado superior derecho */}
        <div className="absolute right-3 -top-2 w-28 h-28 pointer-events-none z-30">
          <img 
            src="/game_sticker_hand.png" 
            alt="Hand Sticker" 
            className="w-full h-full object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.5)] transform rotate-6 scale-110" 
          />
        </div>

        <div className="relative z-10 pr-16">
          {/* Título de Canal y Signo ? */}
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="text-base font-black text-slate-950 tracking-tight">Canal Activo</h3>
            <span className="w-4 h-4 rounded-full border border-slate-950 text-slate-950 text-[11px] font-extrabold flex items-center justify-center">?</span>
          </div>

          {/* Subtítulo / Instrucción */}
          <p className="text-xs font-bold text-slate-900/80 mb-5 max-w-[17rem]">
            Ubícate cerca a la cámara de tu aula para validar asistencia.
          </p>

          {/* Cápsula Verde Translúcida Interna (Fila de Avatares + Contador + Botón Negro) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 pl-3 rounded-full bg-slate-950/10 backdrop-blur-md border border-slate-950/10">
            {/* Avatares Circulares de Miembros */}
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-700 border-2 border-[#ccff00] overflow-hidden shadow-sm">
                  <img src={user?.photo || '/este-agon.png'} alt="user" className="w-full h-full object-cover" />
                </div>
                <div className="w-8 h-8 rounded-full bg-cyan-600 border-2 border-[#ccff00] flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                  A
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-[#ccff00] flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                  B
                </div>
              </div>

              {/* Contador "999+ personas activadas" */}
              <span className="text-xs font-black text-slate-950">
                {points > 0 ? `${points}+ Activos` : '999+ personas activadas'}
              </span>
            </div>

            {/* Botón Cápsula Negro `Activar ->` */}
            <button
              onClick={onAction}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-xs font-black shadow-lg transition active:scale-95"
            >
              <span>Activar</span>
              <span className="text-sm font-bold">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
