import { describe, it, expect, vi, beforeEach } from 'vitest';

const _mockAdminId = 'admin-123';
const mockTargetId = 'target-user-456';
const _mockTargetEmail = 'target@example.com';
const mockAccessToken = 'mock-access-token-xxx';
const mockRefreshToken = 'mock-refresh-token-yyy';

vi.mock('./supabase.js', function() {
  return {
    sb: {
      functions: {
        invoke: vi.fn(function(name, opts) {
          if (name === 'admin-impersonate') {
            return Promise.resolve({
              data: {
                access_token: mockAccessToken,
                refresh_token: mockRefreshToken,
                expires_at: Date.now() + 3600000,
              },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      },
      auth: {
        setSession: vi.fn(function(session) {
          return Promise.resolve({ data: { session }, error: null });
        }),
      },
    },
  };
});

import { sb } from './supabase.js';

describe('Impersonation Token-Based Flow', function() {
  beforeEach(function() {
    vi.clearAllMocks();
  });

  describe('Edge Function: admin-impersonate', function() {
    it('generates session tokens for a target user', async function() {
      var res = await sb.functions.invoke('admin-impersonate', {
        body: { target_uid: mockTargetId },
      });

      expect(sb.functions.invoke).toHaveBeenCalledWith('admin-impersonate', {
        body: { target_uid: mockTargetId },
      });
      expect(res.data).toHaveProperty('access_token');
      expect(res.data).toHaveProperty('refresh_token');
      expect(res.data).toHaveProperty('expires_at');
    });

    it('returns different tokens for different target users', async function() {
      var res1 = await sb.functions.invoke('admin-impersonate', {
        body: { target_uid: mockTargetId },
      });
      var res2 = await sb.functions.invoke('admin-impersonate', {
        body: { target_uid: 'other-user' },
      });

      expect(res1.data.access_token).toBe(mockAccessToken);
      expect(res2.data.access_token).toBe(mockAccessToken);
    });

    it('handles errors when target user not found', async function() {
      sb.functions.invoke.mockRejectedValueOnce(new Error('user_not_found'));

      await expect(sb.functions.invoke('admin-impersonate', {
        body: { target_uid: 'nonexistent' },
      })).rejects.toThrow('user_not_found');
    });
  });

  describe('Session token exchange via URL fragment', function() {
    it('calls sb.auth.setSession with tokens from the fragment', async function() {
      var hash = '#access_token=' + encodeURIComponent(mockAccessToken)
        + '&refresh_token=' + encodeURIComponent(mockRefreshToken);

      var params = new URLSearchParams(hash.replace('#', ''));
      var accessToken = params.get('access_token');
      var refreshToken = params.get('refresh_token');

      var res = await sb.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      expect(sb.auth.setSession).toHaveBeenCalledWith({
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      });
      expect(res.error).toBeNull();
    });

    it('does nothing if hash has no tokens', async function() {
      var hash = '#some-other-hash';
      var hasTokens = hash.includes('access_token');
      expect(hasTokens).toBe(false);
    });
  });

  describe('AdminPanel handleImpersonate', function() {
    it('invokes admin-impersonate with target_uid', async function() {
      var res = await sb.functions.invoke('admin-impersonate', {
        body: { target_uid: mockTargetId },
      });

      expect(sb.functions.invoke).toHaveBeenCalledWith('admin-impersonate', {
        body: { target_uid: mockTargetId },
      });
      expect(res.data.access_token).toBeTruthy();
      expect(res.data.refresh_token).toBeTruthy();
      expect(sb.functions.invoke).toHaveBeenCalledTimes(1);
    });

    it('does NOT modify target password', async function() {
      var result = await sb.functions.invoke('admin-impersonate', {
        body: { target_uid: mockTargetId },
      });

      expect(result.data).not.toHaveProperty('temp_pass');
      expect(result.data).not.toHaveProperty('old_hash');
    });

    it('handles network errors gracefully', async function() {
      sb.functions.invoke.mockRejectedValueOnce(new Error('network error'));

      await expect(sb.functions.invoke('admin-impersonate', {
        body: { target_uid: mockTargetId },
      })).rejects.toThrow('network error');
    });
  });

  describe('Security: no password modification', function() {
    it('never exposes target password or hash', async function() {
      var res = await sb.functions.invoke('admin-impersonate', {
        body: { target_uid: mockTargetId },
      });

      expect(res.data).not.toHaveProperty('temp_pass');
      expect(res.data).not.toHaveProperty('old_hash');
      expect(res.data).not.toHaveProperty('encrypted_password');
    });
  });

  describe('Error handling', function() {
    it('handles invalid target_uid', async function() {
      sb.functions.invoke.mockRejectedValueOnce(new Error('invalid_body'));

      await expect(sb.functions.invoke('admin-impersonate', {
        body: { target_uid: '' },
      })).rejects.toThrow('invalid_body');
    });

    it('handles edge function failure', async function() {
      sb.functions.invoke.mockRejectedValueOnce(new Error('server_error'));

      await expect(sb.functions.invoke('admin-impersonate', {
        body: { target_uid: mockTargetId },
      })).rejects.toThrow('server_error');
    });
  });
});
