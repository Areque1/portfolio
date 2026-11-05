import { test, expect, type Page } from '@playwright/test';
import { abrir } from './helpers';

/** Retrato do que está desenhado no canvas agora. */
const retrato = (page: Page) => page.locator('.constelacao').evaluate(c => (c as HTMLCanvasElement).toDataURL());

test('a constelação cobre o topo, atrás do conteúdo e escondida do leitor de tela', async ({ page }) => {
  await abrir(page);
  const tela = page.locator('.constelacao');
  await expect(tela).toHaveAttribute('aria-hidden', 'true');
  await expect(tela).toHaveCSS('pointer-events', 'none');

  const caixa = (await tela.boundingBox())!;
  const topo = (await page.locator('.hero').boundingBox())!;
  const largura = await page.evaluate(() => document.documentElement.clientWidth);
  expect(caixa.y).toBe(0);
  expect(caixa.width).toBe(largura);
  expect(Math.abs(caixa.y + caixa.height - (topo.y + topo.height))).toBeLessThanOrEqual(1);

  // O nome e os botões continuam por cima e clicáveis.
  for (const alvo of ['.name', '.links .btn-primary']) {
    await page.locator(alvo).scrollIntoViewIfNeeded();
    const b = (await page.locator(alvo).boundingBox())!;
    const noPonto = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest('.name, .btn')?.className ?? null,
      [b.x + b.width / 2, b.y + b.height / 2],
    );
    expect(noPonto, alvo).not.toBeNull();
  }
});

test('as estrelas se movem sozinhas', async ({ page }) => {
  await abrir(page);
  const antes = await retrato(page);
  await expect.poll(() => retrato(page)).not.toBe(antes);
});

test.describe('com "reduzir movimento" ligado', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('as estrelas ficam paradas', async ({ page }) => {
    await abrir(page);
    const antes = await retrato(page);
    await page.waitForTimeout(400);
    expect(await retrato(page)).toBe(antes);
  });

  test('o ponteiro ainda liga as estrelas próximas', async ({ page }) => {
    await abrir(page);
    const antes = await retrato(page);
    const topo = (await page.locator('.hero').boundingBox())!;
    await page.mouse.move(topo.x + topo.width / 2, topo.y + 120);
    await expect.poll(() => retrato(page)).not.toBe(antes);
  });
});

test('não desenha nada na impressão', async ({ page }) => {
  await abrir(page);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.constelacao')).toBeHidden();
});
