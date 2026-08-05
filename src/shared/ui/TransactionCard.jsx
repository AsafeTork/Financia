import React from 'react';
import { fmt, fmtDate, brandAlpha, safe } from '../../lib/utils.js';
import { isRecurringId } from '../../lib/recurring.js';

export function TransactionCard({ 
  transaction, 
  type, 
  brand, 
  products, 
  onEdit, 
  onDelete, 
  onDeductStock,
  onConfirm,
  index,
  totalCount,
  isEditing,
  editData,
  onSaveEdit,
  onCancelEdit,
  showActions = true,
}) {
  var isIncome = type === 'income';
  var accentColor = isIncome ? brand?.color : 'var(--danger)';
  var accentBg = isIncome ? brandAlpha(brand?.color, 0.08) : 'var(--danger-bg, rgba(239,68,68,0.06))';
  var isRecurring = isRecurringId(transaction.id);
  
  var iconPath = isIncome ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7';
  var amountPrefix = isIncome ? '+' : '-';
  var methodOrCategory = isIncome ? transaction.method : (transaction.category || transaction.cat || '');

  if (isEditing && editData && editData.id === transaction.id) {
    return (
      <div
        data-testid={'tx-edit-' + transaction.id}
        role="listitem"
        aria-setsize={totalCount}
        aria-posinset={index + 1}
        className="px-4 py-3.5 border-b border-gray-50 bg-blue-50 transition-colors"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={iconPath} />
              </svg>
            </div>
            <div className="min-w-0">
              <input
                type="text"
                value={editData.desc}
                onChange={function(e) { onSaveEdit(transaction.id, { desc: e.target.value }); }}
                className="text-sm font-semibold text-gray-800 w-full px-2 py-1 border border-blue-300 rounded-lg"
                placeholder="Descrição"
                autoFocus
              />
              <p className="text-xs text-gray-400 truncate">{methodOrCategory || ''}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              value={editData.amount}
              onChange={function(e) { onSaveEdit(transaction.id, { amount: Number(e.target.value) || 0 }); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl"
              placeholder="0,00"
            />
            <input
              type="date"
              value={editData.date}
              onChange={function(e) { onSaveEdit(transaction.id, { date: e.target.value }); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl"
            />
          </div>
          {isIncome ? (
            <select
              value={editData.method}
              onChange={function(e) { onSaveEdit(transaction.id, { method: e.target.value }); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl"
            >
              {['PIX','Dinheiro','Cartao de Debito','Cartao de Credito','Boleto','Transferencia'].map(function(m) {
                return <option key={m} value={m}>{m}</option>;
              })}
            </select>
          ) : (
            <select
              value={editData.cat}
              onChange={function(e) { onSaveEdit(transaction.id, { cat: e.target.value }); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl"
            >
              {['Fixo','Variavel','Estoque','Marketing','Pessoal','Servicos','Outro'].map(function(c) {
                return <option key={c} value={c}>{c}</option>;
              })}
            </select>
          )}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={function() { onSaveEdit(transaction.id, { confirm: true }); }}
              className="pressable flex-1 rounded-xl py-2.5 text-sm font-semibold text-white min-h-[44px]"
              style={{ background: accentColor }}
            >
              Salvar
            </button>
            <button
              onClick={function() { onCancelEdit(transaction.id); }}
              className="pressable flex-1 rounded-xl py-2.5 text-sm font-medium min-h-[44px]"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-sub)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={'tx-item-' + transaction.id}
      role="listitem"
      aria-setsize={totalCount}
      aria-posinset={index + 1}
      className="px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={iconPath} />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{safe(transaction.desc)}</p>
              {transaction.items && transaction.items.length > 1 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: accentBg, color: accentColor }}>
                  {transaction.items.length} itens
                </span>
              )}
              {isRecurring && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{background:'var(--brand-soft)', color:'var(--brand)'}} aria-label="Transação recorrente">
                  recorrente
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate">
              {methodOrCategory}
              {transaction.registered_by ? ' · ' + transaction.registered_by : ''}
            </p>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
            <span className="text-sm font-bold tabular mr-1" style={{ color: accentColor }}>
              {amountPrefix + fmt(transaction.amount)}
            </span>
            <button
              type="button"
              onClick={function() { onEdit(transaction); }}
              aria-label={isIncome ? 'Editar venda' : 'Editar despesa'}
              className="pressable p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 min-w-[40px] min-h-[40px] flex items-center justify-center"
              data-testid={'tx-edit-' + transaction.id}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={function() { onConfirm('Excluir este registro?', function() { onDelete(transaction.id); }); }}
              aria-label={isIncome ? 'Excluir venda' : 'Excluir despesa'}
              className="pressable p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
              data-testid={'tx-delete-' + transaction.id}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TransactionGroupHeader({ date, total, type, brand }) {
  var isIncome = type === 'income';
  var accentColor = isIncome ? brand?.color : 'var(--danger)';
  var amountPrefix = isIncome ? '+' : '-';
  
  return (
    <div role="separator" aria-label={fmtDate(date) + ' - Total ' + amountPrefix + fmt(total)} className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{fmtDate(date)}</span>
        <span className="text-xs font-semibold tabular" style={{ color: accentColor }}>
          {amountPrefix + fmt(total)}
        </span>
      </div>
    </div>
  );
}

export function EmptyTransactionState({ type, brand, onAdd }) {
  var isIncome = type === 'income';
  var accentColor = isIncome ? brand?.color : 'var(--danger)';
  var accentBg = isIncome ? brandAlpha(brand?.color, 0.08) : 'var(--danger-bg, rgba(239,68,68,0.06))';
  var iconPath = isIncome ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6';
  var title = isIncome ? 'Nenhuma venda registrada' : 'Nenhuma despesa registrada';
  var description = isIncome 
    ? 'Registre vendas com múltiplos itens, cálculo automático do total e baixa no estoque.'
    : 'Cadastre aluguel, internet, fornecedores e outras saídas para descobrir seu lucro real.';
  
  var features = isIncome ? [
    { icon: 'M5 13l4 4L19 7', label: 'Múltiplos itens' },
    { icon: 'M5 13l4 4L19 7', label: 'Baixa no estoque' },
    { icon: 'M5 13l4 4L19 7', label: 'Cálculo automático' },
  ] : [
    'Aluguel', 'Internet', 'Fornecedor', 'Energia', 'Frete'
  ].map(function(ex) { return { label: ex }; });

  return (
    <div className="py-14 flex flex-col items-center gap-4 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1" style={{ background: accentBg }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={iconPath} />
        </svg>
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{title}</p>
      <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>
      <div className="flex flex-wrap gap-2 justify-center text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        {features.map(function(f, i) {
          if (typeof f === 'string') {
            return <span key={f} className="px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>{f}</span>;
          }
          return (
            <span key={i} className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d={f.icon} />
              </svg>
              {f.label}
            </span>
          );
        })}
      </div>
      <button
        onClick={function() { onAdd(); }}
        className="pressable mt-2 rounded-xl py-2.5 text-sm font-semibold text-white min-h-[44px]"
        style={{ background: accentColor }}
      >
        {isIncome ? 'Registrar venda' : 'Registrar despesa'}
      </button>
    </div>
  );
}