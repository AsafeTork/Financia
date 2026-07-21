// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlanTabsEditor from './PlanTabsEditor.jsx';
import BrandGlobalEditor from './BrandGlobalEditor.jsx';
import ModuleEditor from './ModuleEditor.jsx';

const mockToast = vi.fn();
const mockOnSavePlan = vi.fn().mockResolvedValue({});
const mockOnCopyJSON = vi.fn();
const mockOnCopyDocs = vi.fn();

const defaultProps = {
  brandConfig: {
    schemaVersion: '1.0.0',
    modules: {},
    planOverrides: {},
  },
  onSavePlan: mockOnSavePlan,
  onCopyJSON: mockOnCopyJSON,
  onCopyDocs: mockOnCopyDocs,
  brandColor: '#002f59',
  toast: mockToast,
};

function resetMocks() {
  mockToast.mockClear();
  mockOnSavePlan.mockClear();
  mockOnCopyJSON.mockClear();
  mockOnCopyDocs.mockClear();
}

describe('PlanTabsEditor', function() {

  beforeEach(function() {
    resetMocks();
  });

  afterEach(function() {
  });

  it('renderiza abas dos planos', function() {
    render(<PlanTabsEditor {...defaultProps} />);
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('mostra paleta de cores para plano ativo', function() {
    render(<PlanTabsEditor {...defaultProps} />);
    const paletteText = screen.getAllByText(/paleta de cores.*free/i);
    expect(paletteText.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('Primaria')).toBeInTheDocument();
    expect(screen.getByLabelText('Secundaria')).toBeInTheDocument();
    expect(screen.getByLabelText('Destaque')).toBeInTheDocument();
  });

  it('muda plano ativo ao clicar na aba', async function() {
    const user = userEvent.setup();
    render(<PlanTabsEditor {...defaultProps} />);
    await user.click(screen.getByText('Pro'));
    expect(screen.getByText('Paleta de cores — Pro')).toBeInTheDocument();
  });

  it('atualiza cor ao mudar input color', async function() {
    const user = userEvent.setup();
    render(<PlanTabsEditor {...defaultProps} />);
    const colorInput = screen.getByLabelText('Primaria');
    await user.clear(colorInput);
    await user.type(colorInput, '#ff0000');
    expect(colorInput.value).toBe('#ff0000');
  });

  it('aplica JSON e atualiza form', async function() {
    const user = userEvent.setup();
    render(<PlanTabsEditor {...defaultProps} />);
    const jsonTextarea = screen.getByLabelText('JSON');
    const newJson = JSON.stringify({
      primary: '#111111',
      secondary: '#222222',
      accent: '#333333',
      bgPage: '#fafafa',
      bgCard: '#ffffff',
      bgInput: '#ffffff',
      bgSubtle: '#f5f5f5',
      surface: '#ffffff',
      textMain: '#111111',
      textSub: '#555555',
      textMuted: '#999999',
      border: '#eeeeee',
      success: '#16a34a',
      warning: '#f59e0b',
      danger: '#dc2626',
      info: '#2563eb',
    }, null, 2);
    await user.clear(jsonTextarea);
    await user.type(jsonTextarea, newJson);
    expect(screen.getByLabelText('Primaria').value).toBe('#111111');
  });

  it('salva configuracao do plano', async function() {
    const user = userEvent.setup();
    render(<PlanTabsEditor {...defaultProps} />);
    const colorInput = screen.getByLabelText('Primaria');
    await user.clear(colorInput);
    await user.type(colorInput, '#ff0000');
    const saveButton = screen.getByText('Salvar configuracao do plano Free');
    expect(saveButton.disabled).toBe(false);
    await user.click(saveButton);
    await waitFor(() => expect(mockOnSavePlan).toHaveBeenCalled());
    const call = mockOnSavePlan.mock.calls[0];
    expect(call[0]).toBe('free');
    expect(call[1]).toHaveProperty('modules.palette');
    expect(mockToast).toHaveBeenCalledWith('Cores salvas para plano free', 'success');
  });

  it('mostra preview com cores atuais', function() {
    render(<PlanTabsEditor {...defaultProps} />);
    expect(screen.getByText('Preview — Free')).toBeInTheDocument();
    // Preview elements
    expect(screen.getByText('Financia')).toBeInTheDocument();
    expect(screen.getByText('Salvar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('NOVO')).toBeInTheDocument();
    expect(screen.getByText('ATIVO')).toBeInTheDocument();
  });

  it('copia JSON ao clicar botao', async function() {
    const user = userEvent.setup();
    render(<PlanTabsEditor {...defaultProps} />);
    await user.click(screen.getByText('Copiar JSON'));
    expect(mockOnCopyJSON).toHaveBeenCalled();
  });

  it('copia doc ao clicar botao', async function() {
    const user = userEvent.setup();
    render(<PlanTabsEditor {...defaultProps} />);
    await user.click(screen.getByText('Copiar doc'));
    expect(mockOnCopyDocs).toHaveBeenCalled();
  });

  it('desabilita botao salvar quando sem mudancas', function() {
    render(<PlanTabsEditor {...defaultProps} />);
    const saveButton = screen.getByText('Salvar configuracao do plano Free');
    expect(saveButton.disabled).toBe(true);
  });

  it('habilita botao salvar apos mudanca', async function() {
    const user = userEvent.setup();
    render(<PlanTabsEditor {...defaultProps} />);
    const colorInput = screen.getByLabelText('Primaria');
    await user.clear(colorInput);
    await user.type(colorInput, '#ff0000');
    const saveButton = screen.getByText('Salvar configuracao do plano Free');
    expect(saveButton.disabled).toBe(false);
  });
});

describe('BrandGlobalEditor', function() {

  beforeEach(function() {
    resetMocks();
  });

  it('renderiza campos de informacoes da marca', function() {
    const brandGlobal = { name: 'Test', short_name: 'TS', app_title: 'App Title' };
    const setField = vi.fn();
    render(<BrandGlobalEditor brandGlobal={brandGlobal} setField={setField} onSave={mockOnSavePlan} brandColor="#002f59" />);
    expect(screen.getByLabelText('Nome do app')).toHaveValue('Test');
    expect(screen.getByLabelText('Nome curto (abreviacao)')).toHaveValue('TS');
    expect(screen.getByLabelText('Titulo da aplicacao (aba do navegador)')).toHaveValue('App Title');
  });

  it('atualiza campo ao digitar', async function() {
    const user = userEvent.setup();
    const brandGlobal = { name: 'Test', short_name: '', app_title: '' };
    const setField = vi.fn();
    render(<BrandGlobalEditor brandGlobal={brandGlobal} setField={setField} onSave={mockOnSavePlan} brandColor="#002f59" />);
    const input = screen.getByLabelText('Nome do app');
    await user.clear(input);
    await user.type(input, 'Novo Nome');
    expect(setField).toHaveBeenCalledWith('name', 'Novo Nome');
  });

  it('renderiza upload de logos', function() {
    const brandGlobal = { logo_url: '', favicon_url: '', login_logo_url: '', secondary_logo_url: '' };
    const setField = vi.fn();
    render(<BrandGlobalEditor brandGlobal={brandGlobal} setField={setField} onSave={mockOnSavePlan} brandColor="#002f59" />);
    expect(screen.getByText('Logo principal')).toBeInTheDocument();
    expect(screen.getByText('Favicon')).toBeInTheDocument();
    expect(screen.getByText('Logo da tela de login')).toBeInTheDocument();
    expect(screen.getByText('Segunda logo')).toBeInTheDocument();
  });

  it('mostra preview da logo quando ha valor', function() {
    const brandGlobal = { logo_url: 'data:image/png;base64,abc' };
    const setField = vi.fn();
    render(<BrandGlobalEditor brandGlobal={brandGlobal} setField={setField} onSave={mockOnSavePlan} brandColor="#002f59" />);
    const img = screen.getByAltText('Logo principal');
    expect(img.src).toContain('data:image/png;base64,abc');
  });

  it('renderiza controles de segunda logo', function() {
    const brandGlobal = { secondary_logo_url: '', secondary_logo_position: 'right', secondary_logo_size: 40 };
    const setField = vi.fn();
    render(<BrandGlobalEditor brandGlobal={brandGlobal} setField={setField} onSave={mockOnSavePlan} brandColor="#002f59" />);
    expect(screen.getByText('Posicao')).toBeInTheDocument();
    expect(screen.getByText('Tamanho (px)')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('right');
    expect(screen.getByRole('slider')).toHaveValue('40');
  });

  it('salva identidade global ao clicar botao', async function() {
    const user = userEvent.setup();
    const brandGlobal = { name: 'Test' };
    const setField = vi.fn();
    render(<BrandGlobalEditor brandGlobal={brandGlobal} setField={setField} onSave={mockOnSavePlan} brandColor="#002f59" />);
    await user.click(screen.getByText('Salvar identidade global'));
    expect(mockOnSavePlan).toHaveBeenCalled();
  });

  it('remove logo ao clicar remover', async function() {
    const user = userEvent.setup();
    const brandGlobal = { logo_url: 'data:image/png;base64,abc' };
    const setField = vi.fn();
    render(<BrandGlobalEditor brandGlobal={brandGlobal} setField={setField} onSave={mockOnSavePlan} brandColor="#002f59" />);
    await user.click(screen.getByText('Remover'));
    expect(setField).toHaveBeenCalledWith('logo_url', '');
  });
});

describe('ModuleEditor', function() {

  beforeEach(function() {
    resetMocks();
  });

  it('renderiza campos do modulo', function() {
    const mod = {
      name: 'palette',
      def: {
        description: 'Paleta de cores',
        schema: {
          properties: {
            primary: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
            secondary: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
            mode: { type: 'string', enum: ['light', 'dark'] },
          },
        },
      },
    };
    const brandConfig = { modules: { palette: { primary: '#ff0000', secondary: '#ffe0e0', mode: 'light' } } };
    const onApply = vi.fn();
    render(<ModuleEditor mod={mod} brandConfig={brandConfig} onApply={onApply} brandColor="#002f59" />);
    expect(screen.getByLabelText('Primary')).toBeInTheDocument();
    expect(screen.getByLabelText('Secondary')).toBeInTheDocument();
    expect(screen.getByLabelText('Mode')).toBeInTheDocument();
  });

  it('renderiza color input para campos hex', function() {
    const mod = {
      name: 'palette',
      def: { schema: { properties: { primary: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' } } } },
    };
    const onApply = vi.fn();
    render(<ModuleEditor mod={mod} brandConfig={{ modules: {} }} onApply={onApply} brandColor="#002f59" />);
    expect(screen.getByLabelText('Primary')).toBeInTheDocument();
  });

  it('renderiza input text para enum', function() {
    const mod = {
      name: 'palette',
      def: { schema: { properties: { mode: { type: 'string', enum: ['light', 'dark'] } } } },
    };
    const onApply = vi.fn();
    render(<ModuleEditor mod={mod} brandConfig={{ modules: {} }} onApply={onApply} brandColor="#002f59" />);
    expect(screen.getByLabelText('Mode')).toBeInTheDocument();
  });

  it('renderiza range para number com min/max', function() {
    const mod = {
      name: 'spacing',
      def: { schema: { properties: { unit: { type: 'integer', minimum: 2, maximum: 12 } } } },
    };
    const onApply = vi.fn();
    render(<ModuleEditor mod={mod} brandConfig={{ modules: {} }} onApply={onApply} brandColor="#002f59" />);
    expect(screen.getByLabelText('Unit')).toBeInTheDocument();
  });

  it('renderiza checkbox para boolean', function() {
    const mod = {
      name: 'animations',
      def: { schema: { properties: { enabled: { type: 'boolean' } } } },
    };
    const onApply = vi.fn();
    render(<ModuleEditor mod={mod} brandConfig={{ modules: {} }} onApply={onApply} brandColor="#002f59" />);
    expect(screen.getByRole('checkbox', { name: /enabled/i })).toBeInTheDocument();
  });

  it('renderiza upload para URL', function() {
    const mod = {
      name: 'logo',
      def: { schema: { properties: { url: { type: 'string' } } } },
    };
    const onApply = vi.fn();
    render(<ModuleEditor mod={mod} brandConfig={{ modules: {} }} onApply={onApply} brandColor="#002f59" />);
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('mostra botao aplicar quando ha mudancas', async function() {
    const user = userEvent.setup();
    const mod = {
      name: 'palette',
      def: { description: 'Paleta de cores', schema: { properties: { primary: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' } } } },
    };
    const brandConfig = { modules: { palette: { primary: '#002f59' } } };
    const onApply = vi.fn();
    render(<ModuleEditor mod={mod} brandConfig={brandConfig} onApply={onApply} brandColor="#002f59" />);
    const primaryInput = screen.getByLabelText('Primary');
    await user.clear(primaryInput);
    await user.type(primaryInput, '#ff0000');
    expect(screen.getByText('Aplicar Paleta de cores')).toBeInTheDocument();
  });

  it('expande objetos aninhados', function() {
    const mod = {
      name: 'typography',
      def: {
        schema: {
          properties: {
            fontFamily: { type: 'string' },
            sizes: {
              type: 'object',
              properties: { base: { type: 'string' }, lg: { type: 'string' } },
            },
          },
        },
      },
    };
    const onApply = vi.fn();
    render(<ModuleEditor mod={mod} brandConfig={{ modules: {} }} onApply={onApply} brandColor="#002f59" />);
    expect(screen.getByText('Font Family')).toBeInTheDocument();
    expect(screen.getByText('Sizes (2 campos)')).toBeInTheDocument();
  });
});