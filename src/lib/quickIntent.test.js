// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import { emitQuickIntent, consumeQuickIntent, getQuickIntent, clearQuickIntent, useQuickIntent } from './quickIntent.js';

describe('quickIntent', function() {
  beforeEach(function() { clearQuickIntent(); });
  afterEach(function() { cleanup(); clearQuickIntent(); });

  it('emite intencao e consome exatamente uma vez', function() {
    emitQuickIntent('income');
    expect(getQuickIntent().type).toBe('income');
    var consumed = consumeQuickIntent('income');
    expect(consumed.type).toBe('income');
    expect(consumeQuickIntent('income')).toBeNull();
  });

  it('nao consome intencao de tipo diferente', function() {
    emitQuickIntent('income');
    expect(consumeQuickIntent('expense')).toBeNull();
    expect(consumeQuickIntent('income')).not.toBeNull();
  });

  it('emissao subsequente gera nova intencao (seq diferente)', function() {
    var a = emitQuickIntent('income');
    var b = emitQuickIntent('income');
    expect(a.seq).not.toBe(b.seq);
    expect(consumeQuickIntent('income').seq).toBe(b.seq);
  });

  it('useQuickIntent dispara callback no mount quando ha intencao pendente', function() {
    emitQuickIntent('product');
    var calls = 0;
    function Harness() { useQuickIntent('product', function() { calls += 1; }); return null; }
    render(React.createElement(Harness));
    expect(calls).toBe(1);
  });

  it('useQuickIntent dispara callback quando evento chega', function() {
    var calls = 0;
    function Harness() { useQuickIntent('loss', function() { calls += 1; }); return null; }
    render(React.createElement(Harness));
    emitQuickIntent('loss');
    expect(calls).toBe(1);
    emitQuickIntent('loss');
    expect(calls).toBe(2);
  });

  it('useQuickIntent ignora intencao de outro tipo', function() {
    var calls = 0;
    function Harness() { useQuickIntent('expense', function() { calls += 1; }); return null; }
    render(React.createElement(Harness));
    emitQuickIntent('income');
    expect(calls).toBe(0);
    emitQuickIntent('expense');
    expect(calls).toBe(1);
  });

  it('dispara novamente para nova intencao apos consumo anterior', function() {
    emitQuickIntent('product');
    var calls = 0;
    function Harness() { useQuickIntent('product', function() { calls += 1; }); return null; }
    render(React.createElement(Harness));
    emitQuickIntent('product');
    expect(calls).toBe(2);
  });
});
