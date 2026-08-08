import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./dexie.js', () => ({
  ldb: {
    meta: {
      get: vi.fn(async (key) => undefined),
      put: vi.fn(async () => true),
    },
  },
}));

vi.mock('./aiClient.js', () => ({
  askAI: vi.fn(async () => ({ ok: true, text: '{"0":"Fixo","1":"Marketing"}' })),
}));

import { ldb } from './dexie.js';
import { askAI } from './aiClient.js';
import {
  CATEGORIES,
  heuristica,
  applyRules,
  classifyRules,
  categorizeBatch,
  learnCategory,
  getRules,
} from './categorize.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('heuristica', () => {
  it('mapeia descricoes comuns de microempreendedores', () => {
    expect(heuristica('Aluguel da loja')).toBe('Fixo');
    expect(heuristica('conta de luz')).toBe('Fixo');
    expect(heuristica('ifood')).toBe('Variavel');
    expect(heuristica('combustível')).toBe('Variavel');
    expect(heuristica('fornecedor de grãos')).toBe('Estoque');
    expect(heuristica('meta ads')).toBe('Marketing');
    expect(heuristica('salário do funcionário')).toBe('Pessoal');
    expect(heuristica('contador mensal')).toBe('Servicos');
  });

  it('retorna null para desconhecidas e ignora acentos/caixa', () => {
    expect(heuristica('outra coisa qualquer')).toBeNull();
    expect(heuristica('')).toBeNull();
  });
});

describe('applyRules / classifyRules', () => {
  it('casa por chave normalizada', () => {
    const rules = { 'ifood almoco': 'Variavel' };
    expect(applyRules(rules, 'iFood almoço')).toBe('Variavel');
    expect(classifyRules(rules, 'pedido lanche')).toBeNull();
  });
});

describe('categorizeBatch', () => {
  it('usa regras locais primeiro, sem chamar IA', async () => {
    const rules = { 'aluguel': 'Fixo' };
    ldb.meta.get.mockResolvedValueOnce({ val: rules });
    const out = await categorizeBatch('u1', [{ id: 'a', desc: 'aluguel loja' }]);
    expect(out[0].category).toBe('Fixo');
    expect(askAI).not.toHaveBeenCalled();
  });

  it('usa heuristica antes da IA', async () => {
    ldb.meta.get.mockResolvedValue(undefined);
    const out = await categorizeBatch('u1', [{ id: 'a', desc: 'conta de luz' }]);
    expect(out[0].category).toBe('Fixo');
    expect(askAI).not.toHaveBeenCalled();
  });

  it('chama IA para o que sobra e aprende a resposta', async () => {
    ldb.meta.get.mockResolvedValue(undefined);
    const items = [{ id: 'a', desc: 'pedido 12345' }, { id: 'b', desc: 'xpto' }];
    const out = await categorizeBatch('u1', items);
    expect(askAI).toHaveBeenCalledTimes(1);
    expect(out.map((o) => o.category)).toEqual(['Fixo', 'Marketing']);
    expect(ldb.meta.put).toHaveBeenCalledWith(expect.objectContaining({ val: expect.objectContaining({ 'pedido 12345': 'Fixo', 'xpto': 'Marketing' }) }));
  });

  it('não quebra quando IA falha', async () => {
    askAI.mockResolvedValueOnce({ ok: false, error: 'missing_api_key' });
    ldb.meta.get.mockResolvedValue(undefined);
    const out = await categorizeBatch('u1', [{ id: 'a', desc: 'xpto' }]);
    expect(out[0].category).toBeNull();
  });
});

describe('learnCategory', () => {
  it('grava regra normalizada e preserva regras existentes', async () => {
    ldb.meta.get.mockResolvedValue({ val: { aluguel: 'Fixo' } });
    await learnCategory('u1', 'Seguro do carro', 'Fixo');
    expect(ldb.meta.put).toHaveBeenCalledWith(expect.objectContaining({
      val: expect.objectContaining({ aluguel: 'Fixo', 'seguro do carro': 'Fixo' }),
    }));
  });

  it('ignora entradas vazias', async () => {
    await learnCategory('', '', 'Fixo');
    expect(ldb.meta.put).not.toHaveBeenCalled();
  });

  it('getRules com erro devolve objeto vazio', async () => {
    ldb.meta.get.mockRejectedValueOnce(new Error('boom'));
    const rules = await getRules('u1');
    expect(rules).toEqual({});
  });
});

describe('CATEGORIES', () => {
  it('expõe 7 categorias do app', () => {
    expect(CATEGORIES).toHaveLength(7);
    expect(CATEGORIES).toContain('Outro');
  });
});