import React from 'react';

var ICON = {
  error: React.createElement('svg', {width:14, height:14, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2.5', strokeLinecap:'round'}, React.createElement('path', {d:'M18 6L6 18M6 6l12 12'})),
  warning: React.createElement('svg', {width:14, height:14, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2.5', strokeLinecap:'round', strokeLinejoin:'round'}, React.createElement('path', {d:'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'})),
  success: React.createElement('svg', {width:14, height:14, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2.5', strokeLinecap:'round'}, React.createElement('path', {d:'M5 13l4 4L19 7'})),
};

var BG = {
  error: 'bg-destructive',
  warning: 'bg-amber-600',
  success: 'bg-green-600',
};

export default function Toast({ toasts, onDismiss }) {
  var [exiting, setExiting] = React.useState({});
  var hasExiting = Object.keys(exiting).length > 0;

  var handleDismiss = function(id) {
    setExiting(function(prev) { var o = {}; o[id] = true; return Object.assign({}, prev, o); });
    setTimeout(function() {
      setExiting(function(prev) {
        var next = Object.assign({}, prev);
        delete next[id];
        return next;
      });
      if (onDismiss) onDismiss(id);
    }, 250);
  };

  if (!toasts || (!toasts.length && !hasExiting)) return null;
  var visible = toasts.slice(-4);
  if (hasExiting) {
    var extraIds = Object.keys(exiting);
    extraIds.forEach(function(id) {
      var already = visible.some(function(t) { return t.id === id; });
      if (!already) visible.push({ id: id, msg: '', type: 'success' });
    });
  }

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none">
      {visible.map(function(t) {
        var bgClass = BG[t.type] || 'bg-gray-800';
        var isExiting = exiting && exiting[t.id];
        return (
          <button
            key={t.id}
            onClick={function() { handleDismiss(t.id); }}
            className={'pointer-events-auto anim-up flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white w-full justify-center ' + bgClass + (isExiting ? ' anim-out' : '')}
          >
            <span className="flex-shrink-0">{ICON[t.type]}</span>
            <span className="truncate">{t.msg}</span>
          </button>
        );
      })}
    </div>
  );
}
