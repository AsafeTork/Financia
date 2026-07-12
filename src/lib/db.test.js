import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

function newCollection() {
  return {
    equals: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
    anyOf: vi.fn().mockReturnThis(),
    modify: vi.fn().mockResolvedValue(undefined),
  };
}

function newTable() {
  const col = newCollection();
  return {
    where: vi.fn().mockReturnValue(col),
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    bulkPut: vi.fn().mockResolvedValue(undefined),
    bulkGet: vi.fn().mockResolvedValue([]),
    bulkDelete: vi.fn().mockResolvedValue(undefined),
    toArray: vi.fn().mockResolvedValue([]),
    collection: col,
  };
}

function newSupabaseQuery() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    is: vi.fn().mockReturnThis(),
    then: vi.fn(function(resolve) {
      resolve({ data: null, error: null });
    }),
  };
}

let _mockTransactions;
let _mockProducts;
let _mockLosses;
let mockProfiles;
let _mockMeta;
let mockQuery;

vi.mock('dexie', function() {
  const t = newTable();
  const p = newTable();
  const l = newTable();
  const pr = newTable();
  const m = newTable();
  _mockTransactions = t;
  _mockProducts = p;
  _mockLosses = l;
  mockProfiles = pr;
  _mockMeta = m;
  const MockDexie = vi.fn(function() {
    return {
      version: vi.fn().mockReturnThis(),
      stores: vi.fn().mockReturnThis(),
      transactions: t,
      products: p,
      losses: l,
      profiles: pr,
      meta: m,
    };
  });
  return { default: MockDexie };
});

vi.mock('./supabase.js', function() {
  mockQuery = newSupabaseQuery();
  return {
    sb: {
      from: vi.fn().mockReturnValue(mockQuery),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      functions: { invoke: vi.fn().mockResolvedValue(null) },
      storage: { from: vi.fn().mockReturnValue({ upload: vi.fn().mockResolvedValue({ data: null, error: null }) }) },
    },
  };
});

import { syncAll } from './sync.js';
import { sb } from './supabase.js';

const UID = 'test-user-id';

describe('syncProfiles (via syncAll)', function() {

  beforeEach(function() {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockQuery.then.mockImplementation(function(resolve) {
      resolve({ data: null, error: null });
    });
    mockQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockQuery.upsert.mockResolvedValue({ data: null, error: null });
    mockProfiles.collection.toArray.mockResolvedValue([]);
    mockProfiles.get.mockResolvedValue(null);
    mockProfiles.put.mockResolvedValue(undefined);
    mockProfiles.update.mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { onLine: true });
  });

  afterEach(function() {
    vi.useRealTimers();
  });

  it('push sends all PROFILE_WRITE_FIELDS including white_label to upsert', async function() {
    const localRow = {
      user_id: UID,
      name: 'Test Co',
      logo: 'l.png',
      color: '#000000',
      color_secondary: '#111111',
      color_accent: '#222222',
      theme: 'dark',
      logo_url: 'https://ex.com/l.png',
      white_label: true,
      phone: '11999999999',
      niche: 'finance',
      custom_palette: '{"primary":"#333"}',
      visual_version: 2,
      _synced: 0,
      updated_at: '2025-01-01T00:00:00Z',
    };

    mockProfiles.collection.toArray.mockResolvedValue([localRow]);
    mockQuery.maybeSingle.mockResolvedValue({ data: null, error: null });

    const _result = await syncAll(UID);

    expect(sb.from).toHaveBeenCalledWith('company_profiles');
    expect(mockQuery.upsert).toHaveBeenCalledTimes(1);
    const payload = mockQuery.upsert.mock.calls[0][0];
    expect(payload.white_label).toBe(true);
    expect(payload.user_id).toBe(UID);
    expect(payload.name).toBe('Test Co');
    expect(payload.color).toBe('#000000');
    expect(payload.color_secondary).toBe('#111111');
    expect(payload.color_accent).toBe('#222222');
    expect(payload.theme).toBe('dark');
    expect(payload.logo_url).toBe('https://ex.com/l.png');
    expect(payload.phone).toBe('11999999999');
    expect(payload.niche).toBe('finance');
    expect(payload.custom_palette).toBe('{"primary":"#333"}');
    expect(payload.visual_version).toBe(2);
    expect(payload.logo).toBe('l.png');
    expect(payload.updated_at).toBe('2025-01-01T00:00:00Z');
    expect(mockProfiles.update).toHaveBeenCalledWith(UID, { _synced: 1 });
  });

  it('pull does not overwrite local when _synced is 0', async function() {
    mockProfiles.get.mockResolvedValue({ user_id: UID, name: 'Local', _synced: 0 });
    mockQuery.maybeSingle.mockResolvedValue({
      data: { user_id: UID, name: 'Remote', color: '#fff', updated_at: '2025-06-01T00:00:00Z' },
      error: null,
    });

    await syncAll(UID);

    expect(mockProfiles.put).not.toHaveBeenCalled();
  });

  it('pull overwrites local when _synced is 1', async function() {
    mockProfiles.get.mockResolvedValue({ user_id: UID, name: 'Local', _synced: 1 });
    mockQuery.maybeSingle.mockResolvedValue({
      data: { user_id: UID, name: 'Remote', color: '#fff', updated_at: '2025-06-01T00:00:00Z' },
      error: null,
    });

    await syncAll(UID);

    expect(mockProfiles.put).toHaveBeenCalledTimes(1);
    const saved = mockProfiles.put.mock.calls[0][0];
    expect(saved.name).toBe('Remote');
    expect(saved._synced).toBe(1);
  });

  it('returns false when sync exceeds 15s timeout', async function() {
    mockQuery.then.mockImplementation(function() {
      return new Promise(function() {});
    });
    mockQuery.maybeSingle.mockReturnValue(new Promise(function() {}));
    mockQuery.upsert.mockReturnValue(new Promise(function() {}));

    vi.useFakeTimers();
    const promise = syncAll(UID);
    await vi.advanceTimersByTimeAsync(15001);
    const result = await promise;
    expect(result).toBe(false);
  });

});
