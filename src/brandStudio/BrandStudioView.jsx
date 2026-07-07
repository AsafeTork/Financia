import React from 'react';
import useBrandStudio from './useBrandStudio.js';
import { PageHead, Card, Spin } from '../components/ui.jsx';
import PlanTabsEditor from './PlanTabsEditor.jsx';
import PreviewGeral from './PreviewGeral.jsx';
import BrandGlobalEditor from './BrandGlobalEditor.jsx';

var NAV_ITEMS = [
  { key: 'preview', label: 'Preview', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  { key: 'global', label: 'Global', icon: 'M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7h16' },
  { key: 'planos', label: 'Planos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { key: 'editor', label: 'Logo', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'assets', label: 'Assets', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { key: 'presets', label: 'Presets', icon: 'M5 13l4 4L19 7' },
  { key: 'ia', label: 'IA', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
];

export default function BrandStudioView({ brand, planInfo, onSave, toast, onNav }) {
  var bs = useBrandStudio(brand, planInfo, onSave, toast);
  var brandColor = (brand && brand.color) || '#002f59';
  var [section, setSection] = React.useState('planos');
  var [savePresetOpen, setSavePresetOpen] = React.useState(false);
  var [importPresetOpen, setImportPresetOpen] = React.useState(false);
  var [filter, setFilter] = React.useState('');
  var [categoryFilter, setCategoryFilter] = React.useState('');
  var [importJson, setImportJson] = React.useState('');
  var [iaJson, setIaJson] = React.useState('');

  var presets = bs.allPresets.filter(function(p) {
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (filter && p.name.toLowerCase().indexOf(filter.toLowerCase()) === -1 && p.tags.indexOf(filter.toLowerCase()) === -1) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHead icon="M11 5h2m-1-1v2m0 14v-2m0 0h-2m2 0h2m-9.657-2.343l1.414-1.414m0 0a8 8 0 111.414 1.414L4.929 17.07zm13.314-10.142l-1.414 1.414" title="Brand Studio" sub="Centro de identidade visual do Financia" />

      <div className="flex border-b gap-1 flex-wrap overflow-x-auto" style={{borderColor:'var(--border)'}}>
        {NAV_ITEMS.map(function(s) {
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

      {section === 'preview' && (
        <div className="flex flex-col gap-4">
          <Card className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Preview em tempo real</p>
              <div className="flex gap-1">
                <button onClick={bs.undo} disabled={bs.historyIndex <= 0}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg disabled:opacity-30 transition"
                  style={{background:'var(--bg-input)', color:'var(--text-sub)'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h13a4 4 0 010 8H7" /><path d="M7 6l-4 4 4 4" /></svg>
                </button>
                <button onClick={bs.redo} disabled={bs.historyIndex >= bs.history.length - 1}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg disabled:opacity-30 transition"
                  style={{background:'var(--bg-input)', color:'var(--text-sub)'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H8a4 4 0 000 8h10" /><path d="M17 6l4 4-4 4" /></svg>
                </button>
              </div>
            </div>
            <PreviewGeral brandConfig={bs.brandConfig} brandColor={brandColor} />
            {bs.history.length > 0 && (
              <div className="flex flex-col gap-2 mt-2 max-h-[200px] overflow-y-auto">
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{color:'var(--text-muted)'}}>Historico de versoes ({bs.history.length})</p>
                {bs.history.map(function(h, i) {
                  var active = i === bs.historyIndex;
                  return (
                    <button key={i} onClick={function() { bs.restoreFromHistory(i); }}
                      className={'text-xs text-left px-3 py-2 rounded-lg transition ' + (active ? 'text-white' : '')}
                      style={active ? {background: brandColor} : {background:'var(--bg-subtle)', color:'var(--text-sub)'}}>
                      Versao {i + 1} — {new Date().toLocaleString('pt-BR')}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {section === 'global' && (
        <Card className="p-6 flex flex-col gap-4">
          <BrandGlobalEditor
            brandGlobal={bs.brandGlobal}
            setField={bs.setBrandGlobalField}
            onSave={bs.saveBrandGlobal}
            brandColor={brandColor} />
        </Card>
      )}

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

      {section === 'editor' && (
        <Card className="p-6 flex flex-col gap-4">
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Editor da Logo</p>
          <p className="text-xs" style={{color:'var(--text-muted)'}}>Em breve: editor visual de SVG com grupos editaveis. Por enquanto, use a seção Global para fazer upload da logo.</p>
          <div className="rounded-xl p-8 flex items-center justify-center" style={{background:'var(--bg-subtle)', border:'2px dashed var(--border)'}}>
            <div className="flex flex-col items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-xs font-medium" style={{color:'var(--text-muted)'}}>Editor SVG em desenvolvimento</p>
            </div>
          </div>
        </Card>
      )}

      {section === 'assets' && (
        <Card className="p-6 flex flex-col gap-4">
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Biblioteca de Assets</p>
          <p className="text-xs" style={{color:'var(--text-muted)'}}>Em breve: biblioteca de logos, SVG, icones, favicons, imagens, backgrounds e elementos decorativos.</p>
          <div className="rounded-xl p-8 flex items-center justify-center" style={{background:'var(--bg-subtle)', border:'2px dashed var(--border)'}}>
            <div className="flex flex-col items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="text-xs font-medium" style={{color:'var(--text-muted)'}}>Biblioteca de assets em desenvolvimento</p>
            </div>
          </div>
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

      {section === 'ia' && (
        <Card className="p-6 flex flex-col gap-4">
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Assistente IA</p>
          <p className="text-xs" style={{color:'var(--text-muted)'}}>Peça para qualquer IA gerar um JSON de identidade visual. Cole o resultado abaixo para validar, visualizar e aplicar.</p>

          <div className="flex gap-2">
            <button onClick={bs.copyPrompt}
              className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:opacity-80 min-h-[44px] flex items-center justify-center gap-2"
              style={{background:'var(--brand-soft)', color: brandColor}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              Copiar documentacao
            </button>
            <button onClick={bs.copyCurrentJSON}
              className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:opacity-80 min-h-[44px] flex items-center justify-center gap-2"
              style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              Copiar JSON atual
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium" style={{color:'var(--text-sub)'}}>Cole o JSON gerado pela IA:</p>
            <textarea value={iaJson} onChange={function(e) { setIaJson(e.target.value); }} placeholder='Cole o JSON aqui...' rows={5}
              className="rounded-xl px-3 py-2.5 text-xs font-mono resize-none focus:outline-none"
              style={{background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border)'}} />
            <button onClick={function() { if (iaJson.trim()) { bs.parseAndValidate(iaJson.trim()); } }}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl text-white transition hover:opacity-90 min-h-[44px]"
              style={{background: brandColor}}>
              Validar e visualizar
            </button>
          </div>

          {bs.proposed && bs.proposed.success && (
            <div className="flex flex-col gap-3 rounded-xl p-4" style={{background:'var(--bg-subtle)', border:'1px solid var(--border)'}}>
              <p className="text-xs font-semibold" style={{color:'var(--text-main)'}}>Resumo das alteracoes</p>
              {bs.proposed.summary && bs.proposed.summary.executive && bs.proposed.summary.executive.map(function(line, i) {
                return <p key={i} className="text-xs" style={{color:'var(--text-sub)'}}>{line}</p>;
              })}
              {bs.proposed.summary && bs.proposed.summary.technical && bs.proposed.summary.technical.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold mb-1" style={{color:'var(--text-muted)'}}>Detalhes tecnicos:</p>
                  {bs.proposed.summary.technical.map(function(t, i) {
                    return <p key={i} className="text-[10px] font-mono" style={{color:'var(--text-muted)'}}>{t.module}: {t.status} ({t.fields.length} campos)</p>;
                  })}
                </div>
              )}

              <div className="rounded-xl overflow-hidden">
                <PreviewGeral brandConfig={bs.proposed.normalized} brandColor={brandColor} />
              </div>

              <div className="flex gap-2">
                <button onClick={bs.approveProposed}
                  className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl text-white transition hover:opacity-90 min-h-[44px]"
                  style={{background: brandColor}}>
                  Aprovar e aplicar
                </button>
                <button onClick={bs.rejectProposed}
                  className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:opacity-80 min-h-[44px]"
                  style={{background:'var(--bg-input)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
                  Rejeitar
                </button>
              </div>
            </div>
          )}

          {bs.proposed && !bs.proposed.success && (
            <div className="rounded-xl p-4 flex flex-col gap-2" style={{background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)'}}>
              <p className="text-xs font-semibold" style={{color:'#ef4444'}}>Erro na validacao</p>
              <p className="text-xs" style={{color:'var(--text-sub)'}}>Etapa: {bs.proposed.step}</p>
              <p className="text-xs" style={{color:'var(--text-sub)'}}>{bs.proposed.error}</p>
            </div>
          )}
        </Card>
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
          <button onClick={function() { if (name.trim()) { bs.saveCompletePreset(name.trim(), desc, cat, []); onClose(); } }}
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
