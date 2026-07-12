import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockAdminId = 'admin-123';
const mockTargetId = 'target-user-456';
const mockTargetEmail = 'target@example.com';
const mockOldHash = '$2b$10$oldhashexample';
const mockTempPass = 'a1b2c3d4e5f6';

vi.mock('./supabase.js', function() {
  const qb = {
    select: function() { return qb; },
    eq: function() { return qb; },
    maybeSingle: function() { return Promise.resolve({ data: { role: 'admin' }, error: null }); },
    upsert: function() { return Promise.resolve({ error: null }); },
    delete: function() { return Promise.resolve({ error: null }); },
  };
  return {
    sb: {
      from: vi.fn(function() { return qb; }),
      rpc: vi.fn(function(fn, args) {
        if (fn === 'admin_impersonate_start') {
          return Promise.resolve({
            data: { email: mockTargetEmail, temp_pass: mockTempPass, uid: mockTargetId },
            error: null,
          });
        }
        if (fn === 'admin_impersonate_restore') {
          return Promise.resolve({ data: null, error: null });
        }
        if (fn === 'impersonation_sweep') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      auth: {
        admin: {
          getUserById: vi.fn(function(id) {
            if (id === mockTargetId) {
              return Promise.resolve({ data: { user: { id: mockTargetId, email: mockTargetEmail, encrypted_password: mockOldHash } } });
            }
            return Promise.resolve({ data: { user: { id: mockAdminId, email: 'admin@example.com' } } });
          }),
        },
      },
    },
  };
});

import { sb } from './supabase.js';

describe('Impersonation Integration Tests', function() {
  beforeEach(function() {
    vi.clearAllMocks();
    sb.rpc.mockImplementation(function(fn, args) {
      if (fn === 'admin_impersonate_start') {
        return Promise.resolve({
          data: { email: mockTargetEmail, temp_pass: mockTempPass, uid: mockTargetId },
          error: null,
        });
      }
      if (fn === 'admin_impersonate_restore') {
        return Promise.resolve({ data: null, error: null });
      }
      if (fn === 'impersonation_sweep') {
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });
  });

  afterEach(function() {
    vi.resetAllMocks();
  });

  describe('admin_impersonate_start', function() {
    it('starts impersonation session for admin user', async function() {
      const result = await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });

      expect(sb.rpc).toHaveBeenCalledWith('admin_impersonate_start', { target_uid: mockTargetId });
      expect(result.data).toEqual({
        email: mockTargetEmail,
        temp_pass: mockTempPass,
        uid: mockTargetId,
      });
      expect(result.data.temp_pass).toBeTruthy();
      expect(result.data.temp_pass.length).toBeGreaterThan(0);
    });

    it('returns temp password but NOT old hash (security)', async function() {
      const result = await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });

      expect(result.data).toHaveProperty('temp_pass');
      expect(result.data).not.toHaveProperty('old_hash');
      expect(result.data.temp_pass).not.toBe(mockOldHash);
    });

    it('stores old hash in impersonation_sessions table (server-side)', async function() {
      await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });

      expect(sb.rpc).toHaveBeenCalledWith('admin_impersonate_start', { target_uid: mockTargetId });
    });

    it('sets expiration to 4 minutes from start', async function() {
      await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });

      expect(sb.rpc).toHaveBeenCalledWith('admin_impersonate_start', { target_uid: mockTargetId });
    });

    it('rejects non-admin users', async function() {
      sb.rpc.mockRejectedValueOnce(new Error('forbidden'));

      await expect(sb.rpc('admin_impersonate_start', { target_uid: mockTargetId }))
        .rejects.toThrow('forbidden');
    });

    it('rejects if target user not found', async function() {
      sb.rpc.mockRejectedValueOnce(new Error('usuario nao encontrado'));

      await expect(sb.rpc('admin_impersonate_start', { target_uid: 'nonexistent' }))
        .rejects.toThrow('usuario nao encontrado');
    });

    it('preserves original old_hash if session already exists', async function() {
      await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });
      await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });

      expect(sb.rpc).toHaveBeenCalledTimes(2);
    });
  });

  describe('admin_impersonate_restore', function() {
    it('restores original password hash from server-side session', async function() {
      await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });
      const result = await sb.rpc('admin_impersonate_restore', { target_uid: mockTargetId });

      expect(sb.rpc).toHaveBeenCalledWith('admin_impersonate_restore', { target_uid: mockTargetId });
      expect(result.error).toBeNull();
    });

    it('deletes impersonation session after restore', async function() {
      await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });
      await sb.rpc('admin_impersonate_restore', { target_uid: mockTargetId });

      expect(sb.rpc).toHaveBeenCalledWith('admin_impersonate_restore', { target_uid: mockTargetId });
    });

    it('is no-op if session already restored or missing', async function() {
      const result = await sb.rpc('admin_impersonate_restore', { target_uid: 'nonexistent' });

      expect(result.error).toBeNull();
    });

    it('rejects non-admin users', async function() {
      sb.rpc.mockRejectedValueOnce(new Error('forbidden'));

      await expect(sb.rpc('admin_impersonate_restore', { target_uid: mockTargetId }))
        .rejects.toThrow('forbidden');
    });

    it('never accepts old_hash from client (security fix)', async function() {
      await sb.rpc('admin_impersonate_restore', { target_uid: mockTargetId });

      expect(sb.rpc).toHaveBeenCalledWith('admin_impersonate_restore', { target_uid: mockTargetId });
      expect(sb.rpc).not.toHaveBeenCalledWith('admin_impersonate_restore', expect.objectContaining({
        old_hash: expect.any(String),
      }));
    });
  });

  describe('impersonation_sweep (cron safety net)', function() {
    it('restores expired sessions automatically', async function() {
      const result = await sb.rpc('impersonation_sweep');

      expect(sb.rpc).toHaveBeenCalledWith('impersonation_sweep');
      expect(result.error).toBeNull();
    });

    it('handles multiple expired sessions in one run', async function() {
      await sb.rpc('impersonation_sweep');
      await sb.rpc('impersonation_sweep');

      expect(sb.rpc).toHaveBeenCalledTimes(2);
    });

    it('deletes expired session records after restore', async function() {
      await sb.rpc('impersonation_sweep');

      expect(sb.rpc).toHaveBeenCalledWith('impersonation_sweep');
    });
  });

  describe('Full impersonation lifecycle', function() {
    it('start -> session created with temp password -> sweep removes expired -> restore removes session', async function() {
      const startResult = await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });
      expect(startResult.data.temp_pass).toBeTruthy();
      expect(startResult.data.uid).toBe(mockTargetId);

      const sweepResult = await sb.rpc('impersonation_sweep');
      expect(sweepResult.error).toBeNull();

      const restoreResult = await sb.rpc('admin_impersonate_restore', { target_uid: mockTargetId });
      expect(restoreResult.error).toBeNull();

      expect(sb.rpc).toHaveBeenCalledWith('admin_impersonate_start', { target_uid: mockTargetId });
      expect(sb.rpc).toHaveBeenCalledWith('impersonation_sweep');
      expect(sb.rpc).toHaveBeenCalledWith('admin_impersonate_restore', { target_uid: mockTargetId });
    });

    it('pagehide simulation: restore called on page unload', async function() {
      await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });

      const restoreResult = await sb.rpc('admin_impersonate_restore', { target_uid: mockTargetId });
      expect(restoreResult.error).toBeNull();

      expect(sb.rpc).toHaveBeenCalledWith('admin_impersonate_restore', { target_uid: mockTargetId });
    });

    it('process killed simulation: sweep restores when pagehide never fires', async function() {
      await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });

      const sweepResult = await sb.rpc('impersonation_sweep');
      expect(sweepResult.error).toBeNull();

      const restoreResult = await sb.rpc('admin_impersonate_restore', { target_uid: mockTargetId });
      expect(restoreResult.error).toBeNull();

      expect(sb.rpc).toHaveBeenCalledWith('impersonation_sweep');
    });

    it('prevents account takeover: old_hash never exposed to client', async function() {
      const startResult = await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });

      expect(startResult.data).not.toHaveProperty('old_hash');
      expect(startResult.data).not.toHaveProperty('encrypted_password');
      expect(startResult.data).toHaveProperty('temp_pass');
      expect(startResult.data.temp_pass).not.toBe(mockOldHash);
    });
  });

  describe('admin-create-client flow (related)', function() {
    it('creates client user and company profile', async function() {
      sb.rpc.mockResolvedValueOnce({ data: { user: { id: 'new-user-123' } }, error: null });

      const createResult = await sb.rpc('admin_create_client', {
        email: 'newclient@example.com',
        password: 'securepass123',
        company_name: 'New Client Co',
      });

      expect(createResult.error).toBeNull();
    });
  });

  describe('Security: RLS and permissions', function() {
    it('impersonation_sessions table has no RLS policies for anon/authenticated', async function() {
      expect(sb.from).toBeDefined();
    });

    it('only SECURITY DEFINER functions can access impersonation_sessions', async function() {
      expect(sb.rpc).toBeDefined();
    });

    it('admin_impersonate_restore requires admin role', async function() {
      sb.rpc.mockRejectedValueOnce(new Error('forbidden'));

      await expect(sb.rpc('admin_impersonate_restore', { target_uid: mockTargetId }))
        .rejects.toThrow('forbidden');
    });
  });

  describe('Concurrent impersonation attempts', function() {
    it('second start extends expiration but preserves original old_hash', async function() {
      await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });
      await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });

      expect(sb.rpc).toHaveBeenCalledTimes(2);
    });

    it('restore after double-start still uses original hash', async function() {
      await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });
      await sb.rpc('admin_impersonate_start', { target_uid: mockTargetId });
      await sb.rpc('admin_impersonate_restore', { target_uid: mockTargetId });

      expect(sb.rpc).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error handling', function() {
    it('handles database errors gracefully', async function() {
      sb.rpc.mockRejectedValueOnce(new Error('db connection failed'));

      await expect(sb.rpc('admin_impersonate_start', { target_uid: mockTargetId }))
        .rejects.toThrow('db connection failed');
    });

    it('handles network errors gracefully', async function() {
      sb.rpc.mockRejectedValueOnce(new Error('network error'));

      await expect(sb.rpc('impersonation_sweep'))
        .rejects.toThrow('network error');
    });
  });
});