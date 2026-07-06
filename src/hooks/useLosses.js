import { useState } from 'react';
import { sb } from '../lib/supabase.js';
import { ldb } from '../lib/db.js';
import { rowMeta, updMeta, deletedMeta, applyEdit, countLimit, dexiePut, dexieUpdate, syncUpsert, syncUpdate, syncDelete } from '../lib/crud.js';

export function useLosses(session, enforceLimit, toast) {
  var [losses, setLosses] = useState([]);

  var addLoss = async function(l) {
    var cnt = await countLimit(ldb, 'losses', session.user.id);
    if (!enforceLimit('losses', cnt)) return false;
    if (!l.desc || !l.desc.trim()) { toast('Descricao obrigatoria', 'error'); return false; }
    if (!l.qty || Number(l.qty) <= 0) { toast('Quantidade deve ser maior que zero', 'error'); return false; }
    var meta = rowMeta(session);
    var row = {id:l.id, description:l.desc, qty:Number(l.qty), reason:l.reason||null, date:l.date, desc:l.desc, user_id:meta.user_id, registered_by:meta.registered_by, updated_at:meta.updated_at, _synced:meta._synced, _deleted:meta._deleted, _updated_at:meta._updated_at};
    if (!await dexiePut(ldb, 'losses', row, toast)) return false;
    setLosses(function(p) { return [row].concat(p); });
    await syncUpsert(sb, 'losses', {id:row.id, description:row.description, qty:row.qty, reason:row.reason, date:row.date, user_id:meta.user_id, registered_by:meta.registered_by, updated_at:row.updated_at}, ldb, row.id, toast);
    return true;
  };

  var editLoss = async function(id, u) {
    if (!u.desc || !u.desc.trim()) { toast('Descricao obrigatoria', 'error'); return false; }
    if (!u.qty || Number(u.qty) <= 0) { toast('Quantidade deve ser maior que zero', 'error'); return false; }
    var upd = Object.assign({description:u.desc, qty:Number(u.qty), reason:u.reason||null, date:u.date, desc:u.desc}, updMeta());
    if (!await dexieUpdate(ldb, 'losses', id, upd, toast)) return false;
    setLosses(function(p) { return applyEdit(p, id, upd); });
    await syncUpdate(sb, 'losses', {description:upd.description, qty:upd.qty, reason:upd.reason, date:upd.date, updated_at:upd.updated_at}, id, ldb, toast);
    return true;
  };

  var deleteLoss = async function(id) {
    if (!await dexieUpdate(ldb, 'losses', id, deletedMeta(), toast)) return false;
    setLosses(function(p) { return p.filter(function(l) { return l.id !== id; }); });
    await syncDelete(sb, 'losses', id, ldb, toast);
    return true;
  };

  return {losses, setLosses, addLoss, editLoss, deleteLoss};
}
