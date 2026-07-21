import React from 'react';
import { generateLogoSvg, logoSvgToDataUrl, buildCheckPath } from './logoUtils.js';
import { OFFICIAL_LOGO_COLORS, LOGO_ELEMENTS } from './defaults.js';
import { loadLogoSchemesFromDb, persistLogoScheme, deleteLogoSchemeFromDb, migrateLogoSchemesFromLocalStorage } from './presets.js';

function genId() {
  return `scheme_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default function LogoSchemes({ brandColor, toast, onApply }) {
  const [colors, setColors] = React.useState({ ...OFFICIAL_LOGO_COLORS });
  const [schemeName, setSchemeName] = React.useState('');
  const [schemes, setSchemes] = React.useState([]);
  const [jsonInput, setJsonInput] = React.useState(JSON.stringify(OFFICIAL_LOGO_COLORS, null, 2));

  React.useEffect(() => {
    const loadSchemes = async () => {
      await migrateLogoSchemesFromLocalStorage();
      const loaded = await loadLogoSchemesFromDb();
      setSchemes(loaded);
    };
    loadSchemes();
  }, []);

  const setColor = (id, val) => {
    setColors(prev => ({ ...prev, [id]: val }));
    setJsonInput(prev => {
      try {
        const p = JSON.parse(prev);
        p[id] = val;
        return JSON.stringify(p, null, 2);
      } catch {
        return prev;
      }
    });
  };

  const applyJson = (json) => {
    setJsonInput(json);
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object') {
        const safe = {};
        const allowedKeys = LOGO_ELEMENTS.map(el => el.id);
        allowedKeys.forEach(k => { if (parsed[k] !== undefined) safe[k] = String(parsed[k]).slice(0, 100); });
        setColors(prev => ({ ...prev, ...safe }));
      }
    } catch (_) { void _; }
  };

  const saveScheme = () => {
    const name = schemeName.trim();
    if (!name) {
      if (toast) toast('De um nome para o esquema de cores.', 'warning');
      return;
    }
    const now = Date.now();
    const entry = { id: genId(), name, colors: { ...colors }, createdAt: now };
    const updated = [entry, ...schemes].slice(0, 20);
    setSchemes(updated);
    persistLogoScheme(entry);
    setSchemeName('');
    if (toast) toast(`Esquema "${name}" salvo!`, 'success');
  };

  const restoreScheme = (scheme) => {
    setColors({ ...scheme.colors });
    if (toast) toast(`Esquema "${scheme.name}" carregado.`, 'success');
  };

  const deleteScheme = (id) => {
    const updated = schemes.filter(s => s.id !== id);
    setSchemes(updated);
    deleteLogoSchemeFromDb(id);
  };

  const resetToOriginal = () => {
    setColors({ ...OFFICIAL_LOGO_COLORS });
    if (toast) toast('Cores originais restauradas.', 'success');
  };

  const applyColors = (c) => {
    if (!onApply) return;
    const svg = generateLogoSvg(c);
    const dataUrl = logoSvgToDataUrl(svg);
    onApply(dataUrl, c);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="flex-shrink-0">
          <div className="rounded-2xl overflow-hidden bg-white" style={{width:280, height:280}}>
            <svg width="280" height="280" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Preview da logo">
              <rect width="400" height="400" fill="transparent"/>
              <g transform="translate(34,200)">
                <rect width="71" height="125" rx="10" fill={colors.blue} />
              </g>
              <g transform="translate(134,129)">
                <rect width="71" height="196" rx="10" fill={colors.green} />
              </g>
              <g transform="translate(234,75)">
                <rect width="72" height="250" rx="10" fill={colors.teal} />
              </g>
              <g transform="translate(169,126)">
                <path d={buildCheckPath(197, 148)} fill={colors.check} />
              </g>
            </svg>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <p className="text-sm font-semibold" style={{color:'var(--text-main, #0f172a)'}}>Cores da logo</p>
          <p className="text-xs" style={{color:'var(--text-muted, #94a3b8)'}}>Edite a cor de cada elemento da logo. As alteracoes aparecem em tempo real.</p>

          {LOGO_ELEMENTS.map(el => (
            <div key={el.id} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded flex-shrink-0" style={{background: colors[el.id]}} />
              <label htmlFor={`logo-color-${el.id}`} className="text-xs font-medium min-w-[64px]" style={{color:'var(--text-sub, #475569)'}}>{el.label}</label>
              <input type="color" id={`logo-color-${el.id}`} value={colors[el.id]} onChange={e => setColor(el.id, e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5 flex-shrink-0" aria-label={el.label} />
              <input type="text" value={colors[el.id]} onChange={e => setColor(el.id, e.target.value)}
                className="flex-1 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none"
                style={{background:'var(--bg-input, #f1f5f9)', color:'var(--text-main, #0f172a)', border:'1px solid var(--border, #e2e8f0)'}} />
            </div>
          ))}

          <div className="flex flex-col gap-2 mb-2">
            <label htmlFor="logo-json-input" className="text-xs font-medium" style={{color:'var(--text-sub, #475569)'}}>JSON</label>
            <textarea id="logo-json-input" value={jsonInput} onChange={e => applyJson(e.target.value)}
              rows={3} className="rounded-xl px-3 py-2 text-[11px] font-mono resize-none focus:outline-none"
              style={{background:'var(--bg-input, #f1f5f9)', color:'var(--text-main, #0f172a)', border:'1px solid var(--border, #e2e8f0)'}} />
          </div>

          <div className="flex gap-2 mt-1">
            <button onClick={() => applyColors(colors)}
              className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl text-white transition hover:opacity-90 min-h-[44px]"
              style={{background: brandColor}}>
              Salvar logo global
            </button>
            <button onClick={resetToOriginal}
              className="text-xs font-medium px-3 py-2 rounded-xl transition hover:opacity-80"
              style={{background:'var(--bg-subtle, #f1f5f9)', color:'var(--text-sub, #475569)', border:'1px solid var(--border, #e2e8f0)'}}>
              Original
            </button>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 flex items-end gap-3" style={{borderColor:'var(--border, #e2e8f0)'}}>
        <div className="flex-1 flex flex-col gap-1">
          <label htmlFor="scheme-name" className="text-xs font-medium" style={{color:'var(--text-sub, #475569)'}}>Nome do esquema</label>
          <input id="scheme-name" value={schemeName} onChange={e => setSchemeName(e.target.value)}
            placeholder="Ex.: Natal, Escuro, Corporativo..."
            className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{background:'var(--bg-input, #f1f5f9)', color:'var(--text-main, #0f172a)', border:'1px solid var(--border, #e2e8f0)'}} />
        </div>
        <button onClick={saveScheme}
          className="text-xs font-semibold px-5 py-2.5 rounded-xl text-white transition hover:opacity-90 min-h-[44px] whitespace-nowrap"
          style={{background: brandColor}}>
          Salvar esquema
        </button>
      </div>

      <div className="border-t pt-4" style={{borderColor:'var(--border, #e2e8f0)'}}>
        <p className="text-xs font-semibold mb-3" style={{color:'var(--text-muted, #94a3b8)'}}>Historico de esquemas</p>
        {schemes.length === 0 && (
          <p className="text-xs text-center py-6" style={{color:'var(--text-muted, #94a3b8)'}}>Nenhum esquema salvo ainda.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-xl p-3 flex items-center gap-3 cursor-pointer transition hover:opacity-80"
            style={{background:'var(--bg-subtle, #f1f5f9)', border:`2px solid ${brandColor}`}}
            onClick={() => { resetToOriginal(); applyColors(OFFICIAL_LOGO_COLORS); }}>
            <svg width="48" height="48" viewBox="0 0 400 400" className="flex-shrink-0 rounded-lg overflow-hidden bg-white">
              <g transform="translate(34,200)"><rect width="71" height="125" rx="10" fill={OFFICIAL_LOGO_COLORS.blue} /></g>
              <g transform="translate(134,129)"><rect width="71" height="196" rx="10" fill={OFFICIAL_LOGO_COLORS.green} /></g>
              <g transform="translate(234,75)"><rect width="72" height="250" rx="10" fill={OFFICIAL_LOGO_COLORS.teal} /></g>
              <g transform="translate(169,126)"><path d={buildCheckPath(197, 148)} fill={OFFICIAL_LOGO_COLORS.check} /></g>
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{color:'var(--text-main, #0f172a)'}}>Original</p>
              <p className="text-[10px]" style={{color:'var(--text-muted, #94a3b8)'}}>Cores padrao — aplicado</p>
            </div>
          </div>

          {schemes.map(s => {
            const isActive = s.colors.blue === colors.blue && s.colors.green === colors.green
              && s.colors.teal === colors.teal && s.colors.check === colors.check;
            return (
              <div key={s.id} className={`rounded-xl p-3 flex items-center gap-3 transition hover:opacity-80 ${isActive ? 'ring-2' : ''}`}
                style={{background:'var(--bg-subtle, #f1f5f9)', border:'1px solid var(--border, #e2e8f0)', '--tw-ring-color': brandColor}}
                onClick={() => restoreScheme(s)}>
                <svg width="48" height="48" viewBox="0 0 400 400" className="flex-shrink-0 rounded-lg overflow-hidden bg-white">
                  <g transform="translate(34,200)"><rect width="71" height="125" rx="10" fill={s.colors.blue || OFFICIAL_LOGO_COLORS.blue} /></g>
                  <g transform="translate(134,129)"><rect width="71" height="196" rx="10" fill={s.colors.green || OFFICIAL_LOGO_COLORS.green} /></g>
                  <g transform="translate(234,75)"><rect width="72" height="250" rx="10" fill={s.colors.teal || OFFICIAL_LOGO_COLORS.teal} /></g>
                  <g transform="translate(169,126)"><path d={buildCheckPath(197, 148)} fill={s.colors.check || OFFICIAL_LOGO_COLORS.check} /></g>
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{color:'var(--text-main, #0f172a)'}}>{s.name}</p>
                  <p className="text-[10px]" style={{color:'var(--text-muted, #94a3b8)'}}>{new Date(s.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
<div className="flex gap-1 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); applyColors(s.colors); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs hover:opacity-70"
                    style={{background:'var(--brand-soft, #ccfbf1)', color: brandColor}}
                    aria-label={`Aplicar esquema ${s.name}`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteScheme(s.id); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs hover:opacity-70"
                    style={{color:'#ef4444', background:'rgba(239,68,68,0.08)'}}
                    aria-label={`Excluir esquema ${s.name}`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}