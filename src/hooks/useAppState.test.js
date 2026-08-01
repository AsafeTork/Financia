// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppState } from './useAppState.js';
import { INIT_BRAND, INIT_PLAN } from '../../lib/constants.js';

describe('useAppState', function() {
  it('retorna valores iniciais corretos', function() {
    const { result } = renderHook(function() { return useAppState(); });
    expect(result.current.session).toBeNull();
    expect(result.current.isAdminDB).toBe(false);
    expect(result.current.appLoading).toBe(true);
    expect(result.current.dataLoading).toBe(false);
    expect(result.current.dataError).toBeNull();
    expect(result.current.brand).toEqual(INIT_BRAND);
    expect(result.current.planInfo).toEqual(INIT_PLAN);
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.toasts).toEqual([]);
    expect(result.current.confirmData).toBeNull();
    expect(result.current.showLogin).toBe(false);
    expect(result.current.showUpgrade).toBe(false);
    expect(result.current.onboardingNeeded).toBe(false);
    expect(result.current.announceMsg).toBe('');
    expect(result.current.sidebarOpen).toBe(false);
  });

  it('setters basicos atualizam estado', function() {
    const { result } = renderHook(function() { return useAppState(); });
    act(function() {
      result.current.setSession({ user: { id: 'u1' } });
      result.current.setIsAdminDB(true);
      result.current.setDataLoading(true);
      result.current.setDataError('ops');
      result.current.setSyncStatus('syncing');
      result.current.setOnboardingNeeded(true);
      result.current.setSidebarOpen(true);
      result.current.setShowUpgrade(true);
      result.current.setShowLogin(true);
    });
    expect(result.current.session).toEqual({ user: { id: 'u1' } });
    expect(result.current.isAdminDB).toBe(true);
    expect(result.current.dataLoading).toBe(true);
    expect(result.current.dataError).toBe('ops');
    expect(result.current.syncStatus).toBe('syncing');
    expect(result.current.onboardingNeeded).toBe(true);
    expect(result.current.sidebarOpen).toBe(true);
    expect(result.current.showUpgrade).toBe(true);
    expect(result.current.showLogin).toBe(true);
  });

  it('setBrandStable atualiza quando brand muda', function() {
    const { result } = renderHook(function() { return useAppState(); });
    const next = { name: 'Nova Marca', color: '#ff0000' };
    act(function() { result.current.setBrandStable(next); });
    expect(result.current.brand.name).toBe('Nova Marca');
    expect(result.current.brand.color).toBe('#ff0000');
  });

  it('setBrandStable nao atualiza quando brand e identico (referencia previa)', function() {
    const { result } = renderHook(function() { return useAppState(); });
    act(function() { result.current.setBrandStable(INIT_BRAND); });
    expect(result.current.brand).toEqual(INIT_BRAND);
  });

  it('setBrandStable ignora next undefined/null', function() {
    const { result } = renderHook(function() { return useAppState(); });
    act(function() { result.current.setBrandStable(undefined); });
    expect(result.current.brand).toEqual(INIT_BRAND);
    act(function() { result.current.setBrandStable(null); });
    expect(result.current.brand).toEqual(INIT_BRAND);
  });

  it('setBrandStable aceita next quando prev e nulo', function() {
    const { result } = renderHook(function() { return useAppState(); });
    act(function() { result.current.setBrand(null); });
    act(function() { result.current.setBrandStable({ name: 'X' }); });
    expect(result.current.brand).toEqual({ name: 'X' });
  });

  it('setBrandStable com prev nulo e next nulo mantem', function() {
    const { result } = renderHook(function() { return useAppState(); });
    act(function() { result.current.setBrand(null); });
    act(function() { result.current.setBrandStable(null); });
    expect(result.current.brand).toBeNull();
  });

  it('firstRender comeca true', function() {
    const { result } = renderHook(function() { return useAppState(); });
    expect(result.current.firstRender.current).toBe(true);
  });

  it('onboardingRef comeca null e toastId comeca 0', function() {
    const { result } = renderHook(function() { return useAppState(); });
    expect(result.current.onboardingRef.current).toBeNull();
    expect(result.current.toastId.current).toBe(0);
  });

  it('modalRef espelha o estado atual de confirmData/showUpgrade/sidebarOpen/showLogin', function() {
    const { result } = renderHook(function() { return useAppState(); });
    act(function() {
      result.current.setConfirmData({ kind: 'delete' });
      result.current.setShowUpgrade(true);
      result.current.setSidebarOpen(true);
      result.current.setShowLogin(true);
    });
    expect(result.current.modalRef.current).toEqual({ confirmData: { kind: 'delete' }, showUpgrade: true, sidebarOpen: true, showLogin: true });
    act(function() { result.current.setShowUpgrade(false); });
    expect(result.current.modalRef.current.showUpgrade).toBe(false);
  });

  it('toastTimeoutsRef inicia como array vazio', function() {
    const { result } = renderHook(function() { return useAppState(); });
    expect(result.current.toastTimeoutsRef.current).toEqual([]);
  });
});
