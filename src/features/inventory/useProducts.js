import { useState, useCallback } from 'react';
import { sb } from '../../lib/supabase.js';
import { ldb } from '../../lib/dexie.js';
import { rowMeta, updMeta, deletedMeta, applyEdit, countLimit, dexiePut, dexieUpdate, syncUpsert, syncUpdate, syncDelete } from '../../lib/crud.js';

export function useProducts(session, enforceLimit, toast) {
  const [products, setProducts] = useState([]);

  const addProduct = useCallback(async function(p) {
    if (!session) return false;
    const cnt = await countLimit(ldb, 'products', session.user.id);
    if (!enforceLimit('products', cnt)) return false;
    if (!p.name || !p.name.trim()) { toast('Nome do produto obrigatorio', 'error'); return false; }
    if (p.price == null || Number(p.price) < 0) { toast('Preco invalido', 'error'); return false; }
    if (p.stock != null && Number(p.stock) < 0) { toast('Estoque invalido', 'error'); return false; }
    const meta = rowMeta(session);
    const stock = (p.stock !== '' && p.stock != null) ? Number(p.stock) : null;
    const row = {id:p.id, name:p.name, category:p.category||null, price:Number(p.price), cost:Number(p.cost)||0, stock:stock, user_id:meta.user_id, registered_by:meta.registered_by, updated_at:meta.updated_at, _synced:meta._synced, _deleted:meta._deleted, _updated_at:meta._updated_at};
    if (!await dexiePut(ldb, 'products', row, toast)) return false;
    setProducts(function(prev) { return prev.concat([row]); });
    await syncUpsert(sb, 'products', {id:row.id, name:row.name, category:row.category, price:row.price, cost:row.cost, stock:row.stock, user_id:meta.user_id, registered_by:meta.registered_by, updated_at:row.updated_at}, ldb, row.id, toast);
    return true;
  }, [session, enforceLimit, toast]);

  const editProduct = useCallback(async function(id, u) {
    if (!session) return false;
    if (!u.name || !u.name.trim()) { toast('Nome do produto obrigatorio', 'error'); return false; }
    const upd = Object.assign({name:u.name, category:u.category||null, price:Number(u.price), cost:Number(u.cost)||0, stock:(u.stock!==''&&u.stock!=null)?Number(u.stock):null}, updMeta());
    if (!await dexieUpdate(ldb, 'products', id, upd, toast)) return false;
    setProducts(function(p) { return applyEdit(p, id, upd); });
    await syncUpdate(sb, 'products', {name:upd.name, category:upd.category, price:upd.price, cost:upd.cost, stock:upd.stock, updated_at:upd.updated_at}, id, ldb, toast);
    return true;
  }, [session, toast]);

  const deleteProduct = useCallback(async function(id) {
    if (!session) return false;
    if (!await dexieUpdate(ldb, 'products', id, deletedMeta(), toast)) return false;
    setProducts(function(p) { return p.filter(function(prod) { return prod.id !== id; }); });
    await syncDelete(sb, 'products', id, ldb, toast);
    return true;
  }, [session, toast]);

  const adjustStock = useCallback(async function(id, delta) {
    if (!session) return false;
    const found = products.find(function(p) { return p.id === id; });
    if (!found) return false;
    const ns = Math.max(0, (found.stock || 0) + delta);
    const upd = Object.assign({stock:ns}, updMeta());
    if (!await dexieUpdate(ldb, 'products', id, upd, toast)) return false;
    setProducts(function(p) { return applyEdit(p, id, upd); });
    await syncUpdate(sb, 'products', {stock:ns, updated_at:upd.updated_at}, id, ldb, toast);
    return true;
  }, [products, session, toast]);

  return {products, setProducts, addProduct, editProduct, deleteProduct, adjustStock};
}