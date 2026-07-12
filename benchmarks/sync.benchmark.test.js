import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Dexie from 'dexie';

const PROFILE_WRITE_FIELDS = ['user_id','name','logo','color','color_secondary','color_accent','theme','logo_url','white_label','phone','niche','custom_palette','visual_version'];
const validHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);

const now = () => new Date().toISOString();

const FIELD_MAP = {
  transactions: ['id','user_id','amount','description','category','type','date','created_at','updated_at'],
  products: ['id','user_id','name','price','cost','category','stock','created_at','updated_at'],
  losses: ['id','user_id','description','amount','category','date','created_at','updated_at'],
};

const pickFields = (row, fields) => {
  const out = {};
  fields.forEach((f) => { if (row[f] !== undefined) out[f] = row[f]; });
  return out;
};

const toLocal = (row, mapLocal) => ({ ...row, ...mapLocal(row), _synced: 1, _updated_at: row.updated_at });

let ldb;
let sb;
let lastSyncStore = {};

const getLastSync = async (uid) => lastSyncStore[uid] || '2020-01-01';
const setLastSync = async (ts, uid) => { lastSyncStore[uid] = ts; };

const syncTable = async (uid, table, ldbTable, mapLocal) => {
  if (!navigator.onLine) return true;
  const lastSync = await getLastSync(uid);
  const fields = FIELD_MAP[table] || [];

  const unsynced = await ldbTable.where('user_id').equals(uid).and(r => r._synced === 0).toArray();
  const toDeleteIds = [];
  const toMarkSynced = [];
  for (const row of unsynced) {
    try {
      if (row._deleted) {
        await sb.from(table).delete().eq('id', row.id);
        toDeleteIds.push(row.id);
      } else {
        const sbRow = pickFields(
          Object.assign({}, row, { description: row.description || row.desc, category: row.category || row.cat }),
          fields
        );
        const { error } = await sb.from(table).upsert(sbRow, { onConflict: 'id' });
        if (!error) toMarkSynced.push(row.id);
      }
    } catch (_) { void _; }
  }
  if (toDeleteIds.length > 0) await ldbTable.bulkDelete(toDeleteIds);
  if (toMarkSynced.length > 0) await ldbTable.where('id').anyOf(toMarkSynced).modify({ _synced: 1 });

  const { data: remote, error: pullErr } = await sb.from(table).select('*')
    .eq('user_id', uid)
    .gte('updated_at', lastSync)
    .limit(500);
  if (pullErr) return false;
  if (!remote || remote.length === 0) return true;

  const remoteIds = remote.map((r) => r.id);
  const existingArr = await ldbTable.bulkGet(remoteIds);
  const rowsToPut = [];
  remote.forEach((row, i) => {
    const ex = existingArr[i];
    if (!ex || (ex._synced === 1 && row.updated_at >= (ex._updated_at || ''))) {
      rowsToPut.push(toLocal(row, mapLocal(row)));
    }
  });
  if (rowsToPut.length > 0) await ldbTable.bulkPut(rowsToPut);

  return true;
};

const syncProfiles = async (uid) => {
  if (!navigator.onLine) return true;
  const unsynced = await ldb.profiles.where('user_id').equals(uid).and(r => r._synced === 0).toArray();
  let ok = true;
  for (const row of unsynced) {
    const clean = {};
    PROFILE_WRITE_FIELDS.forEach((k) => { if (row[k] !== undefined) clean[k] = row[k]; });
    if (clean.color && !validHex(clean.color)) clean.color = '#002f59';
    if (clean.color_secondary && !validHex(clean.color_secondary)) clean.color_secondary = null;
    if (clean.color_accent && !validHex(clean.color_accent)) clean.color_accent = null;
    clean.updated_at = row.updated_at || now();
    const { error } = await sb.from('company_profiles').upsert(clean, { onConflict: 'user_id' });
    if (!error) await ldb.profiles.update(uid, { _synced: 1 });
    else { await ldb.profiles.update(uid, { _synced: 1 }); ok = false; }
  }
  if (!ok) return false;
  const { data, error: profPullErr } = await sb.from('company_profiles').select('*').eq('user_id', uid).maybeSingle();
  if (profPullErr) return false;
  if (data) {
    const localRow = await ldb.profiles.get(uid);
    if (!localRow || localRow._synced !== 0) {
      await ldb.profiles.put(toLocal(data));
    }
  }
  return true;
};

const syncAll = async (uid) => {
  if (!uid || !navigator.onLine) return false;
  try {
    const ts = now();
    const results = await Promise.all([
      syncTable(uid, 'transactions', ldb.transactions, (r) => ({ desc: r.description, cat: r.category })),
      syncTable(uid, 'products', ldb.products, () => ({})),
      syncTable(uid, 'losses', ldb.losses, (r) => ({ desc: r.description })),
      syncProfiles(uid),
    ]);
    await setLastSync(ts, uid);
    return results.every(Boolean);
  } catch { return false; }
};

const TEST_UID = 'benchmark-user-10k';

function generateTestData(count) {
  const transactions = [];
  const products = [];
  const losses = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    transactions.push({
      id: `tx_${i}`,
      user_id: TEST_UID,
      amount: Math.floor(Math.random() * 100000),
      description: `Transaction ${i}`,
      category: 'food',
      type: i % 2 === 0 ? 'income' : 'expense',
      date: new Date(baseTime + i * 1000).toISOString(),
      created_at: new Date(baseTime + i * 1000).toISOString(),
      updated_at: new Date(baseTime + i * 1000).toISOString(),
      _synced: 0,
      _updated_at: new Date(baseTime + i * 1000).toISOString(),
    });

    products.push({
      id: `pr_${i}`,
      user_id: TEST_UID,
      name: `Product ${i}`,
      price: Math.floor(Math.random() * 50000),
      cost: Math.floor(Math.random() * 20000),
      category: 'general',
      stock: Math.floor(Math.random() * 100),
      created_at: new Date(baseTime + i * 1000).toISOString(),
      updated_at: new Date(baseTime + i * 1000).toISOString(),
      _synced: 0,
      _updated_at: new Date(baseTime + i * 1000).toISOString(),
    });

    losses.push({
      id: `ls_${i}`,
      user_id: TEST_UID,
      description: `Loss ${i}`,
      amount: Math.floor(Math.random() * 50000),
      category: 'waste',
      date: new Date(baseTime + i * 1000).toISOString(),
      created_at: new Date(baseTime + i * 1000).toISOString(),
      updated_at: new Date(baseTime + i * 1000).toISOString(),
      _synced: 0,
      _updated_at: new Date(baseTime + i * 1000).toISOString(),
    });
  }

  return { transactions, products, losses };
}

function setupMockSupabase() {
  const mockQb = {
    select: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    delete: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn(function(onFulfilled) { return Promise.resolve({ data: [], error: null }).then(onFulfilled); }),
  };

  sb = {
    from: vi.fn(() => mockQb),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  };
}

async function seedDatabase({ transactions, products, losses }) {
  await ldb.transactions.bulkPut(transactions);
  await ldb.products.bulkPut(products);
  await ldb.losses.bulkPut(losses);
  await ldb.profiles.put({
    user_id: TEST_UID,
    name: 'Benchmark User',
    _synced: 1,
    _updated_at: new Date().toISOString(),
  });
}

async function clearDatabase() {
  await ldb.transactions.clear();
  await ldb.products.clear();
  await ldb.losses.clear();
  await ldb.profiles.clear();
  await ldb.lastSync.clear();
  lastSyncStore = {};
}

describe('syncAll 10k benchmark', () => {
  beforeAll(async () => {
    ldb = new Dexie('FinanciaBenchmark');
    ldb.version(1).stores({
      transactions: 'id, user_id, _synced, updated_at',
      products: 'id, user_id, _synced, updated_at',
      losses: 'id, user_id, _synced, updated_at',
      profiles: 'user_id, _synced, updated_at',
      lastSync: 'user_id',
    });
    await ldb.open();

    setupMockSupabase();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    const testData = generateTestData(10000);
    await seedDatabase(testData);
  }, 60000);

  afterAll(async () => {
    await clearDatabase();
    await ldb.close();
  }, 30000);

  it('syncAll with 10k records completes under 5s', async () => {
    const start = performance.now();
    const result = await syncAll(TEST_UID);
    const end = performance.now();

    const totalTimeMs = end - start;
    const recordsPerSecond = (30000 / totalTimeMs) * 1000;
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;

    const metrics = {
      totalTimeMs: Math.round(totalTimeMs),
      recordsPerSecond: Math.round(recordsPerSecond * 100) / 100,
      memoryUsage: Math.round(memoryUsage * 100) / 100,
      recordsProcessed: 30000,
      success: result,
    };

    const fs = await import('fs');
    const path = await import('path');
    const benchmarksDir = path.resolve('/workspaces/financia/benchmarks');
    if (!fs.existsSync(benchmarksDir)) {
      fs.mkdirSync(benchmarksDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(benchmarksDir, 'syncAll-10k.json'),
      JSON.stringify(metrics, null, 2)
    );

    console.log('Benchmark metrics:', JSON.stringify(metrics, null, 2));

    expect(result).toBe(true);
    expect(totalTimeMs).toBeLessThan(5000);
  }, 60000);
});