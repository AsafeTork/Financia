// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBrandManager } from './useBrandManager.js';
import { INIT_BRAND } from '../../lib/constants.js';

const profilesGetMock = vi.fn();
const profilesPutMock = vi.fn();
const profilesUpdateMock = vi.fn();
const upsertMock = vi.fn();
const updateEqMock = vi.fn();
const updateBrandConfigMock = vi.fn();
const nowMock = vi.fn(function() { return '2026-01-01T00:00:00.000Z'; });

vi.mock('../../lib/dexie.js', function() {
  return {
    ldb: {
      profiles: {
        get: function() { return profilesGetMock.apply(this, arguments); },
        put: function() { return profilesPutMock.apply(this, arguments); },
        update: function() { return profilesUpdateMock.apply(this, arguments); },
      },
    },
  };
});

vi.mock('../../lib/supabase.js', function() {
  return {
    sb: {
      from: vi.fn(function(table) {
        return {
          upsert: function() { return upsertMock.apply(this, arguments); },
          update: function() { return { eq: function() { return updateEqMock.apply(this, arguments); } }; },
        };
      }),
    },
  };
});

vi.mock('../../lib/utils.js', function() {
  return { now: function() { return nowMock.apply(this, arguments); } };
});

vi.mock('../../features/branding/responseProcessor.js', function() {
  return { updateBrandConfig: function() { return updateBrandConfigMock.apply(this, arguments); } };
});

const session = { user: { id: 'u1', email: 'a@b.com', user_metadata: { name: 'Teste' } } };

function makeHook() {
  let brand = Object.assign({}, INIT_BRAND);
  const toast = vi.fn();
  const setBrand = vi.fn(function(u) { brand = typeof u === 'function' ? u(brand) : u; });
  const hook = renderHook(function() { return useBrandManager({ session: session, toast: toast, setBrand: setBrand }); });
  return { hook: hook, toast: toast, setBrand: setBrand, getBrand: function() { return brand; } };
}

function makeBrand(overrides) {
  return Object.assign({ name: 'Loja', logo: 'L', color: '#123456', color_secondary: '#abcdef', color_accent: '#654321', theme: 'light', white_label: true, niche: '', logo_url: null }, overrides || {});
}

describe('useBrandManager — saveBrand', function() {
  beforeEach(function() {
    profilesGetMock.mockReset();
    profilesGetMock.mockResolvedValue(null);
    profilesPutMock.mockReset();
    profilesPutMock.mockResolvedValue(undefined);
    profilesUpdateMock.mockReset();
    profilesUpdateMock.mockResolvedValue(undefined);
    upsertMock.mockReset();
    upsertMock.mockResolvedValue({ error: null });
    updateEqMock.mockReset();
    updateEqMock.mockResolvedValue({ error: null });
    updateBrandConfigMock.mockReset();
    updateBrandConfigMock.mockResolvedValue({ ok: true });
    var _onLine = false;
    Object.defineProperty(navigator, 'onLine', { get: function() { return _onLine; }, set: function(v) { _onLine = v; }, configurable: true });
    Object.defineProperty(navigator, 'serviceWorker', { value: { controller: null }, configurable: true });
  });

  it('offline: salva localmente, atualiza brand e toast de sucesso', async function() {
    const { hook, toast, getBrand } = makeHook();
    await act(async function() { await hook.result.current.saveBrand(makeBrand({ name: 'Nova Loja', color: '#ff6600', white_label: true })); });
    expect(profilesPutMock).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u1', name: 'Nova Loja' }));
    expect(upsertMock).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith('Configurações salvas', 'success');
    expect(getBrand().name).toBe('Nova Loja');
    expect(getBrand().color).toBe('#ff6600');
  });

  it('sem white-label usa cores do plano visual', async function() {
    const { hook, getBrand } = makeHook();
    await act(async function() { await hook.result.current.saveBrand(makeBrand({ white_label: false })); });
    expect(getBrand().color).toBe('#0f3d3e');
  });

  it('hex invalido cai para #002f59', async function() {
    const { hook, getBrand } = makeHook();
    await act(async function() { await hook.result.current.saveBrand(makeBrand({ color: 'red', white_label: true })); });
    expect(getBrand().color).toBe('#002f59');
  });

  it('color_secondary invalido vira null', async function() {
    const { hook, getBrand } = makeHook();
    await act(async function() { await hook.result.current.saveBrand(makeBrand({ color_secondary: 'azul', white_label: true })); });
    expect(getBrand().color_secondary).toBeNull();
  });

  it('online com sucesso: faz upsert e marca _synced 1', async function() {
    navigator.onLine = true;
    const { hook } = makeHook();
    await act(async function() { await hook.result.current.saveBrand(makeBrand()); });
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u1', name: 'Loja' }));
    expect(profilesUpdateMock).toHaveBeenCalledWith('u1', expect.objectContaining({ _synced: 1 }));
  });

  it('upsert com erro -> toast warning de nao sincronizado', async function() {
    navigator.onLine = true;
    upsertMock.mockResolvedValueOnce({ error: new Error('offline') });
    const { hook, toast } = makeHook();
    await act(async function() { await hook.result.current.saveBrand(makeBrand()); });
    expect(toast).toHaveBeenCalledWith('Não sincronizado — tentaremos em breve', 'warning');
  });

  it('brand_config presente: chama updateBrandConfig', async function() {
    navigator.onLine = true;
    const bc = { palette: { bgPage: '#111' } };
    const { hook } = makeHook();
    await act(async function() { await hook.result.current.saveBrand(makeBrand({ brand_config: bc })); });
    expect(updateBrandConfigMock).toHaveBeenCalled();
    expect(profilesUpdateMock).toHaveBeenCalledWith('u1', expect.objectContaining({ _synced: 1 }));
  });

  it('brand_config com falha -> toast warning especifico', async function() {
    navigator.onLine = true;
    updateBrandConfigMock.mockResolvedValueOnce({ ok: false });
    const { hook, toast } = makeHook();
    await act(async function() { await hook.result.current.saveBrand(makeBrand({ brand_config: { palette: {} } })); });
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('marca não sincronizada'), 'warning');
    expect(profilesUpdateMock).not.toHaveBeenCalled();
  });

  it('falha no put local -> toast de erro e nao segue', async function() {
    profilesPutMock.mockRejectedValueOnce(new Error('quota'));
    const { hook, toast, setBrand } = makeHook();
    await act(async function() { await hook.result.current.saveBrand(makeBrand()); });
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('quota'), 'error');
    expect(setBrand).not.toHaveBeenCalled();
  });

  it('preserva white_label vindo do Dexie quando objeto nao tem', async function() {
    profilesGetMock.mockResolvedValue({ white_label: true, plan: 'free', name: 'Antiga' });
    const { hook, getBrand } = makeHook();
    await act(async function() { await hook.result.current.saveBrand(makeBrand({ white_label: undefined })); });
    expect(getBrand().white_label).toBe(true);
  });
});

describe('useBrandManager — savePhone', function() {
  beforeEach(function() {
    profilesGetMock.mockReset();
    profilesGetMock.mockResolvedValue({ user_id: 'u1', phone: '91999999999' });
    profilesUpdateMock.mockReset();
    profilesUpdateMock.mockResolvedValue(undefined);
    updateEqMock.mockReset();
    updateEqMock.mockResolvedValue({ error: null });
    var _onLine = false;
    Object.defineProperty(navigator, 'onLine', { get: function() { return _onLine; }, set: function(v) { _onLine = v; }, configurable: true });
  });

  it('offline: salva local e informa que sincroniza depois', async function() {
    const { hook, toast, getBrand } = makeHook();
    let ret;
    await act(async function() { ret = await hook.result.current.savePhone('(91) 99999-1234'); });
    expect(profilesUpdateMock).toHaveBeenCalledWith('u1', expect.objectContaining({ phone: '91999991234', _synced: 0 }));
    expect(getBrand().phone).toBe('91999991234');
    expect(toast).toHaveBeenCalledWith('Telefone salvo — sincroniza quando online', 'success');
    expect(ret).toBe(true);
  });

  it('online com sucesso: sincroniza e informa telefone atualizado', async function() {
    navigator.onLine = true;
    const { hook, toast } = makeHook();
    await act(async function() { await hook.result.current.savePhone('91999991234'); });
    expect(updateEqMock).toHaveBeenCalledWith('u1');
    expect(profilesUpdateMock).toHaveBeenCalledWith('u1', expect.objectContaining({ _synced: 1 }));
    expect(toast).toHaveBeenCalledWith('Telefone atualizado', 'success');
  });

  it('online com erro no supabase -> toast warning', async function() {
    navigator.onLine = true;
    updateEqMock.mockResolvedValueOnce({ error: new Error('x') });
    const { hook, toast } = makeHook();
    await act(async function() { await hook.result.current.savePhone('91999991234'); });
    expect(toast).toHaveBeenCalledWith('Não sincronizado — tentaremos em breve', 'warning');
  });

  it('online com exception -> toast warning', async function() {
    navigator.onLine = true;
    updateEqMock.mockRejectedValueOnce(new Error('net'));
    const { hook, toast } = makeHook();
    await act(async function() { await hook.result.current.savePhone('91999991234'); });
    expect(toast).toHaveBeenCalledWith('Não sincronizado — tentaremos em breve', 'warning');
  });

  it('sem profile existente nao chama update local, mas atualiza brand', async function() {
    profilesGetMock.mockResolvedValue(null);
    const { hook, getBrand, toast } = makeHook();
    await act(async function() { await hook.result.current.savePhone('91999991234'); });
    expect(profilesUpdateMock).not.toHaveBeenCalled();
    expect(getBrand().phone).toBe('91999991234');
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('sincroniza quando online'), 'success');
  });
});
