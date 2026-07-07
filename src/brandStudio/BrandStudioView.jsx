import React from 'react';
import { PageHead, Card } from '../components/ui.jsx';
import LogoSchemes from './LogoSchemes.jsx';

var NAV = [
  { key: 'logo', label: 'Logo', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'ia', label: 'IA', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
];

export default function BrandStudioView({ brand, planInfo, onSave, toast, onNav }) {
  var brandColor = (brand && brand.color) || '#002f59';
  var [section, setSection] = React.useState('logo');

  return (
    <div className="flex flex-col gap-6">
      <PageHead icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" title="Brand Studio" sub="Editor de cores da logo" />

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

      {section === 'logo' && (
        <Card className="p-6">
          <LogoSchemes brandColor={brandColor} toast={toast} />
        </Card>
      )}

      {section === 'ia' && (
        <Card className="p-6 flex flex-col gap-4">
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Em breve</p>
          <p className="text-xs" style={{color:'var(--text-muted)'}}>Assistente IA para gerar esquemas de cor da logo.</p>
        </Card>
      )}
    </div>
  );
}
