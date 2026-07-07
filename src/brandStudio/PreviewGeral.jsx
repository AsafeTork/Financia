import React from 'react';

var SWATCHES = ['primary','secondary','accent','bgPage','bgCard','bgInput','bgSubtle','surface','textMain','textSub','textMuted','border','success','warning','danger','info'];

export default function PreviewGeral({ brandConfig, brandColor }) {
  var pal = (brandConfig && (brandConfig.modules && brandConfig.modules.palette || brandConfig.palette)) || {};
  var typ = (brandConfig && brandConfig.modules && brandConfig.modules.typography) || {};
  var btn = (brandConfig && brandConfig.modules && brandConfig.modules.buttons) || {};
  var inp = (brandConfig && brandConfig.modules && brandConfig.modules.inputs) || {};
  var cardsMod = (brandConfig && brandConfig.modules && brandConfig.modules.cards) || {};
  var sidebar = (brandConfig && brandConfig.modules && brandConfig.modules.sidebar) || {};

  var pk = pal.primary || brandColor || '#002f59';
  var sc = pal.secondary || '#e8f0f7';
  var ac = pal.accent || '#1a6b5c';
  var bgPage = pal.bgPage || '#f5f5f0';
  var bgCard = pal.bgCard || '#ffffff';
  var bgInput = pal.bgInput || '#ffffff';
  var bgSubtle = pal.bgSubtle || '#f5f5f0';
  var tMain = pal.textMain || '#0f172a';
  var tSub = pal.textSub || '#5b6b7c';
  var tMuted = pal.textMuted || '#94a3b8';
  var bd = pal.border || '#edeae3';
  var btnRadius = btn.radius || '12px';
  var inpRadius = inp.radius || '12px';
  var cardRadius = cardsMod.radius || '12px';
  var sidebarBg = sidebar.bg || '#1e293b';
  var sidebarText = sidebar.text || '#ffffff';

  return (
    <div className="rounded-2xl overflow-hidden" style={{background: bgPage, color: tMain, fontFamily: typ.fontFamily || 'inherit'}}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{background: pk, color: '#ffffff'}}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{background:'rgba(255,255,255,0.2)'}}>F</div>
          <span className="text-sm font-semibold">Financia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold" style={{background:'rgba(255,255,255,0.2)'}}>AD</div>
        </div>
      </div>

      <div className="flex">
        <div className="w-20 flex-shrink-0 p-2 flex flex-col gap-1.5" style={{background: sidebarBg}}>
          {[1,2,3,4].map(function(i) {
            return (
              <div key={i} className="h-7 rounded-lg flex items-center justify-center"
                style={{background: i === 2 ? sidebar.activeBg || 'rgba(255,255,255,0.14)' : 'transparent', color: sidebarText}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
              </div>
            );
          })}
        </div>

        <div className="flex-1 p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-semibold text-white" style={{background: pk, borderRadius: btnRadius}}>Salvar</button>
            <button className="px-4 py-2 text-sm font-semibold" style={{background: sc, color: pk, borderRadius: btnRadius}}>Cancelar</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 flex flex-col gap-2" style={{background: bgCard, borderRadius: cardRadius, border:'1px solid '+bd}}>
              <div className="h-3 w-2/3 rounded" style={{background: bgSubtle}} />
              <div className="h-3 w-1/2 rounded" style={{background: bgSubtle}} />
              <div className="h-1.5 rounded-full mt-2" style={{background: bgSubtle}}>
                <div className="h-full rounded-full" style={{width:'60%', background: ac}} />
              </div>
            </div>
            <div className="p-3 flex flex-col gap-2" style={{background: bgCard, borderRadius: cardRadius, border:'1px solid '+bd}}>
              <div className="h-3 w-1/2 rounded" style={{background: bgSubtle}} />
              <div className="h-3 w-3/4 rounded" style={{background: bgSubtle}} />
              <span className="text-[10px] font-medium flex items-center gap-1" style={{color: tSub}}>
                <span className="w-2 h-2 rounded-full" style={{background: sc}} />
                Tag ativa
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{background: bgInput, border:'1px solid '+bd, borderRadius: inpRadius}}>
              <svg width="14" height="14" fill="none" stroke={tMuted} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span className="text-xs" style={{color: tMuted}}>Buscar...</span>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="text-[8px] font-bold px-2 py-0.5 rounded-full text-white" style={{background: pk}}>NOVO</div>
            <div className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{background: sc, color: pk}}>EM ANDAMENTO</div>
          </div>

          <div className="flex gap-1.5">
            {SWATCHES.slice(0,13).map(function(s) {
              var c = pal[s];
              if (!c) return null;
              return <div key={s} className="w-4 h-4 rounded" style={{background: c}} title={s} />;
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium" style={{color: tSub}}>CSS:</span>
              <span className="text-[10px] font-mono" style={{color: tMain}}>{pk}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium" style={{color: tSub}}>Font:</span>
              <span className="text-[10px]" style={{color: tMain}}>{typ.fontFamily ? typ.fontFamily.split(',')[0] : 'Inter'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
