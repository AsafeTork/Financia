/* sync.worker.js — Background sync Web Worker */
import { sb } from '../lib/supabase.js';
import { now } from '../lib/utils.js';
import { ldb, toLocal, getLastSync, setLastSync, FIELD_MAP, pickFields } from '../lib/dexie.js';

var consecutiveFailures = 0;
var MAX_CONSECUTIVE_FAILURES = 5;
var BACKOFF_MS = 60000;
var lastFailureTs = 0;
var CONCURRENT_LIMIT = 8;
var MAX_PAGINATION_PAGES = 50;

var runLimited = async function(items, fn) {
  var results = [];
  for (var i = 0; i < items.length; i += CONCURRENT_LIMIT) {
    var batch = items.slice(i, i + CONCURRENT_LIMIT);
    var batchResults = await Promise.allSettled(batch.map(fn));
    results = results.concat(batchResults);
  }
  return results;
};

var validHex = function(v) { return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v); };
var PROFILE_WRITE_FIELDS = ['user_id','name','logo','color','color_secondary','color_accent','theme','logo_url','white_label','phone','niche','custom_palette','visual_version','brand_config'];

var syncTable = async function(uid, table, ldbTable, mapLocal, signal) {
  if (!navigator.onLine) return { ok: true, changed: false };
  const lastSync = await getLastSync(uid);
  const fields = FIELD_MAP[table] || [];
  const unsynced = await ldbTable.where('user_id').equals(uid).and(r => r._synced === 0).toArray();
  const toDeleteIds = [];
  const toMarkSynced = [];

  await runLimited(unsynced, async function(row) {
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
  });

  if (toDeleteIds.length > 0) await ldbTable.bulkDelete(toDeleteIds);
  if (toMarkSynced.length > 0) await ldbTable.where('id').anyOf(toMarkSynced).modify({ _synced: 1 });

  var selectFields = (FIELD_MAP[table] || ['id']).join(', ');
  var allRemote = [];
  var cursor = null;
  for (var page = 0; page < MAX_PAGINATION_PAGES; page++) {
    if (signal && signal.aborted) break;
    var query = sb.from(table).select(selectFields).eq('user_id', uid).gte('updated_at', lastSync).order('updated_at', {ascending:true}).limit(500);
    if (cursor) query = query.gt('updated_at', cursor);
    var batch = await query;
    if (batch.error) return { ok: false, changed: false };
    var rows = batch.data || [];
    if (rows.length === 0) break;
    for (var j = 0; j < rows.length; j++) allRemote.push(rows[j]);
    if (rows.length < 500) break;
    cursor = rows[rows.length - 1].updated_at;
  }
  if (allRemote.length === 0) return { ok: true, changed: false };

  var remote = allRemote;
  const remoteIds = remote.map(function(r) { return r.id; });
  const existingArr = await ldbTable.bulkGet(remoteIds);
  const rowsToPut = [];
  remote.forEach(function(row, i) {
    const ex = existingArr[i];
    if (!ex || (ex._synced === 1 && row.updated_at >= (ex._updated_at || ''))) {
      rowsToPut.push(toLocal(row, mapLocal(row)));
    }
  });
  if (rowsToPut.length > 0) await ldbTable.bulkPut(rowsToPut);
  return { ok: true, changed: true };
};

var syncProfiles = async function(uid) {
  if (!navigator.onLine) return true;
  const unsynced = await ldb.profiles.where('user_id').equals(uid).and(r => r._synced === 0).toArray();
  var results = await Promise.allSettled(unsynced.map(async function(row) {
    const clean = {};
    PROFILE_WRITE_FIELDS.forEach(function(k) { if (row[k] !== undefined) clean[k] = row[k]; });
    if (clean.color && !validHex(clean.color)) clean.color = '#002f59';
    if (clean.color_secondary && !validHex(clean.color_secondary)) clean.color_secondary = null;
    if (clean.color_accent && !validHex(clean.color_accent)) clean.color_accent = null;
    clean.updated_at = row.updated_at || now();
    var { error } = await sb.from('company_profiles').upsert(clean, { onConflict: 'user_id' });
    if (!error) await ldb.profiles.update(uid, { _synced: 1 });
    else { await ldb.profiles.update(uid, { _synced: 1 }); return false; }
    return true;
  }));
  var ok = results.every(function(r) { return r.status === 'fulfilled' && r.value !== false; });
  if (!ok) return false;
  var PROFILE_READ_FIELDS = 'user_id,name,logo,color,color_secondary,color_accent,theme,logo_url,white_label,phone,niche,custom_palette,visual_version,brand_config';
  const { data, error: profPullErr } = await sb.from('company_profiles').select(PROFILE_READ_FIELDS).eq('user_id', uid).maybeSingle();
  if (profPullErr) return false;
  if (data) {
    var localRow = await ldb.profiles.get(uid);
    if (!localRow || localRow._synced !== 0) {
      await ldb.profiles.put(toLocal(data));
    }
  }
  return true;
};

var syncAll = async function(uid) {
  if (!uid || !navigator.onLine) return { ok: false, changed: false };
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    if (Date.now() - lastFailureTs < BACKOFF_MS) return { ok: false, changed: false };
    consecutiveFailures = 0;
  }
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, 30000); // 30s timeout in worker
  try {
    const ts = now();
    const results = await Promise.all([
      syncTable(uid, 'transactions', ldb.transactions, function(r) { return { desc: r.description, cat: r.category }; }, controller.signal),
      syncTable(uid, 'products',     ldb.products,     function() { return {}; }, controller.signal),
      syncTable(uid, 'losses',       ldb.losses,       function(r) { return { desc: r.description }; }, controller.signal),
      syncProfiles(uid),
    ]);
    clearTimeout(timer);
    var allOk = results.every(function(r) { return r.ok !== false; });
    var anyChanged = results.some(function(r) { return r.changed === true; });
    await setLastSync(ts, uid);
    consecutiveFailures = 0;
    return { ok: allOk, changed: anyChanged };
  } catch (e) {
    clearTimeout(timer);
    controller.abort();
    consecutiveFailures++;
    lastFailureTs = Date.now();
    console.error('[sync-worker] syncAll failed:', e);
    return { ok: false, changed: false };
  }
};

self.onmessage = async function(e) {
  const { type, uid } = e.data;
  
  if (type === 'sync') {
    self.postMessage({ type: 'sync-start', uid });
    const result = await syncAll(uid);
    self.postMessage({ type: 'sync-complete', uid, result });
  }
  
  if (type === 'sync-table') {
    const { table } = e.data;
    const tableMap = {
      transactions: { ldbTable: ldb.transactions, mapLocal: (r) => ({ desc: r.description, cat: r.category }) },
      products: { ldbTable: ldb.products, mapLocal: () => ({}) },
      losses: { ldbTable: ldb.losses, mapLocal: (r) => ({ desc: r.description }) },
    };
    const config = tableMap[table];
    if (config) {
      const result = await syncTable(uid, table, config.ldbTable, config.mapLocal);
      self.postMessage({ type: 'table-sync-complete', uid, table, result });
    }
  }
};
