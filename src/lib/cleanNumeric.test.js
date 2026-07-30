import { describe, it, expect } from 'vitest';
import { cleanNumeric } from './utils.js';

describe('cleanNumeric', function() {
  it('caminho feliz: decimal valido passa intacto', function() {
    const r = cleanNumeric('12.50');
    expect(r.value).toBe('12.50');
    expect(r.invalid).toBe(false);
  });

  it('entrada invalida: letra/simbolo marca invalid e e removido', function() {
    const r = cleanNumeric('12a!');
    expect(r.value).toBe('12');
    expect(r.invalid).toBe(true);
  });

  it('normaliza virgula para ponto', function() {
    expect(cleanNumeric('12,5').value).toBe('12.5');
  });

  it('mantem apenas o primeiro separador decimal', function() {
    expect(cleanNumeric('1.2.3').value).toBe('1.23');
    expect(cleanNumeric('1,2,3').value).toBe('1.23');
  });

  it('limita o comprimento (anti-overflow de layout)', function() {
    const r = cleanNumeric('123456789012345', { maxLen: 12 });
    expect(r.value.length).toBe(12);
  });

  it('modo inteiro: remove ponto/virgula e marca invalid', function() {
    const r = cleanNumeric('10.5', { decimals: false });
    expect(r.value).toBe('105');
    expect(r.invalid).toBe(true);
  });

  it('entrada vazia / null: value vazio e valido', function() {
    expect(cleanNumeric('').value).toBe('');
    expect(cleanNumeric(null).value).toBe('');
    expect(cleanNumeric(null).invalid).toBe(false);
  });

  it('so simbolos invalidos: value vazio mas invalid=true', function() {
    const r = cleanNumeric('abc');
    expect(r.value).toBe('');
    expect(r.invalid).toBe(true);
  });
});

describe('cleanNumeric — entradas profundas e borda', function() {
  it('notacao cientifica remove letra e marca invalido', function() {
    const r = cleanNumeric('1e2');
    expect(r.value).toBe('12');
    expect(r.invalid).toBe(true);
  });
  it('numero negativo com virgula remove sinal e marca invalido', function() {
    const r = cleanNumeric('-12,5');
    expect(r.value).toBe('12.5');
    expect(r.invalid).toBe(true);
  });
  it('numero negativo com ponto remove sinal e marca invalido', function() {
    const r = cleanNumeric('-12.5');
    expect(r.value).toBe('12.5');
    expect(r.invalid).toBe(true);
  });
  it('multiplo ponto decimal corrige segundo', function() {
    const r = cleanNumeric('1.2.3.4');
    expect(r.value).toBe('1.234');
  });
  it('multiplo virgula decimal corrige segundo', function() {
    const r = cleanNumeric('1,2,3,4');
    expect(r.value).toBe('1.234');
  });
  it('formato BR ponto e virgula normaliza', function() {
    const r = cleanNumeric('123.456,78');
    expect(r.value).toBe('123456.78');
  });
  it('maxLen zero retorna string vazia', function() {
    const r = cleanNumeric('12345', { maxLen: 0 });
    expect(r.value).toBe('');
  });
  it('maxLen um mantem apenas primeiro digito', function() {
    const r = cleanNumeric('12345', { maxLen: 1 });
    expect(r.value).toBe('1');
    expect(r.invalid).toBe(false);
  });
  it('decimals false com ponto remove o ponto', function() {
    const r = cleanNumeric('12.5', { decimals: false });
    expect(r.value).toBe('125');
    expect(r.invalid).toBe(true);
  });
  it('espacos em branco sao removidos e marcam invalido', function() {
    const r = cleanNumeric('  12.5  ');
    expect(r.value).toBe('12.5');
    expect(r.invalid).toBe(true);
  });
  it('unicode digits nao sao interpretados como validos', function() {
    const r = cleanNumeric('١٢٣');
    expect(r.value).toBe('');
    expect(r.invalid).toBe(true);
  });
  it('string NaN invalido', function() {
    const r = cleanNumeric('NaN');
    expect(r.value).toBe('');
    expect(r.invalid).toBe(true);
  });
  it('Infinity invalido', function() {
    const r = cleanNumeric('Infinity');
    expect(r.value).toBe('');
    expect(r.invalid).toBe(true);
  });
  it('underscore no meio mantem como separador invalido', function() {
    const r = cleanNumeric('1_000.00');
    expect(r.value).toBe('1000.00');
    expect(r.invalid).toBe(true);
  });
  it('ponto flutuante sem digitos apos decimal mantem ponto', function() {
    const r = cleanNumeric('12.');
    expect(r.value).toBe('12.');
    expect(r.invalid).toBe(false);
  });
  it('ponto flutuante sem digitos antes do decimal mantem ponto', function() {
    const r = cleanNumeric('.5');
    expect(r.value).toBe('.5');
    expect(r.invalid).toBe(false);
  });
});
