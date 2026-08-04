import { useEffect } from 'react';
import { effectivePlan } from '../lib/constants.js';

export function usePlanEffects({ dataLoading, setDataLoading, setSyncStatus, planInfo, session, toast, path, setAnnounceMsg, firstRender, toastTimeoutsRef }) {
  useEffect(function() {
    const plan = effectivePlan(planInfo);
    const el = document.documentElement;
    el.setAttribute('data-plan', plan);
    if (plan !== 'free' && session) {
      const prev = el.getAttribute('data-plan-prev');
      if (prev && prev !== plan) {
        const msg = plan === 'premium'
          ? 'Seu plano foi atualizado para Premium. Sua experiencia executiva ja esta disponivel.'
          : 'Seu plano foi atualizado para Pro. Sua nova experiencia ja esta disponivel.';
        toast(msg, 'success');
      }
      el.setAttribute('data-plan-prev', plan);
    } else {
      el.setAttribute('data-plan-prev', plan);
    }
  }, [planInfo, session, toast]);

  useEffect(function() {
    if (!dataLoading) return;
    const t = setTimeout(function() { setDataLoading(false); setSyncStatus('idle'); }, 25000);
    return function() { clearTimeout(t); };
  }, [dataLoading, setDataLoading, setSyncStatus]);

  useEffect(function() {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const names = { dashboard:'Dashboard', income:'Vendas e Ganhos', expense:'Despesas', inventory:'Estoque', report:'Relat\u00f3rio', email:'Comunicar', settings:'Configura\u00e7\u00f5es', planos:'Planos', brandstudio:'Brand Studio' };
    var name = names[path] || path;
    setAnnounceMsg('');
    var rafId = requestAnimationFrame(function() {
      setAnnounceMsg(name);
    });
    var main = document.getElementById('main-content');
    if (main) main.focus();
    var t = setTimeout(function() { setAnnounceMsg(''); }, 3000);
    return function() { cancelAnimationFrame(rafId); clearTimeout(t); };
  }, [path, setAnnounceMsg, firstRender]);

  useEffect(function() {
    return function() {
      toastTimeoutsRef.current.forEach(function(tid) { clearTimeout(tid); });
      toastTimeoutsRef.current = [];
    };
  }, [toastTimeoutsRef]);
}