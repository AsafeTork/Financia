import React from 'react';

function isValidHex(v) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

export default function ColorField({ label, desc, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <p className="text-xs font-semibold" style={{color:'var(--text-main)'}}>{label}</p>
        <p className="text-xs" style={{color:'var(--text-sub)'}}>{desc}</p>
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={isValidHex(value) ? value : '#002f59'} onChange={function(e) { onChange(e.target.value); }}
          className="w-9 h-9 rounded-xl cursor-pointer p-0.5 flex-shrink-0" style={{border:'1px solid var(--border)'}}/>
        <input value={value} onChange={function(e) {
          var raw = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(raw)) onChange(raw);
        }}
          placeholder="#000000" maxLength={7}
          className="rounded-xl px-3 py-2 text-sm font-mono flex-1 focus:outline-none" style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}}/>
        <div className="w-8 h-8 rounded-xl flex-shrink-0" style={{background: value, border:'1px solid var(--border)'}}/>
      </div>
    </div>
  );
}
