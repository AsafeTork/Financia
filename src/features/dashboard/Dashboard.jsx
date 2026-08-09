import React, { useMemo, useState, useEffect, useDeferredValue, useTransition } from 'react';
import { Card, PageSkeleton } from '../../shared/ui/ui.jsx';
import { KpiCard, BarChartSVG } from '../../shared/ui/UsageBar.jsx';
import PlanStatusCard from '../../shared/ui/PlanStatusCard.jsx';
import AiInsightsCard from '../../shared/ui/AiInsightsCard.jsx';
import { fmt, fmtDate, today, prevDays, brandAlpha } from '../../lib/utils.js';
import { PLAN_LIMITS, effectivePlan } from '../../lib/constants.js';
import { forecastCashFlow } from '../../lib/forecast.js';

var PERIODS = [
  { v:'month',    l:'Mês atual' },
  { v:'3months',  l:'Últimos 3 meses' },
  { v:'6months',  l:'Últimos 6 meses' },
  { v:'year',     l:'Ano atual' },
  { v:'12months', l:'Últimos 12 meses' },
];

export default React.memo(function Dashboard({ tx, products, brand, onNav, planInfo, lossesCount, onUpgrade, loading, uid }) {
  var [period, setPeriod] = useState('month');
  var [, startPeriodTransition] = useTransition();
  var deferredPeriod = useDeferredValue(period);
  var [forecastData, setForecastData] = useState(null);
  useEffect(function() {
    var dead = false;
    if (!uid || !tx.length) { setForecastData(null); return; }
    forecastCashFlow(uid, tx).then(function(o) { if (!dead) setForecastData(o); })
      .catch(function() { if (!dead) setForecastData(null); });
    return function() { dead = true; };
  }, [uid, tx]);
  var now_d = new Date();
  var pStart = deferredPeriod === 'year'
    ? new Date(now_d.getFullYear(), 0, 1)
    : new Date(now_d.getFullYear(), now_d.getMonth() - ({month:0,'3months':2,'6months':5,'12months':11})[deferredPeriod], 1);
  var pMonths = deferredPeriod === 'year' ? 12 : ({month:1,'3months':3,'6months':6,'12months':12})[deferredPeriod];
  var ppStart = new Date(pStart.getFullYear(), pStart.getMonth() - pMonths, 1);
  var pS = pStart.getFullYear() + '-' + String(pStart.getMonth()+1).padStart(2,'0');
  var ppS = ppStart.getFullYear() + '-' + String(ppStart.getMonth()+1).padStart(2,'0');

  var mtx  = useMemo(function() { return tx.filter(function(t) { return t.date >= pS; }); }, [tx, pS]);
  var pmtx = useMemo(function() { return tx.filter(function(t) { return t.date >= ppS && t.date < pS; }); }, [tx, ppS, pS]);

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
  var hasFirstSale = tx.some(function(t) { return t.type === 'income'; });
  var lowStock = useMemo(function() { return products.filter(function(p) { return p.stock != null && p.stock <= 5; }); }, [products]);
  var usage = useMemo(function() {
    return [
      { key: 'transactions', label: 'Transacoes', used: tx.length,        limit: PLAN_LIMITS.free.transactions, color: brand.color },
      { key: 'products',     label: 'Produtos',   used: products.length,  limit: PLAN_LIMITS.free.products,     color: '#0f9d6c' },
      { key: 'losses',       label: 'Perdas',     used: lossesCount || 0, limit: PLAN_LIMITS.free.losses,       color: 'var(--danger)' },
    ];
  }, [tx.length, products.length, lossesCount, brand.color]);
  var reachedCats = useMemo(function() { return usage.filter(function(u) { return u.used >= u.limit; }); }, [usage]);
  var anyReached = plan === 'free' && reachedCats.length > 0;
  var recent   = useMemo(function() { return tx.slice().sort(function(a, b) { return b.date.localeCompare(a.date); }).slice(0, 8); }, [tx]);
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
        <select aria-label="Periodo" value={period} onChange={function(e){startPeriodTransition(function(){setPeriod(e.target.value)})}}
          className="text-xs rounded-xl px-3 py-2 border min-h-[44px] flex-shrink-0"
          style={{background:'var(--bg-card)', color:'var(--text-main)', borderColor:'var(--border)'}}>
          {PERIODS.map(function(p){return <option key={p.v} value={p.v}>{p.l}</option>})}
        </select>
      </div>

      {!hasFirstSale && (
        <div className="rounded-[20px] p-5 sm:p-6 flex flex-col gap-5" style={{background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)'}}>
          <div>
            <p className="font-display text-lg font-semibold" style={{color:'var(--text-main)'}}>{products.length > 0 ? 'Próximo passo: registre sua primeira venda' : 'Bem-vindo ao Financia'}</p>
            <p className="text-sm mt-1" style={{color:'var(--text-sub)'}}>{products.length > 0 ? 'Seu estoque está pronto. Registre uma venda para começar a ver o resultado do seu negócio.' : 'Siga os passos abaixo para começar a controlar seu negócio.'}</p>
          </div>

          {(function() {
            var steps = [
              { n:'1', title:'Cadastre seus produtos', sub:'Defina precos, custos e controle de estoque', nav:'inventory', btn:'Cadastrar', done: products.length > 0 },
              { n:'2', title:'Registre sua primeira venda', sub:'Multiplos itens, calculo automatico e baixa de estoque', nav:'income', btn:'Registrar', done: hasFirstSale },
              { n:'3', title:'Cadastre uma despesa', sub:'Descubra para onde vai seu dinheiro com categorias e fixos', nav:'expense', btn:'Registrar', done: tx.some(function(t){ return t.type === 'expense'; }) },
              { n:'4', title:'Veja seu primeiro relatorio', sub:'Exporte PDF e Excel com seus dados organizados', nav:'report', btn:'Ver', done: tx.length > 0 },
            ];
            var pct = Math.round(steps.filter(function(s){ return s.done; }).length / steps.length * 100);
            return (
              <>
          {/* Barra de progresso */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
              <div className="h-full rounded-full transition-all duration-500" style={{width:pct + '%', background: brand.color}} />
            </div>
            <span className="text-xs font-bold tabular" style={{color:brand.color}}>{pct}%</span>
          </div>

          <div className="flex flex-col gap-3">
            {steps.map(function(step) {
              return (
                <div key={step.n} className="flex items-start gap-3 rounded-xl px-4 py-3 transition-colors duration-200" style={{background: step.done ? 'color-mix(in srgb, var(--success) 6%, transparent)' : 'var(--bg-subtle)'}}>
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 transition-colors duration-300" style={{background: step.done ? 'var(--success)' : brand.color}}>
                    {step.done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg> : step.n}
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
              </>
            );
          })()}
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="rounded-xl px-4 py-3.5 flex flex-col gap-2" style={{border:'1px solid var(--warning)', background:'color-mix(in srgb, var(--warning) 10%, transparent)'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{background:'var(--warning)'}} aria-label="Alerta: estoque baixo"/>
              <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Estoque baixo</p>
            </div>
            <button onClick={function() { onNav('inventory'); }} className="text-xs font-semibold hover:underline inline-flex items-center min-h-[44px] -my-2.5 px-1 flex-shrink-0" style={{color:'var(--warning)'}}>
              Ver estoque
            </button>
          </div>
          {lowStock.slice(0, 3).map(function(p) {
            return (
              <div key={p.id} className="flex items-center justify-between pl-3.5">
                <span className="text-sm" style={{color:'var(--text-main)'}}>{p.name}</span>
                <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (p.stock <= 0 ? 'bg-red-100 text-red-600' : '')} style={p.stock <= 0 ? {} : {background:'color-mix(in srgb, var(--warning) 12%, transparent)', color:'var(--warning)'}}>
                  {p.stock <= 0 ? 'Esgotado' : p.stock + ' un.'}
                </span>
              </div>
            );
          })}
          {lowStock.length > 3 && <p className="text-xs pl-3.5" style={{color:'var(--warning)'}}>+{lowStock.length - 3} outros com estoque baixo</p>}
        </div>
      )}

      {/* ─── KPIs para empty state: cards educativos ─── */}
      {!hasFirstSale ? (
        <div className="grid grid-cols-2 gap-3">
          {[
             { icon:'M12 4v16m8-8l-8-8-8 8', label:'Entradas', desc:'Registre vendas para ver o quanto entrou', action:'Registrar venda', nav:'income', color:'var(--success)', buttonColor:'var(--success)' },
             { icon:'M12 20V4m-8 8l8 8 8-8', label:'Despesas', desc:'Cadastre contas e veja para onde vai o dinheiro', action:'Registrar despesa', nav:'expense', color:'var(--danger)', buttonColor:'var(--danger-strong)' },
             { icon:'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label:'Estoque', desc:'Gerencie produtos, precos e controle de quantidade', action:'Adicionar produto', nav:'inventory', color:brand.color, buttonColor:brand.color },
             { icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label:'Relatorios', desc:'Exporte PDF e Excel com dados organizados', action:'Ver relatorios', nav:'report', color:'var(--info)', buttonColor:'var(--info-strong)' },
          ].map(function(k) {
            return (
              <div key={k.label} className="rounded-[20px] p-4 sm:p-5 hover:-translate-y-0.5" style={{background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)', transition:'background-color .15s ease, transform .12s ease'}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{background: brandAlpha(k.color, 0.1)}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={k.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={k.icon}/></svg>
                </div>
                <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>{k.label}</p>
                <p className="text-xs mt-1 mb-3 leading-relaxed" style={{color:'var(--text-muted)'}}>{k.desc}</p>
                <button onClick={function() { onNav(k.nav); }} className="text-xs font-semibold px-4 py-2.5 rounded-xl text-white hover:brightness-110 hover:-translate-y-0.5 transition min-h-[44px]" style={{background: k.buttonColor || k.color}}>
                  {k.action}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <section role="region" aria-label="Resumo financeiro" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <KpiCard label="Resultado Liquido"
              value={fmt(profitCurr)}
              color={brand.color}
              accentBar={brand.color}
              variation={profVar}
              sub={profVar === null ? 'Sem dados anteriores' : undefined}
              headline={true}
              highlight={true}
              heading="h2"/>
          </div>
          <KpiCard label="Receitas Totais"
            value={fmt(ti)}
            color="var(--success)"
            accentBar="var(--success)"
            variation={inVar}
            onClick={function() { onNav('income'); }}
            sub={inVar === null ? 'Sem dados anteriores' : undefined}
            heading="h3"/>
          <KpiCard label="Despesas Totais"
            value={fmt(to)}
            color="var(--danger)"
            accentBar="var(--danger)"
            variation={outVar}
            invert={true}
            onClick={function() { onNav('expense'); }}
            sub={outVar === null ? 'Sem dados anteriores' : undefined}
            heading="h3"/>
          <KpiCard label="Saldo Atual"
            value={fmt(di - dout)}
            color="var(--info)"
            accentBar="var(--info)"
            sub={di > 0 || dout > 0 ? ('+' + fmt(di) + ' / -' + fmt(dout)) : 'Sem movimento hoje'}
            heading="h3"/>
        </section>
      )}

      {forecastData && forecastData.months > 0 && (
        <section role="region" aria-label="Previsão de fluxo de caixa" className="rounded-[20px] p-5" style={{background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)'}}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Previsão de caixa</p>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{background:'var(--bg-subtle)', color:'var(--text-sub)'}}>
              Fixos + média {forecastData.months} {forecastData.months === 1 ? 'mês' : 'meses'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[[30, 'Em 30 dias'], [60, 'Em 60 dias'], [90, 'Em 90 dias']].map(function(cfg) {
              var p = forecastData.points.find(function(pt) { return pt.days === cfg[0]; });
              var neg = p && p.balance < 0;
              return (
                <div key={cfg[0]} className="rounded-xl px-3 py-3" style={{background: neg ? 'color-mix(in srgb, var(--danger) 6%, transparent)' : 'var(--bg-subtle)'}}>
                  <p className="text-[11px] font-medium" style={{color:'var(--text-sub)'}}>{cfg[1]} · saldo previsto</p>
                  <p className="text-base font-bold tabular mt-0.5" style={{color: neg ? 'var(--danger)' : 'var(--success)'}}>
                    {p ? fmt(p.balance) : '—'}
                  </p>
                </div>
              );
            })}
          </div>
          {forecastData.alerts.length > 0 && (
            <div className="mt-3 rounded-xl px-3.5 py-2.5 flex items-center gap-2" style={{background:'color-mix(in srgb, var(--danger) 8%, transparent)'}}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="var(--danger)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              <p className="text-xs font-medium" style={{color:'var(--danger)'}}>
                Atençao: saldo projetado negativo em {forecastData.alerts.map(function(a) { return a.days; }).join(' e ')} dias. Reveja os proximos gastos fixos.
              </p>
            </div>
          )}
          <p className="text-[11px] mt-3" style={{color:'var(--text-muted)'}}>
            Estimativa baseada nos seus gastos fixos e na media dos ultimos {forecastData.months} meses. Atualiza automaticamente conforme novas transacoes.
          </p>
        </section>
      )}

      <AiInsightsCard mtx={mtx} ti={ti} to={to} profitCurr={profitCurr} profVar={profVar} lowStock={lowStock} products={products} brand={brand} plan={plan} onUpgrade={onUpgrade}/>

      <div className="cv-auto"><PlanStatusCard plan={plan} brand={brand} onUpgrade={onUpgrade} usage={usage} anyReached={anyReached} reachedCats={reachedCats} planInfo={planInfo}/></div>

      <Card className="p-5 cv-auto" style={{aspectRatio:'16/9'}}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Ultimos 7 dias</p>
          <div className="flex gap-3 text-xs" style={{color:'var(--text-muted)'}}>
            <span className="flex items-center gap-1.5">
               <span role="img" className="w-2.5 h-2.5 rounded-sm inline-block" style={{background: brand.color}} aria-label="Entradas"/>
              <span className="sr-only">Entrada</span>
               Entradas
             </span>
             <span className="flex items-center gap-1.5">
               <span role="img" className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:'var(--danger)'}} aria-label="Saídas"/>
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

      <Card className="cv-auto">
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
<button onClick={function() { onNav('income'); }} className="text-xs font-semibold px-4 py-3 rounded-lg text-white min-h-[44px] hover:opacity-90" style={{background:'var(--success)'}}>+ Venda</button>
<button onClick={function() { onNav('expense'); }} className="text-xs font-semibold px-4 py-3 rounded-lg text-white min-h-[44px] hover:opacity-90" style={{background:'var(--danger)'}}>+ Despesa</button>
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
                        style={{background: isInc ? brandAlpha(brand.color, 0.1) : 'color-mix(in srgb, var(--danger) 8%, transparent)'}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke={isInc ? brand.color : 'var(--danger)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d={isInc ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{color:'var(--text-main)'}}>{t.desc}</p>
                        <p className="text-xs truncate" style={{color:'var(--text-muted)'}}>{fmtDate(t.date)}{t.method ? ' . ' + t.method : ''}{t.category ? ' . ' + t.category : ''}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular flex-shrink-0 ml-3" style={{color: isInc ? brand.color : 'var(--danger)'}}>
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
