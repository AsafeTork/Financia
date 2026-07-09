// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn, signUp, signOut, updatePassword, sendPasswordReset } from './auth.js';

var mockSignInWithPassword = vi.fn();
var mockSignUp = vi.fn();
var mockSignOut = vi.fn();
var mockUpdateUser = vi.fn();
var mockResetPasswordForEmail = vi.fn();

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
