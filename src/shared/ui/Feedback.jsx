import React from 'react';

// Feedback visual inline (erro/sucesso/info) com ícone e animação de entrada.
// Usa role=alert para erros (anunciado por leitores de tela) e role=status para
// sucesso/info.

var ICONS = {
  error:   React.createElement('path', { d: 'M18 6L6 18M6 6l12 12' }),
  success: React.createElement('path', { d: 'M5 13l4 4L19 7' }),
  info:    React.createElement('path', { d: 'M12 9v4M12 17h.01' }),
};

var STYLES = {
  error:   { bg: 'rgba(239,68,68,0.08)',  border: '#ef4444', color: '#ef4444' },
  success: { bg: 'rgba(22,163,74,0.08)',  border: '#16a34a', color: '#16a34a' },
  info:    { bg: 'var(--brand-soft)',     border: 'var(--brand)', color: 'var(--brand)' },
};

export default function Feedback({ type, children, className }) {
  var t = type === 'success' ? 'success' : type === 'info' ? 'info' : 'error';
  var s = STYLES[t];
  return (
    <div role={t === 'error' ? 'alert' : 'status'} aria-live="polite"
      className={'anim-up flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm ' + (className || '')}
      style={{ background: s.bg, border: '1px solid ' + s.border, color: 'var(--text-main)' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.4"
        strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
        {ICONS[t]}
      </svg>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
