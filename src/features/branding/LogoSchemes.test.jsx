// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { generateLogoSvg, logoSvgToDataUrl } from './LogoSchemes.jsx';

describe('LogoSchemes - generateLogoSvg', function() {

  it('gera SVG com cores padrao', function() {
    const svg = generateLogoSvg();
    expect(svg).toContain('<svg width="400" height="400" viewBox="0 0 400 400"');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('#002f59'); // blue
    expect(svg).toContain('#1a6b5c'); // green
    expect(svg).toContain('#6ec6c8'); // teal
    expect(svg).toContain('#8cf2d1'); // check
  });

  it('gera SVG com cores customizadas', function() {
    const colors = { blue: '#ff0000', green: '#00ff00', teal: '#0000ff', check: '#ffff00' };
    const svg = generateLogoSvg(colors);
    expect(svg).toContain('#ff0000');
    expect(svg).toContain('#00ff00');
    expect(svg).toContain('#0000ff');
    expect(svg).toContain('#ffff00');
  });

  it('usa cor padrao quando cor nao fornecida', function() {
    const colors = { blue: '#ff0000' };
    const svg = generateLogoSvg(colors);
    expect(svg).toContain('#ff0000');
    expect(svg).toContain('#1a6b5c'); // default green
    expect(svg).toContain('#6ec6c8'); // default teal
    expect(svg).toContain('#8cf2d1'); // default check
  });

  it('gera SVG valido com estrutura correta', function() {
    const svg = generateLogoSvg();
    expect(svg).toContain('<rect width="400" height="400" fill="transparent"/>');
    expect(svg).toContain('transform="translate(34,200)"');
    expect(svg).toContain('transform="translate(134,129)"');
    expect(svg).toContain('transform="translate(234,75)"');
    expect(svg).toContain('transform="translate(169,126)"');
  });

  it('inclui path do check mark', function() {
    const svg = generateLogoSvg();
    expect(svg).toContain('<path d="');
    expect(svg).toContain('Z"');
  });
});

describe('LogoSchemes - logoSvgToDataUrl', function() {

  it('converte SVG para data URL', function() {
    const svg = '<svg>test</svg>';
    const dataUrl = logoSvgToDataUrl(svg);
    expect(dataUrl).toBe('data:image/svg+xml,%3Csvg%3Etest%3C%2Fsvg%3E');
  });

  it('codifica caracteres especiais', function() {
    const svg = '<svg width="400" height="400"><rect fill="#ff0000"/></svg>';
    const dataUrl = logoSvgToDataUrl(svg);
    expect(dataUrl).toContain('%23ff0000');
    expect(dataUrl).toContain('%22');
  });

  it('retorna string nao vazia', function() {
    const dataUrl = logoSvgToDataUrl('<svg/>');
    expect(typeof dataUrl).toBe('string');
    expect(dataUrl.length).toBeGreaterThan(0);
    expect(dataUrl.startsWith('data:image/svg+xml,')).toBe(true);
  });
});

describe('LogoSchemes - buildCheckPath (internal)', function() {
  // buildCheckPath is not exported, but we test via generateLogoSvg

  it('gera path valido para check mark', function() {
    const svg = generateLogoSvg({ check: '#ff0000' });
    const pathMatch = svg.match(/<path d="([^"]+)"/);
    expect(pathMatch).not.toBeNull();
    const pathData = pathMatch[1];
    expect(pathData).toContain('M ');
    expect(pathData).toContain('L ');
    expect(pathData).toContain('C ');
    expect(pathData).toContain('Z');
  });
});