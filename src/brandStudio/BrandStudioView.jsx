import React from 'react';
import useBrandStudio from './useBrandStudio.js';
import { PageHead, Card } from '../components/ui.jsx';
import LogoSchemes, { generateLogoSvg, logoSvgToDataUrl } from './LogoSchemes.jsx';
import PlanTabsEditor from './PlanTabsEditor.jsx';
import PreviewGeral from './PreviewGeral.jsx';

var NAV = [
  { key: 'logo', label: 'Logo', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'planos', label: 'Planos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
];

export default function BrandStudioView({ brand, planInfo, onSave, toast, onNav }) {
  var bs = useBrandStudio(brand, planInfo, onSave, toast);
  var brandColor = (brand && brand.color) || '#002f59';
  var [section, setSection] = React.useState('logo');

  var applyLogoScheme = async function(dataUrl, colors) {
    try {
      bs.saveToHistory(brand);
      var cfg = (typeof bs.brandConfig === 'object' && bs.brandConfig) ? bs.brandConfig : {};
      var updated = Object.assign({}, brand, {
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
    <div className="flex flex-col gap-6">
      <PageHead icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" title="Brand Studio" sub="Edite a logo, cores dos planos e use IA" />

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

      <div className="flex border-b gap-1" style={{borderColor:'var(--border)'}}>
        {NAV.map(function(s) {
          var active = section === s.key;
          return (
            <button key={s.key} onClick={function() { setSection(s.key); }}
              className={'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ' + (active ? '' : 'text-gray-400 border-transparent hover:text-gray-600')}
              style={active ? {borderColor: brandColor, color: brandColor} : {}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
              {s.label}
            </button>
          );
        })}
      </div>

      {section === 'logo' && <LogoTabContent brand={brand} bs={bs} brandColor={brandColor} applyLogoScheme={applyLogoScheme} toast={toast} />}

      {section === 'planos' && (
        <Card className="p-6 flex flex-col gap-4">
          <PlanTabsEditor
            brandConfig={bs.brandConfig}
            onSavePlan={bs.savePlanOverride}
            onCopyJSON={bs.copyCurrentJSON}
            onCopyDocs={bs.copyPrompt}
            brandColor={brandColor}
            toast={toast} />
        </Card>
      )}
    </div>
  );
}

var PLAN_LOGO_META = {
  free: { label: 'Free' },
  pro: { label: 'Pro' },
  premium: { label: 'Premium' },
};

var LOGO_ELEMENTS = [
  { id: 'blue', label: 'Coluna 1' },
  { id: 'green', label: 'Coluna 2' },
  { id: 'teal', label: 'Coluna 3' },
  { id: 'check', label: 'Check' },
];

var ORIGINAL_LOGO = {
  blue: '#002f59', green: '#1a6b5c', teal: '#6ec6c8', check: '#8cf2d1',
};

function buildCheckPath(w, h) {
  var NORM = [
    { x:1.0, y:0.17 }, { x:0.87, y:0 }, { x:0.36, y:0.66 }, { x:0.13, y:0.35 },
    { x:0, y:0.52 }, { x:0.12, y:0.68 }, { x:0.24, y:0.84 }, { x:0.36, y:1.0 },
  ];
  var pts = NORM.map(function(p) { return (p.x * w).toFixed(1) + ' ' + (p.y * h).toFixed(1); });
  return 'M ' + pts[0] + ' L ' + pts[1] + ' L ' + pts[2] + ' L ' + pts[3]
    + ' L ' + pts[4] + ' C ' + pts[5] + ' ' + pts[6] + ' ' + pts[7] + ' Z';
}

function usePlanLogoSync(activePlan, brandConfig, brandColor) {
  var planOverrides = (brandConfig && brandConfig.planOverrides) || {};
  var globalColors = (brandConfig && brandConfig.logoColors) || ORIGINAL_LOGO;
  var overrideColors = planOverrides[activePlan] && planOverrides[activePlan].logoColors;
  var hasCustom = !!overrideColors;

  var [form, setForm] = React.useState(function() {
    return Object.assign({}, overrideColors || globalColors);
  });
  var [jsonInput, setJsonInput] = React.useState(JSON.stringify(overrideColors || globalColors, null, 2));

  React.useEffect(function() {
    var src = overrideColors || globalColors;
    setForm(Object.assign({}, src));
    setJsonInput(JSON.stringify(src, null, 2));
  }, [activePlan, hasCustom]);

  var setColor = function(id, val) {
    setForm(function(prev) { var o = Object.assign({}, prev); o[id] = val; return o; });
    setJsonInput(function(prev) {
      try { var p = JSON.parse(prev); p[id] = val; return JSON.stringify(p, null, 2); } catch (_) { return prev; }
    });
  };

  var applyJson = function(json) {
    setJsonInput(json);
    try {
      var parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object') {
        setForm(Object.assign({}, form, parsed));
      }
    } catch (_) { void _; }
  };

  return { form: form, hasCustom: hasCustom, jsonInput: jsonInput, setColor: setColor, applyJson: applyJson, setJsonInput: setJsonInput };
}

function LogoTabContent({ brand, bs, brandColor, applyLogoScheme, toast }) {
  var [activePlan, setActivePlan] = React.useState('free');
  var lps = usePlanLogoSync(activePlan, bs.brandConfig, brandColor);

  var doSavePlanLogo = async function() {
    await bs.savePlanLogo(activePlan, lps.form);
  };

  var doUseGlobal = async function() {
    await bs.savePlanLogo(activePlan, null);
  };

  return (
    <>
      <Card className="p-6">
        <LogoSchemes brandColor={brandColor} toast={toast} onApply={applyLogoScheme} />
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold mb-4" style={{color:'var(--text-main)'}}>Logo por plano</p>
        <p className="text-xs mb-3" style={{color:'var(--text-muted)'}}>Personalize a logo para cada plano. Por padrao, cada plano usa a logo global.</p>

        <div className="flex border-b gap-1 mb-4" style={{borderColor:'var(--border)'}}>
          {Object.keys(PLAN_LOGO_META).map(function(k) {
            var active = activePlan === k;
            return (
              <button key={k} onClick={function() { setActivePlan(k); }}
                className={'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ' + (active ? '' : 'text-gray-400 border-transparent hover:text-gray-600')}
                style={active ? {borderColor: brandColor, color: brandColor} : {}}>
                {PLAN_LOGO_META[k].label}
              </button>
            );
          })}
        </div>

        {!lps.hasCustom && (
          <div className="rounded-xl p-3 mb-4 text-xs" style={{background:'var(--bg-subtle)', border:'1px solid var(--border)', color:'var(--text-sub)'}}>
            Usando a logo global. Personalize abaixo e salve para criar uma versao exclusiva para este plano.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-5 mb-4">
          <div className="flex-shrink-0">
            <div className="rounded-2xl overflow-hidden bg-white" style={{width:140, height:140}}>
              <svg width="140" height="140" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="400" fill="transparent" />
                <g transform="translate(34,200)"><rect width="71" height="125" rx="10" fill={lps.form.blue || ORIGINAL_LOGO.blue} /></g>
                <g transform="translate(134,129)"><rect width="71" height="196" rx="10" fill={lps.form.green || ORIGINAL_LOGO.green} /></g>
                <g transform="translate(234,75)"><rect width="72" height="250" rx="10" fill={lps.form.teal || ORIGINAL_LOGO.teal} /></g>
                <g transform="translate(169,126)"><path d={buildCheckPath(197, 148)} fill={lps.form.check || ORIGINAL_LOGO.check} /></g>
              </svg>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <p className="text-xs font-semibold" style={{color:'var(--text-main)'}}>Cores da logo — {PLAN_LOGO_META[activePlan].label}</p>
            {LOGO_ELEMENTS.map(function(el) {
              return (
                <div key={el.id} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded flex-shrink-0" style={{background: lps.form[el.id] || '#000'}} />
                  <span className="text-[11px] font-medium min-w-[56px]" style={{color:'var(--text-sub)'}}>{el.label}</span>
                  <input type="color" value={lps.form[el.id] || '#000000'} onChange={function(e) { lps.setColor(el.id, e.target.value); }}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5 flex-shrink-0" />
                  <input type="text" value={lps.form[el.id] || ''} onChange={function(e) { lps.setColor(el.id, e.target.value); }}
                    className="flex-1 rounded-xl px-2 py-1.5 text-[11px] font-mono focus:outline-none"
                    style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <label className="text-xs font-medium" style={{color:'var(--text-sub)'}}>JSON</label>
          <textarea value={lps.jsonInput} onChange={function(e) { lps.applyJson(e.target.value); }}
            rows={3} className="rounded-xl px-3 py-2 text-[11px] font-mono resize-none focus:outline-none"
            style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
        </div>

        <div className="flex gap-2">
          <button onClick={doSavePlanLogo}
            className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl text-white transition hover:opacity-90 min-h-[44px]"
            style={{background: brandColor}}>
            Salvar logo do plano {PLAN_LOGO_META[activePlan].label}
          </button>
          <button onClick={doUseGlobal}
            className="text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:opacity-80 min-h-[44px]"
            style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
            Usar logo global
          </button>
        </div>
      </Card>
    </>
  );
}
