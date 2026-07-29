import React, { useMemo, useState } from 'react';
import { Card, PageSkeleton } from '../../shared/ui/ui.jsx';
import { KpiCard, BarChartSVG } from '../../shared/ui/UsageBar.jsx';
import PlanStatusCard from '../../shared/ui/PlanStatusCard.jsx';
import AiInsightsCard from '../../shared/ui/AiInsightsCard.jsx';
import { fmt, fmtDate, today, prevDays, brandAlpha } from '../../lib/utils.js';
import { PLAN_LIMITS, effectivePlan } from '../../lib/constants.js';

export default React.memo(function Dashboard({ tx, products, brand, onNav, planInfo, lossesCount, onUpgrade, loading }) {
  var [period, setPeriod] = useState('month');
  var periods = [
    { v:'month',    l:'Mês atual' },
    { v:'3months',  l:'Últimos 3 meses' },
    { v:'6months',  l:'Últimos 6 meses' },
    { v:'year',     l:'Ano atual' },
    { v:'12months', l:'Últimos 12 meses' },
  ];
  var now_d = new Date();
  var pStart = period === 'year'
    ? new Date(now_d.getFullYear(), 0, 1)
    : new Date(now_d.getFullYear(), now_d.getMonth() - ({month:0,'3months':2,'6months':5,'12months':11})[period], 1);
  var pMonths = period === 'year' ? 12 : ({month:1,'3months':3,'6months':6,'12months':12})[period];
  var ppStart = new Date(pStart.getFullYear(), pStart.getMonth() - pMonths, 1);
  var pS = pStart.getFullYear() + '-' + String(pStart.getMonth()+1).padStart(2,'0');
  var ppS = ppStart.getFullYear() + '-' + String(ppStart.getMonth()+1).padStart(2,'0');

  var mtx  = tx.filter(function(t) { return t.date >= pS; });
  var pmtx = tx.filter(function(t) { return t.date >= ppS && t.date < pS; });

  var sumMonth = useMemo(function() {
    var r = { ti: 0, to: 0 };
    mtx.forEach(function(t) { if (t.type === 'income') r.ti += t.amount; else r.to += t.amount; });
    return r;
  }, [mtx]);
  var sumPrev = useMemo(function() {
    var r = { ti: 0, to: 0 };
    pmtx.forEach(function(t) { if (t.type === 'income') r.ti += t.amount; else r.to += t.amount; });
    return r;
  }, [pmtx]);
  var sumToday = useMemo(function() {
    var r = { ti: 0, to: 0 };
    var dtx = tx.filter(function(t) { return t.date === today(); });
    dtx.forEach(function(t) { if (t.type === 'income') r.ti += t.amount; else r.to += t.amount; });
    return r;
  }, [tx]);
  var ti = sumMonth.ti, to = sumMonth.to, pmi = sumPrev.ti, pmo = sumPrev.to, di = sumToday.ti, dout = sumToday.to;

  var inVar  = pmi  > 0 ? Math.round(((ti - pmi) / pmi) * 100)   : null;
  var outVar = pmo  > 0 ? Math.round(((to - pmo) / pmo) * 100)   : null;
  var profitCurr = ti - to;
  var profitPrev = pmi - pmo;
  var profVar = profitPrev !== 0 ? Math.round(((profitCurr - profitPrev) / Math.abs(profitPrev)) * 100) : null;

  var chartData = useMemo(function() {
    return Array.from({length: 7}, function(_, i) {
      var d = prevDays(6 - i);
      var dt = tx.filter(function(t) { return t.date === d; });
      var sums = { i: 0, o: 0 };
      dt.forEach(function(t) { if (t.type === 'income') sums.i += t.amount; else sums.o += t.amount; });
      return { day: new Date(d + 'T12:00').toLocaleDateString('pt-BR', {weekday: 'short'}), i: sums.i, o: sums.o };
    });
  }, [tx]);

  var plan     = effectivePlan(planInfo);
  var lowStock = products.filter(function(p) { return p.stock != null && p.stock <= 5; });
  var usage = [
    { key: 'transactions', label: 'Transacoes', used: tx.length,        limit: PLAN_LIMITS.free.transactions, color: brand.color },
    { key: 'products',     label: 'Produtos',   used: products.length,  limit: PLAN_LIMITS.free.products,     color: '#0f9d6c' },
    { key: 'losses',       label: 'Perdas',     used: lossesCount || 0, limit: PLAN_LIMITS.free.losses,       color: '#8b5cf6' },
  ];
  var reachedCats = usage.filter(function(u) { return u.used >= u.limit; });
  var anyReached = plan === 'free' && reachedCats.length > 0;
  var recent   = tx.slice().sort(function(a, b) { return b.date.localeCompare(a.date); }).slice(0, 8);
  var hour     = new Date().getHours();
  var greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  if (loading) return <PageSkeleton/>;

  return (
    <div className="flex flex-col gap-5">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-header">{greeting}</h1>
          <p className="page-sub capitalize">
            {new Date().toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'})}
          </p>
        </div>
        <select aria-label="Periodo" value={period} onChange={function(e){setPeriod(e.target.value)}}
          className="text-xs rounded-xl px-3 py-2 border min-h-[44px] flex-shrink-0"
          style={{background:'var(--bg-card)', color:'var(--text-main)', borderColor:'var(--border)'}}>
          {periods.map(function(p){return <option key={p.v} value={p.v}>{p.l}</option>})}
        </select>
      </div>

      {tx.length === 0 && products.length === 0 && (
        <div className="rounded-[20px] p-5 sm:p-6 flex flex-col gap-5" style={{background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)'}}>
          <div>
            <p className="font-display text-lg font-semibold" style={{color:'var(--text-main)'}}>Bem-vindo ao Financia</p>
            <p className="text-sm mt-1" style={{color:'var(--text-sub)'}}>Siga os passos abaixo para comecar a controlar seu negocio.</p>
          </div>

          {/* Barra de progresso */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
              <div className="h-full rounded-full transition-all duration-500" style={{width:'0%', background: brand.color}} />
            </div>
            <span className="text-xs font-bold tabular" style={{color:brand.color}}>0%</span>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {n:'1', title:'Cadastre seus produtos', sub:'Defina precos, custos e controle de estoque', nav:'inventory', btn:'Cadastrar' },
              {n:'2', title:'Registre sua primeira venda', sub:'Multiplos itens, calculo automatico e baixa de estoque', nav:'income', btn:'Registrar' },
              {n:'3', title:'Cadastre uma despesa', sub:'Descubra para onde vai seu dinheiro com categorias e fixos', nav:'expense', btn:'Registrar' },
              {n:'4', title:'Veja seu primeiro relatorio', sub:'Exporte PDF e Excel com seus dados organizados', nav:'report', btn:'Ver' },
            ].map(function(step, idx) {
              var done = false;
              return (
                <div key={step.n} className="flex items-start gap-3 rounded-xl px-4 py-3 transition-colors duration-200" style={{background: done ? 'rgba(59,191,160,0.06)' : 'var(--bg-subtle)'}}>
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 transition-colors duration-300" style={{background: done ? '#3bbfa0' : brand.color}}>
                    {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg> : step.n}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold block" style={{color:'var(--text-main)'}}>{step.title}</span>
                    <span className="text-xs block mt-0.5" style={{color:'var(--text-muted)'}}>{step.sub}</span>
                  </div>
                  <button onClick={function() { onNav(step.nav); }} className="text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0 inline-flex items-center justify-center min-h-[44px] hover:brightness-110 transition" style={{background: brandAlpha(brand.color, 0.12), color: brand.color}}>{step.btn}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="rounded-xl border border-amber-200 px-4 py-3.5 flex flex-col gap-2" style={{background:'rgba(245,158,11,0.10)'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-label="Alerta: estoque baixo"/>
              <p className="text-sm font-semibold text-amber-800">Estoque baixo</p>
            </div>
            <button onClick={function() { onNav('inventory'); }} className="text-xs text-amber-600 font-semibold hover:underline inline-flex items-center min-h-[44px] -my-2.5 px-1 flex-shrink-0">
              Ver estoque
            </button>
          </div>
          {lowStock.slice(0, 3).map(function(p) {
            return (
              <div key={p.id} className="flex items-center justify-between pl-3.5">
                <span className="text-sm text-amber-700">{p.name}</span>
                <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (p.stock <= 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700')}>
                  {p.stock <= 0 ? 'Esgotado' : p.stock + ' un.'}
                </span>
              </div>
            );
          })}
          {lowStock.length > 3 && <p className="text-xs text-amber-600 pl-3.5">+{lowStock.length - 3} outros com estoque baixo</p>}
        </div>
      )}

      {/* ─── KPIs para empty state: cards educativos ─── */}
      {tx.length === 0 && products.length === 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon:'M12 4v16m8-8l-8-8-8 8', label:'Entradas', desc:'Registre vendas para ver o quanto entrou', action:'Registrar venda', nav:'income', color:'#22c55e' },
            { icon:'M12 20V4m-8 8l8 8 8-8', label:'Despesas', desc:'Cadastre contas e veja para onde vai o dinheiro', action:'Registrar despesa', nav:'expense', color:'#ef4444' },
            { icon:'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label:'Estoque', desc:'Gerencie produtos, precos e controle de quantidade', action:'Adicionar produto', nav:'inventory', color:brand.color },
            { icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label:'Relatorios', desc:'Exporte PDF e Excel com dados organizados', action:'Ver relatorios', nav:'report', color:'#3b82f6' },
          ].map(function(k) {
            return (
              <div key={k.label} className="rounded-[20px] p-4 sm:p-5 hover:-translate-y-0.5" style={{background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)', transition:'background-color .15s ease, transform .12s ease'}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{background: brandAlpha(k.color, 0.1)}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={k.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={k.icon}/></svg>
                </div>
                <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>{k.label}</p>
                <p className="text-xs mt-1 mb-3 leading-relaxed" style={{color:'var(--text-muted)'}}>{k.desc}</p>
                <button onClick={function() { onNav(k.nav); }} className="text-xs font-semibold px-4 py-2.5 rounded-xl text-white hover:brightness-110 hover:-translate-y-0.5 transition min-h-[44px]" style={{background: k.color}}>
                  {k.action}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Entradas do mes"
            value={fmt(ti)}
            color="#22c55e"
            accentBar="#22c55e"
            variation={inVar}
            onClick={function() { onNav('income'); }}
            sub={inVar === null ? 'Sem dados anteriores' : undefined}/>
          <KpiCard label="Saidas do mes"
            value={fmt(to)}
            color="#ef4444"
            accentBar="#ef4444"
            variation={outVar}
            invert={true}
            onClick={function() { onNav('expense'); }}
            sub={outVar === null ? 'Sem dados anteriores' : undefined}/>
          <KpiCard label="Resultado"
            value={fmt(profitCurr)}
            color={brand.color}
            accentBar={brand.color}
            variation={profVar}
            sub={profVar === null ? 'Sem dados anteriores' : undefined}/>
          <KpiCard label="Saldo hoje"
            value={fmt(di - dout)}
            color="#3b82f6"
            accentBar="#3b82f6"
            sub={di > 0 || dout > 0 ? ('+' + fmt(di) + ' / -' + fmt(dout)) : 'Sem movimento hoje'}/>
        </div>
      )}

      <AiInsightsCard mtx={mtx} ti={ti} to={to} profitCurr={profitCurr} profVar={profVar} lowStock={lowStock} products={products} brand={brand} plan={plan} onUpgrade={onUpgrade}/>

      <PlanStatusCard plan={plan} brand={brand} onUpgrade={onUpgrade} usage={usage} anyReached={anyReached} reachedCats={reachedCats} planInfo={planInfo}/>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Ultimos 7 dias</p>
          <div className="flex gap-3 text-xs" style={{color:'var(--text-muted)'}}>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background: brand.color}} aria-label="Entradas"/>
              <span className="sr-only">Entrada</span>
               Entradas
             </span>
             <span className="flex items-center gap-1.5">
               <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:'#ef4444'}} aria-label="Saídas"/>
              <span className="sr-only">Saída</span>
               Saidas
            </span>
          </div>
        </div>
        {tx.length === 0
          ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <svg width="52" height="44" viewBox="0 0 52 44" fill="none">
                <rect x="2" y="22" width="12" height="20" rx="3" fill={brandAlpha(brand.color, 0.12)}/>
                <rect x="18" y="10" width="12" height="32" rx="3" fill={brandAlpha(brand.color, 0.22)}/>
                <rect x="34" y="15" width="12" height="27" rx="3" fill={brandAlpha(brand.color, 0.17)}/>
                <rect x="2" y="42" width="44" height="2" rx="1" fill={brandAlpha(brand.color, 0.1)}/>
              </svg>
              <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Nenhuma movimentacao ainda</p>
              <p className="text-xs" style={{color:'var(--text-muted)'}}>Registre sua primeira venda para ver o resumo aqui.</p>
              <button onClick={function() { onNav('income'); }}
                className="text-xs font-semibold px-5 py-3 rounded-xl text-white transition hover:opacity-90 min-h-[44px]"
                style={{background: brand.color}}>
                Registrar primeira venda
              </button>
            </div>
          )
          : <BarChartSVG role="img" aria-label="Gráfico de receitas e despesas" data={chartData} color={brand.color}/>
        }
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Movimentacoes recentes</p>
          {recent.length > 0 && (
            <button onClick={function() { onNav('report'); }} className="text-xs font-medium hover:underline inline-flex items-center min-h-[44px] -my-4 px-1 flex-shrink-0" style={{color:'var(--text-sub)'}}>
              Ver relatorio
            </button>
          )}
        </div>
        {recent.length === 0
          ? (
            <div className="py-12 flex flex-col items-center gap-4 text-center px-6">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <p className="text-sm" style={{color:'var(--text-muted)'}}>Registre vendas e despesas para ver aqui</p>
              <div className="flex gap-3">
                <button onClick={function() { onNav('income'); }} className="text-xs font-semibold px-4 py-3 rounded-lg text-white min-h-[44px] hover:opacity-90" style={{background:'#22c55e'}}>+ Venda</button>
                <button onClick={function() { onNav('expense'); }} className="text-xs font-semibold px-4 py-3 rounded-lg text-white min-h-[44px] hover:opacity-90" style={{background:'#ef4444'}}>+ Despesa</button>
              </div>
            </div>
          )
          : (
            <div className="divide-y divide-gray-50">
              {recent.map(function(t) {
                var isInc = t.type === 'income';
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--bg-subtle)] transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{background: isInc ? brandAlpha(brand.color, 0.1) : 'rgba(239,68,68,0.08)'}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke={isInc ? brand.color : '#ef4444'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d={isInc ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{color:'var(--text-main)'}}>{t.desc}</p>
                        <p className="text-xs truncate" style={{color:'var(--text-muted)'}}>{fmtDate(t.date)}{t.method ? ' . ' + t.method : ''}{t.category ? ' . ' + t.category : ''}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular flex-shrink-0 ml-3" style={{color: isInc ? brand.color : '#ef4444'}}>
                      {(isInc ? '+' : '-') + fmt(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        }
      </Card>
    </div>
  );
})