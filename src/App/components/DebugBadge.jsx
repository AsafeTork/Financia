import React from 'react';

function DebugBadge() {
  const [show, setShow] = React.useState(function() {
    try { return localStorage.getItem('financia_debug_mode') === '1'; } catch { return false; }
  });
  React.useEffect(function() {
    function check() { try { setShow(localStorage.getItem('financia_debug_mode') === '1'); } catch (e) { console.warn('DebugBadge: error reading debug state:', e); } }
    window.addEventListener('storage', check);
    window.addEventListener('financia-debug-change', check);
    return function() { window.removeEventListener('storage', check); window.removeEventListener('financia-debug-change', check); };
  }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg"
      style={{background:'#6b21a8', color:'#fff'}}>
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      DEBUG
    </div>
  );
}

export default DebugBadge;