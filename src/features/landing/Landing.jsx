import React, { useState, useEffect, useRef } from 'react';
import { useScrollReveal } from '../../shared/hooks/useScrollReveal.js';
import { fmt } from '../../lib/utils.js';
import { waLink, PRICING_PLANS } from '../../lib/constants.js';

var NAVY = '#002f59';
var TEAL = '#1a6b5c';
var GREEN = '#3bbfa0';
var _SKY = '#6ec6c8';
var OFF_WHITE = '#f5f5f0';
var INK = '#0a2540';
var MUTED = '#5b6b7c';

var GRADIENT_TEAL = 'linear-gradient(135deg, #1a6b5c, #3bbfa0)';
var GRADIENT_PRIMARY = 'linear-gradient(135deg, #002f59, #1a6b5c)';
var _GLOW_GREEN = '0 0 40px rgba(59,191,160,0.2)';
var GLOW_NAVY = '0 0 40px rgba(0,47,89,0.15)';

var delay = function(ms) { return { animationDelay: ms + 'ms', animationFillMode: 'both' }; };

// ─── COUNTER HOOK ───
function useCountUp(end, duration) {
  var ref = useRef(null);
  var [val, setVal] = useState(0);
  useEffect(function() {
    var el = ref.current;
    if (!el) return;
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (!e.isIntersecting) return;
        var start = 0;
        var step = Math.ceil(end / (duration / 16));
        var timer = setInterval(function() {
          start += step;
          if (start >= end) { start = end; clearInterval(timer); }
          setVal(start);
        }, 16);
        obs.disconnect();
      });
    }, { threshold: 0.3 });
    obs.observe(el);
    return function() { obs.disconnect(); };
  }, [end, duration]);
  return [val, ref];
}

// ─── MOCK DATA ───
var MOCK_CHART = [
  { day: 'Seg', i: 210, o: 140 },
  { day: 'Ter', i: 350, o: 200 },
  { day: 'Qua', i: 180, o: 280 },
  { day: 'Qui', i: 490, o: 160 },
  { day: 'Sex', i: 620, o: 310 },
  { day: 'Sab', i: 780, o: 220 },
  { day: 'Dom', i: 520, o: 150 },
];
var maxChart = Math.max.apply(null, MOCK_CHART.map(function(x) { return Math.max(x.i, x.o); }));

var MOCK_MOVEMENTS = [
  { desc: 'Venda balcao', detail: 'PIX', val: '+ R$ 450', type: 'income' },
  { desc: 'Compra insumos', detail: 'Estoque', val: '- R$ 180', type: 'expense' },
  { desc: 'Servico realizado', detail: 'Cartao Credito', val: '+ R$ 890', type: 'income' },
  { desc: 'Venda online', detail: 'PIX', val: '+ R$ 1.200', type: 'income' },
  { desc: 'Aluguel', detail: 'Fixo', val: '- R$ 1.200', type: 'expense' },
];

var FEATURES = [
  { t: 'Funciona offline', d: 'Registre a venda na hora, mesmo sem sinal. Tudo sincroniza sozinho quando a internet volta.', icon: 'M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01' },
  { t: 'Ao vivo entre celulares', d: 'Voce no caixa, seu socio no estoque — os mesmos numeros, atualizados na hora nos dois aparelhos.', icon: 'M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3' },
  { t: 'Vendas, despesas e estoque', d: 'O que entra, o que sai e o que tem na prateleira. Um app so, sem planilha baguncada.', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { t: 'Relatorios que decidem', d: 'Lucro do mes, onde o dinheiro esta vazando e exportacao pra planilha em um toque.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

var FAQ = [
  { q: 'Preciso de internet pra usar?', a: 'Nao. O Financia funciona offline e sincroniza sozinho quando a conexao volta. Voce nunca perde uma venda.' },
  { q: 'Funciona no celular e no computador?', a: 'Sim. Roda no navegador de qualquer aparelho e pode ser instalado como aplicativo no celular e no Windows.' },
  { q: 'Da pra comecar de graca?', a: 'Da. O plano Gratis ja resolve pra quem esta comecando, sem cartao de credito. Quando crescer, voce passa pro Pro.' },
  { q: 'Meus dados ficam seguros?', a: 'Ficam. Cada conta enxerga apenas os proprios dados, com conexao criptografada e isolamento por usuario no banco.' },
];

export default function Landing({ onEnter }) {
  var waLinkUrl = waLink('Quero conhecer o Financia para o meu negocio.');
  var [_scrollY, setScrollY] = useState(0);

  useEffect(function() {
    var onScroll = function() { setScrollY(window.scrollY || 0); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return function() { window.removeEventListener('scroll', onScroll); };
  }, []);

  var statsRef = useScrollReveal();
  var dashRef = useScrollReveal();
  var txRef = useScrollReveal();
  var featRef = useScrollReveal();
  var priceRef = useScrollReveal();
  var faqRef = useScrollReveal();
  var ctaRef = useScrollReveal();
  var _trustRef = useScrollReveal();

  var [users] = useCountUp(2800, 1200);
  var [rating] = useCountUp(95, 1000);

  // Estado do FAQ accordion
  var [openFaq, setOpenFaq] = useState(null);
  var toggleFaq = function(idx) { setOpenFaq(function(p) { return p === idx ? null : idx; }); };

  return (
    <div className="relative overflow-hidden" style={{ color: INK, minHeight: '100vh', background: '#fff' }}>

      {/* Orbes de fundo com blur sutil */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -10 }} aria-hidden="true">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(110,198,200,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute top-[30%] right-[-8%] w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(59,191,160,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,47,89,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(16px) saturate(1.8)', WebkitBackdropFilter: 'blur(16px) saturate(1.8)', borderBottom: '1px solid rgba(10,37,64,0.06)' }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon-192.svg" alt="Financia" className="w-7 h-7" />
            <span className="font-display text-lg font-semibold" style={{ color: NAVY, letterSpacing: '-0.3px' }}>Financia</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: MUTED }}>
            <a href="#beneficios" className="hover:text-[#002f59] transition-colors">Recursos</a>
            <a href="#planos" className="hover:text-[#002f59] transition-colors">Planos</a>
            <a href="#faq" className="hover:text-[#002f59] transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={onEnter} className="text-sm font-semibold px-5 py-2.5 min-h-[44px] rounded-xl text-white transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5" style={{ background: GRADIENT_PRIMARY, boxShadow: GLOW_NAVY }}>
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 anim-fade-up" style={{ background: 'rgba(26,107,92,0.08)', border: '1px solid rgba(26,107,92,0.15)', color: TEAL }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: TEAL }} />
              Para o pequeno negocio brasileiro
            </div>

            <h1 className="anim-fade-up font-display font-semibold" style={Object.assign({ color: NAVY, fontSize: 'clamp(2.5rem, 5.8vw, 4.25rem)', lineHeight: 1.0, letterSpacing: '-1.8px' }, delay(80))}>
              Suas financas no<br/>
              <span style={{ background: GRADIENT_TEAL, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>controle total</span>.
            </h1>

            <p className="anim-fade-up mt-5 text-base sm:text-lg max-w-lg leading-relaxed" style={Object.assign({ color: MUTED, lineHeight: 1.6 }, delay(160))}>
              Vendas, despesas e estoque do seu negocio em um so lugar. 
              Sem planilha, sem complicacao. Funciona ate offline.
            </p>

            <div className="anim-fade-up mt-8 flex flex-col sm:flex-row gap-3" style={delay(240)}>
              <button onClick={onEnter} className="group text-sm font-semibold px-8 py-4 rounded-2xl text-white transition-all duration-200 hover:-translate-y-0.5" style={{ background: GRADIENT_PRIMARY, boxShadow: '0 8px 32px rgba(0,47,89,0.25)' }}>
                Criar conta gratis
                <svg className="inline-block ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <a href="#planos" className="text-sm font-semibold px-8 py-4 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] text-center" style={{ border: '1px solid rgba(10,37,64,0.12)', color: INK }}>
                Ver planos
              </a>
            </div>

            <div className="anim-fade-up mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs" style={Object.assign({ color: MUTED }, delay(300))}>
              {['Sem cartao de credito', 'Funciona offline', 'Pronto em 1 minuto'].map(function(t) {
                return (
                  <span key={t} className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
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
              <div className="rounded-[20px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(10,37,64,0.07)', boxShadow: '0 24px 64px -12px rgba(0,47,89,0.18), 0 8px 24px rgba(0,0,0,0.04)' }}>
                {/* Barra de titulo */}
                <div className="flex items-center gap-2 px-5 py-3" style={{ background: '#fcfcfa', borderBottom: '1px solid rgba(10,37,64,0.05)' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#eab308' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
                  <span className="ml-2 text-[11px] font-medium" style={{ color: MUTED }}>financia.app / dashboard</span>
                </div>

                {/* Conteudo do mockup */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-medium" style={{ color: MUTED }}>Resultado do mes</p>
                      <p className="font-display font-bold tabular" style={{ color: NAVY, fontSize: '2rem', letterSpacing: '-1px', lineHeight: 1.1 }}>R$ 8.420</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(59,191,160,0.1)', color: TEAL }}>+18%</span>
                  </div>

                  <div className="flex items-end gap-1.5 h-28 mb-4">
                    {MOCK_CHART.map(function(m, i) {
                      var h = Math.max(Math.round((m.i + m.o) / 18), 6);
                      return (
                        <div key={'hc-' + i} className="flex-1 rounded-t-md" style={{ height: h + '%', background: i === MOCK_CHART.length - 1 ? 'linear-gradient(180deg, #3bbfa0, #1a6b5c)' : 'rgba(0,47,89,0.10)', minHeight: 4 }} />
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-3.5" style={{ background: '#f8faf7' }}>
                      <p className="text-xs" style={{ color: MUTED }}>Entradas</p>
                      <p className="font-bold tabular mt-0.5" style={{ color: NAVY }}>R$ 14.200</p>
                    </div>
                    <div className="rounded-2xl p-3.5" style={{ background: '#f8faf7' }}>
                      <p className="text-xs" style={{ color: MUTED }}>Saidas</p>
                      <p className="font-bold tabular mt-0.5" style={{ color: NAVY }}>R$ 5.780</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card flutuante 1 (receita) */}
            <div className="absolute -bottom-4 -left-8 hidden md:block" style={{ animation: 'floatSlow 5s ease-in-out infinite', animationDelay: '-1s' }}>
              <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(10,37,64,0.06)', boxShadow: '0 8px 24px rgba(0,47,89,0.08)', backdropFilter: 'blur(8px)' }}>
                <p className="text-[11px] font-medium" style={{ color: MUTED }}>Receita hoje</p>
                <p className="font-bold tabular text-sm" style={{ color: '#22c55e' }}>R$ 2.340</p>
              </div>
            </div>

            {/* Card flutuante 2 (ping) */}
            <div className="absolute -top-3 -right-6 hidden md:block" style={{ animation: 'floatSlow 5s ease-in-out infinite', animationDelay: '-2.5s' }}>
              <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(10,37,64,0.06)', boxShadow: '0 8px 24px rgba(0,47,89,0.08)', backdropFilter: 'blur(8px)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: GREEN }} />
                  <span className="text-[11px] font-medium" style={{ color: MUTED }}>Ao vivo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ SOCIAL PROOF ═══════ */}
      <section ref={statsRef} className="px-5 py-14 scroll-reveal" style={{ background: OFF_WHITE }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: MUTED }}>Confianca de quem usa</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-display font-bold" style={{ color: NAVY, fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-1.5px' }}>{users > 0 ? users + '+' : '2.8k+'}</p>
              <p className="text-sm mt-1" style={{ color: MUTED }}>empresas usando o Financia</p>
            </div>
            <div>
              <p className="font-display font-bold" style={{ color: NAVY, fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-1.5px' }}>{rating > 0 ? rating + '%' : '95%'}</p>
              <p className="text-sm mt-1" style={{ color: MUTED }}>avaliam como excelente</p>
            </div>
            <div>
              <p className="font-display font-bold" style={{ color: NAVY, fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-1.5px' }}>4.9</p>
              <p className="text-sm mt-1" style={{ color: MUTED }}>avaliacao media nas lojas</p>
            </div>
          </div>
          {/* Logos placeholder */}
          <div className="flex items-center justify-center gap-8 mt-10 flex-wrap opacity-30 select-none">
            {['Mercado Livre', 'Shopee', 'Magalu', 'Nuvemshop', 'Correios'].map(function(n) {
              return <span key={n} className="text-sm font-bold tracking-wider" style={{ color: NAVY }}>{n}</span>;
            })}
          </div>
        </div>
      </section>

      {/* ═══════ MOCKUP DASHBOARD ═══════ */}
      <section ref={dashRef} className="max-w-6xl mx-auto px-5 py-20 scroll-reveal">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: TEAL }}>Painel financeiro</p>
          <h2 className="font-display font-semibold mt-3" style={{ color: NAVY, fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', letterSpacing: '-1px', lineHeight: 1.1 }}>
            O que aparece ao abrir o app
          </h2>
          <p className="mt-3 text-sm max-w-lg mx-auto" style={{ color: MUTED }}>
            Seus numeros, graficos e movimentos em tempo real. Tudo que importa em uma tela.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Entradas', val: 'R$ 14.200', color: '#22c55e', icon: 'M5 15l7-7 7 7' },
            { label: 'Saidas', val: 'R$ 5.780', color: '#ef4444', icon: 'M19 9l-7 7-7-7' },
            { label: 'Resultado', val: 'R$ 8.420', color: TEAL, icon: 'M12 2l4 8 8 4-8 4-4 8-4-8-8-4 8-4z' },
            { label: 'Saldo hoje', val: 'R$ 2.340', color: '#3b82f6', icon: 'M3 12h18M12 3v18' },
          ].map(function(k, i) {
            return (
              <div key={'k-' + i} className="preview-card rounded-2xl p-4 sm:p-5" style={{ background: '#fff', border: '1px solid rgba(10,37,64,0.06)', boxShadow: '0 2px 8px rgba(0,47,89,0.03)' }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: k.color + '14' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={k.color} strokeWidth="2.5" strokeLinecap="round"><path d={k.icon} /></svg>
                  </div>
                </div>
                <p className="text-xs font-medium" style={{ color: MUTED }}>{k.label}</p>
                <p className="font-display font-bold tabular mt-0.5" style={{ color: k.color, fontSize: '1.15rem', letterSpacing: '-0.3px' }}>{k.val}</p>
              </div>
            );
          })}
        </div>

        {/* Grafico + movimentacoes */}
        <div className="preview-card rounded-[20px] overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(10,37,64,0.06)', boxShadow: '0 2px 16px rgba(0,47,89,0.04)' }}>
          {/* Header do grafico */}
          <div className="p-5 sm:p-6 border-b" style={{ borderColor: 'rgba(10,37,64,0.05)' }}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold" style={{ color: NAVY }}>Ultimos 7 dias</p>
              <div className="flex gap-4 text-xs" style={{ color: MUTED }}>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: GREEN }} />Entradas</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#ef4444' }} />Saidas</span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-36">
              {MOCK_CHART.map(function(m, i) {
                var ih = Math.max((m.i / maxChart) * 100, 4);
                var oh = Math.max((m.o / maxChart) * 100, 4);
                return (
                  <div key={'bc-' + i} className="flex-1 flex flex-col items-center gap-0.5 justify-end">
                    <div className="w-3/4 rounded-t-sm" style={{ height: oh + '%', background: '#ef4444', minHeight: 3 }} />
                    <div className="w-3/4 rounded-t-sm" style={{ height: ih + '%', background: GREEN, minHeight: 3 }} />
                    <span className="text-[10px] tabular mt-0.5" style={{ color: MUTED }}>{m.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Movimentacoes */}
          <div className="px-5 sm:px-6 py-4 border-b" style={{ borderColor: 'rgba(10,37,64,0.05)' }}>
            <p className="text-sm font-semibold" style={{ color: NAVY }}>Movimentacoes recentes</p>
          </div>
          {MOCK_MOVEMENTS.map(function(t, i) {
            var inc = t.type === 'income';
            return (
              <div key={'mov-' + i} className="flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-[#fafaf8] transition-colors" style={{ borderBottom: i < MOCK_MOVEMENTS.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none' }}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: inc ? 'rgba(59,191,160,0.1)' : 'rgba(239,68,68,0.07)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={inc ? GREEN : '#ef4444'} strokeWidth="2.5" strokeLinecap="round"><path d={inc ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: NAVY }}>{t.desc}</p>
                    <p className="text-xs" style={{ color: MUTED }}>{t.detail}</p>
                  </div>
                </div>
                <span className="text-sm font-bold tabular" style={{ color: inc ? GREEN : '#ef4444' }}>{t.val}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ MOCKUP TRANSACOES (off white bg) ═══════ */}
      <section ref={txRef} className="px-5 py-20 scroll-reveal" style={{ background: OFF_WHITE }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: TEAL }}>Extrato completo</p>
            <h2 className="font-display font-semibold mt-3" style={{ color: NAVY, fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', letterSpacing: '-1px', lineHeight: 1.1 }}>
              Vendas e despesas organizadas por dia
            </h2>
            <p className="mt-3 text-sm" style={{ color: MUTED }}>Filtre, busque, edite e exporte. Seu extrato sempre a mao.</p>
          </div>

          <div className="preview-card rounded-[20px] overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(10,37,64,0.06)', boxShadow: '0 2px 16px rgba(0,47,89,0.04)' }}>
            {/* Search bar */}
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'rgba(10,37,64,0.05)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span className="text-sm" style={{ color: MUTED }}>Buscar vendas ou despesas...</span>
            </div>

            {/* Grupo 03/07 */}
            {[
              { date: '03/07', total: '- R$ 750', items: [{ desc: 'Venda balcao', cat: 'PIX', val: '+ R$ 450', inc: true }, { desc: 'Aluguel', cat: 'Fixo', val: '- R$ 1.200', inc: false }] },
              { date: '02/07', total: '+ R$ 1.770', items: [{ desc: 'Venda online', cat: 'PIX', val: '+ R$ 1.200', inc: true }, { desc: 'Servico realizado', cat: 'Cartao Credito', val: '+ R$ 890', inc: true }, { desc: 'Reposicao estoque', cat: 'Estoque', val: '- R$ 320', inc: false }] },
              { date: '01/07', total: '+ R$ 240', items: [{ desc: 'Venda balcao', cat: 'PIX', val: '+ R$ 780', inc: true }, { desc: 'Compras insumos', cat: 'Variavel', val: '- R$ 540', inc: false }] },
            ].map(function(g, gi) {
              var gPos = g.items.reduce(function(s, i) { return i.inc ? s + 1 : s - 1; }, 0) >= 0;
              return (
                <div key={'g-' + gi}>
                  <div className="flex items-center justify-between px-5 py-2.5" style={{ background: 'rgba(10,37,64,0.03)', borderBottom: '1px solid rgba(10,37,64,0.05)' }}>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{g.date}</span>
                    <span className="text-xs font-semibold tabular" style={{ color: gPos ? GREEN : '#ef4444' }}>{g.total}</span>
                  </div>
                  {g.items.map(function(t, ti) {
                    return (
                      <div key={'gi-' + gi + '-' + ti} className="flex items-center justify-between px-5 py-3 hover:bg-[#fafaf8] transition-colors" style={{ borderBottom: '1px solid rgba(10,37,64,0.04)' }}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.inc ? 'rgba(59,191,160,0.1)' : 'rgba(239,68,68,0.07)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.inc ? GREEN : '#ef4444'} strokeWidth="2.5" strokeLinecap="round"><path d={t.inc ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} /></svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: NAVY }}>{t.desc}</p>
                            <p className="text-xs truncate" style={{ color: MUTED }}>{t.cat}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold tabular" style={{ color: t.inc ? GREEN : '#ef4444' }}>{t.val}</span>
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
          <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: TEAL }}>Por que o Financia</p>
          <h2 className="font-display font-semibold mt-3" style={{ color: NAVY, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', letterSpacing: '-1px', lineHeight: 1.1 }}>
            Tudo que seu negocio precisa
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map(function(f, i) {
            return (
              <div key={f.t} className="group rounded-[20px] p-7 transition-all duration-300 hover:-translate-y-1.5" style={{ background: '#fff', border: '1px solid rgba(10,37,64,0.06)', boxShadow: '0 2px 8px rgba(0,47,89,0.03)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg" style={{ background: 'rgba(26,107,92,0.1)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                </div>
                <p className="font-display font-semibold text-lg mb-2" style={{ color: NAVY }}>{f.t}</p>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{f.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section ref={priceRef} id="planos" className="px-5 py-20 scroll-reveal" style={{ background: OFF_WHITE }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: TEAL }}>Planos</p>
            <h2 className="font-display font-semibold mt-3" style={{ color: NAVY, fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', letterSpacing: '-1px' }}>Um preco justo pra cada fase</h2>
            <p className="mt-3 text-sm" style={{ color: MUTED }}>Comece de graca. Mude quando quiser, sem fidelidade.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
            {PRICING_PLANS.map(function(p) {
              var popular = !!p.popular;
              var isFree = p.id === 'free';
              var isPremium = p.id === 'premium';
              return (
                <div key={p.id} className="group relative rounded-[24px] p-8 flex flex-col gap-6 transition-all duration-300 hover:-translate-y-1"
                  style={Object.assign(
                    { background: popular ? '#fff' : '#fff', border: popular ? '1.5px solid ' + TEAL : '1px solid rgba(10,37,64,0.08)' },
                    popular ? { boxShadow: '0 8px 40px rgba(26,107,92,0.12), 0 0 0 1px ' + TEAL + '20' } : { boxShadow: '0 2px 12px rgba(0,47,89,0.04)' }
                  )}>

                  {popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: GRADIENT_TEAL, color: '#fff', boxShadow: '0 4px 16px rgba(59,191,160,0.35)' }}>
                      Mais escolhido
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2.5">
                      <p className="font-display font-semibold text-xl" style={{ color: NAVY }}>{p.name}</p>
                      {isPremium && <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(59,191,160,0.1)', color: TEAL }}>Premium</span>}
                    </div>
                    <p className="text-xs mt-2" style={{ color: MUTED }}>{p.tagline}</p>
                  </div>

                  <div>
                    <div className="flex items-end gap-1">
                      <span className="font-display font-bold tabular" style={{ color: NAVY, fontSize: '2.8rem', letterSpacing: '-1.5px', lineHeight: 1 }}>{fmt(p.price)}</span>
                      {p.period && <span className="text-sm mb-1.5" style={{ color: MUTED }}>{p.period}</span>}
                    </div>
                    <p className="text-xs mt-2" style={{ color: MUTED }}>{isFree ? 'gratis para sempre, sem cartao' : 'cobrado mensalmente, cancele quando quiser'}</p>
                  </div>

                  <button onClick={onEnter}
                    className="text-sm font-semibold py-3.5 rounded-2xl transition-all duration-200 min-h-[44px]"
                    style={popular ? { background: GRADIENT_TEAL, color: '#fff', boxShadow: '0 4px 16px rgba(59,191,160,0.25)' } : isFree ? { background: 'rgba(10,37,64,0.05)', color: NAVY } : { background: NAVY, color: '#fff' }}>
                    {p.cta}
                  </button>

                  <div className="flex flex-col gap-3 pt-1">
                    {p.features.map(function(feat) {
                      var ladder = feat.indexOf('Tudo do') === 0;
                      if (ladder) {
                        return (
                          <div key={feat} className="flex items-center gap-2 pb-2 mb-1" style={{ borderBottom: '1px dashed rgba(10,37,64,0.1)' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                            <span className="text-sm font-bold" style={{ color: NAVY }}>{feat}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={feat} className="flex items-start gap-2.5">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><path d="M5 13l4 4L19 7" /></svg>
                          <span className="text-sm" style={{ color: 'rgba(10,37,64,0.75)' }}>{feat}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs" style={{ color: MUTED }}>
              {['Sem fidelidade', 'Troque ou cancele quando quiser', 'Pagamento seguro pela Stripe'].map(function(t) {
                return (
                  <span key={t} className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
                    {t}
                  </span>
                );
              })}
            </div>
            <a href={waLinkUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold transition hover:opacity-70" style={{ color: TEAL }}>Precisa de algo sob medida? Fale no WhatsApp</a>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section ref={faqRef} id="faq" className="max-w-2xl mx-auto px-5 py-20 scroll-reveal">
        <h2 className="font-display font-semibold text-center mb-12" style={{ color: NAVY, fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', letterSpacing: '-0.5px' }}>Perguntas frequentes</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map(function(item, idx) {
            var isOpen = openFaq === idx;
            return (
              <div key={item.q} className="rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#002f59]/20" style={{ border: '1px solid ' + (isOpen ? 'rgba(0,47,89,0.15)' : 'rgba(10,37,64,0.07)'), background: '#fff' }}>
                <button onClick={function() { toggleFaq(idx); }} className="w-full flex items-center justify-between px-5 py-4 text-left min-h-[44px]" style={{ color: NAVY }}>
                  <span className="text-sm font-semibold">{item.q}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 ml-3 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="overflow-hidden transition-all duration-200" style={{ maxHeight: isOpen ? '200px' : '0px', opacity: isOpen ? 1 : 0 }}>
                  <p className="text-sm px-5 pb-4 leading-relaxed" style={{ color: MUTED }}>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ CTA FINAL ═══════ */}
      <section ref={ctaRef} className="px-5 py-16 scroll-reveal" style={{ background: 'linear-gradient(180deg, #f5f5f0, #ffffff)' }}>
        <div className="max-w-5xl mx-auto rounded-[2rem] px-8 py-16 sm:py-20 text-center relative overflow-hidden" style={{ background: GRADIENT_PRIMARY, boxShadow: '0 24px 64px rgba(0,47,89,0.25), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
          {/* Glow orb */}
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(59,191,160,0.15) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(110,198,200,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: 'rgba(59,191,160,0.8)' }}>Comece agora</p>
            <h2 className="font-display font-semibold text-white" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-1.5px', lineHeight: 1.05 }}>
              Organize seu negocio em<br/>
              <span style={{ color: GREEN }}>menos de 1 minuto</span>
            </h2>
            <p className="mt-4 text-sm max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Conta gratis, sem cartao de credito. Quando crescer, voce escolhe o plano ideal.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={onEnter} className="group text-sm font-semibold px-8 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5" style={{ background: GRADIENT_TEAL, color: '#fff', boxShadow: '0 6px 24px rgba(59,191,160,0.35)' }}>
                Criar conta gratis
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
      <footer className="max-w-6xl mx-auto px-5 py-12" style={{ borderTop: '1px solid rgba(10,37,64,0.06)' }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/icon-192.svg" alt="" className="w-6 h-6" />
            <span className="font-display text-sm font-semibold" style={{ color: NAVY }}>Financia</span>
          </div>
          <p className="text-xs" style={{ color: MUTED }}>Gestao financeira para pequenos negocios brasileiros</p>
          <div className="flex items-center gap-5 text-xs" style={{ color: MUTED }}>
            <a href="#privacidade" className="hover:text-[#002f59] transition-colors">Privacidade</a>
            <a href="#termos" className="hover:text-[#002f59] transition-colors">Termos de Uso</a>
          </div>
        </div>
      </footer>

      </div>
    </div>
  );
}