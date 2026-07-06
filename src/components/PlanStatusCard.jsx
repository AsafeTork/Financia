import { UsageBar } from './UsageBar.jsx';
import { brandAlpha } from '../lib/utils.js';
import { isAdminGranted } from '../lib/constants.js';

export default function PlanStatusCard({ plan, brand, onUpgrade, usage, anyReached, reachedCats, planInfo }) {
  if (plan === 'free') {
    return (
      <div className="rounded-2xl overflow-hidden" style={{background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-md)'}}>
        <div className="h-1 w-full" style={{background:'var(--plan-gradient, ' + brand.color + ')'}}/>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide" style={{color:'var(--text-muted)'}}>Plano gratuito</p>
            <span className="badge-plan text-xs font-bold px-2.5 py-0.5 rounded-full">FREE</span>
          </div>
          <div className="flex flex-col gap-3">
            {usage.map(function(u, i) {
              return (
                <div key={u.key} className={i > 0 ? 'pt-3' : ''} style={i > 0 ? {borderTop:'1px solid var(--border)'} : {}}>
                  <UsageBar label={u.label} used={u.used} limit={u.limit} color={u.color}/>
                </div>
              );
            })}
          </div>
          {anyReached && (
            <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 border border-amber-200" style={{background:'rgba(245,158,11,0.07)'}}>
              <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1"/>
              <p className="text-xs font-semibold text-amber-700">
                {'Limite de ' + reachedCats.map(function(c) { return c.label.toLowerCase(); }).join(' e ') + ' atingido. As demais categorias continuam liberadas.'}
              </p>
            </div>
          )}
          <div className="rounded-xl p-4 flex flex-col gap-3" style={{background:'var(--bg-subtle)'}}>
            <p className="text-xs font-semibold" style={{color:'var(--text-sub)'}}>Ao atualizar voce desbloqueia:</p>
            <div className="flex flex-col gap-1.5">
              {['IA Financeira com insights personalizados', 'Relatorios ilimitados', 'Exportacao em PDF e Excel', 'Historico ilimitado de transacoes', 'Backup prioritario'].map(function(b) {
                return (
                  <div key={b} className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3bbfa0" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
                    <span className="text-xs" style={{color:'var(--text-sub)'}}>{b}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={onUpgrade}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-white rounded-xl py-3 min-h-[44px] transition hover:opacity-90 btn-plan-grad"
            style={{background:'var(--btn-grad, ' + brand.color + ')'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/></svg>
            {anyReached ? 'Liberar tudo - fazer upgrade' : 'Ver planos e fazer upgrade'}
          </button>
        </div>
      </div>
    );
  }

  if (plan === 'pro') {
    return (
      <div className="rounded-2xl overflow-hidden" style={{background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-md)'}}>
        <div className="h-0.5 w-full" style={{background:'var(--plan-gradient, ' + brand.color + ')'}}/>
        <div className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--plan-badge-bg, var(--brand-soft))'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--plan-accent, ' + brand.color + ')" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Plano Pro</p>
              <span className="badge-plan text-[10px] font-bold px-2 py-0.5 rounded-full">PRO</span>
              {planInfo && isAdminGranted(planInfo) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:'rgba(245,158,11,0.12)', color:'#d97706'}}>Cortesia</span>
              )}
            </div>
            <p className="text-xs" style={{color:'var(--text-muted)'}}>Voce tem acesso a todas as ferramentas.</p>
          </div>
          <button onClick={onUpgrade}
            className="text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0 min-h-[44px] transition hover:opacity-80"
            style={{background:'var(--bg-subtle)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>
            Ver Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-md)'}}>
      <div className="h-0.5 w-full" style={{background:'var(--plan-gradient, ' + brand.color + ')'}}/>
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--plan-badge-bg, var(--brand-soft))'}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--plan-accent, #D4AF6A)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
            <path d="M5 18h14v2H5v-2z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold" style={{color:'var(--text-main)'}}>Plano Premium</p>
            <span className="badge-plan text-[10px] font-bold px-2 py-0.5 rounded-full">PREMIUM</span>
            {planInfo && isAdminGranted(planInfo) && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:'rgba(245,158,11,0.12)', color:'#d97706'}}>Cortesia</span>
            )}
          </div>
          <p className="text-xs" style={{color:'var(--text-muted)'}}>A experiencia completa do Financia.</p>
        </div>
      </div>
    </div>
  );
}
