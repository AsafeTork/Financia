import React, { useEffect, useRef } from 'react';

export default React.memo(function Confirm({ msg, onOk, onCancel }) {
  var dialogRef = useRef(null);
  var prevFocus = useRef(null);
  var cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;
  var [closing, setClosing] = React.useState(false);

  useEffect(function () {
    prevFocus.current = document.activeElement;

    var dialog = dialogRef.current;
    if (!dialog) return;

    var firstBtn = dialog.querySelector('button');
    if (firstBtn) firstBtn.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setClosing(true);
        setTimeout(function() { cancelRef.current(); }, 150);
        return;
      }
      if (e.key !== 'Tab') return;

      var btns = dialog.querySelectorAll('button');
      if (btns.length === 0) return;
      var first = btns[0];
      var last = btns[btns.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          if (last) last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          if (first) first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return function () {
      document.removeEventListener('keydown', handleKeyDown);
      if (prevFocus.current && typeof prevFocus.current.focus === 'function') {
        prevFocus.current.focus();
      }
    };
  }, []);

  return (
    <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg" className={'fixed inset-0 z-50 flex items-center justify-center p-4 ' + (closing ? 'anim-exit-overlay' : 'anim-fade')} style={{background:'rgba(15,23,42,0.55)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)'}}>
      <div className={'rounded-2xl w-full max-w-xs p-6 flex flex-col gap-4 ' + (closing ? 'anim-exit-modal' : 'anim-scale')} style={{background:'var(--bg-card)', boxShadow:'var(--shadow-lg)'}}>
        <h2 id="confirm-title" className="sr-only">Confirmação</h2>
        <p id="confirm-msg" className="text-sm text-center leading-relaxed" style={{color:'var(--text-main)'}}>{msg}</p>
        <div className="flex gap-2">
          <button onClick={function() { setClosing(true); setTimeout(onCancel, 150); }} className="flex-1 rounded-xl py-2.5 text-sm font-medium min-h-[44px]" style={{border:'1px solid var(--border)', color:'var(--text-sub)', background:'var(--bg-card)'}}>Cancelar</button>
          <button onClick={onOk} className="flex-1 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 min-h-[44px]" style={{background:'var(--brand)'}}>Confirmar</button>
        </div>
      </div>
    </div>
  );
});
