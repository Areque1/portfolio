import { test, expect, type Page } from '@playwright/test';
import { abrir } from './helpers';

const TOTAL_FERRAMENTAS = 24; // 18 no trabalho + 6 em cursos e estudos
const ORIGINAIS = '.tools .track:not([aria-hidden]) > li:not([aria-hidden])';

/** Deslocamento horizontal atual de cada faixa, em px. */
const posicoes = (page: Page) =>
  page.locator('.marquee .track:first-child').evaluateAll(listas =>
    listas.map(l => new DOMMatrix(getComputedStyle(l).transform).m41),
  );

test('cada ferramenta tem nome e um logo que carrega', async ({ page }) => {
  await abrir(page);
  const itens = await page.locator(ORIGINAIS).evaluateAll(lis =>
    lis.map(li => {
      const logo = li.querySelector('.logo') as HTMLElement;
      const img = logo instanceof HTMLImageElement ? logo : null;
      const r = logo.getBoundingClientRect();
      return {
        // Só o texto do item; as iniciais do quadradinho ficam de fora (aria-hidden).
        nome: [...li.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join('').trim(),
        imagem: !!img,
        carregou: img ? img.complete && img.naturalWidth > 0 : true,
        altVazio: img ? img.getAttribute('alt') === '' : true,
        visivel: r.width > 0 && r.height > 0,
      };
    }),
  );
  expect(itens).toHaveLength(TOTAL_FERRAMENTAS);
  // Zephyr, Mantis e Active Directory não têm logo livre e usam as iniciais.
  expect(itens.filter(i => !i.imagem).map(i => i.nome)).toEqual(['Zephyr', 'Mantis', 'Active Directory']);
  for (const i of itens) {
    expect(i.nome, 'item sem nome').not.toBe('');
    expect(i.visivel, `${i.nome}: logo sem tamanho`).toBe(true);
    expect(i.carregou, `${i.nome}: imagem não carregou`).toBe(true);
    // O nome já está escrito ao lado; o logo é decorativo para o leitor de tela.
    expect(i.altVazio, `${i.nome}: alt deveria ser vazio`).toBe(true);
  }
});

test.describe('com movimento', () => {
  test('as duas faixas andam, em sentidos opostos', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('.marquee.is-moving')).toHaveCount(2);
    const antes = await posicoes(page);
    await page.waitForTimeout(600);
    const depois = await posicoes(page);
    // As duas andam; a segunda roda a animação ao contrário.
    expect(Math.abs(depois[0] - antes[0])).toBeGreaterThan(5);
    expect(Math.abs(depois[1] - antes[1])).toBeGreaterThan(5);
  });

  test('cada faixa é mais larga que a área visível, sem buraco no loop', async ({ page }) => {
    await abrir(page);
    const faixas = await page.locator('.marquee').evaluateAll(ms =>
      ms.map(m => ({ lista: m.querySelector('.track')!.scrollWidth, area: m.clientWidth })),
    );
    for (const { lista, area } of faixas) expect(lista).toBeGreaterThanOrEqual(area);
  });

  test('para quando o mouse está em cima', async ({ page }) => {
    await abrir(page);
    await page.locator('.marquee').first().hover();
    // O WebKit ajusta a posição alguns px logo após pausar; espera assentar.
    let anterior = (await posicoes(page))[0];
    await expect
      .poll(async () => {
        const atual = (await posicoes(page))[0];
        const assentou = Math.abs(atual - anterior) < 0.5;
        anterior = atual;
        return assentou;
      })
      .toBe(true);
    const antes = await posicoes(page);
    await page.waitForTimeout(600);
    const depois = await posicoes(page);
    expect(depois[0]).toBeCloseTo(antes[0], 0);
  });

  test('o leitor de tela encontra cada ferramenta uma vez só', async ({ page }) => {
    await abrir(page);
    await expect(page.locator(ORIGINAIS)).toHaveCount(TOTAL_FERRAMENTAS);
    const copiasVisiveisAoLeitor = await page
      .locator('.marquee li')
      .evaluateAll(lis => lis.filter(li => !li.closest('[aria-hidden="true"]')).length);
    expect(copiasVisiveisAoLeitor).toBe(TOTAL_FERRAMENTAS);
  });

  test('não cria rolagem horizontal na página', async ({ page }) => {
    await abrir(page);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });
});

test.describe('com "reduzir movimento" ligado', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('a faixa fica parada, sem cópias, sem nada saindo pelas laterais', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('.marquee.is-moving')).toHaveCount(0);
    await expect(page.locator('.tools li')).toHaveCount(TOTAL_FERRAMENTAS);
    const foraDaTela = await page.locator('.tools li').evaluateAll(lis => {
      const largura = document.documentElement.clientWidth;
      return lis
        .filter(li => {
          const r = li.getBoundingClientRect();
          return r.left < 0 || r.right > largura;
        })
        .map(li => li.textContent!.trim());
    });
    expect(foraDaTela).toEqual([]);
  });
});

// Logos que sumiriam no fundo recebem filtro só no tema em que somem.
const FILTROS = {
  light: { Bash: 'none', C: 'brightness(0.7)', GitHub: 'none', MySQL: 'none' },
  dark: { Bash: 'invert(1)', C: 'none', GitHub: 'invert(1)', MySQL: 'brightness(1.9)' },
} as const;

for (const tema of ['light', 'dark'] as const) {
  test(`no tema ${tema === 'light' ? 'claro' : 'escuro'}, os logos que sumiriam recebem o filtro certo`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: tema });
    await abrir(page);
    const filtros = Object.fromEntries(
      await page.locator(ORIGINAIS).evaluateAll(lis =>
        lis.map(li => [
          [...li.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join('').trim(),
          getComputedStyle(li.querySelector('.logo')!).filter,
        ]),
      ),
    );
    for (const [nome, esperado] of Object.entries(FILTROS[tema])) {
      expect(filtros[nome], nome).toBe(esperado);
    }
    // Os demais logos aparecem com as cores originais.
    const outros = Object.entries(filtros).filter(([nome]) => !(nome in FILTROS[tema]));
    expect(outros.filter(([, f]) => f !== 'none')).toEqual([]);
  });
}
