import React from 'react';
import { luminance, isValidUrl } from '../../lib/utils.js';
import ThemeToggle from './ThemeToggle.jsx';

function Header({ brand, onMenuOpen, onOpenSearch, syncStatus, theme, onToggleTheme }) {
  const dotColor = syncStatus === 'ok' ? '#22c55e' : syncStatus === 'error' ? '#ef4444' : '#94a3b8';
  const lum = luminance(brand.color || '#002f59');
  const textColor = lum > 0.4 ? 'var(--text-main)' : '#ffffff';
  const overlayAlpha = lum > 0.4 ? '0.08' : '0.18';

  const headerBg = React.useMemo(function() {
    return {background: brand.color || '#002f59'};
  }, [brand.color]);

  const logoBorderStyle = React.useMemo(function() {
    return {border:'2px solid rgba(0,0,0,0.15)'};
  }, []);

  const menuBtnStyle = React.useMemo(function() {
    return {background:'rgba(0,0,0,' + overlayAlpha + ')'};
  }, [overlayAlpha]);

  const logoFallbackStyle = React.useMemo(function() {
    return {background:'rgba(0,0,0,' + overlayAlpha + ')', border:'2px solid rgba(0,0,0,0.15)'};
  }, [overlayAlpha]);
  return (
    <header data-testid="header" className="sticky top-0 z-20 lg:hidden shadow-sm" style={headerBg}>
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {isValidUrl(brand.logo_url)
            ? <img src={brand.logo_url} alt="" fetchPriority="high" decoding="sync" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" style={logoBorderStyle}/>
            : <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={logoFallbackStyle}>
                <span className="font-bold text-sm" style={{color: textColor}}>{(brand.logo || 'F')[0]}</span>
              </div>
          }
          <span className="font-semibold text-sm truncate" style={{color: textColor}}>{brand.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button data-testid="header-search" onClick={onOpenSearch} aria-label="Abrir busca" className="p-3 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center transition hover:opacity-80" style={menuBtnStyle}>
            <svg className="w-4 h-4" fill="none" stroke={textColor} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </button>
          <div className="w-2 h-2 rounded-full" style={{background: dotColor}}/>
          {onToggleTheme && <ThemeToggle theme={theme} onToggle={onToggleTheme} variant="header" onBrand={textColor}/>}
          <button data-testid="header-menu" onClick={onMenuOpen} aria-label="Abrir menu" className="p-3 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center" style={menuBtnStyle}>
            <svg className="w-4 h-4" fill="none" stroke={textColor} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default React.memo(Header);
