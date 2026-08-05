import React from 'react';
import { brandAlpha } from '../../lib/utils.js';

var NavLink = React.memo(function NavLink({ href, label, onClick, variant = 'default' }) {
  var baseStyles = 'text-xs font-medium transition-colors min-h-[44px] flex items-center';
  var styles = {
    default: baseStyles + ' text-gray-500 hover:text-gray-700',
    primary: baseStyles + ' text-white/80 hover:text-white',
    muted: baseStyles + ' text-gray-400 hover:text-gray-300',
  };
  return (
    <a
      href={href}
      onClick={onClick}
      className={styles[variant]}
      style={{ color: variant === 'primary' ? 'var(--text-on-brand, white)' : undefined }}
    >
      {label}
    </a>
  );
});

export default function Footer({ brand, onNav, isMobile }) {
  var brandColor = (brand && brand.color) || 'var(--brand)';
  var brandColorHex = (brand && brand.color) || '#002f59';
  var currentYear = new Date().getFullYear();
  var appVersion = '2.3.0';

  var footerLinks = [
    { label: 'Privacidade', href: '/privacidade', onClick: function(e) { e.preventDefault(); onNav('privacidade'); } },
    { label: 'Termos de Uso', href: '/termos', onClick: function(e) { e.preventDefault(); onNav('termos'); } },
    { label: 'Suporte', href: 'mailto:suporte@financiabr.me' },
  ];

  var socialLinks = [
    { label: 'GitHub', href: 'https://github.com/AsafeTork/Financia', external: true },
    { label: 'Documentação', href: 'https://docs.financiabr.me', external: true },
  ];

  return (
    <footer
      role="contentinfo"
      className={'w-full py-6 lg:py-8 transition-colors ' + (isMobile ? 'lg:hidden' : 'hidden lg:block')}
      style={{
        background: 'var(--bg-page)',
        borderTop: '1px solid var(--border-color, #e5e7eb)',
        marginTop: 'auto',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {brand?.logo_url ? (
                <img src={brand.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: brandAlpha(brandColorHex, 0.15) }}>
                  <span className="font-bold" style={{ color: brandColor }}>{(brand?.logo || 'F')[0]}</span>
                </div>
              )}
              <span className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>{brand?.name || 'Financia'}</span>
            </div>
            <p className="text-xs text-gray-500 max-w-xs">
              Gestão financeira simplificada para pequenos negócios. Controle vendas, despesas e estoque em um só lugar.
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>v{appVersion}</span>
              <span aria-hidden="true">·</span>
              <span>{currentYear} Financia</span>
            </div>
          </div>

          <nav aria-label="Links úteis" className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Produto</h4>
            {footerLinks.map(function(link) {
              return (
                <NavLink
                  key={link.label}
                  href={link.href}
                  label={link.label}
                  onClick={link.onClick}
                  variant="default"
                />
              );
            })}
          </nav>

          <nav aria-label="Recursos" className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Recursos</h4>
            <NavLink href="#vendas" label="Vendas / Ganhos" onClick={function(e) { e.preventDefault(); onNav('income'); }} variant="default" />
            <NavLink href="#despesas" label="Despesas" onClick={function(e) { e.preventDefault(); onNav('expense'); }} variant="default" />
            <NavLink href="#estoque" label="Estoque" onClick={function(e) { e.preventDefault(); onNav('inventory'); }} variant="default" />
            <NavLink href="#relatorio" label="Relatórios" onClick={function(e) { e.preventDefault(); onNav('report'); }} variant="default" />
          </nav>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Conecte-se</h4>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(function(link) {
                return (
                  <NavLink
                    key={link.label}
                    href={link.href}
                    label={link.label}
                    variant="muted"
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                  />
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 max-w-xs">
              Feito com cuidado para empreendedores brasileiros.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderColor: 'var(--border-color, #e5e7eb)' }}>
          <p className="text-xs text-gray-400 text-center md:text-left">
            © {currentYear} Financia. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Status: <span className="font-mono text-green-600">Operacional</span></span>
            <a href="https://status.financiabr.me" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Página de status
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MobileFooter({ brand, onNav, currentView }) {
  var brandColor = (brand && brand.color) || 'var(--brand)';
  var brandColorHex = (brand && brand.color) || '#002f59';
  var items = [
    { key: 'dashboard', label: 'Início', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { key: 'income', label: 'Vendas', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { key: 'expense', label: 'Despesas', icon: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' },
    { key: 'report', label: 'Relatório', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  return (
    <footer
      role="contentinfo"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <nav aria-label="Navegação principal mobile" className="flex h-14">
        {items.map(function(item) {
          var active = currentView === item.key;
          return (
            <button
              key={item.key}
              onClick={function() { onNav(item.key); }}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0"
              style={{ color: active ? brandColor : 'var(--text-muted)' }}
            >
              {active && (
                <div className="absolute top-0 left-1/2 w-6 h-0.5 rounded-b-full transform -translate-x-1/2" style={{ background: brandColor }} />
              )}
              <div className="flex items-center justify-center rounded-lg transition-all" style={{ width: 32, height: 24, background: active ? brandAlpha(brandColorHex, 0.1) : 'transparent' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
              </div>
              <span className="truncate max-w-full px-0.5" style={{ fontSize: 9, fontWeight: active ? 600 : 400, lineHeight: '10px' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </footer>
  );
}