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
    const long = Array(250).fill('a').join('');
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
    const r = deriveCores('#002f59');
    expect(r).toHaveProperty('secondary');
    expect(r).toHaveProperty('accent');
  });
  it('secondary e accent sao strings hex', function() {
    const r = deriveCores('#002f59');
    expect(r.secondary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(r.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });
  it('accent e mais claro que secondary', function() {
    const r = deriveCores('#002f59');
    const lumAccent = parseInt(r.accent.replace('#', ''), 16);
    const lumSecondary = parseInt(r.secondary.replace('#', ''), 16);
    expect(lumAccent).toBeGreaterThan(lumSecondary);
  });
  it('funciona com null (usa fallback)', function() {
    const r = deriveCores(null);
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
describe('safe — entradas extremas', function() {
  it('tira tag script de string enorme com XSS', function() {
    const payload = '<script>alert("xss")</script>' + 'A'.repeat(300);
    const result = safe(function() { throw new Error(payload); });
    expect(result.includes('<script>')).toBe(false);
    expect(result.includes('alert')).toBe(false);
  });
  it('trata onerror= dentro de atributo', function() {
    const result = safe(() => { throw new Error('<img onerror=alert(1) src=x>'); });
    expect(result.includes('onerror')).toBe(false);
  });
  it('trata entrada com Newline Injection', function() {
    const result = safe(() => { throw new Error('line1\nline2\n<script>'); });
    expect(result.includes('<script>')).toBe(false);
  });
});

describe('deriveCores — inputs borda', function() {
  it('aceita hex com 3 caracteres', function() {
    const r = deriveCores('#fff');
    expect(r.secondary).toBeTruthy();
    expect(r.accent).toBeTruthy();
  });
  it('aceita hex maiusculo', function() {
    const r = deriveCores('#002F59');
    expect(r.secondary).toBeTruthy();
    expect(r.accent).toBeTruthy();
  });
  it('aceita hex com # faltando', function() {
    const r = deriveCores('002f59');
    expect(r.primary).toBeTruthy();
  });
  it('branco puro usa fallback', function() {
    const r = deriveCores('#ffffff');
    expect(r.primary).toBe('#002f59');
  });
});

describe('brandAlpha — alfas extremos', function() {
  it('alpha 0 retorna rgba transparente', function() {
    expect(brandAlpha('#002f59', 0)).toBe('rgba(0,47,89,0)');
  });
  it('alpha 1 retorna opaco', function() {
    expect(brandAlpha('#002f59', 1)).toBe('rgba(0,47,89,1)');
  });
  it('alpha negativo e tratado como zero', function() {
    const result = brandAlpha('#002f59', -0.5);
    expect(result).toBe('rgba(0,47,89,0)');
  });
  it('alpha maior que 1 e tratado como 1', function() {
    const result = brandAlpha('#002f59', 2);
    expect(result).toBe('rgba(0,47,89,1)');
  });
  it('hex curto #000 funciona', function() {
    expect(brandAlpha('#000', 0.5)).toBe('rgba(0,0,0,0.5)');
  });
});
