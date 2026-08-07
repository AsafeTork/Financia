import Dexie from 'dexie';
import { now } from './utils.js';

export const ldb = new Dexie('gestao_offline');

ldb.version(5).stores({
  // Índices compostos (P0 #2): cada um otimiza uma query específica.
  // [user_id+_synced]           -> sync.js/sync.worker.js: scan de linhas não sincronizadas
  //                                (where('[user_id+_synced]').equals([uid,0])) em vez de
  //                                varrer todas as linhas do usuário + filtro JS em _synced.
  // [user_id+_deleted+date]     -> useDataLoader.js: carregar transações/losses ativos ordenados
  //                                por data sem re-sort em memória (sortBy('date')).
  // [user_id+_deleted+created_at]-> useDataLoader.js: carregar produtos ativos ordenados por
  //                                created_at sem re-sort em memória (sortBy('created_at')).
  transactions: 'id, user_id, [user_id+_deleted], [user_id+updated_at], date, updated_at, _synced, _deleted, [user_id+_synced], [user_id+_deleted+date]',
  products:     'id, user_id, [user_id+_deleted], [user_id+updated_at], created_at, category, updated_at, _synced, _deleted, [user_id+_synced], [user_id+_deleted+created_at]',
  losses:       'id, user_id, [user_id+_deleted], [user_id+updated_at], date, updated_at, _synced, _deleted, [user_id+_synced], [user_id+_deleted+date]',
  profiles:     'user_id, updated_at, _synced, [user_id+_synced]',
  meta:         'key',
  brand_presets: 'id, name, category, favorite, updated_at',
  brand_logo_schemes: 'id, name, createdAt',
}).upgrade(async (tx) => {
  const tables = ['transactions', 'products', 'losses'];
  for (const tableName of tables) {
    await tx.table(tableName).toCollection().modify(row => {
      if (row._synced === undefined) row._synced = 1;
      if (row._deleted === undefined) row._deleted = 0;
    });
  }
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
