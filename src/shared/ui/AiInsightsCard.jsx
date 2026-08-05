import React, { useState, startTransition } from 'react';
import { Card } from './ui.jsx';
import { brandAlpha } from '../../lib/utils.js';
import { askAI } from '../../lib/aiClient.js';

function _yieldToMain() {
  if (globalThis.scheduler?.yield) return globalThis.scheduler.yield();
  return new Promise(function(r) {
    var ch = new MessageChannel();
    ch.port2.onmessage = function() { r(); };
    ch.port1.postMessage(null);
  });
}

export default React.memo(function AiInsightsCard({ mtx, ti, to, profitCurr, profVar, lowStock, products, brand, plan, onUpgrade }) {
  var canUseAI = plan !== 'free';
  var [aiText, setAiText] = useState('');
  var [aiLoading, setAiLoading] = useState(false);
  var [aiErr, setAiErr] = useState('');

  var gerarInsights = async function() {
    setAiLoading(true); setAiErr(''); setAiText('');
    var byCat = mtx.filter(function(t) { return t.type === 'expense'; }).reduce(function(a, t) {
      var k = t.category || t.cat || 'Outros';
      a[k] = (a[k] || 0) + t.amount;
      return a;
    }, {});
    var topCats = Object.keys(byCat).map(function(k) { return [k, byCat[k]]; })
      .sort(function(a, b) { return b[1] - a[1]; }).slice(0, 3);
    var nSales = mtx.filter(function(t) { return t.type === 'income'; }).length;
    var ticket = nSales > 0 ? ti / nSales : 0;
    var top = topCats.map(function(c) { return c[0] + ':' + Math.round(c[1]); }).join('|');
    var resumo = 'in=' + Math.round(ti)
      + ';out=' + Math.round(to)
      + ';profit=' + Math.round(profitCurr)
      + ';profit_var=' + (profVar == null ? 'na' : String(profVar))
      + ';sales=' + nSales
      + ';ticket=' + Math.round(ticket)
      + ';top_exp=' + (top || 'none')
      + ';low_stock=' + lowStock.length
      + ';products=' + products.length
      + ';entries=' + mtx.length;
    var r = await askAI(resumo, { mode: 'insights', maxTokens: 220 });
    startTransition(function() {
      setAiLoading(false);
      if (r.ok) setAiText(r.text); else setAiErr(r.error);
    });
  };

  return (
    <Card className="p-5 card-plan-glow">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={canUseAI ? 'var(--plan-accent, ' + brand.color + ')' : brand.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>
          </svg>
          <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Insights da IA</p>
          {!canUseAI && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-plan">PRO</span>}
          {canUseAI && plan === 'premium' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-plan">PREMIUM</span>}
        </div>
        {canUseAI && (
          <button onClick={gerarInsights} disabled={aiLoading}
            className="text-xs font-semibold px-3 py-2 rounded-lg text-white transition hover:opacity-90 disabled:opacity-50 flex-shrink-0 btn-plan-grad"
            style={{background: 'var(--btn-grad, ' + brand.color + ')'}}>
            {aiLoading ? 'Analisando...' : (aiText ? 'Atualizar' : 'Gerar analise')}
          </button>
        )}
      </div>
          {!canUseAI ? (
            <div className="flex flex-col gap-3 relative">
              <div className="rounded-xl p-4 overflow-hidden" style={{background: 'var(--bg-subtle)', filter: 'blur(2px)', opacity: 0.5, pointerEvents: 'none'}}>
                <p className="text-xs leading-relaxed" style={{color:'var(--text-muted)'}}>"Suas despesas com estoque subiram 15%. Considere renegociar com fornecedores para melhorar sua margem."</p>
                <p className="text-xs leading-relaxed mt-1" style={{color:'var(--text-muted)'}}>"Seu ticket medio e de R$ 195 — aumentar para R$ 220 geraria +R$ 1.200/mes."</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{background: brandAlpha(brand.color, 0.90), color: '#fff'}}>Disponivel no plano Pro</span>
              </div>
              <button onClick={onUpgrade}
                className="self-start text-xs font-semibold px-4 py-2.5 rounded-xl text-white transition hover:opacity-90 min-h-[44px]"
                style={{background: brand.color}}>
                Conhecer plano Pro
              </button>
            </div>
          ) : (
        <React.Fragment>
          {aiErr && <p className="text-xs" style={{color:'#ef4444'}}>{aiErr}</p>}
          {!aiText && !aiErr && !aiLoading && <p className="text-xs" style={{color:'var(--text-muted)'}}>Receba dicas praticas baseadas nos seus numeros do mes.</p>}
          {aiLoading && (
            <div className="flex flex-col gap-2 mt-1">
              <div className="skeleton" style={{height:10, width:'100%'}}/>
              <div className="skeleton" style={{height:10, width:'85%'}}/>
              <div className="skeleton" style={{height:10, width:'70%'}}/>
            </div>
          )}
          {aiText && <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{color:'var(--text-sub)'}}>{aiText}</div>}
        </React.Fragment>
      )}
    </Card>
  );
});
