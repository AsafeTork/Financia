import React from 'react';

export default function BrandGlobalEditor({ brandGlobal, setField, onSave, brandColor }) {
  const handleFile = (key) => (e) => {
    const file = e.target && e.target.files && e.target.files[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.indexOf(file.type) === -1) return;
    if (file.size > 512 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setField(key, String(reader.result));
    reader.readAsDataURL(file);
  };

  const renderLogoUpload = (key, label, desc) => {
    const value = brandGlobal[key];
    return (
      <div className="flex items-center gap-3">
        {value
          ? <img src={value} alt={label} decoding="async" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" style={{border:'1px solid var(--border, #e2e8f0)'}} />
          : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0" style={{background:'var(--bg-subtle, #f1f5f9)', border:'1px dashed var(--border, #e2e8f0)', color:'var(--text-muted, #94a3b8)'}}>{label[0]}</div>
        }
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold mb-0.5" style={{color:'var(--text-main, #0f172a)'}}>{label}</p>
          <p className="text-[10px] mb-1" style={{color:'var(--text-muted, #94a3b8)'}}>{desc}</p>
          <label className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer inline-block transition hover:opacity-80 min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] flex items-center justify-center" style={{background:'var(--brand-soft, #ccfbf1)', color: brandColor}}>
            Upload imagem
            <input type="file" accept="image/*" onChange={handleFile(key)} className="hidden" />
          </label>
          {value && <button onClick={() => setField(key, '')} className="text-[10px] ml-2 font-medium hover:opacity-70 min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)]" style={{color:'var(--text-muted, #94a3b8)'}}>Remover</button>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold" style={{color:'var(--text-main, #0f172a)'}}>Informacoes da marca</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="brand-name" className="text-xs font-medium" style={{color:'var(--text-sub, #475569)'}}>Nome do app</label>
            <input id="brand-name" value={brandGlobal.name} onChange={e => setField('name', e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={{background:'var(--bg-input, #f1f5f9)', color:'var(--text-main, #0f172a)', border:'1px solid var(--border, #e2e8f0)'}} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="brand-short-name" className="text-xs font-medium" style={{color:'var(--text-sub, #475569)'}}>Nome curto (abreviacao)</label>
            <input id="brand-short-name" value={brandGlobal.short_name} onChange={e => setField('short_name', e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={{background:'var(--bg-input, #f1f5f9)', color:'var(--text-main, #0f172a)', border:'1px solid var(--border, #e2e8f0)'}} placeholder="Ex.: FNC" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="brand-app-title" className="text-xs font-medium" style={{color:'var(--text-sub, #475569)'}}>Titulo da aplicacao (aba do navegador)</label>
            <input id="brand-app-title" value={brandGlobal.app_title} onChange={e => setField('app_title', e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={{background:'var(--bg-input, #f1f5f9)', color:'var(--text-main, #0f172a)', border:'1px solid var(--border, #e2e8f0)'}} placeholder="Ex.: Financia - Gestao Financeira" />
          </div>
        </div>
      </div>

      <div className="border-t pt-4" style={{borderColor:'var(--border, #e2e8f0)'}}>
        <p className="text-sm font-semibold mb-3" style={{color:'var(--text-main, #0f172a)'}}>Logos e favicon</p>
        <div className="flex flex-col gap-4">
          {renderLogoUpload('logo_url', 'Logo principal', 'Aparece na barra superior, sidebar e telas de carregamento.')}
          {renderLogoUpload('secondary_logo_url', 'Segunda logo', 'Aparece ao lado da logo principal na barra superior.')}
          {renderLogoUpload('favicon_url', 'Favicon', 'Icone da aba do navegador. Use 32x32 ou 64x64 para melhor resultado.')}
          {renderLogoUpload('login_logo_url', 'Logo da tela de login', 'Aparece na pagina de entrada do sistema.')}
        </div>
      </div>

      <div className="border-t pt-4" style={{borderColor:'var(--border, #e2e8f0)'}}>
        <p className="text-sm font-semibold mb-3" style={{color:'var(--text-main, #0f172a)'}}>Segunda logo - posicao</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="brand-secondary-logo-position" className="text-xs font-medium" style={{color:'var(--text-sub, #475569)'}}>Posicao</label>
            <select id="brand-secondary-logo-position" value={brandGlobal.secondary_logo_position} onChange={e => setField('secondary_logo_position', e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={{background:'var(--bg-input, #f1f5f9)', color:'var(--text-main, #0f172a)', border:'1px solid var(--border, #e2e8f0)'}}>
              <option value="left">Esquerda</option>
              <option value="right">Direita</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="brand-logo-size" className="text-xs font-medium" style={{color:'var(--text-sub, #475569)'}}>Tamanho (px)</label>
            <input id="brand-logo-size" type="range" min="20" max="80" value={brandGlobal.secondary_logo_size || 40} onChange={e => setField('secondary_logo_size', parseInt(e.target.value, 10))}
              className="w-full accent-current" style={{color: brandColor}} />
            <span className="text-[10px] font-mono" style={{color:'var(--text-muted, #94a3b8)'}}>{brandGlobal.secondary_logo_size || 40}px</span>
          </div>
        </div>
      </div>

      <button onClick={onSave}
        className="w-full text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 min-h-[44px] transition"
        style={{background: brandColor}}>
        Salvar identidade global
      </button>
    </div>
  );
}