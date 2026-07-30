import { describe, it, expect } from 'vitest';
import { effectivePlan, limitFor, atLimit, PLAN_LIMITS } from './constants.js';

const FREE = { plan: 'free', plan_expires_at: null };
const PRO  = { plan: 'pro',  plan_expires_at: null };
const PRO_EXPIRED = { plan: 'pro', plan_expires_at: '2000-01-01T00:00:00Z' };
const PRO_ACTIVE  = { plan: 'pro', plan_expires_at: '2099-01-01T00:00:00Z' };

describe('effectivePlan', function() {
  it('retorna free para plano free', function() {
    expect(effectivePlan(FREE)).toBe('free');
  });
  it('retorna pro sem expiracao', function() {
    expect(effectivePlan(PRO)).toBe('pro');
  });
  it('retorna pro com data futura', function() {
    expect(effectivePlan(PRO_ACTIVE)).toBe('pro');
  });
  it('retorna free para pro expirado', function() {
    expect(effectivePlan(PRO_EXPIRED)).toBe('free');
  });
  it('retorna free para null', function() {
    expect(effectivePlan(null)).toBe('free');
  });
});

describe('limitFor', function() {
  it('retorna limite correto para free/transactions', function() {
    expect(limitFor(FREE, 'transactions')).toBe(PLAN_LIMITS.free.transactions);
  });
  it('retorna Infinity para pro/products', function() {
    expect(limitFor(PRO, 'products')).toBe(Infinity);
  });
});

describe('atLimit', function() {
  it('detecta limite atingido no free', function() {
    expect(atLimit(FREE, 'transactions', 50)).toBe(true);
  });
  it('false antes do limite', function() {
    expect(atLimit(FREE, 'transactions', 49)).toBe(false);
  });
  it('nunca atinge limite no pro', function() {
    expect(atLimit(PRO, 'transactions', 999999)).toBe(false);
  });
  it('detecta limite de produtos', function() {
    expect(atLimit(FREE, 'products', 20)).toBe(true);
  });
  it('detecta limite de perdas', function() {
    expect(atLimit(FREE, 'losses', 10)).toBe(true);
  });
});

describe('effectivePlan — inputs borda', function() {
  it('handle string de data malformada', function() {
    expect(effectivePlan({ plan: 'pro', plan_expires_at: 'not-a-date' })).toBe('free');
  });
  it('handle date invalid object', function() {
    expect(effectivePlan({ plan: 'pro', plan_expires_at: new Date('invalid') })).toBe('free');
  });
  it('data de expiracao no exato momento (edge timezone)', function() {
    const now = new Date().toISOString();
    expect(effectivePlan({ plan: 'pro', plan_expires_at: now })).toBe('free');
  });
  it('plan undefined retorna free', function() {
    expect(effectivePlan(undefined)).toBe('free');
  });
  it('plan empty string retorna free', function() {
    expect(effectivePlan({ plan: '', plan_expires_at: null })).toBe('free');
  });
  it('plan vazio mas pro com data futura', function() {
    expect(effectivePlan({ plan: 'pro', plan_expires_at: '2099-12-31T00:00:00.000Z' })).toBe('pro');
  });
});

describe('limitFor — planos borda', function() {
  it('undefined plan usa free', function() {
    expect(limitFor(undefined, 'transactions')).toBe(50);
  });
  it('plan vazio usa free', function() {
    expect(limitFor({ plan: '' }, 'transactions')).toBe(50);
  });
  it('plan desconhecido usa free', function() {
    expect(limitFor({ plan: 'enterprise' }, 'transactions')).toBe(50);
  });
  it('categoria desconhecida retorna Infinity', function() {
    expect(limitFor(FREE, 'unknown-category')).toBe(Infinity);
  });
  it('retorna numero finito para todas as categorias conhecidas no free', function() {
    expect(isFinite(limitFor(FREE, 'transactions'))).toBe(true);
    expect(isFinite(limitFor(FREE, 'products'))).toBe(true);
    expect(isFinite(limitFor(FREE, 'losses'))).toBe(true);
  });
});

describe('atLimit — edge cases', function() {
  it('valor negativo nunca atinge limite', function() {
    expect(atLimit(FREE, 'transactions', -1)).toBe(false);
  });
  it('valor zero nao atinge limite (conta a partir de 1)', function() {
    expect(atLimit(FREE, 'transactions', 0)).toBe(false);
  });
  it('exatamente no limite retorna true', function() {
    expect(atLimit(FREE, 'transactions', 50)).toBe(true);
  });
  it('limite de produtos com valor 0', function() {
    expect(atLimit(FREE, 'products', 0)).toBe(false);
  });
  it('pro com limite muito grande', function() {
    expect(atLimit(PRO, 'transactions', 1000000)).toBe(false);
  });
  it('handle Infinity retorna false', function() {
    expect(atLimit(FREE, 'transactions', Infinity)).toBe(false);
  });
  it('NaN nao atinge limite', function() {
    expect(atLimit(FREE, 'transactions', NaN)).toBe(false);
  });
});
