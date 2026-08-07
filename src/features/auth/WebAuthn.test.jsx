// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { isWebAuthnSupported, signInWithPasskey, registerPasskey, listPasskeys, deletePasskey } from '../../lib/auth.js';
import WebAuthn from './WebAuthn.jsx';

vi.mock('../../lib/auth.js', function() {
  return {
    isWebAuthnSupported: vi.fn(),
    signInWithPasskey: vi.fn(),
    registerPasskey: vi.fn(),
    listPasskeys: vi.fn(),
    deletePasskey: vi.fn(),
  };
});

vi.mock('../../shared/ui/ui.jsx', async function() {
  const actual = await vi.importActual('../../shared/ui/ui.jsx');
  return {
    ...actual,
    Spin: function() { return React.createElement('span', { 'data-testid': 'spin' }, 'loading'); },
  };
});

var noop = function() {};
var sessionUser = { id: 'u1', email: 'user@b.com' };

describe('WebAuthn', function() {
  var user;
  beforeEach(function() {
    user = userEvent.setup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });
  afterEach(function() { cleanup(); });

  describe('login mode', function() {
    it('renderiza o botao de passkey quando o navegador suporta WebAuthn', function() {
      isWebAuthnSupported.mockReturnValue(true);
      render(React.createElement(WebAuthn, { mode: 'login', onSuccess: noop }));
      expect(screen.getByRole('button', { name: /entrar com passkey/i })).toBeTruthy();
    });

    it('nao renderiza o botao quando o navegador nao suporta WebAuthn (fallback para senha)', function() {
      isWebAuthnSupported.mockReturnValue(false);
      render(React.createElement(WebAuthn, { mode: 'login', onSuccess: noop }));
      expect(screen.queryByRole('button', { name: /entrar com passkey/i })).toBeNull();
      expect(screen.getByText(/não disponível neste navegador/i)).toBeTruthy();
    });

    it('chama signInWithPasskey e notifica sucesso ao clicar', async function() {
      isWebAuthnSupported.mockReturnValue(true);
      signInWithPasskey.mockResolvedValue({ data: { user: sessionUser, session: { access_token: 'tok' } }, error: null, message: null });
      var onSuccess = vi.fn();
      render(React.createElement(WebAuthn, { mode: 'login', onSuccess: onSuccess }));
      await user.click(screen.getByRole('button', { name: /entrar com passkey/i }));
      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(signInWithPasskey).toHaveBeenCalledOnce();
    });

    it('exibe mensagem de erro quando a passkey falha', async function() {
      isWebAuthnSupported.mockReturnValue(true);
      signInWithPasskey.mockResolvedValue({ data: null, error: { code: 'webauthn_credential_not_found' }, message: 'Credencial não reconhecida.' });
      render(React.createElement(WebAuthn, { mode: 'login', onSuccess: noop }));
      await user.click(screen.getByRole('button', { name: /entrar com passkey/i }));
      await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
      expect(screen.getByText(/não reconhecida/i)).toBeTruthy();
    });

    it('desabilita o botao durante a cerimonia', async function() {
      isWebAuthnSupported.mockReturnValue(true);
      signInWithPasskey.mockReturnValue(new Promise(function() { return undefined; })); // pendente
      render(React.createElement(WebAuthn, { mode: 'login', onSuccess: noop }));
      await user.click(screen.getByRole('button', { name: /entrar com passkey/i }));
      await waitFor(() => {
        var btn = screen.getByRole('button', { name: /entrar com passkey/i });
        expect(btn).toBeDisabled();
      });
    });
  });

  describe('register mode', function() {
    it('pede login quando nao ha sessao', function() {
      render(React.createElement(WebAuthn, { mode: 'register', brand: {}, session: null }));
      expect(screen.getByText(/entre para gerenciar suas credenciais/i)).toBeTruthy();
    });

    it('carrega e lista as passkeys registradas', async function() {
      listPasskeys.mockResolvedValue({ data: { keys: [{ id: 'k1', created_at: '2026-08-01T10:00:00Z' }, { id: 'k2', created_at: '2026-08-02T10:00:00Z' }] }, error: null, message: null });
      render(React.createElement(WebAuthn, { mode: 'register', brand: {}, session: { user: sessionUser } }));
      await waitFor(() => expect(listPasskeys).toHaveBeenCalledOnce());
      await waitFor(() => expect(screen.getAllByRole('button', { name: /^remover/i })).toHaveLength(2));
    });

    it('chama registerPasskey ao clicar em adicionar', async function() {
      listPasskeys.mockResolvedValue({ data: { keys: [] }, error: null, message: null });
      registerPasskey.mockResolvedValue({ data: { credential_id: 'new' }, error: null, message: 'Passkey cadastrada com sucesso!' });
      var onStatus = vi.fn();
      render(React.createElement(WebAuthn, { mode: 'register', brand: {}, session: { user: sessionUser }, onStatus: onStatus }));
      await user.click(screen.getByRole('button', { name: /adicionar passkey/i }));
      await waitFor(() => expect(registerPasskey).toHaveBeenCalledOnce());
      await waitFor(() => expect(onStatus).toHaveBeenCalledWith('Passkey cadastrada com sucesso!'));
    });

    it('remove uma passkey apos confirmacao', async function() {
      listPasskeys.mockResolvedValue({ data: { keys: [{ id: 'k1', created_at: '2026-08-01T10:00:00Z' }] }, error: null, message: null });
      deletePasskey.mockResolvedValue({ data: null, error: null, message: null });
      window.confirm = vi.fn(function() { return true; });
      render(React.createElement(WebAuthn, { mode: 'register', brand: {}, session: { user: sessionUser } }));
      await waitFor(() => expect(listPasskeys).toHaveBeenCalledOnce());
      await user.click(screen.getByRole('button', { name: /^remover/i }));
      await waitFor(() => expect(deletePasskey).toHaveBeenCalledWith('k1'));
      window.confirm.mockRestore();
    });
  });
});
