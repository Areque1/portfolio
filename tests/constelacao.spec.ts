import { test, expect, type Page } from '@playwright/test';
import { abrir } from './helpers';

/** Retrato do que está desenhado no canvas agora. */
const retrato = (page: Page) => page.locator('.constelacao').evaluate(c => (c as HTMLCanvasElement).toDataURL());

/** Pixels desenhados no canvas na posição de rolagem atual (estrelas e linhas). */
const pixelsDesenhados = (page: Page) =>
  page.locator('.constelacao').evaluate(c => {
    const tela = c as HTMLCanvasElement;
    const { data } = tela.getContext('2d')!.getImageData(0, 0, tela.width, tela.height);
    let n = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
    return n;
  });

/** Rola até a fração da página e espera o canvas redesenhar (evento de rolagem + um quadro). */
const rolarPara = (page: Page, fracao: number) =>
  page.evaluate(
    f =>
      new Promise(pronto => {
        addEventListener('scroll', () => requestAnimationFrame(() => requestAnimationFrame(pronto)), { once: true });
        scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f);
      }),
    fracao,
  );

test('as estrelas se movem sozinhas', async ({ page }) => {
  await abrir(page);
  const antes = await retrato(page);
  await expect.poll(() => retrato(page)).not.toBe(antes);
});

test('não desenha nada na impressão', async ({ page }) => {
  await abrir(page);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.constelacao')).toBeHidden();
});

// Os testes abaixo medem posições e pixels; sem movimento, o canvas fica estável.
test.describe('com "reduzir movimento" ligado', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('a constelação cobre a janela, atrás do conteúdo e escondida do leitor de tela', async ({ page }) => {
    await abrir(page);
    const tela = page.locator('.constelacao');
    await expect(tela).toHaveAttribute('aria-hidden', 'true');
    await expect(tela).toHaveCSS('pointer-events', 'none');
    await expect(tela).toHaveCSS('position', 'fixed');

    const caixa = (await tela.boundingBox())!;
    const janela = await page.evaluate(() => ({ w: document.documentElement.clientWidth, h: innerHeight }));
    expect(caixa.x).toBe(0);
    expect(caixa.y).toBe(0);
    expect(caixa.width).toBe(janela.w);
    expect(caixa.height).toBe(janela.h);

    // O conteúdo continua por cima e clicável, do topo ao rodapé: no meio de cada alvo,
    // o que está na frente é o próprio alvo (ou o item que o contém), nunca o canvas.
    for (const alvo of ['.name', '.links .btn-primary', '.courses a', '.big-mail']) {
      const el = page.locator(alvo).first();
      await el.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
      const b = (await el.boundingBox())!;
      const naFrente = await el.evaluate(
        (e, [x, y]) => {
          const h = document.elementFromPoint(x, y);
          return !!h && !h.matches('.constelacao') && (e.contains(h) || h.contains(e));
        },
        [b.x + b.width / 2, b.y + b.height / 2],
      );
      expect(naFrente, alvo).toBe(true);
    }
  });

  test('as estrelas ficam paradas', async ({ page }) => {
    await abrir(page);
    const antes = await retrato(page);
    await page.waitForTimeout(400);
    expect(await retrato(page)).toBe(antes);
  });

  test('as estrelas se espalham pelo site, cada vez mais ralas até o rodapé', async ({ page }) => {
    await abrir(page);
    const topo = await pixelsDesenhados(page);
    await rolarPara(page, 0.5);
    const meio = await pixelsDesenhados(page);
    await rolarPara(page, 1);
    const fim = await pixelsDesenhados(page);
    expect(meio + fim, 'nenhuma estrela abaixo do topo').toBeGreaterThan(0);
    expect(topo).toBeGreaterThan(meio);
    expect(topo).toBeGreaterThan(fim * 2);
  });

  test('o canvas acompanha a janela quando só a altura muda, sem esticar o desenho', async ({ page }) => {
    await abrir(page);
    const proporcao = () =>
      page.locator('.constelacao').evaluate(c => {
        const tela = c as HTMLCanvasElement;
        return tela.width / tela.clientWidth - tela.height / tela.clientHeight;
      });
    await page.setViewportSize({ width: page.viewportSize()!.width, height: 500 });
    await expect.poll(proporcao).toBeCloseTo(0, 2);
    await page.setViewportSize({ width: page.viewportSize()!.width, height: 1100 });
    await expect.poll(proporcao).toBeCloseTo(0, 2);
  });

  test('o ponteiro ainda liga as estrelas próximas', async ({ page }) => {
    await abrir(page);
    const antes = await retrato(page);
    const topo = (await page.locator('.hero').boundingBox())!;
    await page.mouse.move(topo.x + topo.width / 2, topo.y + 120);
    await expect.poll(() => retrato(page)).not.toBe(antes);
  });
});
