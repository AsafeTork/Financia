import { useState } from 'react';
import { sb } from '../lib/supabase.js';
import { ldb } from '../lib/db.js';
import { isRecurringId, addSkip } from '../lib/recurring.js';
import { rowMeta, updMeta, deletedMeta, applyEdit, countLimit, dexiePut, dexieUpdate, syncUpsert, syncUpdate, syncDelete } from '../lib/crud.js';

export function useTx(session, enforceLimit, toast) {
  var [tx, setTx] = useState([]);

  var addTx = async function(t) {
    var cnt = await countLimit(ldb, 'transactions', session.user.id);
    if (!enforceLimit('transactions', cnt)) return false;
    if (!t.desc || !t.desc.trim()) { toast('Descricao obrigatoria', 'error'); return false; }
    if (!t.amount || Number(t.amount) <= 0) { toast('Valor deve ser maior que zero', 'error'); return false; }
    var meta = rowMeta(session);
    var row = {id:t.id, type:t.type, description:t.desc, amount:Number(t.amount), date:t.date, method:t.method||null, category:t.cat||null, items:t.items||null, desc:t.desc, cat:t.cat||null, user_id:meta.user_id, registered_by:meta.registered_by, updated_at:meta.updated_at, _synced:meta._synced, _deleted:meta._deleted, _updated_at:meta._updated_at};
    if (!await dexiePut(ldb, 'transactions', row, toast)) return false;
    setTx(function(p) { return [row].concat(p); });
    await syncUpsert(sb, 'transactions', {id:row.id, type:row.type, description:row.description, amount:row.amount, date:row.date, method:row.method, category:row.category, items:row.items, user_id:meta.user_id, registered_by:meta.registered_by, updated_at:row.updated_at}, ldb, row.id, toast);
    return true;
  };

  var editTx = async function(id, u) {
    if (!u.desc || !u.desc.trim()) { toast('Descricao obrigatoria', 'error'); return false; }
    if (!u.amount || Number(u.amount) <= 0) { toast('Valor deve ser maior que zero', 'error'); return false; }
    var upd = Object.assign({description:u.desc, amount:Number(u.amount), date:u.date, method:u.method||null, category:u.cat||null, desc:u.desc, cat:u.cat||null}, updMeta());
    if (!await dexieUpdate(ldb, 'transactions', id, upd, toast)) return false;
    setTx(function(p) { return applyEdit(p, id, upd); });
    await syncUpdate(sb, 'transactions', {description:upd.description, amount:upd.amount, date:upd.date, method:upd.method, category:upd.category, updated_at:upd.updated_at}, id, ldb, toast);
    return true;
  };

  var addGenerated = async function(row) {
    var existing = await ldb.transactions.get(row.id);
    if (existing) return false;
    if (!await dexiePut(ldb, 'transactions', row, toast)) return false;
    setTx(function(p) {
      if (p.some(function(t) { return t.id === row.id; })) return p;
      return [Object.assign({}, row, {desc:row.description||row.desc, cat:row.category||row.cat})].concat(p);
    });
    if (navigator.onLine) {
      try {
        var res = await sb.from('transactions').upsert({id:row.id, type:row.type, description:row.description, amount:row.amount, date:row.date, method:row.method, category:row.category, items:row.items, user_id:row.user_id, registered_by:row.registered_by, updated_at:row.updated_at});
        if (!res.error) await ldb.transactions.update(row.id, {_synced:1});
      } catch (e) { void e; }
    }
    return true;
  };

  var deleteTx = async function(id) {
    if (isRecurringId(id)) { try { var r = await ldb.transactions.get(id); if (r) await addSkip(r.user_id, id); } catch (e) { void e; } }
    if (!await dexieUpdate(ldb, 'transactions', id, deletedMeta(), toast)) return false;
    setTx(function(p) { return p.filter(function(t) { return t.id !== id; }); });
    await syncDelete(sb, 'transactions', id, ldb, toast);
    return true;
  };

  return {tx, setTx, addTx, addGenerated, editTx, deleteTx};
}
