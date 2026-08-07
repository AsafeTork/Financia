// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn, signUp, signOut, updatePassword, sendPasswordReset, isWebAuthnSupported, registerPasskey, signInWithPasskey, listPasskeys, deletePasskey } from './auth.js';

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockUpdateUser = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockRegisterPasskey = vi.fn();
const mockSignInWithPasskey = vi.fn();
const mockListPasskeys = vi.fn();
const mockDeletePasskey = vi.fn();

vi.mock('./supabase.js', function() {
  return {
    sb: {
      auth: {
        signInWithPassword: function() {
          return mockSignInWithPassword.apply(this, arguments);
        },
        signUp: function() {
          return mockSignUp.apply(this, arguments);
        },
        signOut: function() {
          return mockSignOut.apply(this, arguments);
        },
        updateUser: function() {
          return mockUpdateUser.apply(this, arguments);
        },
        resetPasswordForEmail: function() {
          return mockResetPasswordForEmail.apply(this, arguments);
        },
        registerPasskey: function() {
          return mockRegisterPasskey.apply(this, arguments);
        },
        signInWithPasskey: function() {
          return mockSignInWithPasskey.apply(this, arguments);
        },
        passkey: {
          list: function() { return mockListPasskeys.apply(this, arguments); },
          delete: function() { return mockDeletePasskey.apply(this, arguments); },
          startRegistration: vi.fn(function() { return Promise.resolve({ data: null, error: { code: 'not_used' } }); }),
          verifyRegistration: vi.fn(function() { return Promise.resolve({ data: null, error: { code: 'not_used' } }); }),
          startAuthentication: vi.fn(function() { return Promise.resolve({ data: null, error: { code: 'not_used' } }); }),
          verifyAuthentication: vi.fn(function() { return Promise.resolve({ data: null, error: { code: 'not_used' } }); }),
          update: vi.fn(function() { return Promise.resolve({ data: null, error: null }); }),
        },
      },
    },
  };
});

beforeEach(function() {
  vi.clearAllMocks();
});

describe('signIn', function() {
  it('returns data on valid credentials', async function() {
    let fakeData = { user: { id: 'u1' }, session: { access_token: 'tok' } };
    mockSignInWithPassword.mockResolvedValue({ data: fakeData, error: null });

    let result = await signIn('a@b.com', 'pass');

    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass' });
    expect(result.data).toEqual(fakeData);
    expect(result.error).toBeNull();
  });

  it('returns error on invalid credentials', async function() {
    let fakeError = { message: 'Invalid login credentials' };
    mockSignInWithPassword.mockResolvedValue({ data: null, error: fakeError });

    let result = await signIn('bad@b.com', 'wrong');

    expect(result.error).toEqual(fakeError);
    expect(result.data).toBeNull();
  });
});

describe('signUp', function() {
  it('registers a new user', async function() {
    let fakeData = { user: { id: 'u2' }, session: null };
    mockSignUp.mockResolvedValue({ data: fakeData, error: null });

    let result = await signUp('new@b.com', 'secret', { name: 'Novo' });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@b.com',
      password: 'secret',
      options: { data: { name: 'Novo' }, emailRedirectTo: window.location.origin },
    });
    expect(result.data).toEqual(fakeData);
  });

  it('passes empty meta as empty object', async function() {
    mockSignUp.mockResolvedValue({ data: null, error: null });

    await signUp('no@meta.com', 'pw');

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'no@meta.com',
      password: 'pw',
      options: { data: {}, emailRedirectTo: window.location.origin },
    });
  });

  it('returns error on duplicate email', async function() {
    let fakeError = { message: 'User already registered' };
    mockSignUp.mockResolvedValue({ data: null, error: fakeError });

    let result = await signUp('dup@b.com', 'pw');

    expect(result.error).toEqual(fakeError);
  });
});

describe('signOut', function() {
  it('calls sb.auth.signOut', async function() {
    mockSignOut.mockResolvedValue({ error: null });

    let result = await signOut();

    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(result.error).toBeNull();
  });
});

describe('updatePassword', function() {
  it('calls sb.auth.updateUser with new password', async function() {
    mockUpdateUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    let result = await updatePassword('newPass123');

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newPass123' });
    expect(result.error).toBeNull();
  });

  it('returns error on weak password', async function() {
    let fakeError = { message: 'Password should be at least 6 characters' };
    mockUpdateUser.mockResolvedValue({ data: null, error: fakeError });

    let result = await updatePassword('123');

    expect(result.error).toEqual(fakeError);
  });
});

describe('sendPasswordReset', function() {
  it('calls sb.auth.resetPasswordForEmail', async function() {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    let result = await sendPasswordReset('user@b.com');

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@b.com', {
      redirectTo: window.location.origin,
    });
    expect(result.error).toBeNull();
  });
});

describe('isWebAuthnSupported', function() {
  it('retorna true quando window.PublicKeyCredential existe', function() {
    var prev = window.PublicKeyCredential;
    window.PublicKeyCredential = function() {};
    expect(isWebAuthnSupported()).toBe(true);
    window.PublicKeyCredential = prev;
  });

  it('retorna false quando PublicKeyCredential nao existe', function() {
    var prev = window.PublicKeyCredential;
    window.PublicKeyCredential = undefined;
    expect(isWebAuthnSupported()).toBe(false);
    window.PublicKeyCredential = prev;
  });
});

describe('signInWithPasskey', function() {
  it('retorna data quando a passkey eh validada', async function() {
    mockSignInWithPasskey.mockResolvedValue({ data: { user: { id: 'u1' }, session: { access_token: 'tok' } }, error: null });

    let result = await signInWithPasskey();

    expect(mockSignInWithPasskey).toHaveBeenCalledOnce();
    expect(result.data.user.id).toBe('u1');
    expect(result.error).toBeNull();
  });

  it('mapeia erro de codigo webauthn para mensagem amigavel', async function() {
    mockSignInWithPasskey.mockResolvedValue({ data: null, error: { code: 'webauthn_challenge_expired', message: 'expired' } });

    let result = await signInWithPasskey();

      expect(result.error).toEqual({ code: 'webauthn_challenge_expired', message: 'expired' });
      expect(result.message).toContain('Tempo esgotado');
  });

    it('mapeia erro NotAllowedError de browser', async function() {
      mockSignInWithPasskey.mockRejectedValue({ name: 'NotAllowedError', message: 'not allowed' });

      let result = await signInWithPasskey();

      expect(result.error).toBeTruthy();
      expect(result.message).toContain('cancelada');
    });
});

describe('registerPasskey', function() {
  it('retorna data quando o cadastro da passkey tem sucesso', async function() {
    mockRegisterPasskey.mockResolvedValue({ data: { credential_id: 'c1' }, error: null });

    let result = await registerPasskey();

    expect(mockRegisterPasskey).toHaveBeenCalledOnce();
    expect(result.data.credential_id).toBe('c1');
    expect(result.error).toBeNull();
  });

  it('retorna erro mapeado quando a credencial ja existe', async function() {
    mockRegisterPasskey.mockResolvedValue({ data: null, error: { code: 'webauthn_credential_exists' } });

    let result = await registerPasskey();

    expect(result.error).toBeTruthy();
    expect(result.message).toContain('já foi cadastrada');
  });
});

describe('listPasskeys', function() {
  it('retorna a lista de chaves', async function() {
    mockListPasskeys.mockResolvedValue({ data: { keys: [{ id: 'k1' }, { id: 'k2' }] }, error: null });

    let result = await listPasskeys();

    expect(mockListPasskeys).toHaveBeenCalledOnce();
    expect(result.data.keys.length).toBe(2);
    expect(result.error).toBeNull();
  });

  it('retorna erro mapeado', async function() {
    mockListPasskeys.mockResolvedValue({ data: null, error: { code: 'passkey_disabled' } });

    let result = await listPasskeys();

    expect(result.error).toBeTruthy();
    expect(result.message).toContain('não está habilitado');
  });
});

describe('deletePasskey', function() {
  it('chama sb.auth.passkey.delete com o credentialId', async function() {
    mockDeletePasskey.mockResolvedValue({ data: null, error: null });

    let result = await deletePasskey('cred-1');

    expect(mockDeletePasskey).toHaveBeenCalledWith({ credentialId: 'cred-1' });
    expect(result.error).toBeNull();
  });

  it('retorna erro quando credentialId ausente', async function() {
    let result = await deletePasskey(null);

    expect(mockDeletePasskey).not.toHaveBeenCalled();
    expect(result.error).toBeTruthy();
    expect(result.message).toContain('inválida');
  });

    it('mapeia erro de exclusao', async function() {
      mockDeletePasskey.mockRejectedValue({ name: 'NotAllowedError', message: 'denied' });

      let result = await deletePasskey('cred-1');

      expect(result.error).toBeTruthy();
      expect(result.message).toContain('cancelada');
    });
});
