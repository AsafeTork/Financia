import React from 'react';

// Tooltip contextual: pequeno botão "i" que revela uma explicação ao passar o
// mouse, focar (teclado) ou tocar (mobile). Acessível via aria-describedby.

export default function Tip({ text, id }) {
  var generatedId = React.useId();
  var tipId = id || (generatedId + '-tip');
  var [open, setOpen] = React.useState(false);

  return (
    <span className="tip-wrap inline-flex align-middle">
      <button type="button" aria-label="Mais informações" aria-describedby={tipId} aria-expanded={open}
        onClick={function(e) { e.preventDefault(); setOpen(function(o) { return !o; }); }}
        className="tip-btn w-4 h-4 rounded-full text-[10px] font-bold leading-none flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
        i
      </button>
      <span id={tipId} role="tooltip" className={'tip-bubble ' + (open ? 'tip-open' : '')}>
        {text}
      </span>
    </span>
  );
}
