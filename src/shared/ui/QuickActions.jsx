import React from 'react';
import { emitQuickIntent } from '../../lib/quickIntent.js';
import { brandAlpha } from '../../lib/utils.js';

// FAB de ações rápidas — acessível das telas principais (dashboard, income,
// expense, inventory). Abre um menu com atalhos para criar venda/despesa/produto/
// perda e acesso rápido às configurações. A view alvo consome a intenção e abre
// o próprio modal de criação (via quickIntent).

var SHOWN_VIEWS = ['dashboard', 'income', 'expense', 'inventory'];

var ACTIONS = [
  { key: 'income',   label: 'Nova Venda',    view: 'income',    type: 'income',   color: '#16a34a', d: 'M12 4v16m8-8l-8-8-8 8' },
  { key: 'expense',  label: 'Nova Despesa',  view: 'expense',   type: 'expense',  color: '#ef4444', d: 'M12 20V4m-8 8l8 8 8-8' },
  { key: 'product',  label: 'Novo Produto',  view: 'inventory', type: 'product',  color: '#0f9d6c', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { key: 'loss',     label: 'Nova Perda',    view: 'inventory', type: 'loss',     color: '#f59e0b', d: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
  { key: 'settings', label: 'Configurações', view: 'settings',  type: null,       color: '#64748b', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function QuickActions({ view, onNav, brand }) {
  var color = (brand && brand.color) || '#002f59';
  var [open, setOpen] = React.useState(false);
  var wrapRef = React.useRef(null);

  React.useEffect(function() {
    if (!open) return undefined;
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    function onDoc(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return function() {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open]);

  if (SHOWN_VIEWS.indexOf(view) < 0) return null;

  function run(a) {
    setOpen(false);
    if (a.type) emitQuickIntent(a.type);
    if (onNav) onNav(a.view);
  }

  return (
    <div ref={wrapRef} data-testid="quick-actions"
      className="fixed z-40 right-4 bottom-24 lg:right-8 lg:bottom-8 flex flex-col items-end gap-3">
      {open && (
        <div role="menu" aria-label="Ações rápidas" data-testid="quick-actions-menu"
          className="flex flex-col items-end gap-2">
          {ACTIONS.map(function(a, i) {
            return (
              <button key={a.key} type="button" role="menuitem"
                onClick={function() { run(a); }}
                className="pressable anim-up flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-full shadow-lg"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', animationDelay: (i * 0.035) + 's' }}
                data-testid={'quick-action-' + a.key}>
                <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: brandAlpha(a.color, 0.12) }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d={a.d} />
                  </svg>
                </span>
                <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text-main)' }}>{a.label}</span>
              </button>
            );
          })}
        </div>
      )}
      <button type="button" onClick={function() { setOpen(function(o) { return !o; }); }}
        aria-expanded={open} aria-haspopup="menu" aria-label="Ações rápidas"
        data-testid="quick-actions-fab"
        className="pressable w-14 h-14 rounded-full shadow-xl flex items-center justify-center"
        style={{ background: color, boxShadow: '0 10px 28px ' + brandAlpha(color, 0.35) }}>
        <svg className={'w-6 h-6 transition-transform duration-200 ' + (open ? 'rotate-45' : '')}
          fill="none" stroke="#fff" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

export default React.memo(QuickActions);
