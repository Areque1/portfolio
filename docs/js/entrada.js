// Seções entram com um leve deslize ao aparecer na tela.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('reveal-on');
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      observador.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.block, .contact').forEach(s => observador.observe(s));
})();
