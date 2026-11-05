import { test, expect } from '@playwright/test';
import { LARGURAS, abrir, elementosForaDaTela } from './helpers';

test.use({ contextOptions: { reducedMotion: 'reduce' } });

for (const largura of LARGURAS) {
  test.describe(`tela de ${largura}px`, () => {
    test.use({ viewport: { width: largura, height: 900 } });

    test('não tem rolagem horizontal', async ({ page }) => {
      await abrir(page);
      const { scroll, tela } = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        tela: document.documentElement.clientWidth,
      }));
      expect(scroll).toBeLessThanOrEqual(tela);
      expect(await elementosForaDaTela(page)).toEqual([]);
    });

    test('o menu não fica por cima do nome', async ({ page }) => {
      await abrir(page);
      const menu = await page.locator('.topbar nav').boundingBox();
      const nome = await page.locator('.name').boundingBox();
      expect(menu!.y + menu!.height).toBeLessThanOrEqual(nome!.y);
    });

    test('nenhum nome de teste do terminal quebra no meio', async ({ page }) => {
      await abrir(page);
      const quebrados = await page.evaluate(() => {
        const pre = document.querySelector('.term pre')!;
        const altura = parseFloat(getComputedStyle(pre).lineHeight);
        return [...document.querySelectorAll('.term .ln b')]
          .filter(b => Math.round(b.getBoundingClientRect().height / altura) > 1)
          .map(b => b.textContent);
      });
      expect(quebrados).toEqual([]);
      expect(await page.locator('.term .summary').evaluate(el => el.getClientRects().length)).toBe(1);
    });
  });
}

test('carrega sem erros de console nem de rede', async ({ page }) => {
  const erros: string[] = [];
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', e => erros.push(String(e)));
  page.on('requestfailed', r => erros.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response', r => { if (r.status() >= 400) erros.push(`${r.status()} ${r.url()}`); });
  await abrir(page);
  expect(erros).toEqual([]);
});

test('carrega as fontes Archivo e IBM Plex Mono', async ({ page }) => {
  await abrir(page);
  const familias = await page.evaluate(() =>
    [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')))],
  );
  expect(familias).toEqual(expect.arrayContaining(['Archivo', 'IBM Plex Mono']));
});
