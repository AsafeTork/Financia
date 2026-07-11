import React from 'react';
import useBrandStudio from './useBrandStudio.js';
import { PageHead, Card } from '../../shared/ui/ui.jsx';
import { generateLogoSvg, logoSvgToDataUrl } from './logoUtils.js';
import PlanTabsEditor from './PlanTabsEditor.jsx';
import PreviewGeral from './PreviewGeral.jsx';

const NAV_TABS = [
  { key: 'logo', label: 'Logo', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'planos', label: 'Planos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
];

const PLAN_LOGO_META = {
  free: { label: 'Free' },
  pro: { label: 'Pro' },
  premium: { label: 'Premium' },
};

const LOGO_ELEMENTS = [
  { id: 'blue', label: 'Coluna 1' },
  { id: 'green', label: 'Coluna 2' },
  { id: 'teal', label: 'Coluna 3' },
  { id: 'check', label: 'Check' },
];

const ORIGINAL_LOGO = {
  blue: '#002f59', green: '#1a6b5c', teal: '#6ec6c8', check: '#8cf2d1',
};

function usePlanLogoSync(activePlan, brandConfig, brandColor) {
  const planOverrides = (brandConfig && brandConfig.planOverrides) || {};
  const globalColors = (brandConfig && brandConfig.logoColors) || ORIGINAL_LOGO;
  const overrideColors = planOverrides[activePlan] && planOverrides[activePlan].logoColors;
  const hasCustom = !!overrideColors;

  const [form, setForm] = React.useState(function() {
    return Object.assign({}, overrideColors || globalColors);
  });
  const [jsonInput, setJsonInput] = React.useState(JSON.stringify(overrideColors || globalColors, null, 2));

  React.useEffect(function() {
    const src = overrideColors || globalColors;
    setForm(Object.assign({}, src));
    setJsonInput(JSON.stringify(src, null, 2));
  }, [activePlan, hasCustom, globalColors, overrideColors]);

  const setColor = function(id, val) {
    setForm(function(prev) { const o = Object.assign({}, prev); o[id] = val; return o; });
    setJsonInput(function(prev) {
      try { const p = JSON.parse(prev); p[id] = val; return JSON.stringify(p, null, 2); } catch { return prev; }
    });
  };

  const applyJson = function(json) {
    setJsonInput(json);
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object') {
        const safe = {}; const allowedKeys = ['blue', 'green', 'teal', 'check'];
        allowedKeys.forEach(function(k) { if (parsed[k] !== undefined) safe[k] = String(parsed[k]).slice(0, 100); });
        setForm(Object.assign({}, form, safe));
      }
    } catch (_) { void _; }
  };

  return { form: form, hasCustom: hasCustom, jsonInput: jsonInput, setColor: setColor, applyJson: applyJson, setJsonInput: setJsonInput };
}

function LogoTabContent({ brand, bs, brandColor, applyLogoScheme, toast }) {
  const [activeTab, setActiveTab] = React.useState('_global');
  const lps = usePlanLogoSync(activeTab, bs.brandConfig, brandColor);
  const isGlobal = activeTab === '_global';

  const doSave = async function() {
    if (isGlobal) {
      const svg = generateLogoSvg(lps.form);
      const dataUrl = logoSvgToDataUrl(svg);
      applyLogoScheme(dataUrl, lps.form);
    } else {
      await bs.savePlanLogo(activeTab, lps.form);
    }
  };

  const doReset = async function() {
    if (isGlobal) {
      const orig = { blue:'#002f59', green:'#1a6b5c', teal:'#6ec6c8', check:'#8cf2d1' };
      const svg = generateLogoSvg(orig);
      applyLogoScheme(logoSvgToDataUrl(svg), orig);
    } else {
      await bs.savePlanLogo(activeTab, null);
    }
  };

  const tabLabel = isGlobal ? 'Global' : PLAN_LOGO_META[activeTab].label;

  return (
    <Card className="p-4 sm:p-5">
      {bs && bs.copyPrompt && bs.copyCurrentJSON && (
        <div className="flex gap-2 mb-3">
          <button onClick={bs.copyPrompt}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-80 flex items-center gap-1.5"
            style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            Copiar doc
          </button>
          <button onClick={bs.copyCurrentJSON}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-80 flex items-center gap-1.5"
            style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            Copiar JSON
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1 border-b pb-1 mb-4" style={{borderColor:'var(--border)'}}>
        <button onClick={function() { setActiveTab('_global'); }}
          className={'text-xs font-semibold px-3 py-2 rounded-t-lg transition ' + (activeTab === '_global' ? 'border-b-2' : 'opacity-50')}
          style={activeTab === '_global' ? {borderColor:brandColor, color:brandColor} : {}}>
        Global
        </button>
        {Object.keys(PLAN_LOGO_META).map(function(k) {
          return (
            <button key={k} onClick={function() { setActiveTab(k); }}
              className={'text-xs font-semibold px-3 py-2 rounded-t-lg transition ' + (activeTab === k ? 'border-b-2' : 'opacity-50')}
              style={activeTab === k ? {borderColor:brandColor, color:brandColor} : {}}>
            {PLAN_LOGO_META[k].label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-3">
        <div className="flex-shrink-0 flex items-center justify-center">
          <div className="rounded-xl overflow-hidden bg-white" style={{width:120, height:120}}>
            <svg width="120" height="120" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Preview da logo">
              <rect width="400" height="400" fill="transparent" />
              <g transform="translate(34,200)"><rect width="71" height="125" rx="10" fill={lps.form.blue || ORIGINAL_LOGO.blue} /></g>
              <g transform="translate(134,129)"><rect width="71" height="196" rx="10" fill={lps.form.green || ORIGINAL_LOGO.green} /></g>
              <g transform="translate(234,75)"><rect width="72" height="250" rx="10" fill={lps.form.teal || ORIGINAL_LOGO.teal} /></g>
              <g transform="translate(169,126)"><path d={buildCheckPath(197, 148)} fill={lps.form.check || ORIGINAL_LOGO.check} /></g>
            </svg>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {LOGO_ELEMENTS.map(function(el) {
            return (
              <div key={el.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded flex-shrink-0" style={{background: lps.form[el.id] || '#000'}} />
                <label htmlFor={"input-" + el.id} className="text-[10px] font-medium min-w-[44px]" style={{color:'var(--text-sub)'}}>{el.label}</label>
                <input type="color" value={lps.form[el.id] || '#000000'} onChange={function(e) { lps.setColor(el.id, e.target.value); }}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0.5 flex-shrink-0" />
                <input id={"input-" + el.id} type="text" value={lps.form[el.id] || ''} onChange={function(e) { lps.setColor(el.id, e.target.value); }}
                  className="flex-1 min-w-0 rounded-lg px-1.5 py-1 text-[10px] font-mono focus:outline-none"
                  style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-3">
        <label htmlFor="logo-json" className="text-[10px] font-medium" style={{color:'var(--text-sub)'}}>JSON</label>
        <textarea id="logo-json" value={lps.jsonInput} onChange={function(e) { lps.applyJson(e.target.value); }}
          rows={2} className="rounded-lg px-2 py-1 text-[10px] font-mono resize-none focus:outline-none"
          style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
      </div>

      <div className="flex gap-2">
        <button onClick={doSave}
          className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl text-white transition hover:opacity-90 min-h-[36px]"
          style={{background: brandColor}}>
        {isGlobal ? 'Salvar logo global' : 'Salvar logo ' + tabLabel}
        </button>
        <button onClick={doReset}
          className="text-xs font-semibold px-3 py-2 rounded-xl transition hover:opacity-80 min-h-[36px]"
          style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
        {isGlobal ? 'Original' : 'Usar global'}
        </button>
      </div>

      {!isGlobal && !lps.hasCustom && (
        <div className="mt-2 rounded-lg p-2 text-[10px]" style={{background:'var(--bg-subtle)', border:'1px solid var(--border)', color:'var(--text-sub)'}}>
          Usando a logo global. Personalize e salve para criar uma versao propria.
        </div>
      )}
    </Card>
  );
}

function buildCheckPath(w, h) {
  const NORM = [
    { x:1.0, y:0.17 }, { x:0.87, y:0 }, { x:0.36, y:0.66 }, { x:0.13, y:0.35 },
    { x:0, y:0.52 }, { x:0.12, y:0.68 }, { x:0.24, y:0.84 }, { x:0.36, y:1.0 },
  ];
  const pts = NORM.map(function(p) { return (p.x * w).toFixed(1) + ' ' + (p.y * h).toFixed(1); });
  return 'M ' + pts[0] + ' L ' + pts[1] + ' L ' + pts[2] + ' L ' + pts[3]
    + ' L ' + pts[3] + ' C ' + pts[5] + ' ' + pts[6] + ' ' + pts[7] + ' Z';
}

export default function BrandStudioView({ brand, planInfo, onSave, toast, onNav }) {
  const bs = useBrandStudio(brand, planInfo, onSave, toast);
  const brandColor = (brand && brand.color) || '#002f59';
  const [section, setSection] = React.useState('logo');

  const applyLogoScheme = async function(dataUrl, colors) {
    try {
      bs.saveToHistory(brand);
      const cfg = (typeof bs.brandConfig === 'object' && bs.brandConfig) ? bs.brandConfig : {};
      const updated = Object.assign({}, brand, {
        logo_url: dataUrl,
        brand_config: JSON.stringify(Object.assign({}, cfg, { logoColors: colors })),
      });
      await onSave(updated);
      if (toast) toast('Logo global atualizada!', 'success');
    } catch (err) {
      if (toast) toast('Erro ao salvar logo: ' + (err.message || 'tente novamente'), 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6" role="main">
      <PageHead icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" title="Brand Studio" sub="Edite a logo global, personalize por plano e gerencie as cores" />

      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color:'var(--text-muted)'}}>Preview do estado atual</p>
        <PreviewGeral brandConfig={bs.brandConfig} brandColor={brandColor} />
        <div className="flex gap-2 mt-2">
          <button onClick={bs.undo} disabled={bs.historyIndex <= 0}
            className="text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-30 transition"
            style={{background:'var(--bg-input)', color:'var(--text-sub)'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h13a4 4 0 010 8H7" /><path d="M7 6l-4 4 4 4" /></svg> Desfazer
          </button>
          <button onClick={bs.redo} disabled={bs.historyIndex >= bs.history.length - 1}
            className="text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-30 transition"
            style={{background:'var(--bg-input)', color:'var(--text-sub)'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H8a4 4 0 000 8h10" /><path d="M17 6l4 4-4 4" /></svg> Refazer
          </button>
        </div>
      </Card>

      <div className="flex border-b gap-1" role="tablist" aria-label="Navegacao principal" style={{borderColor:'var(--border)'}}>
        {NAV_TABS.map(function(s) {
          const active = section === s.key;
          return (
            <button key={s.key} role="tab" id={"tab-" + s.key} aria-selected={active} aria-controls={"panel-" + s.key} onClick={function() { setSection(s.key); }}
              className={'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ' + (active ? '' : 'text-gray-400 border-transparent hover:text-gray-600')}
              style={active ? {borderColor: brandColor, color: brandColor} : {}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
            {s.label}
          </button>
          );
        })}
      </div>

      {section === 'logo' && <div role="tabpanel" id="panel-logo" aria-labelledby="tab-logo"><LogoTabContent brand={brand} bs={bs} brandColor={brandColor} applyLogoScheme={applyLogoScheme} toast={toast} /></div>}

      {section === 'planos' && (
        <div role="tabpanel" id="panel-planos" aria-labelledby="tab-planos">
        <Card className="p-6 flex flex-col gap-4">
          <PlanTabsEditor
            brandConfig={bs.brandConfig}
            onSavePlan={bs.savePlanOverride}
            onCopyJSON={bs.copyCurrentJSON}
            onCopyDocs={bs.copyPrompt}
            brandColor={brandColor}
            toast={toast} />
        </Card>
        </div>
      )}
    </div>
  );
}