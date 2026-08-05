import { useEffect, useRef } from 'react';

/**
 * Hook para ativar animações ao elemento entrar na viewport
 * Uso: const ref = useScrollReveal(); <div ref={ref} className="scroll-reveal">
 */
export function useScrollReveal(options = {}) {
  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', selector } = options;
  const ref = useRef(null);

  useEffect(function() {
    const node = ref.current;
    if (!node) return;
    const target = selector ? node.querySelector(selector) : node;
    if (!target) return;
    const obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('anim-up');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold, rootMargin });
    obs.observe(target);
    return function() { obs.disconnect(); };
  }, [threshold, rootMargin, selector]);

  return ref;
}

/**
 * Hook para observar múltiplos elementos com stagger
 * Uso: useScrollRevealMultiple(containerRef, '.item')
 */
export function useScrollRevealMultiple(containerRef, selector) {
  useEffect(() => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll(selector);
    const timeouts = [];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const tid = setTimeout(() => {
              entry.target.classList.add('visible');
            }, index * 40); // --stagger-base: 40ms from design system
            timeouts.push(tid);

            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    items.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      timeouts.forEach(function(tid) { clearTimeout(tid); });
    };
  }, [containerRef, selector]);
}

/**
 * Hook para parallax scroll
 * Uso: const ref = useParallax(0.5); // 0.5 = move 50% da velocidade do scroll
 */
export function useParallax(speed = 0.5) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const offset = scrollPosition * speed;
      element.style.transform = `translateY(${offset}px)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return ref;
}
