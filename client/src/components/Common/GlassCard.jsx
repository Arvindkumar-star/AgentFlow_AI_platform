import React from 'react';

export default function GlassCard({ children, className = '', hoverEffect = true, glowColor = 'none' }) {
  const getGlowClass = () => {
    if (glowColor === 'emerald') return 'glow-emerald border-emerald-500/30';
    if (glowColor === 'cyan') return 'glow-cyan border-cyan-500/30';
    if (glowColor === 'rose') return 'glow-rose border-rose-500/30';
    return 'border-slate-800/80';
  };

  return (
    <div
      className={`glass-panel rounded-2xl p-5 border transition-all duration-300 ease-out ${
        hoverEffect ? 'hover:scale-[1.01] hover:border-slate-700' : ''
      } ${getGlowClass()} ${className}`}
    >
      {children}
    </div>
  );
}
