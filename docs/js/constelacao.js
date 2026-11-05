// Constelação interativa no fundo do site: estrelas que se ligam quando estão
// perto umas das outras e do ponteiro. Densa no topo, cada vez mais rala até o
// rodapé. O canvas fica fixo na tela e só desenha as estrelas à vista. Sem
// JavaScript, o fundo fica liso; com "reduzir movimento", as estrelas ficam
// paradas e só as linhas do ponteiro reagem.
(() => {
  const tela = document.querySelector('.constelacao');
  const topo = document.querySelector('.hero');
  const ctx = tela.getContext('2d');
  if (!ctx) return;

  const parado = matchMedia('(prefers-reduced-motion: reduce)');
  const LIGA = 130;          // distância máxima entre duas estrelas ligadas, em px
  const ALCANCE = 170;       // raio de ação do ponteiro, em px
  const DENSIDADE = 11000;   // px² de página por estrela, no topo
  const FAIXA = 80;          // altura de cada faixa da página ao sortear as estrelas
  const ponteiro = { x: 0, y: 0, ativo: false };   // em coordenadas da janela
  let w = 0, vh = 0, estrelas = [], cores = {}, quadro = 0, t = 0, molde = '';

  // Sorteio com semente fixa (mulberry32): redistribuir com o mesmo tamanho de
  // página devolve as mesmas estrelas, sem saltos quando a página se ajusta.
  const SEMENTE = (Math.random() * 2 ** 32) >>> 0;
  let estado = SEMENTE;
  const sortear = () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let z = estado;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 2 ** 32;
  };

  const rgb = hex => {
    const n = parseInt(hex.trim().slice(1), 16);
    return `${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}`;
  };
  const lerCores = () => {
    const cs = getComputedStyle(document.documentElement);
    cores = { tinta: rgb(cs.getPropertyValue('--ink')), destaque: rgb(cs.getPropertyValue('--pass')) };
  };

  // Fração da densidade do topo em cada altura da página: 100% no topo,
  // ~40% logo abaixo dele, caindo até ~5% no rodapé.
  const densidade = (y, fimTopo, total) => {
    if (y < fimTopo) return 1;
    const u = Math.min(1, (y - fimTopo) / Math.max(1, total - fimTopo));
    return 0.4 * (1 - u) ** 1.6 + 0.05;
  };

  const espalhar = () => {
    const total = document.documentElement.scrollHeight;
    const fimTopo = Math.round(topo.getBoundingClientRect().bottom + scrollY);
    // Só redistribui quando a largura ou a altura da página mudam de fato.
    const novoMolde = `${w}x${total}x${fimTopo}`;
    if (novoMolde === molde) return;
    molde = novoMolde;
    estado = SEMENTE;
    estrelas = [];
    for (let y0 = 0; y0 < total; y0 += FAIXA) {
      const esperado = (w * FAIXA * densidade(y0, fimTopo, total)) / DENSIDADE;
      const n = Math.floor(esperado) + (sortear() < esperado % 1 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        estrelas.push({
          cx: sortear() * w,          // posição de origem na página
          cy: y0 + sortear() * FAIXA,
          ax: 12 + sortear() * 30,    // amplitude e ritmo da flutuação
          ay: 12 + sortear() * 30,
          fx: 0.15 + sortear() * 0.3,
          fy: 0.15 + sortear() * 0.3,
          fase: sortear() * Math.PI * 2,
          px: 0, py: 0,                   // empurrão do ponteiro, que volta a zero
          r: sortear() * 1.3 + 0.7,
          verde: sortear() < 0.14,
          x: 0, y: 0,
        });
      }
    }
    posicionar();
  };

  const medir = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const novaLargura = tela.clientWidth;
    vh = tela.clientHeight;
    tela.width = Math.round(novaLargura * dpr);
    tela.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = novaLargura;
    espalhar();
    desenhar();
  };

  // Posição de cada estrela na página: origem + flutuação + empurrão.
  const posicionar = () => {
    const anda = !parado.matches;
    for (const e of estrelas) {
      e.x = e.cx + e.px + (anda ? Math.sin(t * e.fx + e.fase) * e.ax : 0);
      e.y = e.cy + e.py + (anda ? Math.cos(t * e.fy + e.fase) * e.ay : 0);
    }
  };

  const empurrar = () => {
    const mx = ponteiro.x, my = ponteiro.y + scrollY;
    for (const e of estrelas) {
      if (ponteiro.ativo) {
        const dx = e.x - mx, dy = e.y - my, d = Math.hypot(dx, dy);
        if (d > 0.1 && d < ALCANCE) {
          const forca = (1 - d / ALCANCE) * 1.6;
          e.px += (dx / d) * forca;
          e.py += (dy / d) * forca;
        }
      }
      e.px *= 0.96;
      e.py *= 0.96;
    }
  };

  const desenhar = () => {
    ctx.clearRect(0, 0, w, vh);
    const sy = scrollY;
    const vistas = estrelas.filter(e => e.y - sy > -LIGA && e.y - sy < vh + LIGA);
    ctx.lineWidth = 1;
    for (let i = 0; i < vistas.length; i++) {
      const a = vistas[i], ay = a.y - sy;
      for (let j = i + 1; j < vistas.length; j++) {
        const b = vistas[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > LIGA) continue;
        ctx.strokeStyle = `rgba(${cores.tinta}, ${(1 - d / LIGA) * 0.2})`;
        ctx.beginPath(); ctx.moveTo(a.x, ay); ctx.lineTo(b.x, b.y - sy); ctx.stroke();
      }
      if (ponteiro.ativo) {
        const d = Math.hypot(a.x - ponteiro.x, ay - ponteiro.y);
        if (d < ALCANCE) {
          ctx.strokeStyle = `rgba(${cores.destaque}, ${(1 - d / ALCANCE) * 0.55})`;
          ctx.beginPath(); ctx.moveTo(a.x, ay); ctx.lineTo(ponteiro.x, ponteiro.y); ctx.stroke();
        }
      }
    }
    for (const e of vistas) {
      ctx.fillStyle = e.verde ? `rgba(${cores.destaque}, 0.9)` : `rgba(${cores.tinta}, 0.45)`;
      ctx.beginPath(); ctx.arc(e.x, e.y - sy, e.r, 0, Math.PI * 2); ctx.fill();
    }
  };

  const loop = agora => {
    t = agora / 1000;
    empurrar();
    posicionar();
    desenhar();
    quadro = requestAnimationFrame(loop);
  };
  const iniciar = () => {
    cancelAnimationFrame(quadro);
    posicionar();
    if (parado.matches) desenhar();
    else quadro = requestAnimationFrame(loop);
  };

  const apontar = ev => {
    ponteiro.x = ev.clientX;
    ponteiro.y = ev.clientY;
    ponteiro.ativo = true;
    if (parado.matches) desenhar();
  };
  const soltar = () => {
    ponteiro.ativo = false;
    if (parado.matches) desenhar();
  };
  addEventListener('pointermove', apontar, { passive: true });
  addEventListener('pointerdown', apontar, { passive: true });
  document.documentElement.addEventListener('pointerleave', soltar);
  addEventListener('pointerup', ev => { if (ev.pointerType !== 'mouse') soltar(); });
  addEventListener('blur', soltar);
  // Parado, só redesenha quando a página rola; animado, o loop já cuida disso.
  addEventListener('scroll', () => { if (parado.matches) desenhar(); }, { passive: true });

  // Mede de novo quando a página muda de tamanho ou só a janela muda de altura
  // (como a barra de endereço do celular aparecendo e sumindo).
  let pendente = 0;
  const observador = new ResizeObserver(() => {
    cancelAnimationFrame(pendente);
    pendente = requestAnimationFrame(medir);
  });
  observador.observe(document.body);
  observador.observe(tela);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { lerCores(); desenhar(); });
  parado.addEventListener('change', iniciar);

  lerCores();
  medir();
  iniciar();
})();
