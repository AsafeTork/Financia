import { getRecurring, activeTemplates, dueDate, periodOf, daysInMonth, isRecurringId } from './recurring.js';

// Previsão determinística de fluxo de caixa (30/60/90 dias).
// Sem IA/API: usa (1) saldo real acumulado, (2) despesas fixas recorrentes
// com data exata, (3) médias móveis dos últimos 3 meses para o restante
// (receitas e despesas variáveis). Offline-first, 100% previsível.

export var HORIZONS = [30, 60, 90];

export function refToday() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function addDays(dateStr, days) {
  var d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function periodOfDate(dateStr) {
  return dateStr.slice(0, 7);
}

export function saldo(tx) {
  return (tx || []).reduce(function(s, t) { return s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)); }, 0);
}

// Médias mensais de receitas e despesas VARIÁVEIS (exclui os gerados por
// recorrência, que entram com data exata) sobre os últimos `lookbackMonths`
// meses completos antes de `ref`.
export function monthlyAverages(tx, ref, lookbackMonths) {
  var refD = new Date(ref + 'T12:00:00');
  var incomes = [], incomesMonths = 0, expenses = [], expensesMonths = 0;
  for (var b = 1; b <= (lookbackMonths || 3); b++) {
    var d = new Date(refD.getFullYear(), refD.getMonth() - b, 1);
    var period = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    var ti = 0, to = 0, has = false;
    (tx || []).forEach(function(t) {
      if (t.type !== 'income' && t.type !== 'expense') return;
      if (t.type === 'expense' && isRecurringId(t.id)) return;
      if (!t.date || periodOfDate(t.date) !== period) return;
      has = true;
      if (t.type === 'income') ti += Number(t.amount) || 0; else to += Number(t.amount) || 0;
    });
    if (has) {
      incomes.push(ti); expenses.push(to); incomesMonths++; expensesMonths++;
    }
  }
  function avg(list) { return list.length ? list.reduce(function(a, b) { return a + b; }, 0) / list.length : 0; }
  return { income: avg(incomes), expense: avg(expenses), months: Math.max(incomesMonths, expensesMonths) };
}

// Gera a lista de despesas fixas (tem data exata) dentro de [ref, ref+days].
export function fixedEntries(templates, ref, days) {
  var out = [];
  var end = addDays(ref, days);
  var cursor = new Date(ref + 'T12:00:00');
  var guard = 0;
  while (cursor <= new Date(end + 'T12:00:00') && guard < 36) {
    var period = periodOf(cursor);
    var dim = daysInMonth(period);
    (templates || []).forEach(function(tpl) {
      if (tpl.active === false) return;
      var day = Math.min(Math.max(Number(tpl.day) || 1, 1), dim);
      var due = dueDate(period, day);
      if (due < ref || due > end) return;
      out.push({ date: due, desc: String(tpl.desc || '').trim(), amount: Number(tpl.amount) || 0, type: 'expense', category: tpl.category || 'Fixo' });
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    guard++;
  }
  return out;
}

// Previsão principal. Devolve:
//   { saldo, meses, fixed, points: [{days, income, expense, balance}], alerts }
// - fixed: despesas fixas projetadas (data exata) no horizonte
// - meses: quantos meses de histórico a média considerou (0 = sem dados)
// - alerts: pontos (incl. 0) em que o saldo projeta negativo
export async function forecastCashFlow(uid, tx, opts) {
  opts = opts || {};
  var ref = opts.refDate || refToday();
  var horizons = opts.horizons || HORIZONS;
  var lookback = opts.lookbackMonths || 3;
  var templates = activeTemplates(await getRecurring(uid));
  var horMax = Math.max.apply(null, horizons);

  var balance = saldo(tx);
  var fixed = fixedEntries(templates, ref, horMax).sort(function(a, b) { return a.date.localeCompare(b.date); });
  var avg = monthlyAverages(tx, ref, lookback);

  // distribuição diária das médias por mês (fixos já contam em `fixed`)
  function dailySpread(dateStr) {
    var period = periodOfDate(dateStr);
    var dim = daysInMonth(period);
    var spread = (avg.income - avg.expense) / dim;
    return spread;
  }
  function balanceAt(days) {
    var bal = balance;
    for (var i = 1; i <= days; i++) {
      var date = addDays(ref, i);
      fixed.forEach(function(e) { if (e.date === date) bal -= e.amount; });
      bal += dailySpread(date);
    }
    return bal;
  }

  var points = horizons.map(function(days) {
    return { days: days, balance: balanceAt(days) };
  });
  var alerts = points.filter(function(p) { return p.balance < 0; }).map(function(p) {
    return { days: p.days, balance: p.balance };
  });

  return {
    balance: balance,
    months: avg.months,
    fixedCount: fixed.length,
    fixedSum: fixed.reduce(function(s, e) { return s + e.amount; }, 0),
    averages: { income: avg.income, expense: avg.expense },
    points: points,
    alerts: alerts,
  };
}