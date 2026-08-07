import React from 'react';

export default React.memo(function PullToRefreshIndicator({ isPulling, pullProgress, isRefreshing, color }) {
  var c = color || 'var(--brand)';
  var show = isPulling || isRefreshing;
  var pct = Math.round(pullProgress * 100);

  return (
    <div
      data-testid="pull-to-refresh-indicator"
      role="status"
      aria-live="polite"
      className={'absolute top-0 left-0 right-0 flex items-center justify-center py-2 transition-all duration-200 ' + (show ? 'h-12 opacity-100' : 'h-0 opacity-0 pointer-events-none')}
      style={{ background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)', borderBottom: show ? '1px solid var(--border)' : 'none' }}
    >
      {isRefreshing ? (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-sub)' }}>
          <svg className="w-4 h-4 animate-spin" fill="none" stroke={c} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={2.5} d="M12 3a9 9 0 108 5"/>
          </svg>
          <span>Sincronizando...</span>
        </div>
      ) : (
        <svg
          className="w-5 h-5 transition-transform duration-200"
          fill="none"
          stroke={c}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: 'rotate(' + (pct * 3.6) + 'deg) translateY(' + (8 * pullProgress) + 'px)' }}
          aria-hidden="true"
        >
          <path d="M12 4v4m0 0l-2 2m2-2l2 2M12 4V2a10 10 0 00-3.16 17.5l1.42-1.42A8 8 0 119 15h3z"/>
        </svg>
      )}
    </div>
  );
});
