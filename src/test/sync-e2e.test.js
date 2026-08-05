import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ldb } from '../lib/dexie.js';
describe('Sync E2E', () => {
  beforeEach(async () => {
    if (ldb.isOpen && !ldb.isOpen()) {
      await ldb.open();
    }
    await ldb.transactions.clear();
    await ldb.products.clear();
    await ldb.losses.clear();
    await ldb.profiles.clear();
  });

  afterEach(async () => {
    await ldb.transactions.clear();
    await ldb.products.clear();
    await ldb.losses.clear();
    await ldb.profiles.clear();
  });

  it('should sync transactions locally', async () => {
    const testTx = {
      id: 'test-tx-1',
      user_id: 'test-user',
      type: 'income',
      description: 'Test sale',
      amount: 100,
      date: '2026-08-05',
      method: 'cash',
      category: 'sales',
      updated_at: new Date().toISOString(),
      _synced: 0,
      _deleted: 0,
    };

    await ldb.transactions.put(testTx);
    const local = await ldb.transactions.get('test-tx-1');
    expect(local).toBeDefined();
    expect(local.description).toBe('Test sale');
    expect(local._synced).toBe(0);
  });

  it('should handle offline queue', async () => {
    const tx1 = {
      id: 'offline-1',
      user_id: 'test-user',
      type: 'expense',
      description: 'Offline expense',
      amount: 50,
      date: '2026-08-05',
      method: 'card',
      category: 'supplies',
      updated_at: new Date().toISOString(),
      _synced: 0,
      _deleted: 0,
    };

    const tx2 = {
      id: 'offline-2',
      user_id: 'test-user',
      type: 'income',
      description: 'Offline income',
      amount: 200,
      date: '2026-08-05',
      method: 'pix',
      category: 'sales',
      updated_at: new Date().toISOString(),
      _synced: 0,
      _deleted: 0,
    };

    await ldb.transactions.bulkPut([tx1, tx2]);
    const all = await ldb.transactions.toArray();
    const unsynced = all.filter(r => r.user_id === 'test-user' && r._synced === 0);

    expect(unsynced).toHaveLength(2);
  });

  it('should mark records as synced', async () => {
    const tx = {
      id: 'sync-test-1',
      user_id: 'test-user',
      type: 'income',
      description: 'Sync test',
      amount: 100,
      date: '2026-08-05',
      method: 'cash',
      category: 'sales',
      updated_at: new Date().toISOString(),
      _synced: 0,
      _deleted: 0,
    };

    await ldb.transactions.put(tx);
    await ldb.transactions.update('sync-test-1', { _synced: 1 });

    const updated = await ldb.transactions.get('sync-test-1');
    expect(updated._synced).toBe(1);
  });

  it('should handle soft delete', async () => {
    const tx = {
      id: 'delete-test-1',
      user_id: 'test-user',
      type: 'expense',
      description: 'To delete',
      amount: 30,
      date: '2026-08-05',
      method: 'cash',
      category: 'other',
      updated_at: new Date().toISOString(),
      _synced: 1,
      _deleted: 0,
    };

    await ldb.transactions.put(tx);
    await ldb.transactions.update('delete-test-1', { _deleted: 1, _synced: 0 });

    const deleted = await ldb.transactions.get('delete-test-1');
    expect(deleted._deleted).toBe(1);
    expect(deleted._synced).toBe(0);
  });

  it('should query by user_id efficiently', async () => {
    const txs = [
      { id: 'u1-tx1', user_id: 'user1', type: 'income', amount: 100, date: '2026-08-05', _synced: 1, _deleted: 0, updated_at: new Date().toISOString() },
      { id: 'u1-tx2', user_id: 'user1', type: 'expense', amount: 50, date: '2026-08-05', _synced: 1, _deleted: 0, updated_at: new Date().toISOString() },
      { id: 'u2-tx1', user_id: 'user2', type: 'income', amount: 200, date: '2026-08-05', _synced: 1, _deleted: 0, updated_at: new Date().toISOString() },
    ];

    await ldb.transactions.bulkPut(txs);
    const all = await ldb.transactions.toArray();
    const user1Tx = all.filter(t => t.user_id === 'user1');
    expect(user1Tx).toHaveLength(2);
  });
});
