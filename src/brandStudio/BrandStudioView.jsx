import React from 'react';
import useBrandStudio from './useBrandStudio.js';
import { PageHead, Card, Spin, Inp } from '../components/ui.jsx';

export default function BrandStudioView({ brand, planInfo, onSave, toast, onNav }) {
  var bs = useBrandStudio(brand, planInfo, onSave, toast);

  var brandColor = (brand && brand.color) || '#002f59';

  var modeTabs = [
    { key: 'basic',    label: 'Basico',   icon: 'M11 5h2m-1-1v2m0 14v-2m0 0h-2m2 0h2m-9.657-2.343l1.414-1.414m0 0a8 8 0 111.414 1.414L4.929 17.07zm13.314-10.142l-1.414 1.414' },
    { key: 'advanced', label: 'Avancado', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
    { key: 'ai',       label: 'IA',       icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        icon="M11 5h2m-1-1v2m0 14v-2m0 0h-2m2 0h2m-9.657-2.343l1.414-1.414m0 0a8 8 0 111.414 1.414L4.929 17.07zm13.314-10.142l-1.414 1.414"
        title="Brand Studio"
        sub="Plataforma de Personalizacao Visual"
      />

      <div className="flex border-b gap-1" style={{borderColor:'var(--border)'}}>
        {modeTabs.map(function(t) {
          var active = bs.mode === t.key;
          return (
            <button key={t.key} onClick={function() { bs.setMode(t.key); }}
              className={'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ' + (active ? '' : 'text-gray-400 border-transparent hover:text-gray-600')}
              style={active ? {borderColor: brandColor, color: brandColor} : {}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={t.icon} />
              </svg>
              {t.label}
            </button>
          );
        })}
        <div className="flex-1" />
        {bs.canUndo && (
          <button onClick={bs.undoLast} disabled={bs.applying}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition hover:opacity-80 disabled:opacity-40"
            style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h13a4 4 0 010 8H7" /><path d="M7 6l-4 4 4 4" /></svg>
            Desfazer
          </button>
        )}
      </div>

      {bs.mode === 'basic' && <BasicMode bs={bs} brand={brand} brandColor={brandColor} onSave={onSave} toast={toast} />}
      {bs.mode === 'advanced' && <AdvancedMode bs={bs} brand={brand} brandColor={brandColor} />}
      {bs.mode === 'ai' && <AIMode bs={bs} brand={brand} brandColor={brandColor} />}

      {bs.historyCount > 0 && (
        <Card className="p-4 flex items-center justify-between">
          <p className="text-xs" style={{color:'var(--text-muted)'}}>{bs.historyCount} configuracao(oes) aplicada(s).</p>
          <button onClick={bs.exportHistory}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
            Exportar historico
          </button>
        </Card>
      )}
    </div>
  );
}

function BasicMode({ bs, brand, brandColor, onSave, toast }) {
  var [form, setForm] = React.useState({
    name: (brand && brand.name) || '',
    color: (brand && brand.color) || '#002f59',
    color_secondary: (brand && brand.color_secondary) || '#e8f0f7',
    color_accent: (brand && brand.color_accent) || '#1a6b5c',
    logo_url: (brand && brand.logo_url) || '',
  });
  var [saving, setSaving] = React.useState(false);

  var setField = function(k, v) { setForm(function(f) { var o = Object.assign({}, f); o[k] = v; return o; }); };

  var save = async function() {
    setSaving(true);
    var nb = Object.assign({}, brand, form);
    await onSave(nb);
    setSaving(false);
    if (toast) toast('Identidade visual basica atualizada', 'success');
  };

  var onLogoFile = function(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 512 * 1024) { if (toast) toast('Imagem muito grande (max. 512KB)', 'error'); return; }
    var reader = new FileReader();
    reader.onload = function() { setField('logo_url', String(reader.result)); };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="p-6 flex flex-col gap-5">
      <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Identidade visual basica</p>
      <p className="text-xs -mt-3" style={{color:'var(--text-muted)'}}>Nome, logo, cores principais e tema.</p>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{background: form.color}}>
          {form.logo_url
            ? <img src={form.logo_url} alt="logo" className="w-full h-full object-cover" />
            : <span className="text-white text-xl font-bold">{form.name ? form.name[0].toUpperCase() : 'F'}</span>}
        </div>
        <label className="text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer text-center min-h-[44px] flex items-center justify-center" style={{background:'var(--brand-soft)', color: brandColor}}>
          Enviar logo
          <input type="file" accept="image/*" onChange={onLogoFile} className="hidden" />
        </label>
        {form.logo_url && (
          <button onClick={function() { setField('logo_url', ''); }} className="text-xs font-medium" style={{color:'var(--text-muted)'}}>Remover</button>
        )}
      </div>

      <Inp label="Nome do app" value={form.name} onChange={function(e) { setField('name', e.target.value); }} placeholder="Ex.: Minha Empresa" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ColorInput label="Primaria" value={form.color} onChange={function(v) { setField('color', v); }} />
        <ColorInput label="Secundaria" value={form.color_secondary} onChange={function(v) { setField('color_secondary', v); }} />
        <ColorInput label="Destaque" value={form.color_accent} onChange={function(v) { setField('color_accent', v); }} />
      </div>

      <button onClick={save} disabled={saving}
        className="w-full text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 min-h-[44px]"
        style={{background: brandColor}}>
        {saving ? <Spin white /> : 'Salvar identidade visual'}
      </button>
    </Card>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{color:'var(--text-sub)'}}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={function(e) { onChange(e.target.value); }}
          className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5" />
        <input type="text" value={value} onChange={function(e) { onChange(e.target.value); }}
          className="flex-1 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
          style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
      </div>
    </div>
  );
}

function AdvancedMode({ bs, brand, brandColor }) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6 flex flex-col gap-4">
        <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Editor avancado</p>
        <p className="text-xs" style={{color:'var(--text-muted)'}}>Controle completo por modulos. Em breve.</p>
        {bs.modules.map(function(mod) {
          return (
            <ModuleCard key={mod.name} mod={mod} brandConfig={bs.brandConfig} />
          );
        })}
      </Card>
    </div>
  );
}

function ModuleCard({ mod, brandConfig }) {
  var config = (brandConfig && brandConfig.modules && brandConfig.modules[mod.name]) || {};
  var hasConfig = Object.keys(config).length > 0;

  return (
    <div className="rounded-xl p-4 flex flex-col gap-2" style={{background:'var(--bg-subtle)', border:'1px solid var(--border)'}}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>{mod.def.description}</p>
        {hasConfig && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">configurado</span>}
      </div>
      {mod.def.semanticMap && Object.keys(mod.def.semanticMap).map(function(sk) {
        return (
          <div key={sk} className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{color:'var(--text-sub)'}}>{sk}:</span>
            <span className="text-xs" style={{color:'var(--text-muted)'}}>{mod.def.semanticMap[sk].join(', ')}</span>
          </div>
        );
      })}
    </div>
  );
}

function AIMode({ bs, brand, brandColor }) {
  var showSuccess = bs.validation && bs.validation.valid;
  var showErrors = bs.validation && !bs.validation.valid;
  var showSummary = bs.summary && bs.summary.executive && bs.summary.executive.length > 0;
  var showPreview = bs.proposedBrand !== null;

  return (
    <Card className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Importar configuracao via IA</p>
          <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>Cole o JSON gerado pela IA ou copie as instrucoes para ela.</p>
        </div>
        <button onClick={bs.copyPrompt}
          className="text-xs font-semibold px-3 py-2 rounded-xl min-h-[44px] transition hover:opacity-80 flex items-center gap-1.5"
          style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          Copiar instrucoes
        </button>
      </div>

      <div className="relative">
        <textarea value={bs.jsonInput}
          onChange={function(e) { bs.parseAndValidate(e.target.value); }}
          placeholder='Cole o JSON aqui...'
          className="w-full rounded-xl px-4 py-3 text-sm font-mono leading-relaxed resize-y focus:outline-none"
          style={{
            minHeight: 160, background: 'var(--bg-input)', color: 'var(--text-main)',
            border: showErrors ? '1px solid #ef4444' : (showSuccess ? '1px solid #16a34a' : '1px solid var(--border)'),
          }}
          spellCheck={false} />
        {bs.jsonInput && (
          <button onClick={bs.clearInput}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs transition hover:opacity-70"
            style={{background:'var(--bg-subtle)', color:'var(--text-muted)'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {bs.adaptedModel && (
        <div className="rounded-xl p-3 text-xs flex items-center gap-2" style={{background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.2)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span style={{color:'#2563eb'}}>JSON adaptado do formato {bs.adaptedModel}. {bs.adapted ? 'Adaptacao automatica aplicada.' : ''}</span>
        </div>
      )}

      {showErrors && (
        <div className="rounded-xl p-4 flex flex-col gap-1.5" style={{background:'#fef2f2', border:'1px solid #fecaca'}}>
          <p className="text-xs font-semibold text-red-700">Erros de validacao:</p>
          {bs.validation.errors.map(function(err, i) {
            return <p key={i} className="text-xs font-mono" style={{color:'#dc2626'}}>{'> '}{err}</p>;
          })}
        </div>
      )}

      {showSummary && (
        <SummaryCard summary={bs.summary} validation={bs.validation} />
      )}

      {showPreview && (
        <div className="flex flex-col gap-4">
          <PreviewChangelist summary={bs.summary} approvedModules={bs.approvedModules} onToggle={bs.toggleModule} />

          <button onClick={bs.applyConfig} disabled={bs.applying}
            className="w-full text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 min-h-[44px] transition"
            style={{background: brandColor}}>
            {bs.applying ? <React.Fragment><Spin white /> Aplicando...</React.Fragment> : 'Aplicar configuracao'}
          </button>
        </div>
      )}
    </Card>
  );
}

function SummaryCard({ summary, validation }) {
  var [level, setLevel] = React.useState('executive');

  var tabs = [
    { key: 'executive', label: 'Resumo' },
    { key: 'technical', label: 'Detalhes' },
    { key: 'diff', label: 'JSON Diff' },
  ];

  return (
    <div className="rounded-xl flex flex-col gap-3" style={{background:'rgba(22,163,74,0.04)', border:'1px solid rgba(22,163,74,0.2)'}}>
      <div className="flex border-b px-3" style={{borderColor:'rgba(22,163,74,0.15)'}}>
        {tabs.map(function(t) {
          var active = level === t.key;
          return (
            <button key={t.key} onClick={function() { setLevel(t.key); }}
              className={'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ' + (active ? '' : 'text-gray-400 border-transparent')}
              style={active ? {borderColor:'#16a34a', color:'#16a34a'} : {}}>
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-4 flex flex-col gap-1">
        {level === 'executive' && summary.executive.map(function(line, i) {
          return <p key={i} className="text-xs" style={{color:'var(--text-main)'}}>{'> '}{line}</p>;
        })}
        {level === 'technical' && summary.technical.map(function(t, i) {
          return (
            <div key={i} className="text-xs flex flex-col gap-0.5 py-1" style={{borderBottom:'1px solid var(--border)'}}>
              <p className="font-semibold" style={{color:'var(--text-main)'}}>{t.module} ({t.status})</p>
              {t.fields && t.fields.map(function(f, fi) {
                return <p key={fi} className="font-mono" style={{color:'var(--text-sub)'}}>{f.field}: {f.from || 'vazio'} → {f.to || 'vazio'}</p>;
              })}
            </div>
          );
        })}
        {level === 'diff' && (
          <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto max-h-48 overflow-y-auto" style={{color:'var(--text-sub)'}}>
            {JSON.stringify(summary.jsonDiff, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function PreviewChangelist({ summary, approvedModules, onToggle }) {
  var modules = summary.technical;
  if (!modules || modules.length === 0) return null;

  var approved = approvedModules || [];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold" style={{color:'var(--text-main)'}}>Aprovacao parcial</p>
      <p className="text-xs" style={{color:'var(--text-muted)'}}>Marque os modulos que deseja aplicar:</p>
      {modules.map(function(mod) {
        var isApproved = approved.indexOf(mod.module) !== -1;
        return (
          <label key={mod.module}
            className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition hover:opacity-80"
            style={{background:'var(--bg-subtle)', border:'1px solid var(--border)'}}>
            <input type="checkbox" checked={isApproved}
              onChange={function() { onToggle(mod.module); }}
              className="w-4 h-4 rounded cursor-pointer accent-current"
              style={{color: 'var(--brand)'}} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>{mod.module}</p>
              <p className="text-xs" style={{color:'var(--text-muted)'}}>{mod.fields ? mod.fields.length + ' campo(s) alterado(s)' : 'Novo modulo'}</p>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{background: isApproved ? 'rgba(22,163,74,0.1)' : 'var(--bg-input)', color: isApproved ? '#16a34a' : 'var(--text-muted)'}}>
              {isApproved ? 'Aprovado' : 'Pendente'}
            </span>
          </label>
        );
      })}
    </div>
  );
}
