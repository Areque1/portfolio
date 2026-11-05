import { test, expect } from '@playwright/test';
import { abrir } from './helpers';

// Depende da internet e de sites de terceiros, por isso fica fora do `npm test`.
// Rode com `npm run test:links`. O LinkedIn recusa qualquer acesso automático (HTTP 999)
// e não entra na verificação; a Udemy às vezes também recusa, e aí vira aviso.
test('os links de certificado abrem o curso certo @externo', async ({ page, request }) => {
  await abrir(page);
  const certificados = await page.locator('.courses a').evaluateAll(as =>
    as.map(a => ({ curso: a.textContent!.trim(), url: (a as HTMLAnchorElement).href })),
  );
  expect(certificados.length).toBeGreaterThan(0);

  for (const { curso, url } of certificados) {
    await test.step(curso, async () => {
      const resposta = await request.get(url);
      // A Udemy responde 403 a clientes automáticos (proteção anti-robô). Nesse caso o link
      // vira um aviso no relatório, para ser conferido à mão, em vez de uma falha.
      if (url.includes('udemy.com') && resposta.status() === 403) {
        test.info().annotations.push({ type: 'aviso', description: `conferir à mão: ${url}` });
        return;
      }
      expect(resposta.status(), url).toBe(200);
      if (url.includes('alura.com.br')) {
        expect(await resposta.text(), url).toContain('LUCAS GOMES GUIMARAES AREQUE');
      }
    });
  }
});
