import Dexie from 'dexie';
import { now } from './utils.js';

export const ldb = new Dexie('gestao_offline');

ldb.version(2).stores({
  transactions: 'id, user_id, date, updated_at, _synced, _deleted',
  products:     'id, user_id, category, updated_at, _synced, _deleted',
  losses:       'id, user_id, date, updated_at, _synced, _deleted',
  profiles:     'user_id, updated_at, _synced',
  meta:         'key',
});

ldb.version(1).stores({
  transactions: 'id, user_id, date, updated_at',
  products:     'id, user_id, category, updated_at',
  losses:       'id, user_id, date, updated_at',
  profiles:     'user_id, updated_at',
  meta:         'key',
});

export const toLocal = function(row, extra) {
  if (!extra) extra = {};
  var base = { _synced: 1, _deleted: 0, _updated_at: row.updated_at || row.created_at || now() };
  return Object.assign({}, row, base, extra);
};

export const getLastSync = async function(uid) {
  const key = uid ? 'last_sync_' + uid : 'last_sync';
  const r = await ldb.meta.get(key);
  return r ? r.val : '1970-01-01T00:00:00Z';
};

export const setLastSync = function(ts, uid) {
  const key = uid ? 'last_sync_' + uid : 'last_sync';
  return ldb.meta.put({ key: key, val: ts });
};

export const TX_FIELDS  = ['id','type','description','amount','date','method','category','items','user_id','registered_by','updated_at'];
export const PRD_FIELDS = ['id','name','category','price','cost','stock','user_id','registered_by','updated_at'];
export const LSS_FIELDS = ['id','description','qty','reason','date','user_id','registered_by','updated_at'];

export const FIELD_MAP = { transactions: TX_FIELDS, products: PRD_FIELDS, losses: LSS_FIELDS };

export const pickFields = function(obj, fields) {
  const out = {};
  fields.forEach(function(k) { if (obj[k] !== undefined) out[k] = obj[k]; });
  return out;
};
