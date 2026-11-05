import type { Page } from '@playwright/test';

/** Larguras de tela cobertas: celulares pequenos, tablet, notebook e monitor. */
export const LARGURAS = [320, 360, 390, 768, 1024, 1366, 1920];

/** Abre o site já com a animação do terminal concluída ou desligada. */
export async function abrir(page: Page) {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Elementos que passam da borda da tela. Ficam de fora o terminal, que rola por dentro,
 * e a faixa de ferramentas em movimento, que esconde o excesso de propósito.
 */
export function elementosForaDaTela(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const fora: string[] = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.term pre, .marquee.is-moving')) continue;
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > vw + 1 || r.left < -1)) {
        fora.push(`${el.tagName.toLowerCase()}.${el.className} [${Math.round(r.left)}..${Math.round(r.right)}]`);
      }
    }
    return fora;
  });
}

/** Textos visíveis abaixo do contraste mínimo da WCAG AA (4.5:1, ou 3:1 em texto grande). */
export function textosComContrasteBaixo(page: Page) {
  return page.evaluate(() => {
    type Cor = { r: number; g: number; b: number; a: number };
    const parse = (c: string): Cor => {
      const m = (c.match(/[\d.]+/g) ?? []).map(Number);
      return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 };
    };
    const lum = ({ r, g, b }: Cor) => {
      const f = (v: number) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const fundo = (el: Element | null): Cor => {
      for (let e = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c.a > 0.5) return c;
      }
      return parse(getComputedStyle(document.body).backgroundColor);
    };

    const ruins: string[] = [];
    for (const el of document.querySelectorAll('body *')) {
      const temTexto = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent?.trim());
      if (!temTexto || el.closest('.skip')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const l1 = lum(parse(cs.color));
      const l2 = lum(fundo(el));
      const razao = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const tamanho = parseFloat(cs.fontSize);
      const grande = tamanho >= 24 || (tamanho >= 18.66 && Number(cs.fontWeight) >= 700);
      const minimo = grande ? 3 : 4.5;
      if (razao < minimo) {
        ruins.push(`"${el.textContent?.trim().slice(0, 30)}" ${razao.toFixed(2)}:1 (mínimo ${minimo})`);
      }
    }
    return ruins;
  });
}
