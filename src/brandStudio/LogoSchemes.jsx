import React from 'react';

var ORIGINAL = {
  blue: '#002f59', green: '#1a6b5c', teal: '#6ec6c8', check: '#8cf2d1',
};

var ELEMENTS_CONFIG = [
  { id: 'blue',  label: 'Coluna 1',  x:34, y:200, w:71,  h:125, rx:10 },
  { id: 'green', label: 'Coluna 2',  x:134, y:129, w:71,  h:196, rx:10 },
  { id: 'teal',  label: 'Coluna 3',  x:234, y:75,  w:72,  h:250, rx:10 },
  { id: 'check', label: 'Check',      x:169, y:126, w:197, h:148, rx:0 },
];

var CHECK_NORM = [
  { x:1.0, y:0.17 }, { x:0.87, y:0 }, { x:0.36, y:0.66 }, { x:0.13, y:0.35 },
  { x:0, y:0.52 }, { x:0.12, y:0.68 }, { x:0.24, y:0.84 }, { x:0.36, y:1.0 },
];

function buildCheckPath(w, h) {
  var pts = CHECK_NORM.map(function(p) { return (p.x * w).toFixed(1) + ' ' + (p.y * h).toFixed(1); });
  return 'M ' + pts[0] + ' L ' + pts[1] + ' L ' + pts[2] + ' L ' + pts[3]
    + ' L ' + pts[4] + ' C ' + pts[5] + ' ' + pts[6] + ' ' + pts[7] + ' Z';
}

export function generateLogoSvg(colors) {
  var c = colors || ORIGINAL;
  return '<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">'
    + '<rect width="400" height="400" fill="transparent"/>'
    + '<g transform="translate(34,200)"><rect width="71" height="125" rx="10" fill="' + (c.blue || ORIGINAL.blue) + '"/></g>'
    + '<g transform="translate(134,129)"><rect width="71" height="196" rx="10" fill="' + (c.green || ORIGINAL.green) + '"/></g>'
    + '<g transform="translate(234,75)"><rect width="72" height="250" rx="10" fill="' + (c.teal || ORIGINAL.teal) + '"/></g>'
    + '<g transform="translate(169,126)"><path d="' + buildCheckPath(197, 148) + '" fill="' + (c.check || ORIGINAL.check) + '"/></g>'
    + '</svg>';
}

export function logoSvgToDataUrl(svgMarkup) {
  return 'data:image/svg+xml,' + encodeURIComponent(svgMarkup);
}

function loadSchemes() {
  try {
    var raw = localStorage.getItem('financia_logo_schemes');
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

function saveSchemes(schemes) {
  try { localStorage.setItem('financia_logo_schemes', JSON.stringify(schemes)); } catch (_) { void _; }
}

export default function LogoSchemes({ brandColor, toast, onApply }) {
  var [colors, setColors] = React.useState(Object.assign({}, ORIGINAL));
  var [schemeName, setSchemeName] = React.useState('');
  var [schemes, setSchemes] = React.useState(loadSchemes);

  var setColor = function(id, val) {
    setColors(function(prev) { var o = Object.assign({}, prev); o[id] = val; return o; });
  };

  var saveScheme = function() {
    var name = schemeName.trim();
    if (!name) { if (toast) toast('De um nome para o esquema de cores.', 'warning'); return; }
    var now = Date.now();
    var entry = { id: 'scheme_' + now, name: name, colors: Object.assign({}, colors), createdAt: now };
    var updated = [entry].concat(schemes);
    if (updated.length > 20) updated = updated.slice(0, 20);
    setSchemes(updated);
    saveSchemes(updated);
    setSchemeName('');
    if (toast) toast('Esquema "' + name + '" salvo!', 'success');
  };

  var restoreScheme = function(scheme) {
    setColors(Object.assign({}, scheme.colors));
    if (toast) toast('Esquema "' + scheme.name + '" carregado.', 'success');
  };

  var deleteScheme = function(id) {
    var updated = schemes.filter(function(s) { return s.id !== id; });
    setSchemes(updated);
    saveSchemes(updated);
  };

  var resetToOriginal = function() {
    setColors(Object.assign({}, ORIGINAL));
    if (toast) toast('Cores originais restauradas.', 'success');
  };

  var applyColors = function(c) {
    if (!onApply) return;
    var svg = generateLogoSvg(c);
    var dataUrl = logoSvgToDataUrl(svg);
    onApply(dataUrl, c);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="flex-shrink-0">
          <div className="rounded-2xl overflow-hidden bg-white" style={{width:280, height:280}}>
            <svg width="280" height="280" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
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
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Cores da logo</p>
          <p className="text-xs" style={{color:'var(--text-muted)'}}>Edite a cor de cada elemento da logo. As alteracoes aparecem em tempo real.</p>

          {ELEMENTS_CONFIG.map(function(el) {
            return (
              <div key={el.id} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded flex-shrink-0" style={{background: colors[el.id]}} />
                <span className="text-xs font-medium min-w-[64px]" style={{color:'var(--text-sub)'}}>{el.label}</span>
                <input type="color" value={colors[el.id]} onChange={function(e) { setColor(el.id, e.target.value); }}
                  className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5 flex-shrink-0" />
                <input type="text" value={colors[el.id]} onChange={function(e) { setColor(el.id, e.target.value); }}
                  className="flex-1 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none"
                  style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
              </div>
            );
          })}

          <div className="flex gap-2 mt-1">
            <button onClick={function() { applyColors(colors); }}
              className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl text-white transition hover:opacity-90 min-h-[44px]"
              style={{background: brandColor}}>
              Salvar logo global
            </button>
            <button onClick={resetToOriginal}
              className="text-xs font-medium px-3 py-2 rounded-xl transition hover:opacity-80"
              style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
              Original
            </button>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 flex items-end gap-3" style={{borderColor:'var(--border)'}}>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs font-medium" style={{color:'var(--text-sub)'}}>Nome do esquema</label>
          <input value={schemeName} onChange={function(e) { setSchemeName(e.target.value); }}
            placeholder="Ex.: Natal, Escuro, Corporativo..."
            className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
        </div>
        <button onClick={saveScheme}
          className="text-xs font-semibold px-5 py-2.5 rounded-xl text-white transition hover:opacity-90 min-h-[44px] whitespace-nowrap"
          style={{background: brandColor}}>
          Salvar esquema
        </button>
      </div>

      <div className="border-t pt-4" style={{borderColor:'var(--border)'}}>
        <p className="text-xs font-semibold mb-3" style={{color:'var(--text-muted)'}}>Historico de esquemas</p>
        {schemes.length === 0 && (
          <p className="text-xs text-center py-6" style={{color:'var(--text-muted)'}}>Nenhum esquema salvo ainda.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-xl p-3 flex items-center gap-3 cursor-pointer transition hover:opacity-80"
            style={{background:'var(--bg-subtle)', border:'2px solid ' + brandColor}}
            onClick={function() { resetToOriginal(); applyColors(ORIGINAL); }}>
            <svg width="48" height="48" viewBox="0 0 400 400" className="flex-shrink-0 rounded-lg overflow-hidden bg-white">
              <g transform="translate(34,200)"><rect width="71" height="125" rx="10" fill={ORIGINAL.blue} /></g>
              <g transform="translate(134,129)"><rect width="71" height="196" rx="10" fill={ORIGINAL.green} /></g>
              <g transform="translate(234,75)"><rect width="72" height="250" rx="10" fill={ORIGINAL.teal} /></g>
              <g transform="translate(169,126)"><path d={buildCheckPath(197, 148)} fill={ORIGINAL.check} /></g>
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{color:'var(--text-main)'}}>Original</p>
              <p className="text-[10px]" style={{color:'var(--text-muted)'}}>Cores padrao — aplicado</p>
            </div>
          </div>

          {schemes.map(function(s) {
            var isActive = s.colors.blue === colors.blue && s.colors.green === colors.green
              && s.colors.teal === colors.teal && s.colors.check === colors.check;
            return (
              <div key={s.id} className={'rounded-xl p-3 flex items-center gap-3 transition hover:opacity-80 ' + (isActive ? 'ring-2' : '')}
                style={{background:'var(--bg-subtle)', border:'1px solid var(--border)', '--tw-ring-color': brandColor}}
                onClick={function() { restoreScheme(s); }}>
                <svg width="48" height="48" viewBox="0 0 400 400" className="flex-shrink-0 rounded-lg overflow-hidden bg-white">
                  <g transform="translate(34,200)"><rect width="71" height="125" rx="10" fill={s.colors.blue || ORIGINAL.blue} /></g>
                  <g transform="translate(134,129)"><rect width="71" height="196" rx="10" fill={s.colors.green || ORIGINAL.green} /></g>
                  <g transform="translate(234,75)"><rect width="72" height="250" rx="10" fill={s.colors.teal || ORIGINAL.teal} /></g>
                  <g transform="translate(169,126)"><path d={buildCheckPath(197, 148)} fill={s.colors.check || ORIGINAL.check} /></g>
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{color:'var(--text-main)'}}>{s.name}</p>
                  <p className="text-[10px]" style={{color:'var(--text-muted)'}}>{new Date(s.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={function(e) { e.stopPropagation(); applyColors(s.colors); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs hover:opacity-70"
                    style={{background:'var(--brand-soft)', color: brandColor}} title="Aplicar">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                  </button>
                  <button onClick={function(e) { e.stopPropagation(); deleteScheme(s.id); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs hover:opacity-70"
                    style={{color:'#ef4444', background:'rgba(239,68,68,0.08)'}} title="Excluir">
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
