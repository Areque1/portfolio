import { test, expect } from '@playwright/test';
import { abrir } from './helpers';

test('declara uma política de segurança de conteúdo restritiva', async ({ page }) => {
  await abrir(page);
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).not.toBeNull();
  for (const diretiva of ["default-src 'self'", "script-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'none'"]) {
    expect(csp, diretiva).toContain(diretiva);
  }
  // Script só do próprio site: nada de inline nem eval liberados.
  expect(csp).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/);
});

test('carrega e rola a página sem violar a política de segurança', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { violacoes: string[] }).violacoes = [];
    document.addEventListener('securitypolicyviolation', e =>
      (window as unknown as { violacoes: string[] }).violacoes.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  await abrir(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as unknown as { violacoes: string[] }).violacoes)).toEqual([]);
});

test('bloqueia script inline injetado na página', async ({ page }) => {
  await abrir(page);
  const executou = await page.evaluate(() => {
    const s = document.createElement('script');
    s.textContent = 'window.injetado = true;';
    document.body.append(s);
    return (window as unknown as { injetado?: boolean }).injetado === true;
  });
  expect(executou).toBe(false);
});

test('não faz requisições a outros domínios', async ({ page }) => {
  const externas: string[] = [];
  page.on('request', r => {
    const url = new URL(r.url());
    if (url.protocol.startsWith('http') && url.hostname !== '127.0.0.1') externas.push(r.url());
  });
  await abrir(page);
  expect(externas).toEqual([]);
});
