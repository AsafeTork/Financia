// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { generateLogoSvg, logoSvgToDataUrl, buildCheckPath } from './logoUtils.js';

describe('logoUtils - generateLogoSvg', function() {

  const ORIGINAL = { blue: '#002f59', green: '#1a6b5c', teal: '#6ec6c8', check: '#8cf2d1' };

  it('gera SVG valido com cores originais', function() {
    const svg = generateLogoSvg();
    expect(svg).toContain('<svg width="400" height="400" viewBox="0 0 400 400"');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain(ORIGINAL.blue);
    expect(svg).toContain(ORIGINAL.green);
    expect(svg).toContain(ORIGINAL.teal);
    expect(svg).toContain(ORIGINAL.check);
  });

  it('gera SVG com cores customizadas', function() {
    const colors = { blue: '#ff0000', green: '#00ff00', teal: '#0000ff', check: '#ffff00' };
    const svg = generateLogoSvg(colors);
    expect(svg).toContain('#ff0000');
    expect(svg).toContain('#00ff00');
    expect(svg).toContain('#0000ff');
    expect(svg).toContain('#ffff00');
  });

  it('usa cores originais para propriedades ausentes', function() {
    const colors = { blue: '#ff0000' };
    const svg = generateLogoSvg(colors);
    expect(svg).toContain('#ff0000');
    expect(svg).toContain(ORIGINAL.green);
    expect(svg).toContain(ORIGINAL.teal);
    expect(svg).toContain(ORIGINAL.check);
  });

  it('retorna string SVG', function() {
    const svg = generateLogoSvg();
    expect(typeof svg).toBe('string');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('contem 4 elementos retangulares (3 colunas + check + fundo)', function() {
    const svg = generateLogoSvg();
    const rectCount = (svg.match(/<rect/g) || []).length;
    expect(rectCount).toBe(4);
    expect(svg).toContain('<path');
  });

  it('elementos tem rx=10 para arredondamento', function() {
    const svg = generateLogoSvg();
    expect(svg).toContain('rx="10"');
  });

  it('contem fundo transparente', function() {
    const svg = generateLogoSvg();
    expect(svg).toContain('fill="transparent"');
  });
});

describe('logoUtils - logoSvgToDataUrl', function() {

  it('converte SVG para data URL', function() {
    const svg = '<svg>test</svg>';
    const dataUrl = logoSvgToDataUrl(svg);
    expect(dataUrl).toBe('data:image/svg+xml,%3Csvg%3Etest%3C%2Fsvg%3E');
  });

  it('codifica caracteres especiais', function() {
    const svg = '<svg fill="#ff0000">test</svg>';
    const dataUrl = logoSvgToDataUrl(svg);
    expect(dataUrl).toContain('%23ff0000');
  });

  it('retorna string', function() {
    const dataUrl = logoSvgToDataUrl('<svg/>');
    expect(typeof dataUrl).toBe('string');
    expect(dataUrl.startsWith('data:image/svg+xml,')).toBe(true);
  });
});

describe('logoUtils - buildCheckPath', function() {

  it('gera path string valido', function() {
    const path = buildCheckPath(197, 148);
    expect(typeof path).toBe('string');
    expect(path.startsWith('M ')).toBe(true);
  });

  it('contem comandos M, L, C, Z', function() {
    const path = buildCheckPath(197, 148);
    expect(path).toContain('M ');
    expect(path).toContain('L ');
    expect(path).toContain('C ');
    expect(path).toContain('Z');
  });

  it('usa dimensoes fornecidas', function() {
    const path = buildCheckPath(100, 50);
    expect(path).toContain('M ');
  });

  it('gera path nao vazio', function() {
    const path = buildCheckPath(10, 10);
    expect(path.length).toBeGreaterThan(0);
  });
});