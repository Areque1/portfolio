import { test, expect } from '@playwright/test';
import { abrir, textosComContrasteBaixo } from './helpers';

test('a página declara idioma e título', async ({ page }) => {
  await abrir(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page).toHaveTitle('Lucas Areque | QA e Infraestrutura');
});

test('tem um único h1 e os títulos não pulam níveis', async ({ page }) => {
  await abrir(page);
  await expect(page.locator('h1')).toHaveCount(1);
  const saltos = await page.evaluate(() => {
    const niveis = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => Number(h.tagName[1]));
    return niveis.flatMap((n, i) => (i && n > niveis[i - 1] + 1 ? [`h${niveis[i - 1]} → h${n}`] : []));
  });
  expect(saltos).toEqual([]);
});

test('todo link tem texto ou rótulo acessível', async ({ page }) => {
  await abrir(page);
  const vazios = await page.evaluate(
    () => [...document.querySelectorAll('a')].filter(a => !a.textContent?.trim() && !a.getAttribute('aria-label')).length,
  );
  expect(vazios).toBe(0);
});

test.describe('teclado', () => {
  // O Safari só navega por links com Tab quando a opção está ligada no sistema.
  test.skip(({ browserName }) => browserName === 'webkit', 'Tab não passa por links no WebKit por padrão');

  test('o primeiro Tab mostra o link "Pular para o conteúdo"', async ({ page }) => {
    await abrir(page);
    await page.keyboard.press('Tab');
    const pular = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(pular).toBeFocused();
    await expect(pular).toBeInViewport();
  });

  test('todo link mostra o contorno de foco', async ({ page }) => {
    await abrir(page);
    const total = await page.locator('a').count();
    const semContorno: string[] = [];
    for (let i = 0; i < total; i++) {
      await page.keyboard.press('Tab');
      const foco = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const cs = getComputedStyle(el);
        return { tag: el.tagName, texto: el.textContent?.trim().slice(0, 40), estilo: cs.outlineStyle, largura: cs.outlineWidth };
      });
      if (foco.tag === 'A' && (foco.estilo === 'none' || foco.largura === '0px')) semContorno.push(foco.texto ?? '');
    }
    expect(semContorno).toEqual([]);
  });
});

for (const tema of ['light', 'dark'] as const) {
  test.describe(`tema ${tema === 'light' ? 'claro' : 'escuro'}`, () => {
    test.use({ colorScheme: tema, contextOptions: { reducedMotion: 'reduce' } });

    test('todo texto passa no contraste WCAG AA', async ({ page }) => {
      await abrir(page);
      expect(await textosComContrasteBaixo(page)).toEqual([]);
    });
  });
}

test.describe('animação do terminal', () => {
  test('termina com todas as linhas visíveis', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('.term .summary')).toHaveCSS('opacity', '1', { timeout: 5000 });
    await expect(page.locator('.term em').last()).toHaveCSS('opacity', '1');
  });

  test.describe('com "reduzir movimento" ligado', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('mostra o terminal completo sem animar', async ({ page }) => {
      await abrir(page);
      const invisiveis = await page.evaluate(
        () => [...document.querySelectorAll('.term .ln, .term .ln em')].filter(e => getComputedStyle(e).opacity !== '1').length,
      );
      expect(invisiveis).toBe(0);
    });
  });
});
