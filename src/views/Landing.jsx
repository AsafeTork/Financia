import React from 'react';
import { PRICING_PLANS, WHATSAPP, waLink as makeWaLink } from '../lib/constants.js';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

var INK = '#0a2540';
var BRAND = '#002f59';
var ACCENT = '#1a6b5c';
var SKY = '#6ec6c8';
var MINT = '#8cf2d1';
var WARM = '#fbfaf7';
var MUTED = '#5b6b7c';

var money = function(v) { return v === 0 ? 'R$ 0' : 'R$ ' + v.toFixed(2).replace('.', ','); };

var FEATURES = [
  { t: 'Funciona offline', d: 'Registre a venda na hora, mesmo sem sinal. Tudo sincroniza sozinho quando a internet volta.',
    icon: 'M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01' },
  { t: 'Ao vivo entre celulares', d: 'Voce no caixa, seu socio no estoque — os mesmos numeros, atualizados na hora nos dois aparelhos.',
    icon: 'M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3' },
  { t: 'Vendas, despesas e estoque', d: 'O que entra, o que sai e o que tem na prateleira. Um app so, sem planilha baguncada.',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { t: 'Relatorios que decidem por voce', d: 'Lucro do mes, onde o dinheiro esta vazando e exportacao pra planilha em um toque.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

var FAQ = [
  { q: 'Preciso de internet pra usar?', a: 'Nao. O Financia funciona offline e sincroniza sozinho quando a conexao volta. Voce nunca perde uma venda.' },
  { q: 'Funciona no celular e no computador?', a: 'Sim. Roda no navegador de qualquer aparelho e pode ser instalado como aplicativo no celular e no Windows.' },
  { q: 'Da pra comecar de graca?', a: 'Da. O plano Gratis ja resolve pra quem esta comecando, sem cartao de credito. Quando crescer, voce passa pro Pro.' },
  { q: 'Meus dados ficam seguros?', a: 'Ficam. Cada conta enxerga apenas os proprios dados, com conexao criptografada e isolamento por usuario no banco.' },
];

// Dados mockados que refletem fielmente as telas reais do app
var MOCK_KPIS = [
  { label: 'Entradas do mes', value: 'R$ 14.200', color: '#22c55e' },
  { label: 'Saidas do mes', value: 'R$ 5.780', color: '#ef4444' },
  { label: 'Resultado', value: 'R$ 8.420', color: BRAND },
  { label: 'Saldo hoje', value: 'R$ 2.340', color: '#3b82f6' },
];

var MOCK_CHART = [
  { day: 'Seg', i: 210, o: 140 },
  { day: 'Ter', i: 350, o: 200 },
  { day: 'Qua', i: 180, o: 280 },
  { day: 'Qui', i: 490, o: 160 },
  { day: 'Sex', i: 620, o: 310 },
  { day: 'Sab', i: 780, o: 220 },
  { day: 'Dom', i: 520, o: 150 },
];

var MOCK_MOVEMENTS = [
  { desc: 'Venda balcao', detail: 'PIX', val: '+ R$ 450', type: 'income' },
  { desc: 'Compra insumos', detail: 'Estoque', val: '- R$ 180', type: 'expense' },
  { desc: 'Reposicao estoque', detail: 'Fixo', val: '- R$ 320', type: 'expense' },
  { desc: 'Servico realizado', detail: 'Cartao de Credito', val: '+ R$ 890', type: 'income' },
  { desc: 'Venda online', detail: 'PIX', val: '+ R$ 1.200', type: 'income' },
];

var MOCK_TX = [
  { date: '03/07', items: [
    { desc: 'Venda balcao', cat: 'PIX', val: '+ R$ 450', type: 'income' },
    { desc: 'Aluguel', cat: 'Fixo', val: '- R$ 1.200', type: 'expense' },
  ]},
  { date: '02/07', items: [
    { desc: 'Reposicao estoque', cat: 'Estoque', val: '- R$ 320', type: 'expense' },
    { desc: 'Venda online', cat: 'Cartao de Credito', val: '+ R$ 1.200', type: 'income' },
    { desc: 'Servico realizado', cat: 'PIX', val: '+ R$ 890', type: 'income' },
  ]},
  { date: '01/07', items: [
    { desc: 'Compras insumos', cat: 'Variavel', val: '- R$ 540', type: 'expense' },
    { desc: 'Venda balcao', cat: 'PIX', val: '+ R$ 780', type: 'income' },
  ]},
];

var MOCK_PRODUCTS = [
  { name: 'Corte de cabelo', cat: 'Servicos', price: 'R$ 45', stock: '—', stockColor: null },
  { name: 'Camiseta basica', cat: 'Roupas', price: 'R$ 59', stock: '32 un', stockColor: 'green' },
  { name: 'Shampoo 300ml', cat: 'Produtos', price: 'R$ 28', stock: '3 un', stockColor: 'amber' },
  { name: 'Agenda personalizada', cat: 'Papelaria', price: 'R$ 22', stock: '12 un', stockColor: 'green' },
  { name: 'Carregador USB', cat: 'Eletronicos', price: 'R$ 35', stock: '0 un', stockColor: 'red' },
];

export default function Landing({ onEnter }) {
  var waLink = makeWaLink('Quero conhecer o Financia para o meu negocio.');
  var delay = function(ms) { return { animationDelay: ms + 'ms', animationFillMode: 'both' }; };
  var statsRef = useScrollReveal();
  var featRef = useScrollReveal();
  var priceRef = useScrollReveal();
  var faqRef = useScrollReveal();
  var ctaRef = useScrollReveal();

  return (
    <div className="relative overflow-hidden" style={{ color: INK, minHeight: '100vh' }}>

      {/* Fundo gradiente continuo */}
      <div className="fixed inset-0" style={{ zIndex: -20, background: 'linear-gradient(180deg, #fcfbf8 0%, #f6faf8 42%, #eff5fb 100%)' }} aria-hidden="true" />

      <div className="relative z-10 flex flex-col min-h-screen w-full">

      <header className="sticky top-0 z-30" style={{ background: 'rgba(251,250,247,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(10,37,64,0.08)' }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon-192.svg" alt="Financia" className="w-8 h-8" />
            <span className="font-display text-xl font-semibold" style={{ color: INK, letterSpacing: '-0.3px' }}>Financia</span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <button onClick={onEnter} className="text-sm font-semibold px-4 min-h-[44px] rounded-xl text-white transition hover:opacity-90" style={{ background: BRAND }}>Entrar</button>
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="max-w-6xl mx-auto px-5 pt-12 pb-16 lg:pt-20 lg:pb-24 relative overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          <div>
            <div className="anim-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: 'rgba(15,157,108,0.1)', color: ACCENT }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
              Feito para o pequeno negocio brasileiro
            </div>
            <h1 className="anim-up font-display font-semibold" style={Object.assign({ color: INK, fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', lineHeight: 1.02, letterSpacing: '-1.5px' }, delay(60))}>
              Suas financas no controle, <span style={{ fontStyle: 'italic', color: ACCENT }}>sem complicacao</span>.
            </h1>
            <p className="anim-up mt-6 text-lg max-w-md" style={Object.assign({ color: MUTED, lineHeight: 1.55 }, delay(140))}>
              Vendas, despesas e estoque do seu negocio em um so lugar. Esqueca o caderninho e a planilha confusa.
            </p>
            <div className="anim-up mt-8 flex flex-col sm:flex-row gap-3" style={delay(220)}>
              <button onClick={onEnter} className="text-sm font-semibold px-7 py-4 rounded-2xl text-white transition hover:opacity-90 hover:-translate-y-0.5" style={{ background: BRAND, boxShadow: '0 10px 30px rgba(0,47,89,0.25)' }}>
                Criar conta gratis
              </button>
              <a href="#planos" className="text-sm font-semibold px-7 py-4 rounded-2xl transition hover:bg-black/5 text-center" style={{ border: '1px solid rgba(10,37,64,0.15)', color: INK }}>
                Ver planos
              </a>
            </div>
            <div className="anim-up mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs" style={Object.assign({ color: MUTED }, delay(300))}>
              {['Sem cartao de credito', 'Funciona offline', 'Pronto em 1 minuto'].map(function(t) {
                return (
                  <span key={t} className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                    {t}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Hero mockup — versao simplificada do Dashboard */}
          <div className="anim-up relative" style={delay(180)}>
            <div className="absolute -inset-6 rounded-2xl" style={{ background: 'radial-gradient(110% 110% at 70% 20%, rgba(110,198,200,0.18), transparent 62%)' }} />
            <div className="lp-ring absolute -inset-8 rounded-full pointer-events-none" aria-hidden="true" style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(26,107,92,0.1) 80deg, transparent 170deg, rgba(0,47,89,0.1) 260deg, transparent 360deg)', opacity: 0.42 }} />
            <div className="relative rounded-2xl p-5 sm:p-6 float-slow" style={{ background: '#fff', border: '1px solid rgba(10,37,64,0.08)', boxShadow: '0 18px 42px rgba(10,37,64,0.14)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-medium" style={{ color: MUTED }}>Resultado do mes</p>
                  <p className="font-display font-semibold tabular" style={{ color: INK, fontSize: '1.9rem', letterSpacing: '-0.5px' }}>R$ 8.420</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(15,157,108,0.12)', color: ACCENT }}>+18%</span>
              </div>
              <div className="flex items-end gap-1.5 h-24 mb-4 lp-main-chart">
                {MOCK_CHART.map(function(m, i) {
                  var h = Math.round((m.i + m.o) / 22);
                  return <div key={'hc-' + i} className="flex-1 rounded-md" style={{ height: Math.max(h, 10) + '%', background: i === MOCK_CHART.length - 1 ? ACCENT : 'rgba(0,47,89,0.14)', animationDelay: (300 + i * 90) + 'ms' }} />;
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl p-3.5" style={{ background: WARM }}>
                  <p className="text-xs" style={{ color: MUTED }}>Entradas</p>
                  <p className="font-bold tabular mt-0.5" style={{ color: INK }}>R$ 14.200</p>
                </div>
                <div className="rounded-2xl p-3.5" style={{ background: WARM }}>
                  <p className="text-xs" style={{ color: MUTED }}>Saidas</p>
                  <p className="font-bold tabular mt-0.5" style={{ color: INK }}>R$ 5.780</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section ref={statsRef} className="max-w-6xl mx-auto px-5 py-10 scroll-reveal">
        <div className="rounded-2xl px-6 py-8 grid grid-cols-3 gap-4 text-center" style={{ background: '#fff', border: '1px solid rgba(10,37,64,0.08)' }}>
          {[['100%', 'no seu controle, online ou offline'], ['1 min', 'pra criar a conta e comecar'], ['R$ 0', 'pra usar o plano gratis']].map(function(s) {
            return (
              <div key={s[0]}>
                <p className="font-display font-semibold" style={{ color: INK, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', letterSpacing: '-0.5px' }}>{s[0]}</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>{s[1]}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── PREVIEW 1: Dashboard real ─── */}
      <section ref={useScrollReveal()} className="max-w-6xl mx-auto px-5 py-14 scroll-reveal">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Painel financeiro</p>
          <h2 className="font-display font-semibold mt-2" style={{ color: INK, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', letterSpacing: '-1px', lineHeight: 1.1 }}>O que voce ve ao abrir o app</h2>
          <p className="mt-2 text-sm" style={{ color: MUTED }}>Numeros reais, grafico de 7 dias e ultimas movimentacoes.</p>
        </div>

        {/* KPIs — exatamente como no Dashboard.jsx */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {MOCK_KPIS.map(function(k, i) {
            return (
              <div key={'kpi-' + i} className="preview-card rounded-2xl p-4" style={{ background: '#fff', border: '1px solid rgba(10,37,64,0.08)' }}>
                <p className="text-xs font-medium" style={{ color: MUTED }}>{k.label}</p>
                <p className="font-display font-semibold tabular mt-1" style={{ color: k.color, fontSize: '1.25rem', letterSpacing: '-0.3px' }}>{k.value}</p>
              </div>
            );
          })}
        </div>

        {/* Grafico de 7 dias + Movimentacoes — como no Dashboard real */}
        <div className="preview-card rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(10,37,64,0.08)' }}>
          {/* Grafico */}
          <div className="p-5 border-b" style={{ borderColor: 'rgba(10,37,64,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: INK }}>Ultimos 7 dias</p>
              <div className="flex gap-3 text-xs" style={{ color: MUTED }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: BRAND }}/>
                  Entradas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#ef4444' }}/>
                  Saidas
                </span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-32">
              {MOCK_CHART.map(function(m, i) {
                var maxV = Math.max.apply(null, MOCK_CHART.map(function(x) { return Math.max(x.i, x.o); }));
                var ih = (m.i / maxV) * 100;
                var oh = (m.o / maxV) * 100;
                return (
                  <div key={'bc-' + i} className="flex-1 flex flex-col items-center gap-1 justify-end">
                    <div className="w-full flex flex-col items-center gap-0.5 justify-end" style={{ height: '100%' }}>
                      <div className="w-3/4 rounded-t-sm" style={{ height: Math.max(oh, 4) + '%', background: '#ef4444', minHeight: 4 }} />
                      <div className="w-3/4 rounded-t-sm" style={{ height: Math.max(ih, 4) + '%', background: BRAND, minHeight: 4 }} />
                    </div>
                    <span className="text-[10px] tabular" style={{ color: MUTED }}>{m.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Movimentacoes recentes — como no Dashboard real */}
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(10,37,64,0.06)' }}>
            <p className="text-sm font-semibold" style={{ color: INK }}>Movimentacoes recentes</p>
          </div>
          <div>
            {MOCK_MOVEMENTS.map(function(t, i) {
              var isInc = t.type === 'income';
              return (
                <div key={'mov-' + i} className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f8f8f6] transition-colors" style={{ borderBottom: i < MOCK_MOVEMENTS.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none' }}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: isInc ? 'rgba(0,47,89,0.08)' : 'rgba(239,68,68,0.08)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isInc ? BRAND : '#ef4444'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={isInc ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: INK }}>{t.desc}</p>
                      <p className="text-xs" style={{ color: MUTED }}>{t.detail}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular flex-shrink-0 ml-3" style={{ color: isInc ? BRAND : '#ef4444' }}>
                    {t.val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PREVIEW 2: Transacoes agrupadas por data (como TxView) ─── */}
      <section ref={useScrollReveal()} className="max-w-6xl mx-auto px-5 py-14 scroll-reveal">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Extrato completo</p>
          <h2 className="font-display font-semibold mt-2" style={{ color: INK, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', letterSpacing: '-1px', lineHeight: 1.1 }}>Todas as vendas e despesas organizadas</h2>
          <p className="mt-2 text-sm" style={{ color: MUTED }}>Registre, edite e exclua. Agrupado por data como no app.</p>
        </div>

        <div className="preview-card rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(10,37,64,0.08)' }}>
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(10,37,64,0.06)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input placeholder="Buscar vendas ou despesas..." className="flex-1 text-sm border-none outline-none bg-transparent" style={{ color: INK }} disabled/>
          </div>
          {MOCK_TX.map(function(g, gi) {
            var isGain = g.items.some(function(i) { return i.type === 'income'; });
            return (
              <div key={'tg-' + gi}>
                <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'rgba(10,37,64,0.03)', borderBottom: '1px solid rgba(10,37,64,0.06)' }}>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{g.date}</span>
                  <span className="text-xs font-semibold tabular" style={{ color: isGain ? BRAND : '#ef4444' }}>
                    {g.items.reduce(function(s, i) {
                      var v = Number(i.val.replace(/[^\d]/g, ''));
                      return i.type === 'income' ? s + v : s - v;
                    }, 0) > 0 ? '+' : ''}
                    {money(g.items.reduce(function(s, i) {
                      var v = Number(i.val.replace(/[^\d]/g, ''));
                      return i.type === 'income' ? s + v : s - v;
                    }, 0))}
                  </span>
                </div>
                {g.items.map(function(t, ti) {
                  return (
                    <div key={'tgi-' + gi + '-' + ti} className="flex items-center justify-between px-4 py-3 hover:bg-[#f8f8f6] transition-colors" style={{ borderBottom: ti < g.items.length - 1 || gi < MOCK_TX.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none' }}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.type === 'income' ? 'rgba(0,47,89,0.08)' : 'rgba(239,68,68,0.06)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.type === 'income' ? BRAND : '#ef4444'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d={t.type === 'income' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: INK }}>{t.desc}</p>
                          <p className="text-xs truncate" style={{ color: MUTED }}>{t.cat}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold tabular flex-shrink-0 ml-2" style={{ color: t.type === 'income' ? BRAND : '#ef4444' }}>
                        {t.val}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── PREVIEW 3: Estoque real ─── */}
      <section ref={useScrollReveal()} className="max-w-6xl mx-auto px-5 py-14 scroll-reveal">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Estoque e perdas</p>
          <h2 className="font-display font-semibold mt-2" style={{ color: INK, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', letterSpacing: '-1px', lineHeight: 1.1 }}>Produtos, categorias e controle de quantidade</h2>
          <p className="mt-2 text-sm" style={{ color: MUTED }}>Adicione produtos, veja margem de lucro e estoque baixo em destaque.</p>
        </div>

        <div className="preview-card rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(10,37,64,0.08)' }}>
          {/* Abas */}
          <div className="flex border-b" style={{ borderColor: 'rgba(10,37,64,0.06)' }}>
            <div className="flex items-center gap-2 pb-3 px-4 pt-4 text-sm font-semibold" style={{ color: BRAND, borderBottom: '2px solid ' + BRAND }}>
              Produtos
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md text-white" style={{ background: BRAND }}>{MOCK_PRODUCTS.length}</span>
            </div>
          </div>

          {/* Categorias e produtos */}
          {['Servicos', 'Produtos', 'Roupas', 'Eletronicos', 'Papelaria'].map(function(cat, ci) {
            var catItems = MOCK_PRODUCTS.filter(function(p) { return p.cat === cat; });
            if (catItems.length === 0) return null;
            return (
              <div key={'cat-' + ci}>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'rgba(10,37,64,0.03)', borderBottom: '1px solid rgba(10,37,64,0.06)' }}>
                  <svg className="w-3.5 h-3.5" style={{ color: MUTED }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{cat}</span>
                </div>
                {catItems.map(function(p, pi) {
                  var stockStyle = p.stockColor === 'red' ? { color: '#dc2626', background: 'rgba(220,38,38,0.08)' } : p.stockColor === 'amber' ? { color: '#d97706', background: 'rgba(217,119,6,0.08)' } : { color: '#16a34a', background: 'rgba(22,163,74,0.08)' };
                  return (
                    <div key={'prod-' + ci + '-' + pi} className="flex items-center justify-between px-4 py-3 hover:bg-[#f8f8f6] transition-colors" style={{ borderBottom: pi < catItems.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: INK }}>{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold tabular" style={{ color: BRAND }}>{p.price}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={stockStyle}>
                        {p.stock}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section ref={featRef} className="max-w-6xl mx-auto px-5 py-14 scroll-reveal">
        <div className="max-w-xl mb-10">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Por que o Financia</p>
          <h2 className="font-display font-semibold mt-2" style={{ color: INK, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', letterSpacing: '-1px', lineHeight: 1.1 }}>Tudo que o seu negocio precisa, nada que ele nao usa</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(function(f) {
            return (
              <div key={f.t} className="rounded-2xl p-7 transition duration-200 hover:-translate-y-1 hover:shadow-lg lp-metric-card" style={{ background: '#fff', border: '1px solid rgba(10,37,64,0.08)', boxShadow: '0 2px 10px rgba(10,37,64,0.04)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(15,157,108,0.1)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                </div>
                <p className="font-display font-semibold text-xl mb-1.5" style={{ color: INK }}>{f.t}</p>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{f.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section ref={priceRef} id="planos" className="max-w-6xl mx-auto px-5 py-16 scroll-mt-20 scroll-reveal">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Planos</p>
          <h2 className="font-display font-semibold mt-2" style={{ color: INK, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', letterSpacing: '-1px' }}>Um preco justo pra cada fase</h2>
          <p className="mt-3 text-sm" style={{ color: MUTED }}>Comece de graca. Mude de plano quando quiser, sem fidelidade.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {PRICING_PLANS.map(function(p) {
            var popular = !!p.popular;
            var isFree = p.id === 'free';
            var isPremiumCard = p.id === 'premium';
            var priceNote = isFree ? 'gratis para sempre, sem cartao' : 'cobrado mensalmente, cancele quando quiser';
            var btnStyle = popular ? { background: ACCENT, color: '#fff' } : (isFree ? { background: 'rgba(10,37,64,0.06)', color: INK } : { background: BRAND, color: '#fff' });
            var cardBorder = popular ? ('1px solid ' + INK) : ('1px solid ' + (isPremiumCard ? 'rgba(15,157,108,0.35)' : 'rgba(10,37,64,0.1)'));
            return (
              <div key={p.id}
                className={'rounded-2xl p-7 flex flex-col gap-5 relative transition duration-200' + (popular ? ' md:-translate-y-3' : '')}
                style={{ background: popular ? INK : '#fff', border: cardBorder, boxShadow: popular ? '0 30px 70px rgba(10,37,64,0.30)' : '0 2px 14px rgba(10,37,64,0.05)' }}>

                {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap" style={{ background: ACCENT, color: '#fff', boxShadow: '0 6px 16px rgba(15,157,108,0.4)' }}>Mais escolhido</span>}

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-semibold text-2xl" style={{ color: popular ? '#fff' : INK }}>{p.name}</p>
                    {isPremiumCard && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'rgba(15,157,108,0.12)', color: ACCENT }}>Completo</span>}
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: popular ? 'rgba(255,255,255,0.65)' : MUTED }}>{p.tagline}</p>
                </div>

                <div>
                  <div className="flex items-end gap-1">
                    <span className="font-display font-semibold tabular" style={{ color: popular ? '#fff' : INK, fontSize: '2.6rem', letterSpacing: '-1px', lineHeight: 1 }}>{money(p.price)}</span>
                    {p.period && <span className="text-sm mb-1.5" style={{ color: popular ? 'rgba(255,255,255,0.6)' : MUTED }}>{p.period}</span>}
                  </div>
                  <p className="text-xs mt-2.5" style={{ color: popular ? 'rgba(255,255,255,0.5)' : MUTED }}>{priceNote}</p>
                </div>

                <button onClick={onEnter} className="text-sm font-semibold py-3.5 rounded-2xl transition hover:opacity-90 min-h-[44px]" style={btnStyle}>{p.cta}</button>

                <div className="flex flex-col gap-2.5 pt-1">
                  {p.features.map(function(feat) {
                    var ladder = feat.indexOf('Tudo do') === 0;
                    if (ladder) {
                      return (
                        <div key={feat} className="flex items-center gap-2 pb-2 mb-1" style={{ borderBottom: '1px dashed ' + (popular ? 'rgba(255,255,255,0.2)' : 'rgba(10,37,64,0.12)') }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                          <span className="text-sm font-bold" style={{ color: popular ? '#fff' : INK }}>{feat}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={feat} className="flex items-start gap-2.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><path d="M5 13l4 4L19 7" /></svg>
                        <span className="text-sm" style={{ color: popular ? 'rgba(255,255,255,0.9)' : 'rgba(10,37,64,0.82)' }}>{feat}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-9 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs" style={{ color: MUTED }}>
            {['Sem fidelidade', 'Troque ou cancele quando quiser', 'Pagamento seguro pela Stripe'].map(function(t) {
              return (
                <span key={t} className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                  {t}
                </span>
              );
            })}
          </div>
          <a href={waLink} target="_blank" rel="noreferrer" className="text-xs font-semibold transition hover:opacity-70" style={{ color: BRAND }}>Precisa de algo sob medida? Fale no WhatsApp</a>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section ref={faqRef} className="max-w-2xl mx-auto px-5 py-14 scroll-reveal">
        <h2 className="font-display font-semibold text-center mb-10" style={{ color: INK, fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', letterSpacing: '-0.5px' }}>Perguntas frequentes</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map(function(item) {
            return (
              <details key={item.q} className="rounded-2xl p-5 group transition duration-200 hover:border-black/15" style={{ background: '#fff', border: '1px solid rgba(10,37,64,0.08)' }}>
                <summary className="font-semibold text-sm cursor-pointer list-none flex items-center justify-between min-h-[44px] -my-1.5 py-1.5" style={{ color: INK }}>
                  {item.q}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 ml-3 transition-transform group-open:rotate-180" style={{ color: MUTED }}><path d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="text-sm mt-3 leading-relaxed" style={{ color: MUTED }}>{item.a}</p>
              </details>
            );
          })}
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section ref={ctaRef} className="max-w-6xl mx-auto px-5 py-12 scroll-reveal">
        <div className="rounded-[1.5rem] px-6 py-16 text-center relative overflow-hidden" style={{ background: INK }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(80% 120% at 50% 0%, rgba(110,198,200,0.15), transparent 58%)' }} />
          <div className="relative">
            <h2 className="font-display font-semibold text-white" style={{ fontSize: 'clamp(1.75rem, 4.5vw, 3rem)', letterSpacing: '-1px', lineHeight: 1.1 }}>Comece a organizar o seu negocio hoje</h2>
            <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Conta gratis, sem cartao. Leva menos de um minuto.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={onEnter} className="text-sm font-semibold px-8 py-4 rounded-2xl transition hover:opacity-90" style={{ background: ACCENT, color: '#fff' }}>Criar conta gratis</button>
              <a href={waLink} target="_blank" rel="noreferrer" className="text-sm font-semibold px-8 py-4 rounded-2xl transition hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>Falar no WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-5 py-10" style={{ borderTop: '1px solid rgba(10,37,64,0.08)' }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/icon-192.svg" alt="" className="w-6 h-6" />
            <span className="font-display text-sm font-semibold" style={{ color: INK }}>Financia</span>
          </div>
          <p className="text-xs" style={{ color: MUTED }}>Gestao financeira para pequenos negocios</p>
          <div className="flex items-center gap-4 text-xs" style={{ color: MUTED }}>
            <a href="#privacidade" className="transition hover:opacity-70" style={{ color: MUTED }}>Privacidade</a>
            <a href="#termos" className="transition hover:opacity-70" style={{ color: MUTED }}>Termos de Uso</a>
          </div>
        </div>
      </footer>

      </div>
    </div>
  );
}