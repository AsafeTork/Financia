import React from 'react';
import { brandAlpha } from '../../lib/utils.js';

var ITEMS = [
  { key: 'dashboard', label: 'Início',    adminOnly: false, d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { key: 'income',    label: 'Vendas / Ganhos',    adminOnly: false, d: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { key: 'expense',   label: 'Despesas',  adminOnly: false, d: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' },
  { key: 'inventory', label: 'Estoque',   adminOnly: false, d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { key: 'report',    label: 'Relatório', adminOnly: false, d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { key: 'email',     label: 'Comunicar', adminOnly: true,  d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'settings',  label: 'Config',    adminOnly: false, d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function BottomNav({ view, onNav, brand, isAdmin }) {
  var isAdminUser = !!isAdmin;
  var visibleItems = ITEMS.filter(function(i) { return !i.adminOnly || isAdminUser; });

  var navStyle = React.useMemo(function() {
    return {background:'var(--bg-page)', borderTop:'1px solid var(--border-color, #f1f5f9)', paddingBottom:'env(safe-area-inset-bottom, 0px)'};
  }, []);

  var indicatorBg = React.useMemo(function() {
    return {background: brand.color, transform:'translateX(-50%)'};
  }, [brand.color]);
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
      style={navStyle}>
      <div className="flex h-16">
        {visibleItems.map(function(item) {
          var active = view === item.key;
          return (
            <button key={item.key} onClick={function() { onNav(item.key); }}
              aria-label={item.label} aria-current={active ? 'page' : undefined}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors min-w-0 pt-1"
              style={{color: active ? brand.color : 'var(--text-muted)'}}>
              {active && (
                <div className="absolute top-0 left-1/2 w-8 h-0.5 rounded-b-full" style={indicatorBg}/>
              )}
              <div className="flex items-center justify-center rounded-xl transition-all" style={{width:36, height:26, background: active ? brandAlpha(brand.color, 0.12) : 'transparent'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.d}/>
                </svg>
              </div>
              <span className="truncate max-w-full px-0.5" style={{fontSize: 10, fontWeight: active ? 600 : 400, lineHeight: '12px'}}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default React.memo(BottomNav);
