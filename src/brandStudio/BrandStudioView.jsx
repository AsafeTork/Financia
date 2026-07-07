import React from 'react';
import useBrandStudio from './useBrandStudio.js';
import { PageHead, Card } from '../components/ui.jsx';
import PlanTabsEditor from './PlanTabsEditor.jsx';

export default function BrandStudioView({ brand, planInfo, onSave, toast, onNav }) {
  var bs = useBrandStudio(brand, planInfo, onSave, toast);
  var brandColor = (brand && brand.color) || '#002f59';

  var [section, setSection] = React.useState('editor');
  var [savePresetOpen, setSavePresetOpen] = React.useState(false);
  var [importPresetOpen, setImportPresetOpen] = React.useState(false);
  var [filter, setFilter] = React.useState('');
  var [categoryFilter, setCategoryFilter] = React.useState('');
  var [importJson, setImportJson] = React.useState('');

  var sections = [
    { key: 'editor', label: 'Personalizar', icon: 'M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7h16' },
    { key: 'presets', label: 'Presets', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  ];

  var presets = bs.allPresets.filter(function(p) {
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (filter && p.name.toLowerCase().indexOf(filter.toLowerCase()) === -1 && p.tags.indexOf(filter.toLowerCase()) === -1) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHead icon="M11 5h2m-1-1v2m0 14v-2m0 0h-2m2 0h2m-9.657-2.343l1.414-1.414m0 0a8 8 0 111.414 1.414L4.929 17.07zm13.314-10.142l-1.414 1.414" title="Brand Studio" sub="Personalizacao por plano de assinatura" />

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
      </div>

      {section === 'editor' && (
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

      {section === 'presets' && (
        <div className="flex flex-col gap-4">
          <Card className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Presets salvos</p>
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
      )}
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
