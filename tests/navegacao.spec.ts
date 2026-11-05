import { test, expect } from '@playwright/test';
import { abrir } from './helpers';

for (const secao of ['experiencia', 'competencias', 'formacao', 'contato']) {
  test(`o menu leva à seção #${secao}`, async ({ page }) => {
    await abrir(page);
    await page.locator(`.topbar nav a[href="#${secao}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#${secao}$`));
    // A rolagem é suave: espera ela parar com a seção logo abaixo da barra fixa do topo
    // (scroll-margin-top) ou com a página no fim.
    await expect
      .poll(() =>
        page.evaluate(id => {
          const alvo = document.getElementById(id)!;
          const topo = alvo.getBoundingClientRect().top;
          const margem = parseFloat(getComputedStyle(alvo).scrollMarginTop) || 0;
          const noFim = Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2;
          return Math.abs(topo - margem) < 5 || noFim;
        }, secao),
      )
      .toBe(true);
    await expect(page.locator(`#${secao}`)).toBeInViewport();
    // O título da seção não fica escondido atrás da barra fixa.
    const barra = await page.locator('.topbar').boundingBox();
    const titulo = await page.locator(`#${secao} h2`).boundingBox();
    expect(titulo!.y).toBeGreaterThanOrEqual(Math.max(0, barra!.y + barra!.height));
    await expect(page.locator(`.topbar nav a[href="#${secao}"]`)).toHaveClass(/is-active/);
  });
}

test('toda âncora interna aponta para um id que existe', async ({ page }) => {
  await abrir(page);
  const quebradas = await page.evaluate(() =>
    [...document.querySelectorAll('a[href^="#"]')]
      .map(a => a.getAttribute('href')!.slice(1))
      .filter(id => id && !document.getElementById(id)),
  );
  expect(quebradas).toEqual([]);
});

test('os ids são únicos', async ({ page }) => {
  await abrir(page);
  const repetidos = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
    return ids.filter((id, i) => ids.indexOf(id) !== i);
  });
  expect(repetidos).toEqual([]);
});

test('links que abrem em nova aba usam rel="noopener"', async ({ page }) => {
  await abrir(page);
  const semRel = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')]
      .filter(a => !a.rel.includes('noopener'))
      .map(a => a.href),
  );
  expect(semRel).toEqual([]);
});

test('os links de contato apontam para o e-mail, LinkedIn e GitHub certos', async ({ page }) => {
  await abrir(page);
  const emails = await page.locator('a[href^="mailto:"]').evaluateAll(as => as.map(a => a.getAttribute('href')));
  expect(emails.length).toBeGreaterThan(0);
  expect(new Set(emails)).toEqual(new Set(['mailto:lucasareque@gmail.com']));
  await expect(page.locator('a[href="https://www.linkedin.com/in/lucas-areque"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://github.com/Areque1"]').first()).toBeVisible();
});

test('o rodapé tem ícones de GitHub, LinkedIn e e-mail com nome acessível', async ({ page }) => {
  await abrir(page);
  const rodape = page.locator('#contato');
  const esperados = {
    GitHub: 'https://github.com/Areque1',
    LinkedIn: 'https://www.linkedin.com/in/lucas-areque',
    'E-mail': 'mailto:lucasareque@gmail.com',
  };
  for (const [nome, destino] of Object.entries(esperados)) {
    const link = rodape.getByRole('link', { name: nome, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', destino);
    const caixa = await link.boundingBox();
    // Área de clique confortável no celular (WCAG 2.5.8 pede ao menos 24px).
    expect(caixa!.width).toBeGreaterThanOrEqual(44);
    expect(caixa!.height).toBeGreaterThanOrEqual(44);
  }
  // O primeiro ícone alinha com o texto do rodapé.
  const icone = await rodape.locator('.social svg').first().boundingBox();
  const titulo = await rodape.locator('h2').boundingBox();
  expect(Math.abs(icone!.x - titulo!.x)).toBeLessThan(2);
});
