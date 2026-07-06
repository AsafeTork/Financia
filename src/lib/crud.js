import { now } from './utils.js';

export function getRb(session) {
  var meta = session.user.user_metadata;
  return meta && meta.name ? meta.name : session.user.email;
}

export function rowMeta(session) {
  return { user_id: session.user.id, registered_by: getRb(session), updated_at: now(), _synced: 0, _deleted: 0, _updated_at: now() };
}

export function updMeta() {
  return { updated_at: now(), _synced: 0, _updated_at: now() };
}

export function deletedMeta() {
  return { _deleted: 1, _synced: 0, _updated_at: now() };
}

export function applyEdit(list, id, upd) {
  return list.map(function(x) { return x.id === id ? Object.assign({}, x, upd) : x; });
}

export async function countLimit(ldb, table, userId) {
  return await ldb[table].where('user_id').equals(userId).filter(function(r) { return !r._deleted; }).count();
}

export async function dexiePut(ldb, table, row, toast) {
  try { await ldb[table].put(row); return true; }
  catch (e) { toast('Erro ao salvar: ' + (e.message || 'tente novamente'), 'error'); return false; }
}

export async function dexieUpdate(ldb, table, id, upd, toast) {
  try { await ldb[table].update(id, upd); return true; }
  catch (e) { toast('Erro ao salvar: ' + (e.message || 'tente novamente'), 'error'); return false; }
}

export async function syncUpsert(sb, table, payload, ldb, id, toast) {
  if (!navigator.onLine) return;
  try {
    var res = await sb.from(table).upsert(payload);
    if (!res.error) await ldb[table].update(id, { _synced: 1 });
    else toast('Salvo no aparelho — sincroniza ao reconectar', 'warning');
  } catch (e) { toast('Salvo no aparelho — sincroniza ao reconectar', 'warning'); }
}

export async function syncUpdate(sb, table, payload, id, ldb, toast) {
  if (!navigator.onLine) return;
  try {
    var res = await sb.from(table).update(payload).eq('id', id);
    if (!res.error) await ldb[table].update(id, { _synced: 1 });
    else toast('Salvo no aparelho — sincroniza ao reconectar', 'warning');
  } catch (e) { toast('Salvo no aparelho — sincroniza ao reconectar', 'warning'); }
}

export async function syncDelete(sb, table, id, ldb, toast) {
  if (!navigator.onLine) return;
  try {
    var res = await sb.from(table).delete().eq('id', id);
    if (!res.error) await ldb[table].delete(id);
  } catch (e) { toast('Removido do aparelho — sincroniza ao reconectar', 'warning'); }
}
