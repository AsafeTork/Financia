import React from 'react';

export default function Header({ brand, onMenuOpen, syncStatus }) {
  var dotColor = syncStatus === 'ok' ? '#22c55e' : syncStatus === 'error' ? '#ef4444' : '#94a3b8';
  return (
    <header className="sticky top-0 z-20 lg:hidden shadow-sm" style={{background: brand.color}}>
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {brand.logo_url
            ? <img src={brand.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" style={{border:'2px solid rgba(255,255,255,0.25)'}}/>
            : <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(255,255,255,0.18)', border:'2px solid rgba(255,255,255,0.25)'}}>
                <span className="text-white font-bold text-sm">{(brand.logo || 'F')[0]}</span>
              </div>
          }
          <span className="font-semibold text-white text-sm truncate">{brand.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-2 h-2 rounded-full" style={{background: dotColor}}/>
          <button onClick={onMenuOpen} className="p-2 rounded-xl" style={{background:'rgba(255,255,255,0.15)'}}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
