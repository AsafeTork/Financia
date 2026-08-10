import React, { useState } from 'react';
import { useScrollReveal } from '../../shared/hooks/useScrollReveal.js';
import { fmt } from '../../lib/utils.js';
import { waLink, PRICING_PLANS } from '../../lib/constants.js';
import { trackEvent, trackEventOnce } from '../../lib/analytics.js';

const delay = function(ms) { return { animationDelay: ms + 'ms', animationFillMode: 'both' }; };

// ─── MOCK DATA ───
const MOCK_CHART = [
  { day: 'Seg', i: 210, o: 140 },
  { day: 'Ter', i: 350, o: 200 },
  { day: 'Qua', i: 180, o: 280 },
  { day: 'Qui', i: 490, o: 160 },
  { day: 'Sex', i: 620, o: 310 },
  { day: 'Sab', i: 780, o: 220 },
  { day: 'Dom', i: 520, o: 150 },
];
const maxChart = Math.max.apply(null, MOCK_CHART.map(function(x) { return Math.max(x.i, x.o); }));

const MOCK_MOVEMENTS = [
  { desc: 'Venda balcao', detail: 'PIX', val: '+ R$ 450', type: 'income' },
  { desc: 'Compra insumos', detail: 'Estoque', val: '- R$ 180', type: 'expense' },
  { desc: 'Servico realizado', detail: 'Cartao Credito', val: '+ R$ 890', type: 'income' },
  { desc: 'Venda online', detail: 'PIX', val: '+ R$ 1.200', type: 'income' },
  { desc: 'Aluguel', detail: 'Fixo', val: '- R$ 1.200', type: 'expense' },
];

const FAQ = [
  { q: 'Preciso de internet pra usar?', a: 'Não. O Financia funciona offline e sincroniza sozinho quando a conexão volta. Você nunca perde uma venda.' },
  { q: 'Funciona no celular e no computador?', a: 'Sim. Roda no navegador de qualquer aparelho e pode ser instalado como aplicativo no celular e no Windows.' },
  { q: 'Dá pra começar de graça?', a: 'Dá. O plano Grátis já resolve pra quem está começando, sem cartão de crédito. Quando crescer, você passa pro Pro.' },
  { q: 'Meus dados ficam seguros?', a: 'Ficam. Cada conta enxerga apenas os próprios dados, com conexão criptografada e isolamento por usuário no banco.' },
];

export default function Landing({ onEnter, onSignup, onNav }) {
  const createAccount = onSignup || onEnter;
  const startSignup = function(placement) {
    trackEvent('landing_cta_click', { placement: placement });
    createAccount();
  };
  const waLinkUrl = waLink('Quero conhecer o Financia para o meu negocio.');
  const statsRef = useScrollReveal();
  const dashRef = useScrollReveal();
  const txRef = useScrollReveal();
  const featRef = useScrollReveal();
  const priceRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  // Estado do FAQ accordion
  const [openFaq, setOpenFaq] = useState(null);
  React.useEffect(function() { trackEventOnce('landing_view', 'session'); }, []);
  const toggleFaq = function(idx) { setOpenFaq(function(prev) { return prev === idx ? null : idx; }); };

  return (
    <div className="relative overflow-hidden" style={{ color: 'var(--text-main)', minHeight: '100vh', background: 'var(--bg-card)' }}>

      {/* Orbes de fundo com blur sutil — blur reduzido em mobile (GPU) */}
      <div className="fixed inset-0 pointer-events-none mob-orb" style={{ zIndex: -10 }} aria-hidden="true">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full orb-bg-1" />
        <div className="absolute top-[30%] right-[-8%] w-[500px] h-[500px] rounded-full orb-bg-2" />
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] rounded-full orb-bg-3" />
      </div>

      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-30" style={{ background: 'var(--navbar-text-color)', backdropFilter: 'blur(16px) saturate(1.8)', WebkitBackdropFilter: 'blur(16px) saturate(1.8)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon-192.svg" alt="Financia" fetchPriority="high" decoding="sync" className="w-7 h-7" />
            <span className="font-display text-lg font-semibold tracking-tight" style={{ color: 'var(--brand)' }}>Financia</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--text-sub)' }}>
            <button onClick={function() { document.getElementById('beneficios').scrollIntoView({behavior:'smooth'}); }} className="hover:text-[var(--brand)] transition-colors">Recursos</button>
            <button onClick={function() { document.getElementById('planos').scrollIntoView({behavior:'smooth'}); }} className="hover:text-[var(--brand)] transition-colors">Planos</button>
            <button onClick={function() { document.getElementById('faq').scrollIntoView({behavior:'smooth'}); }} className="hover:text-[var(--brand)] transition-colors">FAQ</button>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={onEnter} className="text-sm font-semibold px-5 py-2.5 min-h-[44px] rounded-xl text-white transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5" style={{ background: 'var(--brand-grad)', boxShadow: '0 0 40px rgba(0,47,89,0.15)' }}>
              Entrar
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col">

      {/* ═══════ HERO ═══════ */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 lg:pt-24 lg:pb-28 relative">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">

          {/* Esquerda: texto */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 anim-fade-up" style={{ background: 'var(--brand-accent-soft)', border: '1px solid rgba(26,107,92,0.15)', color: 'var(--brand-accent)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-accent)' }} />
              Para o pequeno negócio brasileiro
            </div>

            <h1 className="anim-fade-up font-display font-semibold tracking-tight" style={Object.assign({ color: 'var(--brand)', fontSize: 'var(--text-display)', lineHeight: 1.0 }, delay(80))}>
              Vendas, despesas e estoque<br/>
              <span style={{ background: 'var(--brand-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>no controle, mesmo offline</span>.
            </h1>

            <p className="anim-fade-up mt-5 text-base sm:text-lg max-w-lg leading-relaxed" style={Object.assign({ color: 'var(--text-sub)', lineHeight: 1.6 }, delay(160))}>
              Registre vendas e despesas no celular ou no computador. Funciona sem internet e sincroniza sozinho.
            </p>

            <div className="anim-fade-up mt-8 flex flex-col sm:flex-row gap-3" style={delay(240)}>
              <button onClick={function() { startSignup('hero'); }} className="group text-sm font-semibold px-8 py-4 rounded-2xl text-white transition-all duration-200 hover:-translate-y-0.5" style={{ background: 'var(--brand-grad)', boxShadow: 'var(--shadow-xl)' }}>
                Criar conta grátis
                <svg className="inline-block ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>

            <div className="anim-fade-up mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs" style={Object.assign({ color: 'var(--text-sub)' }, delay(300))}>
              {['Sem cartão de crédito', 'Funciona offline', 'Pronto em 1 minuto'].map(function(t) {
                return (
                  <span key={t} className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                    {t}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Direita: mockup com glass e profundidade */}
          <div className="anim-fade-up relative" style={delay(120)}>
            {/* Glow behind mockup */}
            <div className="absolute -inset-10 rounded-[40px]" style={{ background: 'radial-gradient(100% 100% at 70% 30%, rgba(59,191,160,0.10), transparent 65%)', filter: 'blur(30px)' }} />
            <div className="lp-ring absolute -inset-8 rounded-full pointer-events-none" style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(26,107,92,0.08) 100deg, transparent 200deg, rgba(0,47,89,0.06) 280deg, transparent 360deg)', opacity: 0.4 }} />

            {/* Card principal com glass sutil */}
            <div className="relative float-slow" style={{ transform: 'perspective(1200px) rotateY(-2deg)', transition: 'transform 0.4s' }}>
              <div className="rounded-[20px] overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}>
                {/* Barra de titulo */}
                <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--danger)' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--warning)' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--success)' }} />
                  <span className="ml-2 text-[11px] font-medium" style={{ color: 'var(--text-sub)' }}>financia.app / dashboard</span>
                </div>

                {/* Conteudo do mockup — preview do dashboard */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-sub)' }}>Resultado do mês</p>
                      <p className="font-display font-bold tabular tracking-tight" style={{ color: 'var(--brand)', fontSize: 'var(--text-h2)', lineHeight: 1.1 }}>R$ 8.420</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(59,191,160,0.1)', color: 'var(--brand-accent)' }}>+18%</span>
                  </div>

                  <div className="flex items-end gap-1.5 h-28 mb-4">
                    {MOCK_CHART.map(function(m, i) {
                      const h = Math.max(Math.round((m.i + m.o) / 18), 6);
                      return (
                        <div key={'hc-' + i} className="flex-1 rounded-t-md" style={{ height: h + '%', background: i === MOCK_CHART.length - 1 ? 'var(--brand-grad)' : 'var(--brand-soft)', minHeight: 4 }} />
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-3.5" style={{ background: 'var(--bg-subtle)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-sub)' }}>Entradas</p>
                      <p className="font-bold tabular mt-0.5" style={{ color: 'var(--brand)' }}>R$ 14.200</p>
                    </div>
                    <div className="rounded-2xl p-3.5" style={{ background: 'var(--bg-subtle)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-sub)' }}>Saídas</p>
                      <p className="font-bold tabular mt-0.5" style={{ color: 'var(--brand)' }}>R$ 5.780</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card flutuante 1 (receita) */}
            <div className="absolute -bottom-4 -left-8 hidden md:block" style={{ animation: 'floatSlow 5s ease-in-out infinite', animationDelay: '-1s' }}>
              <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(8px)' }}>
                <p className="text-[11px] font-medium" style={{ color: 'var(--text-sub)' }}>Receita hoje</p>
                <p className="font-bold tabular text-sm" style={{ color: 'var(--success)' }}>R$ 2.340</p>
              </div>
            </div>

            {/* Card flutuante 2 (ping) */}
            <div className="absolute -top-3 -right-6 hidden md:block" style={{ animation: 'floatSlow 5s ease-in-out infinite', animationDelay: '-2.5s' }}>
              <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(8px)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-sub)' }}>Ao vivo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ USE CASES ═══════ */}
      <section ref={statsRef} className="px-5 py-14 scroll-reveal" style={{ background: 'var(--bg-subtle)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--brand-accent)' }}>No dia a dia</p>
            <h2 className="font-display font-semibold tracking-tight mt-2" style={{ color: 'var(--brand)', fontSize: 'var(--text-h2)' }}>Menos planilha. Mais clareza para decidir.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <p className="font-display font-bold text-lg tracking-tight" style={{ color: 'var(--brand)' }}>No caixa</p>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-sub)' }}>Registre a venda na hora, mesmo sem sinal, e continue atendendo sem depender da internet.</p>
            </div>
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <p className="font-display font-bold text-lg tracking-tight" style={{ color: 'var(--brand)' }}>No estoque</p>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-sub)' }}>Acompanhe produtos, custos e perdas para saber o que precisa ser reposto antes de faltar.</p>
            </div>
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <p className="font-display font-bold text-lg tracking-tight" style={{ color: 'var(--brand)' }}>No fechamento</p>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-sub)' }}>Veja entradas, despesas, resultado e previsão de caixa em uma visão simples do negócio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ MOCKUP DASHBOARD ═══════ */}
      <section ref={dashRef} className="max-w-6xl mx-auto px-5 py-20 scroll-reveal">
        <div className="text-center mb-14">
          <h2 className="font-display font-semibold tracking-tight" style={{ color: 'var(--brand)', fontSize: 'var(--text-h1)', lineHeight: 1.1 }}>
            Uma visão do seu negócio ao abrir o app
          </h2>
          <p className="mt-3 text-sm max-w-lg mx-auto" style={{ color: 'var(--text-sub)' }}>
            Exemplo ilustrativo dos números, gráficos e movimentos reunidos em uma tela.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Entradas', val: 'R$ 14.200', color: 'var(--success)', icon: 'M5 15l7-7 7 7' },
            { label: 'Saidas', val: 'R$ 5.780', color: 'var(--danger)', icon: 'M19 9l-7 7-7-7' },
            { label: 'Resultado', val: 'R$ 8.420', color: 'var(--brand-accent)', icon: 'M12 2l4 8 8 4-8 4-4 8-4-8-8-4 8-4z' },
            { label: 'Saldo hoje', val: 'R$ 2.340', color: 'var(--info)', icon: 'M3 12h18M12 3v18' },
          ].map(function(k, i) {
            return (
              <div key={'k-' + i} className="preview-card rounded-2xl p-4 sm:p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: k.color + '14' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={k.color} strokeWidth="2.5" strokeLinecap="round"><path d={k.icon} /></svg>
                  </div>
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-sub)' }}>{k.label}</p>
                <p className="font-display font-bold tabular mt-0.5 tracking-tight" style={{ color: k.color, fontSize: 'var(--text-h4)' }}>{k.val}</p>
              </div>
            );
          })}
        </div>

        {/* Grafico + movimentacoes */}
        <div className="preview-card rounded-[20px] overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          {/* Header do grafico */}
          <div className="p-5 sm:p-6 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>Ultimos 7 dias</p>
              <div className="flex gap-4 text-xs" style={{ color: 'var(--text-sub)' }}>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--green)' }} />Entradas</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--danger)' }} />Saidas</span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-36">
              {MOCK_CHART.map(function(m, i) {
                const ih = Math.max((m.i / maxChart) * 100, 4);
                const oh = Math.max((m.o / maxChart) * 100, 4);
                return (
                  <div key={'bc-' + i} className="flex-1 flex flex-col items-center justify-end min-w-0">
                    <div className="h-32 w-full flex items-end justify-center gap-0.5">
                      <div className="w-1/2 rounded-t-sm flex-shrink-0" style={{ height: oh + '%', background: 'var(--danger)', minHeight: 3 }} />
                      <div className="w-1/2 rounded-t-sm flex-shrink-0" style={{ height: ih + '%', background: 'var(--green)', minHeight: 3 }} />
                    </div>
                    <span className="text-[10px] tabular mt-0.5" style={{ color: 'var(--text-sub)' }}>{m.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Movimentacoes */}
          <div className="px-5 sm:px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>Movimentacoes recentes</p>
          </div>
          {MOCK_MOVEMENTS.map(function(t, i) {
            const inc = t.type === 'income';
            return (
              <div key={'mov-' + i} className="flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-[var(--bg-subtle)] transition-colors" style={{ borderBottom: i < MOCK_MOVEMENTS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: inc ? 'rgba(59,191,160,0.1)' : 'rgba(239,68,68,0.07)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={inc ? 'var(--success)' : 'var(--danger)'} strokeWidth="2.5" strokeLinecap="round"><path d={inc ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--brand)' }}>{t.desc}</p>
                    <p className="text-xs" style={{ color: 'var(--text-sub)' }}>{t.detail}</p>
                  </div>
                </div>
                <span className="text-sm font-bold tabular" style={{ color: inc ? 'var(--success)' : 'var(--danger)' }}>{t.val}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ MOCKUP TRANSACOES (off white bg) ═══════ */}
      <section ref={txRef} className="px-5 py-20 scroll-reveal" style={{ background: 'var(--bg-subtle)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display font-semibold tracking-tight" style={{ color: 'var(--brand)', fontSize: 'var(--text-h1)', lineHeight: 1.1 }}>
              Vendas e despesas organizadas por dia
            </h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--text-sub)' }}>Exemplo ilustrativo: filtre, busque, edite e exporte seu extrato.</p>
          </div>

          <div className="preview-card rounded-[20px] overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            {/* Search bar */}
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-sub)" strokeWidth="2" strokeLinecap="round"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span className="text-sm" style={{ color: 'var(--text-sub)' }}>Buscar vendas ou despesas...</span>
            </div>

            {/* Grupo 03/07 */}
            {[
              { date: '03/07', total: '- R$ 750', items: [{ desc: 'Venda balcao', cat: 'PIX', val: '+ R$ 450', inc: true }, { desc: 'Aluguel', cat: 'Fixo', val: '- R$ 1.200', inc: false }] },
              { date: '02/07', total: '+ R$ 1.770', items: [{ desc: 'Venda online', cat: 'PIX', val: '+ R$ 1.200', inc: true }, { desc: 'Servico realizado', cat: 'Cartao Credito', val: '+ R$ 890', inc: true }, { desc: 'Reposicao estoque', cat: 'Estoque', val: '- R$ 320', inc: false }] },
              { date: '01/07', total: '+ R$ 240', items: [{ desc: 'Venda balcao', cat: 'PIX', val: '+ R$ 780', inc: true }, { desc: 'Compras insumos', cat: 'Variavel', val: '- R$ 540', inc: false }] },
            ].map(function(g, gi) {
              const gPos = g.items.reduce(function(s, i) { return i.inc ? s + 1 : s - 1; }, 0) >= 0;
              return (
                <div key={'g-' + gi}>
                  <div className="flex items-center justify-between px-5 py-2.5" style={{ background: 'var(--brand-soft)', borderBottom: '1px solid var(--border)' }}>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-sub)' }}>{g.date}</span>
                    <span className="text-xs font-semibold tabular" style={{ color: gPos ? 'var(--success)' : 'var(--danger)' }}>{g.total}</span>
                  </div>
                  {g.items.map(function(t, ti) {
                    return (
                      <div key={'gi-' + gi + '-' + ti} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-subtle)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.inc ? 'rgba(59,191,160,0.1)' : 'rgba(239,68,68,0.07)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.inc ? 'var(--success)' : 'var(--danger)'} strokeWidth="2.5" strokeLinecap="round"><path d={t.inc ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} /></svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--brand)' }}>{t.desc}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-sub)' }}>{t.cat}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold tabular" style={{ color: t.inc ? 'var(--success)' : 'var(--danger)' }}>{t.val}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section ref={featRef} id="beneficios" className="max-w-6xl mx-auto px-5 py-20 scroll-reveal">
        <div className="max-w-lg mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--brand-accent)' }}>Por que o Financia</p>
          <h2 className="font-display font-semibold mt-3 tracking-tight" style={{ color: 'var(--brand)', fontSize: 'var(--text-h1)', lineHeight: 1.1 }}>
            Tudo que seu negocio precisa
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Célula A — col-span-2: destacado offline */}
          <div className="group rounded-[20px] p-7 transition-all duration-300 hover:-translate-y-1.5 md:col-span-2" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--brand-accent-soft) 100%)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110" style={{ background: 'var(--brand-accent-soft)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" /></svg>
            </div>
            <p className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--brand)' }}>Funciona offline</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sub)' }}>Registre a venda na hora, mesmo sem sinal. Tudo sincroniza sozinho quando a internet volta.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--brand-accent-soft)', color: 'var(--brand-accent)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
                Instala como app
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--brand-accent-soft)', color: 'var(--brand-accent)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
                Sem internet
              </span>
            </div>
          </div>
          {/* Célula B — 1 col: sincronização */}
          <div className="group rounded-[20px] p-7 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110" style={{ background: 'var(--brand-accent-soft)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" /></svg>
            </div>
            <p className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--brand)' }}>Ao vivo entre celulares</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sub)' }}>Você no caixa, seu sócio no estoque — os mesmos números, atualizados na hora.</p>
          </div>
          {/* Célula C — 1 col: vendas */}
          <div className="group rounded-[20px] p-7 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110" style={{ background: 'var(--brand-accent-soft)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <p className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--brand)' }}>Vendas, despesas e estoque</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sub)' }}>O que entra, o que sai e o que tem na prateleira. Um app só, sem planilha bagunçada.</p>
          </div>
          {/* Célula D — col-span-2: relatórios */}
          <div className="group rounded-[20px] p-7 transition-all duration-300 hover:-translate-y-1.5 md:col-span-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110" style={{ background: 'var(--brand-accent-soft)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <p className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--brand)' }}>Relatórios que decidem</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sub)' }}>Lucro do mês, onde o dinheiro está vazando e exportação pra planilha em um toque.</p>
          </div>
        </div>
      </section>

      {/* ═══════ PWA BADGES ═══════ */}
      <section className="px-5 py-8" style={{ background: 'var(--bg-subtle)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm" style={{ color: 'var(--text-sub)' }}>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
            Funciona offline
          </span>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
            Instala como app em segundos
          </span>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
            No celular e no PC
          </span>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section ref={priceRef} id="planos" className="px-5 py-20 scroll-reveal" style={{ background: 'var(--bg-subtle)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display font-semibold tracking-tight" style={{ color: 'var(--brand)', fontSize: 'var(--text-h1)' }}>Um preço claro para cada fase</h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--text-sub)' }}>Comece de graça. Mude quando quiser, sem fidelidade.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
            {PRICING_PLANS.map(function(p) {
              const popular = !!p.popular;
              const isFree = p.id === 'free';
              const isPremium = p.id === 'premium';
              return (
                <div key={p.id} className="group relative rounded-[24px] p-8 flex flex-col gap-6 transition-all duration-300 hover:-translate-y-1"
                  style={Object.assign(
                    { background: 'var(--bg-card)', border: popular ? '1.5px solid var(--brand-accent)' : '1px solid var(--border-md)' },
                    popular ? { boxShadow: 'var(--shadow-xl), 0 0 0 1px rgba(26,107,92,0.125)' } : { boxShadow: 'var(--shadow-sm)' }
                  )}>

                  {popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: 'var(--brand-grad)', color: 'var(--bg-card)', boxShadow: '0 4px 16px rgba(59,191,160,0.35)' }}>
                      Mais escolhido
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2.5">
                      <p className="font-display font-semibold text-xl" style={{ color: 'var(--brand)' }}>{p.name}</p>
                      {isPremium && <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(59,191,160,0.1)', color: 'var(--brand-accent)' }}>Premium</span>}
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-sub)' }}>{p.tagline}</p>
                  </div>

                  <div>
                    <div className="flex items-end gap-1">
                      <span className="font-display font-bold tabular tracking-tight" style={{ color: 'var(--brand)', fontSize: 'var(--text-h1)', lineHeight: 1 }}>{fmt(p.price)}</span>
                      {p.period && <span className="text-sm mb-1.5" style={{ color: 'var(--text-sub)' }}>{p.period}</span>}
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-sub)' }}>{isFree ? 'grátis para sempre, sem cartão' : 'cobrado mensalmente, cancele quando quiser'}</p>
                  </div>

                  <button onClick={function() { startSignup('pricing_' + p.id); }}
                    className="text-sm font-semibold py-3.5 rounded-2xl transition-all duration-200 min-h-[44px]"
                    style={popular ? { background: 'var(--brand-grad)', color: '#fff', boxShadow: '0 4px 16px rgba(59,191,160,0.25)' } : isFree ? { background: 'var(--brand-soft)', color: 'var(--brand)' } : { background: 'var(--brand)', color: '#fff' }}>
                    {p.cta}
                  </button>

                  <div className="flex flex-col gap-3 pt-1">
                    {p.features.map(function(feat) {
                      const ladder = feat.indexOf('Tudo do') === 0;
                      if (ladder) {
                        return (
                          <div key={feat} className="flex items-center gap-2 pb-2 mb-1" style={{ borderBottom: '1px dashed var(--border-md)' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                            <span className="text-sm font-bold" style={{ color: 'var(--brand)' }}>{feat}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={feat} className="flex items-start gap-2.5">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><path d="M5 13l4 4L19 7" /></svg>
                          <span className="text-sm" style={{ color: 'var(--text-sub)' }}>{feat}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs" style={{ color: 'var(--text-sub)' }}>
              {['Sem fidelidade', 'Troque ou cancele quando quiser', 'Pagamento seguro pela Stripe'].map(function(t) {
                return (
                  <span key={t} className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
                    {t}
                  </span>
                );
              })}
            </div>
            <a href={waLinkUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold transition hover:opacity-70" style={{ color: 'var(--brand-accent)' }}>Precisa de algo sob medida? Fale no WhatsApp</a>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section ref={faqRef} id="faq" className="max-w-2xl mx-auto px-5 py-20 scroll-reveal">
        <h2 className="font-display font-semibold text-center mb-12 tracking-tight" style={{ color: 'var(--brand)', fontSize: 'var(--text-h2)' }}>Perguntas frequentes</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map(function(item, idx) {
            const isOpen = openFaq === idx;
            return (
              <div key={item.q} className="rounded-2xl overflow-hidden transition-all duration-200 hover:border-[var(--brand-soft)]" style={{ border: '1px solid ' + (isOpen ? 'var(--brand-soft)' : 'var(--border)'), background: 'var(--bg-card)' }}>
                <button onClick={function() { toggleFaq(idx); }} id={'faq-btn-' + idx} aria-expanded={isOpen} aria-controls={'faq-panel-' + idx} className="w-full flex items-center justify-between px-5 py-4 text-left min-h-[44px]" style={{ color: 'var(--brand)' }}>
                  <span className="text-sm font-semibold">{item.q}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-sub)" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 ml-3 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div id={'faq-panel-' + idx} role="region" aria-labelledby={'faq-btn-' + idx} style={{ maxHeight: isOpen ? '400px' : '0', opacity: isOpen ? 1 : 0, overflow: 'hidden', transition: 'max-height .3s ease, opacity .2s ease' }}>
                  <p className="text-sm px-5 pb-4 leading-relaxed" style={{ color: 'var(--text-sub)' }}>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ CTA FINAL ═══════ */}
      <section ref={ctaRef} className="px-5 py-16 scroll-reveal" style={{ background: 'linear-gradient(180deg, var(--bg-subtle), var(--bg-card))' }}>
        <div className="max-w-5xl mx-auto rounded-[2rem] px-8 py-16 sm:py-20 text-center relative overflow-hidden" style={{ background: 'var(--brand-grad)', boxShadow: 'var(--shadow-xl), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
          {/* Glow orb */}
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(59,191,160,0.15) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(110,198,200,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: 'rgba(59,191,160,0.8)' }}>Comece agora</p>
            <h2 className="font-display font-semibold text-white tracking-tight" style={{ fontSize: 'var(--text-display)', lineHeight: 1.05 }}>
              Organize seu negócio em<br/>
              <span style={{ color: 'var(--bg-card)' }}>menos de 1 minuto</span>
            </h2>
            <p className="mt-4 text-sm max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Conta grátis, sem cartão de crédito. Quando crescer, você escolhe o plano ideal.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={function() { startSignup('final_cta'); }} className="group text-sm font-semibold px-8 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5" style={{ background: 'var(--bg-card)', color: 'var(--brand)', boxShadow: '0 6px 24px rgba(59,191,160,0.35)' }}>
                Criar conta grátis
                <svg className="inline-block ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <a href={waLinkUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold px-8 py-4 rounded-2xl transition-all duration-200 hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="max-w-6xl mx-auto px-5 py-12" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/icon-192.svg" alt="" loading="lazy" decoding="async" className="w-6 h-6" />
            <span className="font-display text-sm font-semibold" style={{ color: 'var(--brand)' }}>Financia</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-sub)' }}>Gestão financeira para pequenos negócios brasileiros</p>
          <div className="flex items-center gap-5 text-xs" style={{ color: 'var(--text-sub)' }}>
            <a href="/privacidade" onClick={function(e){e.preventDefault();onNav('privacidade');}} className="hover:text-[var(--brand)] transition-colors">Privacidade</a>
            <a href="/termos" onClick={function(e){e.preventDefault();onNav('termos');}} className="hover:text-[var(--brand)] transition-colors">Termos de Uso</a>
          </div>
        </div>
      </footer>

      </div>
    </div>
  );
}
