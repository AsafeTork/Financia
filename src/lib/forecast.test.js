import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./dexie.js', () => ({
  ldb: {
    meta: {
      get: vi.fn(async (key) => undefined),
      put: vi.fn(async () => true),
    },
    transactions: { bulkGet: vi.fn(async () => []) },
  },
}));

import { ldb } from './dexie.js';
import {
  refToday,
  saldo,
  monthlyAverages,
  fixedEntries,
  forecastCashFlow,
  HORIZONS,
} from './forecast.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('saldo', () => {
  it('soma entradas e subtrai despesas', () => {
    expect(saldo([
      { type: 'income', amount: 5000 },
      { type: 'expense', amount: 1800 },
      { type: 'expense', amount: 200 },
    ])).toBe(3000);
  });
});

describe('monthlyAverages', () => {
  const REF = '2026-08-10';

  it('calcula médias dos últimos 3 meses excluindo recorrentes (id rec-)', () => {
    const tx = [
      { id: 'a', type: 'income', amount: 9000, date: '2026-07-15' },
      { id: 'b', type: 'income', amount: 3000, date: '2026-06-10' },
      { id: 'c', type: 'expense', amount: 1000, date: '2026-07-20' },
      { id: 'd', type: 'expense', amount: 1000, date: '2026-06-20' },
      { id: 'rec-x-2026-07', type: 'expense', amount: 5000, date: '2026-07-05' },
    ];
    const avg = monthlyAverages(tx, REF, 3);
    expect(avg.income).toBe(6000); // julho 9000 + junho 3000 / 2
    expect(avg.expense).toBe(1000); // recorrente de 5000 excluída
    expect(avg.months).toBe(2);
  });

  it('devolve zeros sem histórico', () => {
    expect(monthlyAverages([], '2026-08-10', 3)).toEqual({ income: 0, expense: 0, months: 0 });
  });
});

describe('fixedEntries', () => {
  it('gera entradas nas datas exatas dentro do horizonte', () => {
    const tpls = [{ id: 't1', desc: 'Aluguel', amount: 1500, day: 5, active: true }];
    const entries = fixedEntries(tpls, '2026-08-08', 90);
    expect(entries).toHaveLength(3); // set/out/nov (dia 05 de agosto já passou)
    expect(entries.map((e) => e.date)).toEqual(['2026-09-05', '2026-10-05', '2026-11-05']);
    expect(entries[0]).toMatchObject({ desc: 'Aluguel', amount: 1500, type: 'expense', category: 'Fixo' });
  });

  it('ignora templates inativos', () => {
    const tpls = [{ id: 't1', desc: 'Aluguel', amount: 1500, day: 5, active: false }];
    expect(fixedEntries(tpls, '2026-08-08', 90)).toHaveLength(0);
  });

  it('não inclui o vencimento do mês quando o dia já passou', () => {
    const tpls = [{ id: 't1', desc: 'Internet', amount: 100, day: 3, active: true }];
    const entries = fixedEntries(tpls, '2026-08-20', 40);
    expect(entries.map((e) => e.date)).toEqual(['2026-09-03']);
  });
});

describe('forecastCashFlow', () => {
  it('projeta saldo usando fixas e médias', async () => {
    ldb.meta.get.mockResolvedValueOnce({
      val: [
        { id: 't1', desc: 'Aluguel', amount: 1500, day: 5, category: 'Fixo', active: true },
        { id: 't2', desc: 'Internet', amount: 120, day: 10, category: 'Fixo', active: true },
      ],
    });
    const tx = [
      { id: 'a', type: 'income', amount: 8000, date: '2026-07-10' },
      { id: 'b', type: 'income', amount: 8000, date: '2026-06-10' },
      { id: 'c', type: 'expense', amount: 2000, date: '2026-07-20' },
      { id: 'd', type: 'expense', amount: 2000, date: '2026-06-20' },
    ];
    const f = await forecastCashFlow('u1', tx, { refDate: '2026-08-08' });
    expect(f.balance).toBe(12000);
    expect(f.months).toBe(2);
    expect(f.fixedCount).toBe(6); // 2 fixas x 3 meses
    expect(f.points.map((p) => p.days)).toEqual([30, 60, 90]);
    expect(f.points.every((p) => typeof p.balance === 'number')).toBe(true);
    expect(f.alerts).toEqual([]);
  });

  it('aponta alerta quando o saldo projeta negativo', async () => {
    ldb.meta.get.mockResolvedValueOnce({
      val: [{ id: 't1', desc: 'Boleto grande', amount: 5000, day: 5, active: true }],
    });
    const f = await forecastCashFlow('u1', [
      { id: 'a', type: 'income', amount: 1000, date: '2026-07-10' },
      { id: 'b', type: 'expense', amount: 2500, date: '2026-07-20' },
    ], { refDate: '2026-08-08' });
    expect(f.balance).toBe(-1500);
    expect(f.alerts.length).toBe(3);
  });

  it('não quebra sem templates e sem histórico', async () => {
    ldb.meta.get.mockResolvedValueOnce({ val: [] });
    const f = await forecastCashFlow('u1', [], { refDate: '2026-08-08' });
    expect(f.balance).toBe(0);
    expect(f.points.every((p) => p.balance === 0)).toBe(true);
    expect(f.fixedCount).toBe(0);
  });
});

describe('HORIZONS / refToday', () => {
  it('expõe 30/60/90 e refToday no formato YYYY-MM-DD', () => {
    expect(HORIZONS).toEqual([30, 60, 90]);
    expect(refToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});