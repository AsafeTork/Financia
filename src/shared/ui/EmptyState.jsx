import React from 'react';
import { brandAlpha } from '../../lib/utils.js';

export default React.memo(function EmptyState({ icon, title, desc, action, onAction, accent, features, hint }) {
  var c = accent || 'var(--brand)';
  return (
    <div className="py-14 flex flex-col items-center gap-4 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1"
           style={{ background: brandAlpha(c, 0.08) }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={c}
             strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={icon} />
        </svg>
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{title}</p>
      {desc && <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
      {features && (
        <div className="flex flex-wrap gap-2 justify-center text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {features.map(function(f, i) {
            if (typeof f === 'string') {
              return <span key={f} className="px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-subtle)' }}>{f}</span>;
            }
            return (
              <span key={i} className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d={f.icon || 'M5 13l4 4L19 7'} />
                </svg>
                {f.label}
              </span>
            );
          })}
        </div>
      )}
      {hint && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      {action && (
        <button type="button" onClick={onAction}
          className="pressable mt-2 rounded-xl py-2.5 px-5 text-sm font-semibold text-white min-h-[44px]"
          style={{ background: c }}>
          {action}
        </button>
      )}
    </div>
  );
});
