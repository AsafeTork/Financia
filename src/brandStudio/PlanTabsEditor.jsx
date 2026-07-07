import React from 'react';

var PLAN_META = {
  free: { label: 'Free', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  pro: { label: 'Pro', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  premium: { label: 'Premium', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
};

function defaultColors(planId) {
  var map = { free: ['#002f59','#e8f0f7','#1a6b5c'], pro: ['#2563eb','#eff6ff','#7c3aed'], premium: ['#0f172a','#f8fafc','#f59e0b'] };
  return map[planId] || map.free;
}

export default function PlanTabsEditor({ brandConfig, onSavePlan, onCopyJSON, onCopyDocs, brandColor, toast }) {
  var [activePlan, setActivePlan] = React.useState('free');

  var planOverrides = (brandConfig && brandConfig.planOverrides) || {};

  var defaults = defaultColors(activePlan);
  var [form, setForm] = React.useState(function() {
    var ov = planOverrides[activePlan] || {};
    var pal = ov.modules && ov.modules.palette ? ov.modules.palette : {};
    return {
      primary: pal.primary || defaults[0],
      secondary: pal.secondary || defaults[1],
      accent: pal.accent || defaults[2],
      logo_url: ov.logo_url || '',
    };
  });

  var [saving, setSaving] = React.useState(false);
  var [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(function() {
    var ov = planOverrides[activePlan] || {};
    var pal = ov.modules && ov.modules.palette ? ov.modules.palette : {};
    var newForm = {
      primary: pal.primary || defaults[0],
      secondary: pal.secondary || defaults[1],
      accent: pal.accent || defaults[2],
      logo_url: ov.logo_url || '',
    };
    setForm(newForm);
    setHasChanges(false);
  }, [activePlan]);

  var setField = function(k, v) {
    setForm(function(f) {
      var o = Object.assign({}, f);
      o[k] = v;
      return o;
    });
    setHasChanges(true);
  };

  var onLogoFile = function(e) {
    var file = e.target && e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 512 * 1024) { if (toast) toast('Imagem muito grande (max. 512KB)', 'error'); return; }
    var reader = new FileReader();
    reader.onload = function() { setField('logo_url', String(reader.result)); };
    reader.readAsDataURL(file);
  };

  var doSave = async function() {
    setSaving(true);
    try {
      await onSavePlan(activePlan, {
        logo_url: form.logo_url,
        modules: {
          palette: { primary: form.primary, secondary: form.secondary, accent: form.accent },
        },
      });
      setHasChanges(false);
      if (toast) toast('Configuracao salva para plano ' + activePlan, 'success');
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
          Copiar doc
        </button>
        <button onClick={onCopyJSON}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-80 flex items-center gap-1.5"
          style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          Copiar JSON
        </button>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold mb-1" style={{color:'var(--text-main)'}}>Paleta de cores — {PLAN_META[activePlan].label}</p>
          <p className="text-xs mb-4" style={{color:'var(--text-muted)'}}>Essas cores aparecem no login, barra superior e ícone do navegador para usuários do plano {PLAN_META[activePlan].label}.</p>
          <div className="flex items-center gap-4 mb-5">
            {palPreview.map(function(c, i) {
              var labels = ['Primária', 'Secundária', 'Destaque'];
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-2xl border-2" style={{background: c, borderColor: 'var(--border)'}} />
                  <span className="text-[10px] font-medium" style={{color:'var(--text-muted)'}}>{labels[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ColorInputPlan label="Cor primária" value={form.primary} onChange={function(v) { setField('primary', v); }} desc="Sidebar, botões, navegação" />
            <ColorInputPlan label="Cor secundária" value={form.secondary} onChange={function(v) { setField('secondary', v); }} desc="Cards, badges, tags" />
            <ColorInputPlan label="Cor de destaque" value={form.accent} onChange={function(v) { setField('accent', v); }} desc="Hover, gráficos, progresso" />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-1" style={{color:'var(--text-main)'}}>Logo personalizada</p>
          <p className="text-xs mb-3" style={{color:'var(--text-muted)'}}>Uma logo para o plano {PLAN_META[activePlan].label}. Aparece ao lado da logo do Financia na barra superior.</p>
          <div className="flex items-center gap-4">
            {form.logo_url
              ? <img src={form.logo_url} alt="logo" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border" style={{borderColor:'var(--border)'}} />
              : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{background:'var(--bg-subtle)', border:'1px dashed var(--border)', color:'var(--text-muted)'}}>Logo</div>
            }
            <label className="text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer text-center min-h-[44px] flex items-center justify-center transition hover:opacity-80" style={{background:'var(--brand-soft)', color: brandColor}}>
              Enviar logo
              <input type="file" accept="image/*" onChange={onLogoFile} className="hidden" />
            </label>
            {form.logo_url && (
              <button onClick={function() { setField('logo_url', ''); }} className="text-xs font-medium hover:opacity-70" style={{color:'var(--text-muted)'}}>Remover</button>
            )}
          </div>
        </div>

        <button onClick={doSave} disabled={saving || !hasChanges}
          className="w-full text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 min-h-[44px] transition"
          style={{background: brandColor}}>
          {saving ? 'Salvando...' : 'Salvar configuração do plano ' + PLAN_META[activePlan].label}
        </button>
      </div>
    </div>
  );
}

function ColorInputPlan({ label, value, onChange, desc }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{color:'var(--text-sub)'}}>{label}</label>
      {desc && <p className="text-[10px] -mt-1" style={{color:'var(--text-muted)'}}>{desc}</p>}
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={function(e) { onChange(e.target.value); }} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5 flex-shrink-0" />
        <input type="text" value={value} onChange={function(e) { onChange(e.target.value); }} className="flex-1 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none" style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
      </div>
    </div>
  );
}
