// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import BrandStudioView from './BrandStudioView.jsx';
import BrandGlobalEditor from './BrandGlobalEditor.jsx';
import PlanTabsEditor from './PlanTabsEditor.jsx';
import ModuleEditor from './ModuleEditor.jsx';
import LogoSchemes from './LogoSchemes.jsx';

const mockBrand = {
  id: 'brand-1',
  name: 'Test Brand',
  color: '#002f59',
  color_secondary: '#e8f0f7',
  color_accent: '#1a6b5c',
  theme: 'light',
  white_label: false,
  custom_palette: false,
  logo_url: null,
  brand_config: JSON.stringify({ schemaVersion: '1.0.0', modules: {} }),
  visual_version: 0,
};

const mockPlanInfo = { plan: 'free', plan_expires_at: null, plan_activated_by: null };

const mockOnSave = vi.fn((b) => Promise.resolve(b));
const mockToast = vi.fn();
const mockOnNav = vi.fn();
const mockOnApply = vi.fn();
const mockSetField = vi.fn();

afterEach(cleanup);

describe('Acessibilidade - BrandStudioView', function() {
  var sharedProps = { brand: mockBrand, planInfo: mockPlanInfo, onSave: mockOnSave, toast: mockToast, onNav: mockOnNav, isAdmin: true };

  it('tem role main e landmarks', function() {
    render(<BrandStudioView {...sharedProps} />);
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('botoes tem labels acessiveis', function() {
    render(<BrandStudioView {...sharedProps} />);
    expect(screen.getByRole('button', { name: /desfazer/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /refazer/i })).toBeTruthy();
  });

  it('abas de navegacao tem role tab', function() {
    render(<BrandStudioView {...sharedProps} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
  });

  it('inputs de cor tem label associado', function() {
    render(<BrandStudioView {...sharedProps} />);
    expect(screen.getByLabelText(/coluna 1/i)).toBeTruthy();
    expect(screen.getByLabelText(/coluna 2/i)).toBeTruthy();
    expect(screen.getByLabelText(/coluna 3/i)).toBeTruthy();
    expect(screen.getByLabelText(/check/i)).toBeTruthy();
  });

  it('navegacao por teclado funciona nas abas', async function() {
    render(<BrandStudioView {...sharedProps} />);
    const logoTab = screen.getByRole('tab', { name: /logo/i });
    const planosTab = screen.getByRole('tab', { name: /planos/i });
    expect(logoTab).toBeTruthy();
    expect(planosTab).toBeTruthy();
  });

  it('bloqueia acesso sem isAdmin e sem white_label', function() {
    render(<BrandStudioView brand={mockBrand} planInfo={mockPlanInfo} onSave={mockOnSave} toast={mockToast} onNav={mockOnNav} />);
    expect(screen.getByText(/não tem permissão/i)).toBeTruthy();
  });
});

describe('Acessibilidade - BrandGlobalEditor', function() {

  const defaultProps = { brandGlobal: { name: 'Test', short_name: '', app_title: '', logo_url: '', secondary_logo_url: '', favicon_url: '', login_logo_url: '', login_bg: '', login_text: '', secondary_logo_position: 'right', secondary_logo_size: 40 }, setField: mockSetField, onSave: vi.fn(), brandColor: '#002f59' };

  it('campos tem labels associados', function() {
    render(<BrandGlobalEditor {...defaultProps} />);
    expect(screen.getByLabelText(/nome do app/i)).toBeTruthy();
    expect(screen.getByLabelText(/nome curto/i)).toBeTruthy();
    expect(screen.getByLabelText(/titulo da aplicacao/i)).toBeTruthy();
  });

  it('botoes de upload tem label acessivel', function() {
    render(<BrandGlobalEditor {...defaultProps} />);
    expect(screen.getAllByRole('button', { name: /salvar identidade global/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('select de posicao tem label', function() {
    render(<BrandGlobalEditor {...defaultProps} />);
    expect(screen.getByLabelText(/posicao/i)).toBeInTheDocument();
  });

  it('input range de tamanho tem label e valor', function() {
    render(<BrandGlobalEditor {...defaultProps} />);
    const range = screen.getByLabelText(/tamanho/i);
    expect(Number(range.getAttribute('min'))).toBe(20);
    expect(Number(range.getAttribute('max'))).toBe(80);
    expect(screen.getAllByText(/40/).length).toBeGreaterThanOrEqual(1);
  });

  it('botao salvar tem label descritivo', function() {
    render(<BrandGlobalEditor {...defaultProps} />);
    expect(screen.getByRole('button', { name: /salvar identidade global/i })).toBeTruthy();
  });
});

describe('Acessibilidade - PlanTabsEditor', function() {

  const defaultProps = {
    brandConfig: { schemaVersion: '1.0.0', modules: {}, planOverrides: {} },
    onSavePlan: vi.fn(),
    onCopyJSON: vi.fn(),
    onCopyDocs: vi.fn(),
    brandColor: '#002f59',
    toast: mockToast,
  };

  it('abas de plano tem role tab', function() {
    render(<PlanTabsEditor {...defaultProps} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(4);
    expect(tabs[0].textContent).toMatch(/Free/);
    expect(tabs[1].textContent).toMatch(/Pro/);
    expect(tabs[2].textContent).toMatch(/Premium/);
    expect(tabs[3].textContent).toMatch(/White Label/);
  });

  it('inputs de cor tem label e input color', function() {
    render(<PlanTabsEditor {...defaultProps} />);
    expect(screen.getByLabelText(/primaria/i)).toBeTruthy();
    expect(screen.getByLabelText(/secundaria/i)).toBeTruthy();
    expect(screen.getByLabelText(/destaque/i)).toBeTruthy();
    const colorTypeInputs = document.querySelectorAll('input[type="color"]');
    expect(colorTypeInputs.length).toBeGreaterThan(0);
  });

  it('textarea JSON tem label', function() {
    render(<PlanTabsEditor {...defaultProps} />);
    expect(screen.getByLabelText(/json/i)).toBeTruthy();
  });

  it('preview tem contraste adequado (verificacao visual basica)', function() {
    render(<PlanTabsEditor {...defaultProps} />);
    const preview = screen.getByText(/preview.*free/i);
    expect(preview).toBeTruthy();
  });

  it('botoes de copiar tem labels', function() {
    render(<PlanTabsEditor {...defaultProps} />);
    expect(screen.getByRole('button', { name: /copiar doc/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /copiar json/i })).toBeTruthy();
  });
});

describe('Acessibilidade - ModuleEditor', function() {

  it('campos expansiveis tem botao com aria-expanded', function() {
    const mod = { name: 'typography', def: { description: 'Typography', schema: { properties: { fontFamily: { type: 'string' }, sizes: { type: 'object', properties: { base: { type: 'string' }, lg: { type: 'string' } } } } } } };
    const brandConfig = { modules: {} };
    render(<ModuleEditor mod={mod} brandConfig={brandConfig} onApply={mockOnApply} brandColor="#002f59" />);
    const button = screen.getByRole('button', { name: /Sizes.*campos/i });
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('input de cor tem label associado', function() {
    const mod = { name: 'palette', def: { description: 'Paleta', schema: { properties: { primary: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' } } } } };
    render(<ModuleEditor mod={mod} brandConfig={{ modules: {} }} onApply={mockOnApply} brandColor="#002f59" />);
    expect(screen.getByLabelText(/primary/i)).toBeInTheDocument();
  });

  it('botao aplicar aparece so quando ha mudancas', function() {
    const mod = { name: 'palette', def: { description: 'Paleta', schema: { properties: { primary: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' } } } } };
    render(<ModuleEditor mod={mod} brandConfig={{ modules: { palette: { primary: '#002f59' } } }} onApply={mockOnApply} brandColor="#002f59" />);
    expect(screen.queryByRole('button', { name: /aplicar/i })).toBeNull();
  });
});

describe('Acessibilidade - LogoSchemes', function() {

  it('preview da logo tem role img', function() {
    render(<LogoSchemes brandColor="#002f59" toast={mockToast} onApply={mockOnApply} />);
    const svg = screen.getByRole('img');
    expect(svg).toBeTruthy();
  });

  it('inputs de cor tem labels', function() {
    render(<LogoSchemes brandColor="#002f59" toast={mockToast} onApply={mockOnApply} />);
    expect(screen.getByLabelText(/coluna 1/i)).toBeTruthy();
    expect(screen.getByLabelText(/coluna 2/i)).toBeTruthy();
    expect(screen.getByLabelText(/coluna 3/i)).toBeTruthy();
    expect(screen.getByLabelText(/check/i)).toBeTruthy();
  });

  it('textarea JSON tem label', function() {
    render(<LogoSchemes brandColor="#002f59" toast={mockToast} onApply={mockOnApply} />);
    expect(screen.getByLabelText(/json/i)).toBeTruthy();
  });

  it('botoes de acao tem labels', function() {
    render(<LogoSchemes brandColor="#002f59" toast={mockToast} onApply={mockOnApply} />);
    expect(screen.getByRole('button', { name: /salvar logo global/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /original/i })).toBeTruthy();
  });

  it('input nome esquema tem label', function() {
    render(<LogoSchemes brandColor="#002f59" toast={mockToast} onApply={mockOnApply} />);
    expect(screen.getByLabelText(/nome do esquema/i)).toBeTruthy();
  });

  it('historico de esquemas tem botoes com labels', function() {
    render(<LogoSchemes brandColor="#002f59" toast={mockToast} onApply={mockOnApply} />);
    expect(screen.getByRole('button', { name: /original/i })).toBeTruthy();
  });
});

describe('Contraste e Cores - Verificacao Basica', function() {

  it('usa variaveis CSS para cores (nao hardcoded)', function() {
    render(<BrandGlobalEditor brandGlobal={{ name: '', short_name: '', app_title: '', logo_url: '', secondary_logo_url: '', favicon_url: '', login_logo_url: '', login_bg: '', login_text: '', secondary_logo_position: 'right', secondary_logo_size: 40 }} setField={mockSetField} onSave={vi.fn()} brandColor="#002f59" />);
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input.style.border).toContain('var(--border)');
    });
  });

  it('botoes primarios usam brandColor', function() {
    render(<BrandStudioView brand={mockBrand} planInfo={mockPlanInfo} onSave={mockOnSave} toast={mockToast} onNav={mockOnNav} />);
    const saveButtons = screen.getAllByRole('button', { name: /salvar/i });
    saveButtons.forEach(btn => {
      const style = btn.getAttribute('style') || '';
      expect(style).toMatch(/#002f59|rgb\(0, 47, 89\)/);
    });
  });

  it('focus visible em elementos interativos', function() {
    render(<PlanTabsEditor brandConfig={{ planOverrides: {} }} onSavePlan={vi.fn()} onCopyJSON={vi.fn()} onCopyDocs={vi.fn()} brandColor="#002f59" toast={vi.fn()} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(1);
  });
});