import { describe, it, expect } from 'vitest';
import { countsAsRevenue } from './constants.js';

describe('countsAsRevenue', function() {
  it('pro pago via stripe => true', function() {
    expect(countsAsRevenue({ plan: 'pro', plan_activated_by: 'uuid-real' })).toBe(true);
  });
  it('pro ativado pelo admin => true (todo plano nao-free conta)', function() {
    expect(countsAsRevenue({ plan: 'pro', plan_activated_by: 'admin@x.com' })).toBe(true);
  });
  it('premium pago futuro => true', function() {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(countsAsRevenue({ plan: 'premium', plan_activated_by: 'uuid', plan_expires_at: future })).toBe(true);
  });
  it('free => false', function() { expect(countsAsRevenue({ plan: 'free' })).toBe(false); });
  it('null => false', function() { expect(countsAsRevenue(null)).toBe(false); });
});
