import React from 'react';
import useBrandStudio from './useBrandStudio.js';
import { PageHead, Card, Spin } from '../components/ui.jsx';

export default function BrandStudioView({ brand, planInfo, onSave, toast, onNav }) {
  var {
    jsonInput, validation, preview, applying, canUndo, historyCount,
    parseAndValidate, applyConfig, undoLast, clearInput,
  } = useBrandStudio(brand, planInfo, onSave);

  var brandColor = (brand && brand.color) || '#002f59';

  var showSuccess = validation && validation.valid;
  var showErrors = validation && !validation.valid;
  var hasPreview = preview !== null;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        icon="M11 5h2m-1-1v2m0 14v-2m0 0h-2m2 0h2m-9.657-2.343l1.414-1.414m0 0a8 8 0 111.414 1.414L4.929 17.07zm13.314-10.142l-1.414 1.414"
        title="Brand Studio"
        sub="Importe configuracoes visuais via JSON padrao"
      />

      <Card className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Importar JSON</p>
            <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>
              Cole abaixo a configuracao gerada por uma IA. O JSON deve seguir o schema publico.
            </p>
          </div>
          {canUndo && (
            <button onClick={undoLast} disabled={applying}
              className="text-xs font-semibold px-3 py-2 rounded-xl min-h-[44px] transition hover:opacity-80 disabled:opacity-40 flex items-center gap-1.5"
              style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10h13a4 4 0 010 8H7" />
                <path d="M7 6l-4 4 4 4" />
              </svg>
              Desfazer
            </button>
          )}
        </div>

        <div className="relative">
          <textarea
            value={jsonInput}
            onChange={function(e) { parseAndValidate(e.target.value); }}
            placeholder='Cole o JSON aqui...'
            className="w-full rounded-xl px-4 py-3 text-sm font-mono leading-relaxed resize-y focus:outline-none"
            style={{
              minHeight: 160,
              background: 'var(--bg-input)',
              color: 'var(--text-main)',
              border: showErrors ? '1px solid #ef4444' : (showSuccess ? '1px solid #16a34a' : '1px solid var(--border)'),
            }}
            spellCheck={false}
          />
          {jsonInput && (
            <button onClick={clearInput}
              className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs transition hover:opacity-70"
              style={{background:'var(--bg-subtle)', color:'var(--text-muted)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {showErrors && (
          <div className="rounded-xl p-4 flex flex-col gap-1.5" style={{background:'#fef2f2', border:'1px solid #fecaca'}}>
            <p className="text-xs font-semibold text-red-700">Erros de validacao:</p>
            {validation.errors.map(function(err, i) {
              return (
                <p key={i} className="text-xs font-mono" style={{color:'#dc2626'}}>
                  {'> '}{err}
                </p>
              );
            })}
          </div>
        )}

        {showSuccess && (
          <div className="rounded-xl p-3 text-xs font-medium" style={{background:'rgba(22,163,74,0.08)', border:'1px solid rgba(22,163,74,0.25)', color:'#16a34a'}}>
            JSON valido — schema v{preview.schemaVersion}
          </div>
        )}

        {hasPreview && (
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold" style={{color:'var(--text-main)'}}>Preview das alteracoes</p>

            <PreviewSection preview={preview} currentBrand={brand} />
            <PreviewColors palette={preview.palette} theme={preview.theme} />
            <PreviewMeta preview={preview} />

            <button onClick={applyConfig} disabled={applying}
              className="w-full text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 min-h-[44px] transition"
              style={{background: brandColor}}>
              {applying ? (
                <React.Fragment><Spin white /> Aplicando...</React.Fragment>
              ) : (
                'Aplicar configuracao'
              )}
            </button>
          </div>
        )}
      </Card>

      {historyCount > 0 && (
        <Card className="p-5 flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Historico</p>
          <p className="text-xs" style={{color:'var(--text-muted)'}}>
            {historyCount} configuracao(oes) aplicada(s) nesta sessao.
          </p>
        </Card>
      )}

      <Card className="p-5 flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sobre o Brand Studio</p>
        <p className="text-xs leading-relaxed" style={{color:'var(--text-sub)'}}>
          O Brand Studio aceita configuracoes visuais no formato JSON definido pelo schema publico.
          Qualquer IA que conheca o schema pode gerar uma identidade visual completa para o seu app.
          Consulte a documentacao em <code className="font-mono text-xs bg-gray-100 px-1 rounded">docs/AI_BRAND_SCHEMA.md</code> para mais detalhes.
        </p>
        <a href="/docs/AI_BRAND_SCHEMA.md" target="_blank" rel="noreferrer"
          className="text-xs font-semibold py-2.5 rounded-xl min-h-[44px] flex items-center justify-center gap-2 transition hover:opacity-80 mt-1"
          style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
          Ver schema completo
        </a>
      </Card>
    </div>
  );
}

function PreviewSection({ preview, currentBrand }) {
  var nameChanged = preview.brandName && preview.brandName !== currentBrand.name;
  var themeChanged = preview.theme && preview.theme.mode && preview.theme.mode !== currentBrand.theme;
  var primaryChanged = preview.palette.primary !== currentBrand.color;
  var hasChanges = nameChanged || themeChanged || primaryChanged;

  var changes = [];
  if (nameChanged) changes.push('Nome: ' + currentBrand.name + ' -> ' + preview.brandName);
  if (themeChanged) changes.push('Tema: ' + (currentBrand.theme || 'light') + ' -> ' + preview.theme.mode);
  if (primaryChanged) changes.push('Cor primaria: ' + currentBrand.color + ' -> ' + preview.palette.primary);
  if (preview.typography) changes.push('Tipografia: personalizada');
  if (preview.sidebar) changes.push('Sidebar: personalizada');
  if (preview.borderRadius) changes.push('Bordas: personalizadas');

  if (!hasChanges && !preview.typography && !preview.sidebar && !preview.borderRadius) {
    return (
      <p className="text-xs" style={{color:'var(--text-muted)'}}>Nenhuma alteracao detectada em relacao a configuracao atual.</p>
    );
  }

  return (
    <div className="rounded-xl p-3 flex flex-col gap-1" style={{background:'var(--bg-subtle)', border:'1px solid var(--border)'}}>
      {changes.map(function(c, i) {
        return (
          <div key={i} className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span className="text-xs" style={{color:'var(--text-main)'}}>{c}</span>
          </div>
        );
      })}
    </div>
  );
}

function PreviewColors({ palette, theme }) {
  var swatches = [
    { label: 'Primaria',     color: palette.primary },
    { label: 'Secundaria',   color: palette.secondary },
    { label: 'Acento',       color: palette.accent },
    { label: 'Fundo pagina', color: palette.bgPage },
    { label: 'Fundo card',   color: palette.bgCard },
    { label: 'Texto',        color: palette.textMain },
    { label: 'Texto 2',      color: palette.textSub },
    { label: 'Borda',        color: palette.border },
  ];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium" style={{color:'var(--text-sub)'}}>
        Cores {theme && theme.mode === 'dark' ? '(dark)' : '(light)'}
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
        {swatches.map(function(s) {
          return (
            <div key={s.label} className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{background: s.color, border:'1px solid rgba(0,0,0,0.06)'}} />
              <span className="text-[10px] font-medium truncate w-full text-center" style={{color:'var(--text-muted)'}}>{s.label}</span>
              <span className="text-[9px] font-mono truncate w-full text-center" style={{color:'var(--text-muted)'}}>{s.color}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewMeta({ preview }) {
  var groups = [];
  if (preview.typography) groups.push('tipografia');
  if (preview.sidebar) groups.push('sidebar');
  if (preview.header) groups.push('header');
  if (preview.cards) groups.push('cartoes');
  if (preview.buttons) groups.push('botoes');
  if (preview.inputs) groups.push('inputs');
  if (preview.borderRadius) groups.push('bordas');
  if (preview.shadows) groups.push('sombras');
  if (preview.spacing) groups.push('espacamento');
  if (preview.animations) groups.push('animacoes');
  if (preview.logo) groups.push('logo');

  if (groups.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {groups.map(function(g) {
        return (
          <span key={g}
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{background:'var(--brand-soft)', color:'var(--brand)'}}>
            {g}
          </span>
        );
      })}
    </div>
  );
}
