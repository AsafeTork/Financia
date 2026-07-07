import React from 'react';

var PLAN_META = {
  free: { label: 'Free', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  pro: { label: 'Pro', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  premium: { label: 'Premium', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
};

var PALETTE_FIELDS = [
  { key: 'primary', label: 'Primaria', desc: 'Sidebar, botoes, navegacao' },
  { key: 'secondary', label: 'Secundaria', desc: 'Cards, badges, tags' },
  { key: 'accent', label: 'Destaque', desc: 'Hover, graficos, progresso' },
  { key: 'bgPage', label: 'Fundo pagina', desc: 'Fundo principal' },
  { key: 'bgCard', label: 'Fundo card', desc: 'Fundo dos cartoes' },
  { key: 'bgInput', label: 'Fundo input', desc: 'Fundo dos campos' },
  { key: 'bgSubtle', label: 'Fundo sutil', desc: 'Realce secundario' },
  { key: 'surface', label: 'Superficie', desc: 'Elementos elevados' },
  { key: 'textMain', label: 'Texto principal', desc: 'Cor do texto' },
  { key: 'textSub', label: 'Texto secundario', desc: 'Subtitulos' },
  { key: 'textMuted', label: 'Texto muted', desc: 'Descricoes' },
  { key: 'border', label: 'Borda', desc: 'Bordas dos elementos' },
  { key: 'success', label: 'Sucesso', desc: 'Indicador positivo' },
  { key: 'warning', label: 'Alerta', desc: 'Indicador atencao' },
  { key: 'danger', label: 'Erro', desc: 'Indicador negativo' },
  { key: 'info', label: 'Info', desc: 'Indicador informativo' },
];

function defaultPalette(planId) {
  var map = {
    free: { primary:'#002f59', secondary:'#e8f0f7', accent:'#1a6b5c', bgPage:'#f5f5f0', bgCard:'#ffffff', bgInput:'#ffffff', bgSubtle:'#f5f5f0', surface:'#ffffff', textMain:'#0f172a', textSub:'#5b6b7c', textMuted:'#94a3b8', border:'#edeae3' },
    pro: { primary:'#2563eb', secondary:'#eff6ff', accent:'#7c3aed', bgPage:'#f8fafc', bgCard:'#ffffff', bgInput:'#ffffff', bgSubtle:'#f1f5f9', surface:'#ffffff', textMain:'#0f172a', textSub:'#475569', textMuted:'#94a3b8', border:'#e2e8f0' },
    premium: { primary:'#0f172a', secondary:'#f8fafc', accent:'#f59e0b', bgPage:'#fafafa', bgCard:'#ffffff', bgInput:'#ffffff', bgSubtle:'#f5f5f5', surface:'#ffffff', textMain:'#171717', textSub:'#525252', textMuted:'#a3a3a3', border:'#e5e5e5' },
  };
  return map[planId] || map.free;
}

export default function PlanTabsEditor({ brandConfig, onSavePlan, onCopyJSON, onCopyDocs, brandColor, toast }) {
  var [activePlan, setActivePlan] = React.useState('free');
  var planOverrides = (brandConfig && brandConfig.planOverrides) || {};
  var palDefaults = defaultPalette(activePlan);

  var [form, setForm] = React.useState(function() {
    return initForm(activePlan, planOverrides, palDefaults);
  });
  var [saving, setSaving] = React.useState(false);
  var [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(function() {
    setForm(initForm(activePlan, planOverrides, palDefaults));
    setHasChanges(false);
  }, [activePlan]);

  var setColor = function(k, v) {
    setForm(function(f) { var o = Object.assign({}, f); o[k] = v; return o; });
    setHasChanges(true);
  };

  var doSave = async function() {
    setSaving(true);
    try {
      var pal = {};
      PALETTE_FIELDS.forEach(function(f) { pal[f.key] = form[f.key] || null; });
      await onSavePlan(activePlan, { modules: { palette: pal } });
      setHasChanges(false);
      if (toast) toast('Cores salvas para plano ' + activePlan, 'success');
    } catch (_) { void _; }
    setSaving(false);
  };

  var palPreview = [form.primary, form.secondary, form.accent];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex border-b gap-1" style={{borderColor:'var(--border)'}}>
        {Object.keys(PLAN_META).map(function(k) {
          var meta = PLAN_META[k];
          var active = activePlan === k;
          return (
            <button key={k} onClick={function() { setActivePlan(k); }}
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
          style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          Copiar doc
        </button>
        <button onClick={onCopyJSON}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-80 flex items-center gap-1.5"
          style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Copiar JSON
        </button>
      </div>

      <div>
        <p className="text-sm font-semibold mb-1" style={{color:'var(--text-main)'}}>Paleta de cores — {PLAN_META[activePlan].label}</p>
        <p className="text-xs mb-4" style={{color:'var(--text-muted)'}}>Essas cores aparecem nos elementos do sistema para usuarios do plano {PLAN_META[activePlan].label}.</p>
        <div className="flex items-center gap-3 mb-5">
          {palPreview.map(function(c, i) {
            var labels = ['Primaria', 'Secundaria', 'Destaque'];
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl border-2" style={{background: c, borderColor: 'var(--border)'}} />
                <span className="text-[9px] font-medium" style={{color:'var(--text-muted)'}}>{labels[i]}</span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PALETTE_FIELDS.map(function(f) {
            return (
              <ColorInput key={f.key} label={f.label} desc={f.desc} value={form[f.key] || ''} onChange={function(v) { setColor(f.key, v); }} />
            );
          })}
        </div>
      </div>

      <div className="border-t pt-4" style={{borderColor:'var(--border)'}}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color:'var(--text-muted)'}}>Preview — {PLAN_META[activePlan].label}</p>
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
              {[1,2,3,4].map(function(i) {
                return (
                  <div key={i} className="h-6 rounded-lg flex items-center justify-center" style={{background: i === 2 ? 'rgba(255,255,255,0.14)' : 'transparent'}}>
                    <div className="w-3 h-3 rounded" style={{background: i === 2 ? '#ffffff' : 'rgba(255,255,255,0.4)'}} />
                  </div>
                );
              })}
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
        {saving ? 'Salvando...' : 'Salvar configuracao do plano ' + PLAN_META[activePlan].label}
      </button>
    </div>
  );
}

function initForm(activePlan, planOverrides, palDefaults) {
  var ov = planOverrides[activePlan] || {};
  var pal = (ov.modules && ov.modules.palette) || {};
  var form = {};
  PALETTE_FIELDS.forEach(function(f) { form[f.key] = pal[f.key] || palDefaults[f.key] || ''; });
  return form;
}

function ColorInput({ label, value, onChange, desc }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium" style={{color:'var(--text-sub)'}}>{label}</label>
        {desc && <span className="text-[9px]" style={{color:'var(--text-muted)'}}>{desc}</span>}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={value || '#000000'} onChange={function(e) { onChange(e.target.value); }} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5 flex-shrink-0" />
        <input type="text" value={value || ''} onChange={function(e) { onChange(e.target.value); }}
          className="flex-1 rounded-xl px-2.5 py-1.5 text-[11px] font-mono focus:outline-none" style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
      </div>
    </div>
  );
}
