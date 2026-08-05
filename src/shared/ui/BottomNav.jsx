import React from 'react';
import { brandAlpha } from '../../lib/utils.js';
import { NAV } from '../../lib/constants.js';

var ITEMS = NAV;

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
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden" style={navStyle}>
      <div className="flex h-16" role="tablist" aria-label="Navegação principal">
        {visibleItems.map(function(item) {
          var active = view === item.key;
          return (
            <button key={item.key} onClick={function() { onNav(item.key); }}
              role="tab" aria-selected={active} aria-label={item.label} {...(active && { 'aria-current': 'page' })}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors min-w-0 min-h-[44px] min-w-[44px] py-2"
              style={{color: active ? brand.color : 'var(--text-muted)'}}>
              {active && (
                <div className="absolute top-0 left-1/2 w-8 h-0.5 rounded-b-full" style={indicatorBg}/>
              )}
              <div className="flex items-center justify-center rounded-xl transition-all" style={{width:44, height:44, background: active ? brandAlpha(brand.color, 0.12) : 'transparent'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.d}/>
                </svg>
              </div>
              <span className="truncate max-w-full px-1" style={{fontSize: 11, fontWeight: active ? 600 : 400, lineHeight: '14px'}}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default React.memo(BottomNav);