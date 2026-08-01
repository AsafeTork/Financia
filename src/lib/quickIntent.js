import React from 'react';

// Bus de intenção de ação rápida: permite que o FAB (QuickActions) sinalize a view
// alvo para abrir seu modal de criação automaticamente, mesmo quando a navegação
// acontece depois do clique. Uma intenção pendente é consumida exatamente uma vez
// pela view correspondente (no mount ou via evento).

var EVENT = 'financia:quick-action';
var seq = 0;
var intent = null;

export function emitQuickIntent(type) {
  seq += 1;
  intent = { type: type, seq: seq };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: intent }));
  }
  return intent;
}

export function getQuickIntent() {
  return intent;
}

export function consumeQuickIntent(type) {
  if (intent && !intent.consumed && intent.type === type) {
    intent.consumed = true;
    return intent;
  }
  return null;
}

export function clearQuickIntent() {
  intent = null;
}

export function useQuickIntent(type, onTrigger) {
  var cbRef = React.useRef(onTrigger);
  cbRef.current = onTrigger;
  var lastSeq = React.useRef(0);

  React.useEffect(function() {
    var pending = consumeQuickIntent(type);
    if (pending && pending.seq !== lastSeq.current) {
      lastSeq.current = pending.seq;
      cbRef.current();
    }
    function handler(e) {
      var d = e.detail;
      if (d && d.type === type) {
        var qi = consumeQuickIntent(type);
        if (qi && qi.seq !== lastSeq.current) {
          lastSeq.current = qi.seq;
          cbRef.current();
        }
      }
    }
    window.addEventListener(EVENT, handler);
    return function() { window.removeEventListener(EVENT, handler); };
  }, [type]);
}
