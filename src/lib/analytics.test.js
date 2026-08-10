import { beforeEach, describe, expect, it, vi } from 'vitest';

var insert = vi.fn();
vi.mock('./supabase.js', function() {
  return { sb: { from: vi.fn(function() { return { insert: insert }; }) } };
});

import { flushAnalytics, trackEvent, trackEventOnce } from './analytics.js';

describe('product analytics', function() {
  beforeEach(function() {
    localStorage.clear();
    sessionStorage.clear();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    insert.mockReset();
    insert.mockResolvedValue({ error: null });
  });

  it('deduplica marcos de funil por sessao', async function() {
    trackEventOnce('landing_view', 'session');
    trackEventOnce('landing_view', 'session');
    await flushAnalytics();

    expect(insert).toHaveBeenCalledOnce();
    expect(insert.mock.calls[0][0]).toMatchObject({
      event_name: 'landing_view',
      properties: {},
    });
  });

  it('limita propriedades e nao envia PII de cadastro', async function() {
    trackEvent('landing_cta_click', {
      placement: 'hero',
      email: 'cliente@example.com',
      name: 'Cliente',
      count: 1,
    });
    await flushAnalytics();

    expect(insert.mock.calls[0][0].properties).toEqual({
      placement: 'hero',
      count: 1,
    });
  });

  it('mantem evento offline e envia quando a conexao volta', async function() {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    trackEvent('first_sale', { source: 'test' });
    await flushAnalytics();
    expect(insert).not.toHaveBeenCalled();

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    await flushAnalytics();
    expect(insert).toHaveBeenCalledOnce();
  });
});
