// Barra do topo: borda ao rolar e link da seção atual destacado no menu.
(() => {
  const barra = document.querySelector('.topbar');
  const marcar = () => barra.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', marcar, { passive: true });
  marcar();

  const links = new Map([...barra.querySelectorAll('nav a')].map(a => [a.hash.slice(1), a]));
  const ids = [...links.keys()];
  const visiveis = new Set();
  const destacar = () => {
    // No fim da página a última seção pode não chegar à faixa do meio da tela.
    const noFim = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
    const atual = noFim ? ids.at(-1) : ids.filter(id => visiveis.has(id)).pop();
    links.forEach((a, id) => a.classList.toggle('is-active', id === atual));
  };
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(e => (e.isIntersecting ? visiveis.add(e.target.id) : visiveis.delete(e.target.id)));
    destacar();
  }, { rootMargin: '-35% 0px -60% 0px' });
  ids.forEach(id => observador.observe(document.getElementById(id)));
  addEventListener('scroll', destacar, { passive: true });
})();
