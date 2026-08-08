import React, { useState, useMemo, useRef, useCallback, useTransition } from 'react';
import { Card, Inp, NumInp, Sel, Modal, Btn, PageHead } from '../../shared/ui/ui.jsx';
import { SaleForm } from '../../shared/ui/SaleForm.jsx';
import ExportButtons from '../../shared/ui/ExportButtons.jsx';
import { TransactionCard, TransactionGroupHeader } from '../../shared/ui/TransactionCard.jsx';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import { fmt, fmtDate, today, safe, uid, brandAlpha } from '../../lib/utils.js';
import { getRecurring, setRecurring, buildRecurringRow, periodOf } from '../../lib/recurring.js';
import { effectivePlan } from '../../lib/constants.js';
import { exportPDF, exportXLS } from '../../lib/exporters.js';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue.js';
import { useQuickIntent } from '../../lib/quickIntent.js';
import { usePullToRefresh } from '../../shared/hooks/usePullToRefresh.js';
import PullToRefreshIndicator from '../../shared/ui/PullToRefreshIndicator.jsx';
import { categorizeBatch, learnCategory } from '../../lib/categorize.js';

export default React.memo(function TxView({ type, tx, products, onAdd, onEdit, onDelete, onDeductStock, onAddGenerated, uid: userId, brand, toast, confirm, planInfo, onNav, onRefresh }) {
  var isIncome = type === 'income';
  var accentColor = isIncome ? brand.color : 'var(--danger)';
  var accentBg    = isIncome ? brandAlpha(brand.color, 0.08) : 'color-mix(in srgb, var(--danger) 6%, transparent)';
  var paid = effectivePlan(planInfo) !== 'free';

  var [modal, setModal]       = useState(false);
  var [editItem, setEditItem] = useState(null);
  var [saving, setSaving]     = useState(false);
  var [search, setSearch]     = useState('');
  var debouncedSearch = useDebouncedValue(search, 250);
  var [dateFrom, setDateFrom] = useState('');
  var [dateTo, setDateTo]     = useState('');
  var [isPending, startTransition] = useTransition();

  var pendingFilters = useCallback(function(update) {
    startTransition(update);
  }, []);
  var [aiSug, setAiSug] = useState(null);
  var [aiBusy, setAiBusy] = useState(false);
  var expenses = useMemo(function() { return isIncome ? [] : tx.filter(function(t) { return t.type === 'expense'; }); }, [isIncome, tx]);
  var uncategorized = useMemo(function() {
    return expenses.filter(function(t) { return !(t.category || t.cat); });
  }, [expenses]);
  var suggestCategories = useCallback(async function() {
    if (aiBusy || !expenses.length) return;
    setAiBusy(true);
    try {
      var items = expenses.filter(function(t) { return !(t.category || t.cat); }).map(function(t) { return { id: t.id, desc: t.desc }; });
      if (!items.length) { toast('Todas as despesas já têm categoria.', 'success'); return; }
      var out = await categorizeBatch(userId, items);
      var sug = out.filter(function(o) { return o.category; });
      setAiSug(sug);
      if (!sug.length) toast('Não consegui sugerir categorias agora.', 'error');
    } catch(_) { toast('Erro ao sugerir categorias. Tente novamente.', 'error'); }
    finally { setAiBusy(false); }
  }, [aiBusy, expenses, userId, toast]);
  var [form, setForm] = useState({desc:'', amount:'', date:today(), cat:'Fixo', method:'PIX', fixo:false, day:'5'});

  useQuickIntent(isIncome ? 'income' : 'expense', function() { setModal(true); });

  var cats    = ['Fixo','Variavel','Estoque','Marketing','Pessoal','Servicos','Outro'];
  var METHODS = ['PIX','Dinheiro','Cartao de Debito','Cartao de Credito','Boleto','Transferencia'];

  var memo = useMemo(function() {
    var f = tx.filter(function(t) { return t.type === type; });
    if (debouncedSearch)   f = f.filter(function(t) { return t.desc.toLowerCase().indexOf(debouncedSearch.toLowerCase()) !== -1; });
    if (dateFrom) f = f.filter(function(t) { return t.date >= dateFrom; });
    if (dateTo)   f = f.filter(function(t) { return t.date <= dateTo; });
    f.sort(function(a, b) { return b.date.localeCompare(a.date); });
    var total = f.reduce(function(s, t) { return s + t.amount; }, 0);
    var grouped = {};
    var groupOrder = [];
    f.forEach(function(t) {
      if (!grouped[t.date]) { grouped[t.date] = []; groupOrder.push(t.date); }
      grouped[t.date].push(t);
    });
    var flatRows = [];
    var headerTops = [];
    var rowIdx = 0;
    var pixelOffset = 0;
    var headerSize = 44;
    var rowSize = 60;
    groupOrder.forEach(function(date) {
      var dayItems = grouped[date];
      var dayTotal = dayItems.reduce(function(s, t) { return s + t.amount; }, 0);
      headerTops.push({ date: date, total: dayTotal, top: pixelOffset });
      flatRows.push({ type: 'header', date: date, total: dayTotal });
      pixelOffset += headerSize;
      dayItems.forEach(function(t) {
        rowIdx++;
        flatRows.push({ type: 'row', data: t, rowIndex: rowIdx });
        pixelOffset += rowSize;
      });
    });
    var totalRowCount = rowIdx;
    return {filtered: f, total: total, grouped: grouped, groupOrder: groupOrder, flatRows: flatRows, headerTops: headerTops, totalRowCount: totalRowCount};
  }, [tx, type, debouncedSearch, dateFrom, dateTo]);

  var filtered  = memo.filtered;
  var total     = memo.total;
  var flatRows = memo.flatRows;
  var headerTops = memo.headerTops;
  var totalRowCount = memo.totalRowCount;

  var scrollRef = useRef(null);
  var pr = usePullToRefresh(onRefresh);
  var containerRef = pr.containerRef;
  var estimateSize = useCallback(function(index) {
    return flatRows[index].type === 'header' ? 44 : 60;
  }, [flatRows]);
  var virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: function() { return containerRef.current; },
    estimateSize: estimateSize,
  });

  var [stickyTop, setStickyTop] = useState(0);
  var stickyHeader = null;
  var stickyIndex = headerTops.length - 1;
  while (stickyIndex >= 0 && headerTops[stickyIndex].top > stickyTop + 1) stickyIndex--;
  if (stickyIndex >= 0) stickyHeader = headerTops[stickyIndex];

  var onListScroll = useCallback(function() {
    if (!scrollRef.current) return;
    var st = scrollRef.current.scrollTop;
    setStickyTop(function(prev) { return Math.abs(prev - st) > 2 ? st : prev; });
  }, []);

  var openEdit = function(t) {
    setEditItem({id:t.id, desc:t.desc, amount:String(t.amount), date:t.date, cat:t.category||'Fixo', method:t.method||'PIX'});
  };
  var handleSaveEdit = function(id, data) {
    if (data.confirm) {
      saveEdit();
    } else {
      setEditItem(function(prev) { return Object.assign({}, prev, data); });
    }
  };
  var handleCancelEdit = function() { setEditItem(null); };
  var saveEdit = async function() {
    const amount = Number(editItem.amount) || 0;
    if (!editItem.desc || amount <= 0) return;
    setSaving(true);
    try {
      var ok = await onEdit(editItem.id, {
        desc: safe(editItem.desc),
        amount: amount,
        date: editItem.date,
        method: isIncome ? editItem.method : null,
        cat: isIncome ? null : editItem.cat
      });
      if (!ok) return;
      if (!isIncome) learnCategory(userId, editItem.desc, editItem.cat);
      toast(isIncome ? 'Venda atualizada' : 'Despesa atualizada', 'success');
      setEditItem(null);
    } catch(_) { toast('Erro ao salvar. Tente novamente.', 'error'); }
    finally { setSaving(false); }
  };
  var resetForm = function() { setForm({desc:'', amount:'', date:today(), cat:'Fixo', method:'PIX', fixo:false, day:'5'}); };
  var saveNew = async function() {
    const amount = Number(form.amount) || 0;
    if (!form.desc || amount <= 0) return;
    setSaving(true);
    try {
      if (!isIncome && form.fixo) {
        var day = Number(form.day) || 5;
        var tpl = { id: uid(), desc: safe(form.desc), amount: amount, day: day, category: form.cat, active: true };
        var list = await getRecurring(userId);
        await setRecurring(userId, list.concat([tpl]));
        var row = buildRecurringRow(userId, tpl, periodOf(new Date()));
        var okR = onAddGenerated ? await onAddGenerated(row) : true;
        if (okR === false) return;
        toast('Despesa fixa adicionada — repete todo mês.', 'success');
        setModal(false);
        return;
      }
      var ok = await onAdd({
        id: uid(),
        type: type,
        desc: safe(form.desc),
        amount: amount,
        date: form.date,
        method: isIncome ? form.method : null,
        cat: isIncome ? null : form.cat
      });
      if (!ok) return;
      toast(isIncome ? 'Venda registrada!' : 'Despesa registrada!', 'success');
      setModal(false);
      resetForm();
    } catch(_) { toast('Erro ao salvar transação.', 'error'); }
    finally { setSaving(false); }
  };
  var doExport = function(kind) {
    var headers = ['Data', 'Descrição', 'Valor', isIncome ? 'Pagamento' : 'Categoria'];
    var rows = filtered.map(function(t) {
      return [fmtDate(t.date), t.desc || '', fmt(t.amount), isIncome ? (t.method || '') : (t.category || t.cat || '')];
    });
    var fname = (isIncome ? 'vendas' : 'despesas') + '-' + today();
    if (kind === 'xls') { exportXLS({ filename: fname, headers: headers, rows: rows }); toast('Excel exportado!', 'success'); return; }
    var ok = exportPDF({
      title: isIncome ? 'Vendas' : 'Despesas',
      brandName: (brand && brand.name) || 'Financia',
      subtitle: (isIncome ? 'Vendas / Ganhos' : 'Despesas') + ' — ' + filtered.length + ' registro(s) — total ' + fmt(total),
      accent: accentColor, headers: headers, rows: rows,
      kpis: [{ label: 'Total', value: fmt(total), color: accentColor }, { label: 'Registros', value: String(filtered.length) }],
    });
    if (!ok) toast('Permita pop-ups para exportar o PDF.', 'error');
  };

  return (
    <div className="flex flex-col gap-5 pb-20 lg:pb-0">

      <PageHead
        icon={isIncome ? 'M12 4v16m8-8l-8-8-8 8' : 'M12 20V4m-8 8l8 8 8-8'}
        color={accentColor}
        title={isIncome ? 'Vendas / Ganhos' : 'Despesas'}
        sub={<>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}{' . '}<span className="font-semibold tabular" style={{color: accentColor}}>{fmt(total)}</span></>}
        right={<>
          {filtered.length > 0 && (
            <ExportButtons paid={paid} color={accentColor}
              onPDF={function() { doExport('pdf'); }}
              onXLS={function() { doExport('xls'); }}
              onLocked={function() { if (onNav) onNav('planos'); }}/>
          )}
          {!isIncome && uncategorized.length > 0 && (
            <Btn onClick={suggestCategories} disabled={aiBusy} style={{background: 'color-mix(in srgb, var(--info) 14%, transparent)', color: 'var(--info)'}}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L11.828 18.92a1 1 0 01-.448 1.307l-9.66 4.83a1 1 0 01-1.307-.448l-4.83-9.66a1 1 0 01.448-1.307l8.5-4.17a1 1 0 011.307.448 1 1 0 01.448 1.307l-1.976 3.724-2.78 1.69 1.499 1.5z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 2l-7.5 7.5M22 2l-3 8-5.5-5.5L19 2z"/>
              </svg>
              {aiBusy ? 'Analisando...' : 'Sugerir categorias'}
            </Btn>
          )}
          <Btn onClick={function() { setModal(true); }} style={{background: accentColor}}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            {isIncome ? 'Nova Venda' : 'Nova Despesa'}
          </Btn>
        </>}
      />

      <Card className="p-4">
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input aria-label="Buscar transacoes" value={search} onChange={function(e) { pendingFilters(function() { setSearch(e.target.value); }); }}
            placeholder={'Buscar ' + (isIncome ? 'vendas' : 'despesas') + '...'}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl transition"
            style={{background:'var(--bg-input)', color:'var(--text-main)'}}/>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Inp label="De" type="date" value={dateFrom} onChange={function(e) { pendingFilters(function() { setDateFrom(e.target.value); }); }} placeholder="De"/>
          <Inp label="Ate" type="date" value={dateTo}   onChange={function(e) { pendingFilters(function() { setDateTo(e.target.value); }); }}   placeholder="Ate"/>
        </div>
        {dateFrom && dateTo && dateFrom > dateTo && (
          <p className="text-xs text-red-500 mt-1">Data inicial deve ser anterior ou igual a data final.</p>
        )}
        {(search || dateFrom || dateTo) && (
          <button onClick={function() { pendingFilters(function() { setSearch(''); setDateFrom(''); setDateTo(''); }); }}
            className="mt-2 text-xs font-medium text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 min-h-[44px] -my-2.5 rounded-lg">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            Limpar filtros
          </button>
        )}
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={isIncome ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'}
            accent={accentColor}
            title={isIncome ? 'Nenhuma venda registrada' : 'Nenhuma despesa registrada'}
            desc={isIncome ? 'Registre vendas com multiplos itens, calculo automatico do total e baixa no estoque.' : 'Cadastre aluguel, internet, fornecedores e outras saidas para descobrir seu lucro real.'}
            features={isIncome ? [
              {icon:'M5 13l4 4L19 7', label:'Multiplos itens'},
              {icon:'M5 13l4 4L19 7', label:'Baixa no estoque'},
              {icon:'M5 13l4 4L19 7', label:'Calculo automatico'}
            ] : ['Aluguel', 'Internet', 'Fornecedor', 'Energia', 'Frete']}
            action={isIncome ? 'Registrar venda' : 'Registrar despesa'}
            onAction={function() { setModal(true); }}
          />
          ) : (
          <div>
            <div className="relative">
              {isPending && (
                <div data-testid="tx-filter-pending" className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px]" style={{background:'color-mix(in srgb, var(--bg-card) 55%, transparent)'}}>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full" style={{background:'var(--bg-card)', color:'var(--text-sub)', boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeWidth={2.5} d="M12 3a9 9 0 108 12"/>
                    </svg>
                    Filtrando...
                  </span>
                </div>
              )}
              <div ref={containerRef} onScroll={onListScroll} className="max-h-[calc(100vh-280px)] min-h-[200px] overflow-auto" style={{position:'relative'}}>
                <PullToRefreshIndicator isPulling={pr.isPulling} pullProgress={pr.pullProgress} isRefreshing={pr.isRefreshing} color={accentColor}/>
                {stickyHeader && (
                <div className="sticky top-0 z-10 h-0 overflow-visible">
                  <div role="heading" aria-level="2" data-testid="sticky-date-header"
                    className={'flex items-center justify-between border-b px-4 py-2.5 ' + (stickyTop > 8 ? '' : 'invisible')}
                    style={{background:'var(--bg-primary)', borderColor:'var(--border)'}}>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{color:'var(--text-sub)'}}>
                      <span className="sr-only">Data agrupada: </span>{fmtDate(stickyHeader.date)}
                    </span>
                    <span className="text-xs font-semibold tabular" style={{color: accentColor}}>
                      {(isIncome ? '+' : '-') + fmt(stickyHeader.total)}
                    </span>
                  </div>
                </div>
              )}
              <div role="list" data-testid="tx-list" style={{ height: virtualizer.getTotalSize() + 'px', position: 'relative' }}>
                {virtualizer.getVirtualItems().map(function(virtualItem) {
                    var item = flatRows[virtualItem.index];
                    if (item.type === 'header') {
                      return (
                        <div role="listitem" key={item.date} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: 'translateY(' + virtualItem.start + 'px)' }}>
                          <TransactionGroupHeader date={item.date} total={item.total} type={type} brand={brand}/>
                        </div>
                      );
                    }
                    var t = item.data;
                    var rowIndex = item.rowIndex;
                    var isEditing = editItem && editItem.id === t.id;
                    return (
                      <div role="listitem" key={t.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: 'translateY(' + virtualItem.start + 'px)' }}>
                        <TransactionCard
                          transaction={t}
                          type={type}
                          brand={brand}
                          products={products}
                          onEdit={openEdit}
                          onDelete={onDelete}
                          onDeductStock={onDeductStock}
                          onConfirm={confirm}
                          index={rowIndex - 1}
                          totalCount={totalRowCount}
                          isEditing={isEditing}
                          editData={isEditing ? editItem : null}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
            </div>
          </div>
        )}
      </Card>

      {aiSug && (
        <Modal title="Categorias sugeridas" onClose={function() { setAiSug(null); }} color="var(--info)">
          <p className="text-xs mb-3" style={{color:'var(--text-sub)'}}>
            Revise as sugestões abaixo e confirme para aplicar. Cada correção manual futura é aprendida automaticamente.
          </p>
          <div className="max-h-72 overflow-y-auto flex flex-col gap-2 mb-4">
            {aiSug.map(function(s) {
              var cur = expenses.find(function(t) { return t.id === s.id; });
              return (
                <div key={s.id} className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-3" style={{background:'var(--bg-subtle)'}}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{color:'var(--text-main)'}}>{s.desc}</p>
                    <p className="text-[11px] truncate" style={{color:'var(--text-muted)'}}>
                      {cur && (cur.category || cur.cat) ? 'Atual: ' + (cur.category || cur.cat) : 'Sem categoria'} → <span className="font-semibold" style={{color:'var(--info)'}}>{s.category}</span>
                    </p>
                  </div>
                  <Btn onClick={async function() {
                    var ok = await onEdit(s.id, { cat: s.category });
                    if (!ok) return;
                    learnCategory(userId, s.desc, s.category);
                    setAiSug(function(prev) { return prev ? prev.filter(function(o) { return o.id !== s.id; }) : prev; });
                    toast('Categoria aplicada: ' + s.category, 'success');
                  }} style={{background:'var(--info)'}} className="flex-shrink-0">Aplicar</Btn>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {modal && (isIncome
        ? (
          <SaleForm products={products} brand={brand}
            onSave={async function(sale) {
              var ok = await onAdd(sale);
              if (!ok) return false;
              if (sale.items) {
                sale.items.forEach(function(it) {
                  var p = products.find(function(p) { return p.name === it.desc; });
                  if (p && p.stock != null) onDeductStock(p.id, it.qty);
                });
              }
              toast('Venda registrada!', 'success');
              return true;
            }}
            onClose={function() { setModal(false); }}
          />
        ) : (
          <Modal title="Nova Despesa" onClose={function() { setModal(false); }} onSave={saveNew} saving={saving} color={accentColor}>
            <Inp label="Descrição" value={form.desc} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, {desc:e.target.value}); }); }} placeholder="Ex: Aluguel, Energia..."/>
            <div className="grid grid-cols-2 gap-3">
              <NumInp label="Valor (R$)" value={form.amount} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, {amount:e.target.value}); }); }} placeholder="0,00"/>
              <Inp label="Data" type="date" value={form.date} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, {date:e.target.value}); }); }}/>
            </div>
            <Sel label="Categoria" value={form.cat} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, {cat:e.target.value}); }); }}>
              {cats.map(function(c) { return <option key={c}>{c}</option>; })}
            </Sel>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{color:'var(--text-sub)'}}>Tipo de despesa</label>
              <div className="grid grid-cols-2 gap-2">
                {[{k:false, l:'Variável', d:'Lançamento único'}, {k:true, l:'Fixa (mensal)', d:'Repete todo mês'}].map(function(opt) {
                  var sel = form.fixo === opt.k;
                  return (
                    <button key={String(opt.k)} type="button" aria-pressed={sel}
                      onClick={function() { setForm(function(f) { return Object.assign({}, f, {fixo:opt.k}); }); }}
                      className="rounded-xl px-3 py-2.5 text-left transition min-h-[44px]"
                      style={sel ? {border:'1.5px solid ' + accentColor, background: accentBg} : {border:'1px solid var(--border)', background:'var(--bg-card)'}}>
                      <p className="text-sm font-semibold" style={{color: sel ? accentColor : 'var(--text-main)'}}>{opt.l}</p>
                      <p className="text-[11px]" style={{color:'var(--text-sub)'}}>{opt.d}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            {form.fixo && (
              <NumInp label="Dia do vencimento" decimals={false} maxLen={2} value={form.day} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, {day:e.target.value}); }); }} placeholder="5"/>
            )}
          </Modal>
        )
      )}

      {editItem && (
        <Modal title={isIncome ? 'Editar Venda' : 'Editar Despesa'} onClose={function() { setEditItem(null); }} onSave={saveEdit} saving={saving} saveLabel="Salvar alterações" color={accentColor}>
          <Inp label="Descrição" value={editItem.desc} onChange={function(e) { setEditItem(function(f) { return Object.assign({}, f, {desc:e.target.value}); }); }}/>
          <div className="grid grid-cols-2 gap-3">
            <NumInp label="Valor (R$)" value={editItem.amount} onChange={function(e) { setEditItem(function(f) { return Object.assign({}, f, {amount:e.target.value}); }); }}/>
            <Inp label="Data" type="date" value={editItem.date} onChange={function(e) { setEditItem(function(f) { return Object.assign({}, f, {date:e.target.value}); }); }}/>
          </div>
          {isIncome
            ? <Sel label="Pagamento" value={editItem.method} onChange={function(e) { setEditItem(function(f) { return Object.assign({}, f, {method:e.target.value}); }); }}>{METHODS.map(function(m) { return <option key={m}>{m}</option>; })}</Sel>
            : <Sel label="Categoria" value={editItem.cat}    onChange={function(e) { setEditItem(function(f) { return Object.assign({}, f, {cat:e.target.value}); }); }}>{cats.map(function(c) { return <option key={c}>{c}</option>; })}</Sel>
          }
        </Modal>
      )}
    </div>
  );
})