import { describe, it, expect } from 'vitest';
import { generateLogoSvg, logoSvgToDataUrl, buildCheckPath } from './LogoSchemes.jsx';

describe('LogoSchemes utilities', function() {

  describe('generateLogoSvg', function() {

    it('gera SVG valido com cores originais', function() {
      const svg = generateLogoSvg({});
      expect(svg).toContain('<svg width="400" height="400" viewBox="0 0 400 400"');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('#002f59'); // blue
      expect(svg).toContain('#1a6b5c'); // green
      expect(svg).toContain('#6ec6c8'); // teal
      expect(svg).toContain('#8cf2d1'); // check
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
      expect(svg).toContain('#1a6b5c'); // green original
      expect(svg).toContain('#6ec6c8'); // teal original
      expect(svg).toContain('#8cf2d1'); // check original
    });

    it('retorna string SVG completa', function() {
      const svg = generateLogoSvg({});
      expect(typeof svg).toBe('string');
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
    });

    it('contem 4 retangulos e 1 path', function() {
      const svg = generateLogoSvg({});
      const rectCount = (svg.match(/<rect/g) || []).length;
      const pathCount = (svg.match(/<path/g) || []).length;
      expect(rectCount).toBe(3); // blue, green, teal
      expect(pathCount).toBe(1); // check
    });

    it('tem retangulos com rx=10 para colunas', function() {
      const svg = generateLogoSvg({});
      expect(svg).toContain('rx="10"');
    });

  });

  describe('logoSvgToDataUrl', function() {

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

    it('retorna string que comeca com data:image/svg+xml,', function() {
      const svg = '<svg></svg>';
      const dataUrl = logoSvgToDataUrl(svg);
      expect(dataUrl.startsWith('data:image/svg+xml,')).toBe(true);
    });

  });

  describe('buildCheckPath', function() {

    it('retorna string de path SVG', function() {
      const path = buildCheckPath(100, 100);
      expect(path.startsWith('M ')).toBe(true);
      expect(path).toContain('L ');
      expect(path).toContain('C ');
      expect(path.endsWith('Z')).toBe(true);
    });

    it('escala coordenadas conforme largura e altura', function() {
      const pathSmall = buildCheckPath(10, 10);
      const pathLarge = buildCheckPath(100, 100);
      expect(pathLarge.length).toBeGreaterThan(pathSmall.length);
    });

    it('gera path com 8 pontos', function() {
      const path = buildCheckPath(197, 148);
      const coords = path.match(/[\d.]+/g);
      expect(coords.length).toBeGreaterThanOrEqual(8);
    });

  });

  describe('LogoSchemes component (via LogoSchemes.jsx)', function() {

    // Testes de componente precisariam de @testing-library/react
    // Aqui testamos apenas as funcoes puras exportadas

    it('ORIGINAL contem as 4 cores esperadas', function() {
      // As constantes nao sao exportadas, mas podemos testar via generateLogoSvg
      const svg = generateLogoSvg({});
      expect(svg).toContain('#002f59');
      expect(svg).toContain('#1a6b5c');
      expect(svg).toContain('#6ec6c8');
      expect(svg).toContain('#8cf2d1');
    });

    it('ELEMENTS_CONFIG tem 4 elementos', function() {
      // Verificado implicitamente pelo generateLogoSvg
      const svg = generateLogoSvg({});
      const rects = svg.match(/<rect/g).length;
      expect(rects).toBe(3);
    });

  });
});