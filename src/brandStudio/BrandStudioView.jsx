import React from 'react';
import useBrandStudio from './useBrandStudio.js';
import ModuleEditor from './ModuleEditor.jsx';
import { PageHead, Card, Spin, Inp, Modal } from '../components/ui.jsx';

export default function BrandStudioView({ brand, planInfo, onSave, toast, onNav }) {
  var bs = useBrandStudio(brand, planInfo, onSave, toast);
  var brandColor = (brand && brand.color) || '#002f59';

  var [section, setSection] = React.useState('configure');
  var [savePresetOpen, setSavePresetOpen] = React.useState(false);
  var [importPresetOpen, setImportPresetOpen] = React.useState(false);
  var [eventFormOpen, setEventFormOpen] = React.useState(false);

  var sections = [
    { key: 'configure', label: 'Personalizar', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4' },
    { key: 'presets', label: 'Presets', icon: 'M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7h16' },
    { key: 'events', label: 'Eventos', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHead icon="M11 5h2m-1-1v2m0 14v-2m0 0h-2m2 0h2m-9.657-2.343l1.414-1.414m0 0a8 8 0 111.414 1.414L4.929 17.07zm13.314-10.142l-1.414 1.414" title="Brand Studio" sub="Plataforma de Personalizacao Visual" />

      <div className="flex border-b gap-1 flex-wrap" style={{borderColor:'var(--border)'}}>
        {sections.map(function(s) {
          var active = section === s.key;
          return (
            <button key={s.key} onClick={function() { setSection(s.key); }}
              className={'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ' + (active ? '' : 'text-gray-400 border-transparent hover:text-gray-600')}
              style={active ? {borderColor: brandColor, color: brandColor} : {}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
              {s.label}
            </button>
          );
        })}
        <div className="flex-1 min-w-[8px]" />
        {bs.canUndo && (
          <button onClick={bs.undoLast} disabled={bs.applying}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition hover:opacity-80 disabled:opacity-40"
            style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h13a4 4 0 010 8H7" /><path d="M7 6l-4 4 4 4" /></svg>
            Desfazer
          </button>
        )}
      </div>

      {section === 'configure' && <ConfigureSection bs={bs} brand={brand} brandColor={brandColor} onSave={onSave} toast={toast} />}
      {section === 'presets' && <PresetsSection bs={bs} brandColor={brandColor} savePresetOpen={savePresetOpen} setSavePresetOpen={setSavePresetOpen} importPresetOpen={importPresetOpen} setImportPresetOpen={setImportPresetOpen} />}
      {section === 'events' && <EventsSection bs={bs} brandColor={brandColor} eventFormOpen={eventFormOpen} setEventFormOpen={setEventFormOpen} />}

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

function ConfigureSection({ bs, brand, brandColor, onSave, toast }) {
  var modeTabs = [
    { key: 'basic',    label: 'Basico',   icon: 'M11 5h2m-1-1v2m0 14v-2m0 0h-2m2 0h2m-9.657-2.343l1.414-1.414m0 0a8 8 0 111.414 1.414L4.929 17.07zm13.314-10.142l-1.414 1.414' },
    { key: 'advanced', label: 'Avancado', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
    { key: 'ai',       label: 'IA',       icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex border-b gap-1" style={{borderColor:'var(--border)'}}>
        {modeTabs.map(function(t) {
          var active = bs.mode === t.key;
          return (
            <button key={t.key} onClick={function() { bs.setMode(t.key); }}
              className={'flex items-center gap-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ' + (active ? '' : 'text-gray-400 border-transparent hover:text-gray-600')}
              style={active ? {borderColor: brandColor, color: brandColor} : {}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
              {t.label}
            </button>
          );
        })}
      </div>
      {bs.mode === 'basic' && <BasicMode bs={bs} brand={brand} brandColor={brandColor} onSave={onSave} toast={toast} />}
      {bs.mode === 'advanced' && <AdvancedMode bs={bs} brand={brand} brandColor={brandColor} />}
      {bs.mode === 'ai' && <AIMode bs={bs} brand={brand} brandColor={brandColor} />}
    </div>
  );
}

function BasicMode({ bs, brand, brandColor, onSave, toast }) {
  var [form, setForm] = React.useState({ name: (brand && brand.name) || '', color: (brand && brand.color) || '#002f59', color_secondary: (brand && brand.color_secondary) || '#e8f0f7', color_accent: (brand && brand.color_accent) || '#1a6b5c', logo_url: (brand && brand.logo_url) || '' });
  var [saving, setSaving] = React.useState(false);
  var setField = function(k, v) { setForm(function(f) { var o = Object.assign({}, f); o[k] = v; return o; }); };
  var save = async function() { setSaving(true); await onSave(Object.assign({}, brand, form)); setSaving(false); if (toast) toast('Identidade visual basica atualizada', 'success'); };
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
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{background: form.color}}>
          {form.logo_url ? <img src={form.logo_url} alt="logo" className="w-full h-full object-cover" /> : <span className="text-white text-xl font-bold">{form.name ? form.name[0].toUpperCase() : 'F'}</span>}
        </div>
        <label className="text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer text-center min-h-[44px] flex items-center justify-center" style={{background:'var(--brand-soft)', color: brandColor}}>
          Enviar logo <input type="file" accept="image/*" onChange={onLogoFile} className="hidden" />
        </label>
        {form.logo_url && <button onClick={function() { setField('logo_url', ''); }} className="text-xs font-medium" style={{color:'var(--text-muted)'}}>Remover</button>}
      </div>
      <Inp label="Nome do app" value={form.name} onChange={function(e) { setField('name', e.target.value); }} placeholder="Ex.: Minha Empresa" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ColorInput label="Primaria" value={form.color} onChange={function(v) { setField('color', v); }} />
        <ColorInput label="Secundaria" value={form.color_secondary} onChange={function(v) { setField('color_secondary', v); }} />
        <ColorInput label="Destaque" value={form.color_accent} onChange={function(v) { setField('color_accent', v); }} />
      </div>
      <button onClick={save} disabled={saving} className="w-full text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 min-h-[44px]" style={{background: brandColor}}>
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
        <input type="color" value={value} onChange={function(e) { onChange(e.target.value); }} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5" />
        <input type="text" value={value} onChange={function(e) { onChange(e.target.value); }} className="flex-1 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none" style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
      </div>
    </div>
  );
}

function AdvancedMode({ bs, brand, brandColor }) {
  var [expandedMods, setExpandedMods] = React.useState({});

  var toggleMod = function(name) {
    setExpandedMods(function(prev) {
      var o = Object.assign({}, prev);
      if (o[name]) { delete o[name]; } else { o[name] = true; }
      return o;
    });
  };

  var handleModuleApply = function(jsonStr) {
    bs.parseAndValidate(jsonStr);
    bs.setMode('ai');
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6 flex flex-col gap-4">
        <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Editor avancado</p>
        <p className="text-xs" style={{color:'var(--text-muted)'}}>Clique em "Editar" para modificar cada modulo.</p>
        {bs.modules.map(function(mod) {
          var config = (bs.brandConfig && bs.brandConfig.modules && bs.brandConfig.modules[mod.name]) || {};
          var hasConfig = Object.keys(config).length > 0;
          var isExpanded = expandedMods[mod.name];
          return (
            <div key={mod.name} className="rounded-xl p-4 flex flex-col gap-2" style={{background:'var(--bg-subtle)', border:'1px solid var(--border)'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{color:'var(--text-main)'}}>{mod.def.description}</p>
                  {hasConfig && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{background:'rgba(22,163,74,0.1)', color:'#16a34a'}}>configurado</span>}
                </div>
                <button onClick={function() { toggleMod(mod.name); }}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition hover:opacity-80"
                  style={{background: isExpanded ? 'var(--bg-input)' : 'var(--brand-soft)', color: isExpanded ? 'var(--text-sub)' : brandColor}}>
                  {isExpanded ? 'Recolher' : 'Editar'}
                </button>
              </div>
              {isExpanded && (
                <ModuleEditor mod={mod} brandConfig={bs.brandConfig} onApply={handleModuleApply} brandColor={brandColor} />
              )}
              {!isExpanded && mod.def.semanticMap && Object.keys(mod.def.semanticMap).filter(function(sk) { return mod.def.semanticMap[sk].length > 0; }).map(function(sk) {
                return <div key={sk} className="flex items-center gap-2"><span className="text-xs font-medium" style={{color:'var(--text-sub)'}}>{sk}:</span><span className="text-xs" style={{color:'var(--text-muted)'}}>{mod.def.semanticMap[sk].join(', ')}</span></div>;
              })}
            </div>
          );
        })}
      </Card>
      <PlanThemesSection bs={bs} brandColor={brandColor} />
    </div>
  );
}

function PlanThemesSection({ bs, brandColor }) {
  return (
    <Card className="p-6 flex flex-col gap-4">
      <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Temas por Plano</p>
      <p className="text-xs" style={{color:'var(--text-muted)'}}>Aplique um tema padrao para cada plano.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {bs.planThemes.map(function(pt) {
          return (
            <button key={pt.planId} onClick={function() { bs.applyPlanTheme(pt.planId); }}
              className="rounded-xl p-4 flex flex-col gap-1 text-left transition hover:opacity-80"
              style={{background:'var(--bg-subtle)', border:'1px solid var(--border)'}}>
              <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>{pt.name}</p>
              <p className="text-xs" style={{color:'var(--text-muted)'}}>{pt.description}</p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function AIMode({ bs, brand, brandColor }) {
  var showSuccess = bs.validation && bs.validation.valid;
  var showErrors = bs.validation && !bs.validation.valid;
  var showSummary = bs.summary && bs.summary.executive && bs.summary.executive.length > 0;
  var showPreview = bs.proposedBrand !== null;

  return (
    <Card className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Importar configuracao via IA</p>
          <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>Cole o JSON gerado pela IA.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={bs.copyPrompt}
            className="text-xs font-semibold px-3 py-2 rounded-xl min-h-[44px] transition hover:opacity-80 flex items-center gap-1.5"
            style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
            Copiar documentacao
          </button>
          <button onClick={bs.copyCurrentJSON}
            className="text-xs font-semibold px-3 py-2 rounded-xl min-h-[44px] transition hover:opacity-80 flex items-center gap-1.5"
            style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Copiar JSON atual
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea value={bs.jsonInput} onChange={function(e) { bs.parseAndValidate(e.target.value); }}
          placeholder='Cole o JSON aqui...'
          className="w-full rounded-xl px-4 py-3 text-sm font-mono leading-relaxed resize-y focus:outline-none"
          style={{ minHeight: 160, background: 'var(--bg-input)', color: 'var(--text-main)', border: showErrors ? '1px solid #ef4444' : (showSuccess ? '1px solid #16a34a' : '1px solid var(--border)') }}
          spellCheck={false} />
        {bs.jsonInput && (
          <button onClick={bs.clearInput} className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs transition hover:opacity-70" style={{background:'var(--bg-subtle)', color:'var(--text-muted)'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {bs.adaptedModel && (
        <div className="rounded-xl p-3 text-xs flex items-center gap-2" style={{background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.2)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span style={{color:'#2563eb'}}>JSON adaptado do formato {bs.adaptedModel}.</span>
        </div>
      )}

      {showErrors && (
        <div className="rounded-xl p-4 flex flex-col gap-1.5" style={{background:'#fef2f2', border:'1px solid #fecaca'}}>
          <p className="text-xs font-semibold text-red-700">Erros de validacao:</p>
          {bs.validation.errors.map(function(err, i) { return <p key={i} className="text-xs font-mono" style={{color:'#dc2626'}}>{'> '}{err}</p>; })}
        </div>
      )}

      {showSummary && <SummaryCard summary={bs.summary} />}

      {showPreview && (
        <div className="flex flex-col gap-4">
          <PreviewChangelist summary={bs.summary} approvedModules={bs.approvedModules} onToggle={bs.toggleModule} />
          <button onClick={bs.applyConfig} disabled={bs.applying}
            className="w-full text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 min-h-[44px] transition"
            style={{background: brandColor}}>
            {bs.applying ? <React.Fragment><Spin white /> Aplicando...</React.Fragment> : 'Aplicar configuracao'}
          </button>
          <button onClick={bs.applyConfig}
            className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition hover:opacity-80 min-h-[44px]"
            style={{border:'1px solid var(--border)', color:'var(--text-sub)'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 17l-4 4m0 0l-4-4m4 4V3" /></svg>
            Salvar como Preset
          </button>
        </div>
      )}
    </Card>
  );
}

function SummaryCard({ summary }) {
  var [level, setLevel] = React.useState('executive');
  var tabs = [{ key: 'executive', label: 'Resumo' }, { key: 'technical', label: 'Detalhes' }, { key: 'diff', label: 'JSON Diff' }];
  return (
    <div className="rounded-xl flex flex-col gap-3" style={{background:'rgba(22,163,74,0.04)', border:'1px solid rgba(22,163,74,0.2)'}}>
      <div className="flex border-b px-3" style={{borderColor:'rgba(22,163,74,0.15)'}}>
        {tabs.map(function(t) {
          var active = level === t.key;
          return <button key={t.key} onClick={function() { setLevel(t.key); }} className={'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ' + (active ? '' : 'text-gray-400 border-transparent')} style={active ? {borderColor:'#16a34a', color:'#16a34a'} : {}}>{t.label}</button>;
        })}
      </div>
      <div className="px-4 pb-4 flex flex-col gap-1">
        {level === 'executive' && summary.executive.map(function(line, i) { return <p key={i} className="text-xs" style={{color:'var(--text-main)'}}>{'> '}{line}</p>; })}
        {level === 'technical' && summary.technical.map(function(t, i) {
          return <div key={i} className="text-xs flex flex-col gap-0.5 py-1" style={{borderBottom:'1px solid var(--border)'}}><p className="font-semibold" style={{color:'var(--text-main)'}}>{t.module} ({t.status})</p>{t.fields && t.fields.map(function(f, fi) { return <p key={fi} className="font-mono" style={{color:'var(--text-sub)'}}>{f.field}: {f.from || 'vazio'} → {f.to || 'vazio'}</p>; })}</div>;
        })}
        {level === 'diff' && <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto max-h-48 overflow-y-auto" style={{color:'var(--text-sub)'}}>{JSON.stringify(summary.jsonDiff, null, 2)}</pre>}
      </div>
    </div>
  );
}

function PreviewChangelist({ summary, approvedModules, onToggle }) {
  var modules = summary.technical;
  if (!modules || modules.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold" style={{color:'var(--text-main)'}}>Aprovacao parcial</p>
      {modules.map(function(mod) {
        var isApproved = approvedModules.indexOf(mod.module) !== -1;
        return (
          <label key={mod.module} className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition hover:opacity-80" style={{background:'var(--bg-subtle)', border:'1px solid var(--border)'}}>
            <input type="checkbox" checked={isApproved} onChange={function() { onToggle(mod.module); }} className="w-4 h-4 rounded cursor-pointer accent-current" style={{color: 'var(--brand)'}} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>{mod.module}</p>
              <p className="text-xs" style={{color:'var(--text-muted)'}}>{mod.fields ? mod.fields.length + ' campo(s)' : 'Novo modulo'}</p>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{background: isApproved ? 'rgba(22,163,74,0.1)' : 'var(--bg-input)', color: isApproved ? '#16a34a' : 'var(--text-muted)'}}>{isApproved ? 'Aprovado' : 'Pendente'}</span>
          </label>
        );
      })}
    </div>
  );
}

function PresetsSection({ bs, brandColor, savePresetOpen, setSavePresetOpen, importPresetOpen, setImportPresetOpen }) {
  var [filter, setFilter] = React.useState('');
  var [categoryFilter, setCategoryFilter] = React.useState('');
  var [importJson, setImportJson] = React.useState('');

  var presets = bs.allPresets.filter(function(p) {
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (filter && p.name.toLowerCase().indexOf(filter.toLowerCase()) === -1 && p.tags.indexOf(filter.toLowerCase()) === -1) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Biblioteca de Presets</p>
          <div className="flex gap-2">
            <button onClick={function() { setSavePresetOpen(true); }}
              className="text-xs font-semibold px-3 py-2 rounded-xl transition hover:opacity-80 flex items-center gap-1.5"
              style={{background:'var(--brand-soft)', color: brandColor}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m7-7H5" /></svg>
              Salvar atual
            </button>
            <button onClick={function() { setImportPresetOpen(true); }}
              className="text-xs font-semibold px-3 py-2 rounded-xl transition hover:opacity-80 flex items-center gap-1.5"
              style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
              Importar
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input value={filter} onChange={function(e) { setFilter(e.target.value); }} placeholder="Buscar preset..."
            className="flex-1 min-w-[140px] rounded-xl px-3 py-2 text-xs focus:outline-none" style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
          <div className="flex gap-1 flex-wrap">
            <button onClick={function() { setCategoryFilter(''); }} className={'text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition ' + (!categoryFilter ? 'text-white' : '')} style={!categoryFilter ? {background: brandColor} : {background:'var(--bg-subtle)', color:'var(--text-sub)'}}>Todas</button>
            {bs.presetCats.map(function(c) {
              return <button key={c.name} onClick={function() { setCategoryFilter(c.name); }} className={'text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition ' + (categoryFilter === c.name ? 'text-white' : '')} style={categoryFilter === c.name ? {background: brandColor} : {background:'var(--bg-subtle)', color:'var(--text-sub)'}}>{c.name} ({c.count})</button>;
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
          {presets.map(function(p) {
            return (
              <div key={p.id} className="rounded-xl p-4 flex flex-col gap-2 transition hover:opacity-90" style={{background:'var(--bg-subtle)', border:'1px solid var(--border)'}}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{color:'var(--text-main)'}}>{p.name}</p>
                    <p className="text-xs truncate" style={{color:'var(--text-muted)'}}>{p.description}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={function() { bs.applyPreset(p.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition hover:opacity-70" style={{background:'var(--brand-soft)', color: brandColor}} title="Aplicar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>
                    </button>
                    {!p.protected && (
                      <React.Fragment>
                        <button onClick={function() { bs.duplicatePreset(p.id); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition hover:opacity-70" style={{background:'var(--bg-input)', color:'var(--text-muted)'}} title="Duplicar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" /><path d="M16 14h-2" /><path d="M16 10h-2" /><path d="M10 14h-2" /><path d="M10 10h-2" /></svg>
                        </button>
                        <button onClick={function() { bs.deletePreset(p.id); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition hover:opacity-70" style={{background:'var(--bg-input)', color:'#ef4444'}} title="Excluir">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                        </button>
                      </React.Fragment>
                    )}
                    <button onClick={function() { bs.exportPreset(p.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition hover:opacity-70" style={{background:'var(--bg-input)', color:'var(--text-muted)'}} title="Exportar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m7-4l4 4 4-4m-4 4V3" /></svg>
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {p.tags.slice(0, 3).map(function(tag) {
                    return <span key={tag} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{background:'var(--bg-input)', color:'var(--text-muted)'}}>{tag}</span>;
                  })}
                </div>
              </div>
            );
          })}
          {presets.length === 0 && <p className="text-xs col-span-full text-center py-8" style={{color:'var(--text-muted)'}}>Nenhum preset encontrado.</p>}
        </div>
      </Card>

      {savePresetOpen && <SavePresetModal bs={bs} brandColor={brandColor} onClose={function() { setSavePresetOpen(false); }} />}
      {importPresetOpen && <ImportPresetModal bs={bs} brandColor={brandColor} onClose={function() { setImportPresetOpen(false); }} importJson={importJson} setImportJson={setImportJson} />}
    </div>
  );
}

function SavePresetModal({ bs, brandColor, onClose }) {
  var [name, setName] = React.useState('');
  var [desc, setDesc] = React.useState('');
  var [cat, setCat] = React.useState('custom');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4" style={{background:'var(--bg-card)'}} onClick={function(e) { e.stopPropagation(); }}>
        <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Salvar Preset</p>
        <input value={name} onChange={function(e) { setName(e.target.value); }} placeholder="Nome do preset"
          className="rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
        <input value={desc} onChange={function(e) { setDesc(e.target.value); }} placeholder="Descricao (opcional)"
          className="rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
        <select value={cat} onChange={function(e) { setCat(e.target.value); }}
          className="rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}}>
          <option value="custom">Personalizado</option>
          <option value="classic">Classico</option>
          <option value="modern">Moderno</option>
          <option value="corporate">Corporativo</option>
          <option value="dark">Escuro</option>
          <option value="minimal">Minimalista</option>
          <option value="seasonal">Sazonal</option>
        </select>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>Cancelar</button>
          <button onClick={function() { if (name.trim()) { bs.saveCurrentPreset(name.trim(), desc, cat, []); onClose(); } }}
            className="flex-1 text-white rounded-xl py-2.5 text-sm font-semibold" style={{background: brandColor}}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

function ImportPresetModal({ bs, brandColor, onClose, importJson, setImportJson }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md flex flex-col gap-4" style={{background:'var(--bg-card)'}} onClick={function(e) { e.stopPropagation(); }}>
        <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Importar Preset</p>
        <textarea value={importJson} onChange={function(e) { setImportJson(e.target.value); }} placeholder='Cole o JSON do preset aqui...' rows={6}
          className="rounded-xl px-3 py-2.5 text-xs font-mono resize-none focus:outline-none" style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>Cancelar</button>
          <button onClick={function() { if (importJson.trim()) { bs.importPreset(importJson.trim()); onClose(); setImportJson(''); } }}
            className="flex-1 text-white rounded-xl py-2.5 text-sm font-semibold" style={{background: brandColor}}>Importar</button>
        </div>
      </div>
    </div>
  );
}

function EventsSection({ bs, brandColor, eventFormOpen, setEventFormOpen }) {
  return (
    <div className="flex flex-col gap-4">
      {bs.activeEvent && (
        <Card className="p-5 flex items-center gap-3" style={{background:'rgba(22,163,74,0.05)', border:'1px solid rgba(22,163,74,0.2)'}}>
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-700">Evento ativo: {bs.activeEvent.name}</p>
            <p className="text-xs text-green-600">Override temporario aplicado automaticamente.</p>
          </div>
        </Card>
      )}

      <Card className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Eventos Sazonais</p>
          <button onClick={function() { setEventFormOpen(true); }}
            className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5"
            style={{background:'var(--brand-soft)', color: brandColor}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m7-7H5" /></svg>
            Novo evento
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {bs.seasonalEvents.map(function(ev) {
            var isActive = bs.activeEvent && bs.activeEvent.id === ev.id;
            return (
              <div key={ev.id} className="rounded-xl p-4 flex flex-col gap-1" style={{background: isActive ? 'rgba(22,163,74,0.06)' : 'var(--bg-subtle)', border: isActive ? '1px solid rgba(22,163,74,0.3)' : '1px solid var(--border)'}}>
                <div className="flex items-center gap-2">
                  {isActive && <div className="w-2 h-2 rounded-full bg-green-500" />}
                  <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>{ev.name}</p>
                </div>
                <p className="text-xs" style={{color:'var(--text-muted)'}}>{ev.dayStart}/{String(ev.month).padStart(2, '0')} a {ev.dayEnd}/{String(ev.month).padStart(2, '0')}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {eventFormOpen && <EventFormModal bs={bs} brandColor={brandColor} onClose={function() { setEventFormOpen(false); }} />}
    </div>
  );
}

function EventFormModal({ bs, brandColor, onClose }) {
  var [name, setName] = React.useState('');
  var [startDate, setStartDate] = React.useState('');
  var [endDate, setEndDate] = React.useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4" style={{background:'var(--bg-card)'}} onClick={function(e) { e.stopPropagation(); }}>
        <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Criar Evento</p>
        <input value={name} onChange={function(e) { setName(e.target.value); }} placeholder="Nome do evento"
          className="rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-medium" style={{color:'var(--text-muted)'}}>Inicio</label>
            <input type="date" value={startDate} onChange={function(e) { setStartDate(e.target.value); }}
              className="rounded-xl px-3 py-2 text-xs focus:outline-none" style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-medium" style={{color:'var(--text-muted)'}}>Fim</label>
            <input type="date" value={endDate} onChange={function(e) { setEndDate(e.target.value); }}
              className="rounded-xl px-3 py-2 text-xs focus:outline-none" style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>Cancelar</button>
          <button onClick={function() { if (name.trim() && startDate && endDate) { bs.addCustomEvent({ name: name.trim(), starts_at: startDate + 'T00:00:00', expires_at: endDate + 'T23:59:59', enabled: true }); onClose(); } }}
            className="flex-1 text-white rounded-xl py-2.5 text-sm font-semibold" style={{background: brandColor}}>Criar</button>
        </div>
      </div>
    </div>
  );
}
