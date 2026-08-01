// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from './useOnboarding.js';

const session = function(meta) {
  return { user: { id: 'u1', email: 'a@b.com', user_metadata: meta || {} } };
};

const brand = { name: 'Ana Silva', logo: 'A', color: '#002f59' };

function makeHook(overrides) {
  const setOnboardingNeeded = vi.fn();
  const onboardingRef = { current: null };
  const saveBrand = vi.fn(async function() {});
  const savePhone = vi.fn(async function() {});
  const props = Object.assign({
    session: null,
    dataLoading: false,
    brand: brand,
    setOnboardingNeeded: setOnboardingNeeded,
    onboardingRef: onboardingRef,
    saveBrand: saveBrand,
    savePhone: savePhone,
  }, overrides || {});
  const hook = renderHook(function() { return useOnboarding(props); });
  return { hook: hook, setOnboardingNeeded: setOnboardingNeeded, onboardingRef: onboardingRef, saveBrand: saveBrand, savePhone: savePhone };
}

describe('useOnboarding — deteccao de necessidade', function() {
  beforeEach(function() {
    localStorage.removeItem('financia_onboarded_u1');
  });

  it('sem session: desliga onboarding e zera ref', function() {
    const { hook, setOnboardingNeeded, onboardingRef } = makeHook();
    expect(onboardingRef.current).toBeNull();
    expect(setOnboardingNeeded).toHaveBeenCalledWith(false);
    hook.unmount();
  });

  it('com dataLoading: nao avalia nada', function() {
    const { hook, setOnboardingNeeded, onboardingRef } = makeHook({ session: session({ full_name: 'Ana Silva' }), dataLoading: true });
    expect(onboardingRef.current).toBeNull();
    expect(setOnboardingNeeded).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('nome do google igual ao brand.name e sem flag -> onboarding necessario', function() {
    const { setOnboardingNeeded, onboardingRef } = makeHook({ session: session({ full_name: 'Ana Silva' }) });
    expect(onboardingRef.current).toBe(true);
    expect(setOnboardingNeeded).toHaveBeenCalledWith(true);
  });

  it('usa meta.name quando full_name ausente', function() {
    const { setOnboardingNeeded } = makeHook({ session: session({ name: 'Ana Silva' }) });
    expect(setOnboardingNeeded).toHaveBeenCalledWith(true);
  });

  it('flag financia_onboarded presente -> onboarding nao necessario', function() {
    localStorage.setItem('financia_onboarded_u1', '1');
    const { setOnboardingNeeded, onboardingRef } = makeHook({ session: session({ full_name: 'Ana Silva' }) });
    expect(onboardingRef.current).toBe(false);
    expect(setOnboardingNeeded).toHaveBeenCalledWith(false);
  });

  it('nome diferente do brand.name -> onboarding nao necessario', function() {
    const { setOnboardingNeeded, onboardingRef } = makeHook({ session: session({ full_name: 'Outro Nome' }) });
    expect(onboardingRef.current).toBe(false);
    expect(setOnboardingNeeded).toHaveBeenCalledWith(false);
  });

  it('quando onboarding estava ativo e deixa de ser necessario, desliga', function() {
    const first = makeHook({ session: session({ full_name: 'Ana Silva' }) });
    expect(first.onboardingRef.current).toBe(true);
    const second = makeHook({ session: session({ full_name: 'Nome Diferente' }), onboardingRef: first.onboardingRef });
    expect(second.onboardingRef.current).toBe(false);
    expect(second.setOnboardingNeeded).toHaveBeenCalledWith(false);
    first.hook.unmount();
    second.hook.unmount();
  });

  it('sem user_metadata nao exige nome', function() {
    const { setOnboardingNeeded, onboardingRef } = makeHook({ session: session(undefined) });
    expect(onboardingRef.current).toBe(false);
    expect(setOnboardingNeeded).toHaveBeenCalledWith(false);
  });
});

describe('useOnboarding — finishOnboarding', function() {
  beforeEach(function() {
    localStorage.removeItem('financia_onboarded_u1');
  });

  it('salva nome (quando needsName) e telefone, grava flag e desliga', async function() {
    const { hook, saveBrand, savePhone, setOnboardingNeeded, onboardingRef } = makeHook({ session: session({ full_name: 'Ana Silva' }) });
    await act(async function() {
      await hook.result.current.finishOnboarding({ name: 'Nova Loja', phone: '(91) 99999-1234' }, true);
    });
    expect(saveBrand).toHaveBeenCalledWith(Object.assign({}, brand, { name: 'Nova Loja' }));
    expect(savePhone).toHaveBeenCalledWith('(91) 99999-1234');
    expect(localStorage.getItem('financia_onboarded_u1')).toBe('1');
    expect(onboardingRef.current).toBe(false);
    expect(setOnboardingNeeded).toHaveBeenCalledWith(false);
  });

  it('sem needsName nao altera brand', async function() {
    const { hook, saveBrand, savePhone } = makeHook({ session: session({ full_name: 'Ana Silva' }) });
    await act(async function() {
      await hook.result.current.finishOnboarding({ name: 'Outro', phone: '9912345678' }, false);
    });
    expect(saveBrand).not.toHaveBeenCalled();
    expect(savePhone).toHaveBeenCalledWith('9912345678');
  });

  it('sem phone nao chama savePhone', async function() {
    const { hook, savePhone } = makeHook({ session: session({ full_name: 'Ana Silva' }) });
    await act(async function() {
      await hook.result.current.finishOnboarding({ name: 'Nova Loja' }, true);
    });
    expect(savePhone).not.toHaveBeenCalled();
  });

  it('sempre grava a flag mesmo sem tarefas', async function() {
    const { hook } = makeHook({ session: session({ full_name: 'Ana Silva' }) });
    await act(async function() {
      await hook.result.current.finishOnboarding({}, false);
    });
    expect(localStorage.getItem('financia_onboarded_u1')).toBe('1');
  });
});
