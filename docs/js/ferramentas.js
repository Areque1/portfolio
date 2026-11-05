// Faixa de ferramentas em movimento contínuo. Sem JavaScript, ou com
// "reduzir movimento" ligado, a lista fica parada e completa.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const MIN_LARGURA = 1200; // maior que a faixa em qualquer tela
  const VELOCIDADE = 40; // px por segundo
  document.querySelectorAll('.marquee').forEach(faixa => {
    const lista = faixa.querySelector('.track');
    const itens = [...lista.children];
    faixa.classList.add('is-moving');
    while (lista.scrollWidth < MIN_LARGURA) {
      itens.forEach(item => {
        const copia = item.cloneNode(true);
        copia.setAttribute('aria-hidden', 'true');
        lista.append(copia);
      });
    }
    const segunda = lista.cloneNode(true);
    segunda.setAttribute('aria-hidden', 'true');
    faixa.append(segunda);
    faixa.style.setProperty('--dur', `${lista.scrollWidth / VELOCIDADE}s`);
  });
})();
