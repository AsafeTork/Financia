import React from 'react';
import useBrandStudio from './useBrandStudio.js';
import { PageHead, Card } from '../components/ui.jsx';
import PlanTabsEditor from './PlanTabsEditor.jsx';
import PreviewGeral from './PreviewGeral.jsx';

var NAV = [
  { key: 'cores', label: 'Cores', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
  { key: 'ia', label: 'IA', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
];

export default function BrandStudioView({ brand, planInfo, onSave, toast, onNav }) {
  var bs = useBrandStudio(brand, planInfo, onSave, toast);
  var brandColor = (brand && brand.color) || '#002f59';
  var [section, setSection] = React.useState('cores');
  var [iaJson, setIaJson] = React.useState('');

  return (
    <div className="flex flex-col gap-6">
      <PageHead icon="M11 5h2m-1-1v2m0 14v-2m0 0h-2m2 0h2m-9.657-2.343l1.414-1.414" title="Brand Studio" sub="Edite as cores da identidade visual" />

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{color:'var(--text-muted)'}}>Preview ao vivo</p>
          <div className="flex gap-1">
            <button onClick={bs.undo} disabled={bs.historyIndex <= 0}
              className="text-xs px-2 py-1 rounded-lg disabled:opacity-30 transition"
              style={{background:'var(--bg-input)', color:'var(--text-sub)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h13a4 4 0 010 8H7" /><path d="M7 6l-4 4 4 4" /></svg>
            </button>
            <button onClick={bs.redo} disabled={bs.historyIndex >= bs.history.length - 1}
              className="text-xs px-2 py-1 rounded-lg disabled:opacity-30 transition"
              style={{background:'var(--bg-input)', color:'var(--text-sub)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H8a4 4 0 000 8h10" /><path d="M17 6l4 4-4 4" /></svg>
            </button>
          </div>
        </div>
        <PreviewGeral brandConfig={bs.brandConfig} brandColor={brandColor} />
        {bs.history.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap max-h-[120px] overflow-y-auto">
            {bs.history.map(function(h, i) {
              var active = i === bs.historyIndex;
              return (
                <button key={i} onClick={function() { bs.restoreFromHistory(i); }}
                  className={'text-[10px] px-2 py-1 rounded transition ' + (active ? 'text-white' : '')}
                  style={active ? {background: brandColor} : {background:'var(--bg-subtle)', color:'var(--text-sub)'}}>
                  v{i + 1}
                </button>
              );
            })}
          </div>
        )}
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

      {section === 'cores' && (
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

      {section === 'ia' && (
        <Card className="p-6 flex flex-col gap-4">
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Assistente IA</p>
          <p className="text-xs" style={{color:'var(--text-muted)'}}>Peça para qualquer IA gerar um JSON de cores. Cole o resultado abaixo para validar, visualizar e aplicar.</p>

          <div className="flex gap-2">
            <button onClick={bs.copyPrompt}
              className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:opacity-80 min-h-[44px] flex items-center justify-center gap-2"
              style={{background:'var(--brand-soft)', color: brandColor}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              Copiar doc
            </button>
            <button onClick={bs.copyCurrentJSON}
              className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl transition hover:opacity-80 min-h-[44px] flex items-center justify-center gap-2"
              style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              Copiar JSON
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <textarea value={iaJson} onChange={function(e) { setIaJson(e.target.value); }} placeholder='Cole o JSON da IA aqui...' rows={4}
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
              <p className="text-xs font-semibold" style={{color:'var(--text-main)'}}>Resumo</p>
              {bs.proposed.summary && bs.proposed.summary.executive && bs.proposed.summary.executive.map(function(line, i) {
                return <p key={i} className="text-xs" style={{color:'var(--text-sub)'}}>{line}</p>;
              })}
              <div className="rounded-xl overflow-hidden">
                <PreviewGeral brandConfig={bs.proposed.normalized} brandColor={brandColor} />
              </div>
              <div className="flex gap-2">
                <button onClick={bs.approveProposed}
                  className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl text-white transition hover:opacity-90 min-h-[44px]"
                  style={{background: brandColor}}>
                  Aprovar
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
            <div className="rounded-xl p-4" style={{background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)'}}>
              <p className="text-xs font-semibold" style={{color:'#ef4444'}}>Erro: {bs.proposed.error}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
