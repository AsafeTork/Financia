import React from 'react';
import { PALETTE_DEFAULTS, BUTTONS_DEFAULTS, INPUTS_DEFAULTS, CARDS_DEFAULTS, SIDEBAR_DEFAULTS } from './defaults.js';
import { generateLogoSvg, logoSvgToDataUrl } from './logoUtils.js';

const SWATCHES = ['primary','secondary','accent','bgPage','bgCard','bgInput','bgSubtle','surface','textMain','textSub','textMuted','border','success','warning','danger','info'];

export default function PreviewGeral({ brandConfig, brandColor }) {
  const pal = brandConfig && (brandConfig.modules && brandConfig.modules.palette || brandConfig.palette) || {};
  const typ = brandConfig && brandConfig.modules && brandConfig.modules.typography || {};
  const btn = brandConfig && brandConfig.modules && brandConfig.modules.buttons || {};
  const inp = brandConfig && brandConfig.modules && brandConfig.modules.inputs || {};
  const cardsMod = brandConfig && brandConfig.modules && brandConfig.modules.cards || {};
  const sidebar = brandConfig && brandConfig.modules && brandConfig.modules.sidebar || {};

  const pk = pal.primary || brandColor || PALETTE_DEFAULTS.primary;
  const sc = pal.secondary || PALETTE_DEFAULTS.secondary;
  const ac = pal.accent || PALETTE_DEFAULTS.accent;
  const bgPage = pal.bgPage || PALETTE_DEFAULTS.bgPage;
  const bgCard = pal.bgCard || PALETTE_DEFAULTS.bgCard;
  const bgInput = pal.bgInput || PALETTE_DEFAULTS.bgInput;
  const bgSubtle = pal.bgSubtle || PALETTE_DEFAULTS.bgSubtle;
  const tMain = pal.textMain || PALETTE_DEFAULTS.textMain;
  const tSub = pal.textSub || PALETTE_DEFAULTS.textSub;
  const tMuted = pal.textMuted || PALETTE_DEFAULTS.textMuted;
  const bd = pal.border || PALETTE_DEFAULTS.border;
  const btnRadius = btn.radius || BUTTONS_DEFAULTS.radius;
  const inpRadius = inp.radius || INPUTS_DEFAULTS.radius;
  const cardRadius = cardsMod.radius || CARDS_DEFAULTS.radius;
  const sidebarBg = sidebar.background || SIDEBAR_DEFAULTS.background;
  const sidebarActiveBg = sidebar.activeBg || SIDEBAR_DEFAULTS.activeBg;
  const sidebarTextMuted = sidebar.textMuted || SIDEBAR_DEFAULTS.textMuted;
  const logoColors = brandConfig && brandConfig.modules && brandConfig.modules.logo && brandConfig.modules.logo.colors;
  const logoSrc = logoColors ? logoSvgToDataUrl(generateLogoSvg(logoColors)) : '/icon-mark.svg';

  const containerStyle = {
    background: `var(--bg-page, ${bgPage})`,
    color: `var(--text-main, ${tMain})`,
    fontFamily: typ.fontFamily || 'inherit',
  };
  const headerStyle = {
    background: `var(--brand, ${pk})`,
    color: '#ffffff',
  };
  const sidebarStyle = {
    background: `var(--sidebar-bg, ${sidebarBg})`,
  };
  const sidebarItemStyle = (i) => ({
    background: i === 2 ? `var(--sidebar-active-bg, ${sidebarActiveBg})` : 'transparent',
    color: sidebarTextMuted,
  });
  const saveBtnStyle = {
    background: `var(--btn-primary-bg, ${pk})`,
    borderRadius: `var(--btn-radius, ${btnRadius})`,
  };
  const cancelBtnStyle = {
    background: `var(--btn-secondary-bg, ${sc})`,
    color: `var(--btn-primary-bg, ${pk})`,
    borderRadius: `var(--btn-radius, ${btnRadius})`,
  };
  const cardStyle = {
    background: `var(--card-bg, ${bgCard})`,
    borderRadius: `var(--card-radius, ${cardRadius})`,
    border: `1px solid var(--border, ${bd})`,
  };
  const bgSubtleStyle = {
    background: `var(--bg-subtle, ${bgSubtle})`,
  };
  const progressStyle = {
    width: '60%',
    background: `var(--brand-accent, ${ac})`,
  };
  const tagStyle = {
    color: `var(--text-sub, ${tSub})`,
  };
  const tagDotStyle = {
    background: `var(--brand-secondary, ${sc})`,
  };
  const inputStyle = {
    background: `var(--input-bg, ${bgInput})`,
    border: `1px solid var(--input-border, ${bd})`,
    borderRadius: `var(--input-radius, ${inpRadius})`,
  };
  const searchIconStyle = {
    stroke: `var(--text-muted, ${tMuted})`,
  };
  const searchTextStyle = {
    color: `var(--text-muted, ${tMuted})`,
  };
  const novoStyle = {
    background: `var(--brand, ${pk})`,
  };
  const andamentoStyle = {
    background: `var(--brand-secondary, ${sc})`,
    color: `var(--brand, ${pk})`,
  };
  const cssLabelStyle = {
    color: `var(--text-sub, ${tSub})`,
  };
  const cssValueStyle = {
    color: `var(--text-main, ${tMain})`,
  };
  const fontLabelStyle = {
    color: `var(--text-sub, ${tSub})`,
  };
  const fontValueStyle = {
    color: `var(--text-main, ${tMain})`,
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={containerStyle}>
      <div className="flex items-center justify-between px-4 py-2.5" style={headerStyle}>
        <div className="flex items-center gap-2">
           <img src={logoSrc} alt="" className="w-7 h-7 object-contain" />
          <span className="text-sm font-semibold">Financia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold" style={{background:'rgba(255,255,255,0.2)'}}>AD</div>
        </div>
      </div>

      <div className="flex">
        <div className="w-20 flex-shrink-0 p-2 flex flex-col gap-1.5" style={sidebarStyle}>
          {[1,2,3,4].map(i => (
            <div key={i} className="h-7 rounded-lg flex items-center justify-center" style={sidebarItemStyle(i)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            </div>
          ))}
        </div>

        <div className="flex-1 p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-semibold text-white" style={saveBtnStyle}>Salvar</button>
            <button className="px-4 py-2 text-sm font-semibold" style={cancelBtnStyle}>Cancelar</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 flex flex-col gap-2" style={cardStyle}>
              <div className="h-3 w-2/3 rounded" style={bgSubtleStyle} />
              <div className="h-3 w-1/2 rounded" style={bgSubtleStyle} />
              <div className="h-1.5 rounded-full mt-2" style={bgSubtleStyle}>
                <div className="h-full rounded-full" style={progressStyle} />
              </div>
            </div>
            <div className="p-3 flex flex-col gap-2" style={cardStyle}>
              <div className="h-3 w-1/2 rounded" style={bgSubtleStyle} />
              <div className="h-3 w-3/4 rounded" style={bgSubtleStyle} />
              <span className="text-[10px] font-medium flex items-center gap-1" style={tagStyle}>
                <span className="w-2 h-2 rounded-full" style={tagDotStyle} />
                Tag ativa
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={inputStyle}>
              <svg width="14" height="14" fill="none" stroke="currentColor" style={searchIconStyle} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span className="text-xs" style={searchTextStyle}>Buscar...</span>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="text-[8px] font-bold px-2 py-0.5 rounded-full text-white" style={novoStyle}>NOVO</div>
            <div className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={andamentoStyle}>EM ANDAMENTO</div>
          </div>

          <div className="flex gap-1.5">
            {SWATCHES.slice(0,13).map(s => {
              const c = pal[s];
              if (!c) return null;
              return <div key={s} className="w-4 h-4 rounded" style={{background: c}} title={s} />;
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium" style={cssLabelStyle}>CSS:</span>
              <span className="text-[10px] font-mono" style={cssValueStyle}>{pk}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium" style={fontLabelStyle}>Font:</span>
              <span className="text-[10px]" style={fontValueStyle}>{typ.fontFamily ? typ.fontFamily.split(',')[0] : 'Inter'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
