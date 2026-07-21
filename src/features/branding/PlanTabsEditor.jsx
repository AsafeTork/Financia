import React from 'react';
import { PALETTE_UI_FIELDS, PLAN_META, getDefaultPaletteForPlan } from './defaults.js';

const PLAN_META_LOCAL = {
  ...PLAN_META,
  white_label: {
    label: 'White Label',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
};

export default function PlanTabsEditor({ brandConfig, onSavePlan, onCopyJSON, onCopyDocs, brandColor, toast }) {
  const [activePlan, setActivePlan] = React.useState('free');
  const planOverrides = React.useMemo(() => (brandConfig && brandConfig.modules && brandConfig.modules.planOverrides) || {}, [brandConfig]);
  const palDefaults = getDefaultPaletteForPlan(activePlan);

  const [form, setForm] = React.useState(() => initForm(activePlan, planOverrides, palDefaults));
  const [saving, setSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [jsonInput, setJsonInput] = React.useState('');

  React.useEffect(() => {
    const f = initForm(activePlan, planOverrides, palDefaults);
    setForm(f);
    setHasChanges(false);
    setJsonInput(JSON.stringify(f, null, 2));
  }, [activePlan, palDefaults, planOverrides]);

  const setColor = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setHasChanges(true);
    setJsonInput(prev => {
      try { const p = JSON.parse(prev); p[k] = v; return JSON.stringify(p, null, 2); } catch { return prev; }
    });
  };

  const applyJson = (json) => {
    setJsonInput(json);
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object') {
        const safe = {};
        const allowedKeys = PALETTE_UI_FIELDS.map(f => f.key);
        allowedKeys.forEach(k => { if (parsed[k] !== undefined) safe[k] = String(parsed[k]).slice(0, 100); });
        setForm(f => ({ ...f, ...safe }));
        setHasChanges(true);
      }
    } catch (_) { void _; }
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const pal = {};
      PALETTE_UI_FIELDS.forEach(f => { pal[f.key] = form[f.key] || null; });
      await onSavePlan(activePlan, { modules: { palette: pal } });
      setHasChanges(false);
      if (toast) toast('Cores salvas para plano ' + activePlan, 'success');
    } catch (_) { void _; }
    setSaving(false);
  };

  const palPreview = [form.primary, form.secondary, form.accent];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex border-b gap-1" style={{borderColor:'var(--border, #e2e8f0)'}} role="tablist" aria-label="Planos">
        {Object.keys(PLAN_META_LOCAL).map(k => {
          const meta = PLAN_META_LOCAL[k];
          const active = activePlan === k;
          return (
            <button key={k} onClick={() => setActivePlan(k)} role="tab" aria-selected={active}
              className={'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ' + (active ? '' : 'text-gray-400 border-transparent hover:text-gray-600')}
              style={active ? {borderColor: brandColor, color: brandColor} : {}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={meta.icon} /></svg>
              {meta.label}
            </button>
          );
        })}
        <div className="flex-1 min-w-[8px]" />
        <button onClick={onCopyDocs}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-80 flex items-center gap-1.5"
          style={{background:'var(--bg-subtle, #f1f5f9)', color:'var(--text-sub, #475569)', border:'1px solid var(--border, #e2e8f0)'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          Copiar doc
        </button>
        <button onClick={onCopyJSON}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-80 flex items-center gap-1.5"
          style={{background:'var(--bg-subtle, #f1f5f9)', color:'var(--text-sub, #475569)', border:'1px solid var(--border, #e2e8f0)'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Copiar JSON
        </button>
      </div>

      <div>
        <p className="text-sm font-semibold mb-1" style={{color:'var(--text-main, #0f172a)'}}>Paleta de cores — {PLAN_META_LOCAL[activePlan].label}</p>
        <p className="text-xs mb-4" style={{color:'var(--text-muted, #94a3b8)'}}>Essas cores aparecem nos elementos do sistema para usuarios do plano {PLAN_META_LOCAL[activePlan].label}.</p>
        <div className="flex items-center gap-3 mb-5">
          {palPreview.map((c, i) => {
            const labels = ['Primaria', 'Secundaria', 'Destaque'];
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl border-2" style={{background: c, borderColor: 'var(--border, #e2e8f0)'}} />
                <span className="text-[9px] font-medium" style={{color:'var(--text-muted, #94a3b8)'}}>{labels[i]}</span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PALETTE_UI_FIELDS.map(f => (
            <ColorInput key={f.key} label={f.label} desc={f.desc} value={form[f.key] || ''} onChange={v => setColor(f.key, v)} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="plan-json-input" className="text-xs font-medium" style={{color:'var(--text-sub, #475569)'}}>JSON</label>
        <textarea id="plan-json-input" value={jsonInput} onChange={e => applyJson(e.target.value)}
          rows={4} className="rounded-xl px-3 py-2 text-[11px] font-mono resize-none focus:outline-none"
          style={{background:'var(--bg-input, #f1f5f9)', color:'var(--text-main, #0f172a)', border:'1px solid var(--border, #e2e8f0)'}} />
      </div>

      <div className="border-t pt-4" style={{borderColor:'var(--border, #e2e8f0)'}}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color:'var(--text-muted, #94a3b8)'}}>Preview — {PLAN_META_LOCAL[activePlan].label}</p>
        <div className="rounded-2xl overflow-hidden" style={{background: form.bgPage || '#f5f5f0', color: form.textMain || '#0f172a'}}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{background: form.primary || '#002f59', color:'#ffffff'}}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{background:'rgba(255,255,255,0.2)'}}>F</div>
              <span className="text-sm font-semibold">Financia</span>
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold" style={{background:'rgba(255,255,255,0.2)'}}>U</div>
          </div>
          <div className="flex">
            <div className="w-16 flex-shrink-0 p-1.5 flex flex-col gap-1" style={{background: form.primary || '#1e293b'}}>
              {[1,2,3,4].map(i => (
                <div key={i} className="h-6 rounded-lg flex items-center justify-center" style={{background: i === 2 ? 'rgba(255,255,255,0.14)' : 'transparent'}}>
                  <div className="w-3 h-3 rounded" style={{background: i === 2 ? '#ffffff' : 'rgba(255,255,255,0.4)'}} />
                </div>
              ))}
            </div>
            <div className="flex-1 p-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-white rounded-lg" style={{background: form.primary || '#002f59'}}>Salvar</div>
                <div className="px-3 py-1.5 text-[10px] font-semibold rounded-lg" style={{background: form.secondary || '#e8f0f7', color: form.primary || '#002f59'}}>Cancelar</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl flex flex-col gap-1.5" style={{background: form.bgCard || '#ffffff', border:'1px solid ' + (form.border || '#edeae3'), borderRadius:'10px'}}>
                  <div className="h-2 w-2/3 rounded" style={{background: form.bgSubtle || '#f5f5f0'}} />
                  <div className="h-1.5 rounded-full" style={{background: form.bgSubtle || '#f5f5f0'}}>
                    <div className="h-full rounded-full" style={{width:'60%', background: form.accent || '#1a6b5c'}} />
                  </div>
                </div>
                <div className="p-2 rounded-xl flex flex-col gap-1.5" style={{background: form.bgCard || '#ffffff', border:'1px solid ' + (form.border || '#edeae3'), borderRadius:'10px'}}>
                  <div className="h-2 w-1/2 rounded" style={{background: form.bgSubtle || '#f5f5f0'}} />
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{background: form.secondary || '#e8f0f7'}} />
                    <span className="text-[7px]" style={{color: form.textSub || '#5b6b7c'}}>Tag</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="text-[7px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background: form.primary || '#002f59'}}>NOVO</div>
                <div className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{background: form.secondary || '#e8f0f7', color: form.primary || '#002f59'}}>ATIVO</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={doSave} disabled={saving || !hasChanges}
        className="w-full text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 min-h-[44px] transition"
        style={{background: brandColor}}>
        {saving ? 'Salvando...' : 'Salvar configuracao do plano ' + PLAN_META_LOCAL[activePlan].label}
      </button>
    </div>
  );
}

const initForm = (activePlan, planOverrides, palDefaults) => {
  const ov = planOverrides[activePlan] || {};
  const pal = (ov.modules && ov.modules.palette) || {};
  const form = {};
  PALETTE_UI_FIELDS.forEach(f => { form[f.key] = pal[f.key] || palDefaults[f.key] || ''; });
  return form;
};

function ColorInput({ label, value, onChange, desc }) {
  const inputId = `color-input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-xs font-medium" style={{color:'var(--text-sub, #475569)'}}>{label}</label>
        {desc && <span className="text-[9px]" style={{color:'var(--text-muted, #94a3b8)'}}>{desc}</span>}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" id={inputId} value={value || '#000000'} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5 flex-shrink-0" aria-label={label} />
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
          className="flex-1 rounded-xl px-2.5 py-1.5 text-[11px] font-mono focus:outline-none" style={{background:'var(--bg-input, #f1f5f9)', color:'var(--text-main, #0f172a)', border:'1px solid var(--border, #e2e8f0)'}} />
      </div>
    </div>
  );
}