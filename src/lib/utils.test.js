import { describe, it, expect } from 'vitest';
import { fmt, safe, deriveCores, brandAlpha } from './utils.js';

describe('fmt', function() {
  it('formata zero', function() {
    expect(fmt(0)).toBe('R$\xa00,00');
  });
  it('formata valor inteiro', function() {
    expect(fmt(1000)).toMatch(/1\.000,00/);
  });
  it('formata null como zero', function() {
    expect(fmt(null)).toBe('R$\xa00,00');
  });
  it('formata valor decimal', function() {
    expect(fmt(9.99)).toMatch(/9,99/);
  });
});

describe('safe', function() {
  it('remove tags HTML', function() {
    expect(safe(() => { throw new Error('<script>'); })).toBe('');
  });
  it('remove javascript:', function() {
    expect(safe(() => { throw new Error('javascript:alert(1)'); })).toBe('');
  });
  it('limita a 200 caracteres', function() {
    var long = Array(250).fill('a').join('');
    expect(safe(() => { throw new Error(long); }).length).toBe(200);
  });
  it('passa string normal sem alteracao', function() {
    expect(safe(() => 'abc')).toBe('abc');
  });
  it('trata null como string vazia', function() {
    expect(safe(() => { throw null; })).toBe('');
  });
  it('retorna string', function() {
    expect(typeof safe(() => { throw 123; })).toBe('string');
  });
});

describe('deriveCores', function() {
  it('retorna secondary e accent', function() {
    var r = deriveCores('#002f59');
    expect(r).toHaveProperty('secondary');
    expect(r).toHaveProperty('accent');
  });
  it('secondary e accent sao strings hex', function() {
    var r = deriveCores('#002f59');
    expect(r.secondary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(r.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });
  it('accent e mais claro que secondary', function() {
    var r = deriveCores('#002f59');
    var lumAccent = parseInt(r.accent.replace('#', ''), 16);
    var lumSecondary = parseInt(r.secondary.replace('#', ''), 16);
    expect(lumAccent).toBeGreaterThan(lumSecondary);
  });
  it('funciona com null (usa fallback)', function() {
    var r = deriveCores(null);
    expect(r.secondary).toBe('#6c757d');
    expect(r.accent).toBe('#0dcaf0');
  });
});

describe('brandAlpha', function() {
  it('retorna string rgba', function() {
    expect(brandAlpha('#002f59', 0.5)).toMatch(/^rgba\(\d+,\d+,\d+,0\.5\)$/);
  });
  it('inclui o alpha correto', function() {
    expect(brandAlpha('#002f59', 0.12)).toContain(',0.12)');
  });
});