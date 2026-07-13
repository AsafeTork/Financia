import { describe, it, expect } from 'vitest';
import { generateLogoSvg, logoSvgToDataUrl, buildCheckPath } from './logoUtils.js';
import { OFFICIAL_LOGO_COLORS, CHECK_NORM } from './defaults.js';

describe('LogoSchemes utilities', function() {

  describe('generateLogoSvg', function() {

    it('gera SVG valido com cores originais', function() {
      const svg = generateLogoSvg({});
      expect(svg).toContain('<svg width="400" height="400" viewBox="0 0 400 400"');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain(OFFICIAL_LOGO_COLORS.blue); // blue
      expect(svg).toContain(OFFICIAL_LOGO_COLORS.green); // green
      expect(svg).toContain(OFFICIAL_LOGO_COLORS.teal); // teal
      expect(svg).toContain(OFFICIAL_LOGO_COLORS.check); // check
    });

    it('aplica cores personalizadas', function() {
      const colors = { blue: '#ff0000', green: '#00ff00', teal: '#0000ff', check: '#ffff00' };
      const svg = generateLogoSvg(colors);
      expect(svg).toContain('#ff0000');
      expect(svg).toContain('#00ff00');
      expect(svg).toContain('#0000ff');
      expect(svg).toContain('#ffff00');
    });

    it('usa cores originais para campos ausentes', function() {
      const colors = { blue: '#ff0000' };
      const svg = generateLogoSvg(colors);
      expect(svg).toContain('#ff0000');
      expect(svg).toContain(OFFICIAL_LOGO_COLORS.green);
      expect(svg).toContain(OFFICIAL_LOGO_COLORS.teal);
      expect(svg).toContain(OFFICIAL_LOGO_COLORS.check);
    });

    it('retorna string SVG completa', function() {
      const svg = generateLogoSvg({});
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('contem 4 retangulos e 1 path', function() {
      const svg = generateLogoSvg({});
      const rectCount = (svg.match(/<rect/g) || []).length;
      const pathCount = (svg.match(/<path/g) || []).length;
      expect(rectCount).toBe(4);
      expect(pathCount).toBe(1);
    });

    it('tem retangulos com rx=10 para colunas', function() {
      const svg = generateLogoSvg({});
      expect(svg).toContain('rx="10"');
    });

    it('converte SVG para data URL', function() {
      const svg = generateLogoSvg({});
      const dataUrl = logoSvgToDataUrl(svg);
      expect(dataUrl.startsWith('data:image/svg+xml,')).toBe(true);
      expect(dataUrl).toContain(encodeURIComponent('<svg'));
    });

    it('codifica caracteres especiais', function() {
      const svg = '<svg><rect fill="#ff0000" /></svg>';
      const dataUrl = logoSvgToDataUrl(svg);
      expect(dataUrl).toContain('%23ff0000'); // # encoded
    });
  });

  describe('buildCheckPath', function() {
    it('retorna string de path SVG', function() {
      const path = buildCheckPath(197, 148);
      expect(typeof path).toBe('string');
      expect(path.startsWith('M ')).toBe(true);
    });

    it('escala coordenadas conforme largura e altura', function() {
      const path1 = buildCheckPath(100, 100);
      const path2 = buildCheckPath(200, 200);
      expect(path1).not.toBe(path2);
    });

    it('gera path com 8 pontos', function() {
      const path = buildCheckPath(197, 148);
      // Path has 8 points: M(1) + L(4) + C(3 points in one segment) = 8 coordinate pairs
      // Split by commands gives 7 segments, but we can count coordinate pairs
      const coordPairs = path.match(/-?\d+\.?\d*\s+-?\d+\.?\d*/g) || [];
      expect(coordPairs.length).toBe(8);
    });

    it('OFFICIAL_LOGO_COLORS contem as 4 cores esperadas', function() {
      expect(OFFICIAL_LOGO_COLORS).toHaveProperty('blue');
      expect(OFFICIAL_LOGO_COLORS).toHaveProperty('green');
      expect(OFFICIAL_LOGO_COLORS).toHaveProperty('teal');
      expect(OFFICIAL_LOGO_COLORS).toHaveProperty('check');
    });

    it('ELEMENTS_CONFIG tem 4 elementos', function() {
      expect(CHECK_NORM.length).toBe(8); // 8 points in normalized check path
    });
  });
});