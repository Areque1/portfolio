# Portfólio | Lucas Areque

Site estático (HTML + CSS, sem build) com meu currículo: QA, automação de testes e infraestrutura de TI.

## Estrutura

```text
docs/       o site publicado (index.html e style.css)
tests/      testes Playwright do site
package.json, playwright.config.ts, tsconfig.json, .htmlvalidate.json
            configuração dos testes
```

O site fica em `docs/` porque é uma das duas pastas que o GitHub Pages publica direto de uma branch.

## Ver localmente

Abra `docs/index.html` no navegador, ou rode:

```bash
npm run serve
```

e acesse http://localhost:8765.

## Publicar no GitHub Pages

Em **Settings → Pages**, escolha *Deploy from a branch*, branch `main`, pasta `/docs`.
O site fica em `https://areque1.github.io/portfolio/`.

## Branches

- `main`: o que está publicado. Só recebe pull request da `development`.
- `development`: integração. Recebe as branches de trabalho.
- `feat-*` e `fix-*`: saem da `development` e voltam para ela por pull request.

## Testes automatizados

O site é testado com [Playwright](https://playwright.dev) em Chromium, Firefox e WebKit.

```bash
npm ci
npx playwright install chromium firefox webkit
npm test              # testes E2E (o servidor sobe sozinho)
npm run typecheck     # checagem de tipos dos testes
npm run lint:html     # validação do HTML e de regras de acessibilidade
npm run test:links    # links dos certificados (depende da internet)
npm run report        # abre o relatório HTML da última execução
```

| Arquivo | O que verifica |
|---|---|
| `tests/layout.spec.ts` | Sem rolagem horizontal de 320px a 1920px, menu sem sobrepor o nome, terminal sem quebrar no meio, console sem erros e fontes carregadas |
| `tests/navegacao.spec.ts` | Menu leva a cada seção, âncoras e ids válidos, `rel="noopener"` e links de contato |
| `tests/acessibilidade.spec.ts` | Idioma, hierarquia de títulos, navegação por teclado, foco visível, contraste WCAG AA nos temas claro e escuro e animação com "reduzir movimento" |
| `tests/links.spec.ts` | Cada certificado abre o curso certo, no meu nome |
