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
      await onSavePlan(activePlan, { logo_url: '', modules: { palette: pal } });
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
        <p className="text-sm font-semibold mb-1" style={{color:'var(--text-main)'}}>Logo do plano {PLAN_META[activePlan].label}</p>
        <p className="text-xs mb-3" style={{color:'var(--text-muted)'}}>Uma logo personalizada que aparece ao lado da logo do Financia para usuarios deste plano.</p>
        <div className="flex items-center gap-4">
          {form.logo_url
            ? <img src={form.logo_url} alt="logo" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border" style={{borderColor:'var(--border)'}} />
            : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{background:'var(--bg-subtle)', border:'1px dashed var(--border)', color:'var(--text-muted)'}}>Logo</div>
          }
          <label className="text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer text-center min-h-[44px] flex items-center justify-center transition hover:opacity-80" style={{background:'var(--brand-soft)', color: brandColor}}>
            Enviar logo
            <input type="file" accept="image/*" onChange={function(e) {
              var file = e.target && e.target.files && e.target.files[0];
              if (!file) return;
              if (file.size > 512 * 1024) { if (toast) toast('Imagem muito grande (max. 512KB)', 'error'); return; }
              var reader = new FileReader();
              reader.onload = function() { setForm(function(f) { var o = Object.assign({}, f); o.logo_url = String(reader.result); return o; }); setHasChanges(true); };
              reader.readAsDataURL(file);
            }} className="hidden" />
          </label>
          {form.logo_url && (
            <button onClick={function() { setForm(function(f) { var o = Object.assign({}, f); o.logo_url = ''; return o; }); setHasChanges(true); }} className="text-xs font-medium hover:opacity-70" style={{color:'var(--text-muted)'}}>Remover</button>
          )}
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
  var pal = ov.modules && ov.modules.palette ? ov.modules.palette : {};
  var form = { logo_url: ov.logo_url || '' };
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
