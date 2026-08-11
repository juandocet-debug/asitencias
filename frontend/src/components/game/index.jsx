import React from 'react';

/**
 * GameShell - Contenedor principal con estética gamer cyberpunk/arcade neón.
 */
export function GameShell({ children, className = '' }) {
  return (
    <div className={`min-h-screen bg-[#0d0f17] text-slate-100 selection:bg-purple-500 selection:text-white font-sans ${className}`}>
      {children}
    </div>
  );
}

/**
 * GameCard - Tarjeta contenedora con soporte para variantes neón/glow.
 */
export function GameCard({ children, variant = 'default', className = '', onClick }) {
  const base = "relative rounded-2xl transition-all duration-200 overflow-hidden";
  const variants = {
    default: "bg-[#161926]/90 border border-purple-900/40 shadow-lg shadow-purple-950/20 backdrop-blur-md",
    interactive: "bg-[#161926]/90 border border-purple-900/40 shadow-lg hover:border-purple-500/60 hover:shadow-purple-500/10 hover:-translate-y-0.5 cursor-pointer backdrop-blur-md",
    neon: "bg-[#1a182e]/90 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-400/60 cursor-pointer backdrop-blur-md",
    gold: "bg-[#241e16]/90 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md",
    danger: "bg-[#281519]/90 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)] backdrop-blur-md"
  };

  return (
    <div className={`${base} ${variants[variant] || variants.default} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

/**
 * GameButton - Botón gamer interactivo con varios colores neón.
 */
export function GameButton({ children, variant = 'purple', size = 'md', className = '', disabled = false, onClick, type = 'button', icon: Icon }) {
  const base = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-3 text-base gap-2.5"
  };

  const variants = {
    purple: "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 border border-purple-400/30",
    cyan: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400/30",
    gold: "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 border border-amber-300/40",
    emerald: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/30",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 border border-rose-400/30",
    ghost: "bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-800/40"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

/**
 * GameMetricCard - Tarjeta métrica estilo HUD.
 */
export function GameMetricCard({ title, value, subtitle, icon: Icon, color = 'purple', className = '' }) {
  const colorMap = {
    purple: { text: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-800/40' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-800/40' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-800/40' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-800/40' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-800/40' }
  };

  const theme = colorMap[color] || colorMap.purple;

  return (
    <GameCard className={`p-4 ${theme.bg} ${theme.border} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className={`text-2xl font-black mt-1 ${theme.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text} border ${theme.border}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </GameCard>
  );
}

/**
 * GameBadge - Etiqueta estilo gaming.
 */
export function GameBadge({ children, variant = 'purple', size = 'md', className = '' }) {
  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs"
  };

  const variants = {
    purple: "bg-purple-950/80 text-purple-300 border border-purple-700/50",
    cyan: "bg-cyan-950/80 text-cyan-300 border border-cyan-700/50",
    gold: "bg-amber-950/80 text-amber-300 border border-amber-700/50",
    emerald: "bg-emerald-950/80 text-emerald-300 border border-emerald-700/50",
    danger: "bg-rose-950/80 text-rose-300 border border-rose-700/50"
  };

  return (
    <span className={`inline-flex items-center font-bold tracking-wide rounded-lg uppercase ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

/**
 * GameLoading - Indicador de carga gamer.
 */
export function GameLoading({ text = 'Cargando datos...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 gap-3 text-center ${className}`}>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-purple-950 border-t-purple-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-cyan-950 border-b-cyan-400 animate-spin animate-reverse" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 animate-pulse">{text}</p>
    </div>
  );
}

/**
 * GameEmptyState - Pantalla de estado vacío gamer.
 */
export function GameEmptyState({ title = 'Sin registros', description = 'No hay información disponible en este momento.', icon: Icon, action, className = '' }) {
  return (
    <GameCard className={`p-8 text-center flex flex-col items-center justify-center ${className}`}>
      {Icon && (
        <div className="p-4 rounded-2xl bg-purple-950/40 text-purple-400 border border-purple-800/40 mb-3 shadow-inner">
          <Icon size={32} />
        </div>
      )}
      <h4 className="text-base font-bold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </GameCard>
  );
}

/**
 * GameHeader - Header de sección gamer.
 */
export function GameHeader({ title, subtitle, icon: Icon, action, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/40 shadow-md">
            <Icon size={22} />
          </div>
        )}
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-purple-300/70 font-medium">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * GameToast - Reemplazo gamer elegante de alert() nativos.
 */
export function GameToast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-md animate-fadeIn">
      <div className={`p-4 rounded-xl shadow-2xl backdrop-blur-md border flex items-center gap-3 ${
        isError ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' : 'bg-purple-950/90 border-purple-500/50 text-purple-200'
      }`}>
        <p className="text-sm font-semibold">{toast.message}</p>
        <button onClick={onClose} className="ml-auto text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md">OK</button>
      </div>
    </div>
  );
}
