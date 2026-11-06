# Portfólio | Lucas Areque

Site estático (HTML, CSS e JavaScript, sem build) com meu currículo: QA, automação de testes e infraestrutura de TI.

No ar em **https://areque.com.br**.

## Estrutura

```text
docs/                    o site publicado pelo GitHub Pages
├── index.html           conteúdo da página
├── css/style.css        estilos, temas claro e escuro
├── js/
│   ├── constelacao.js   constelação interativa no fundo
│   ├── topo.js          barra do topo e seção atual no menu
│   ├── entrada.js       entrada suave das seções ao rolar
│   └── ferramentas.js   faixa animada de ferramentas
├── icons/               logos das ferramentas (créditos em CREDITOS.md)
├── fonts/               Archivo e IBM Plex Mono servidas pelo próprio site (licenças OFL)
├── img/previa.png       imagem de prévia ao compartilhar o link
├── robots.txt           regras para os buscadores
├── sitemap.xml          páginas do site para o Google Search Console
└── CNAME                domínio do GitHub Pages (areque.com.br)

tests/                   testes E2E do site (Playwright)
├── helpers.ts           funções compartilhadas pelos testes
└── *.spec.ts            um arquivo por assunto (tabela abaixo)

package.json             scripts e dependências dos testes
playwright.config.ts     navegadores e servidor local dos testes
tsconfig.json            checagem de tipos dos testes
.htmlvalidate.json       regras de validação do HTML
```

O site fica em `docs/` porque é uma das duas pastas que o GitHub Pages publica direto de uma branch.
Tudo funciona sem JavaScript; os scripts só acrescentam movimento e interação, e respeitam o
"reduzir movimento" do sistema.

## Ver localmente

Abra `docs/index.html` no navegador, ou rode:

```bash
npm run serve
```

e acesse http://localhost:8765.

## Branches e versões

- `main`: o que está publicado. Só recebe pull request da `development`.
- `development`: integração. Recebe as branches de trabalho.
- `feat-*` e `fix-*`: saem da `development` e voltam para ela por pull request.

Cada versão publicada na `main` ganha uma tag anotada (`v1.0.0`, `v1.0.1`...) com o resumo do que mudou.
Veja com `git tag -n20`.

## Testes automatizados

O site é testado com [Playwright](https://playwright.dev) em Chromium, Firefox e WebKit.

```bash
npm ci
npx playwright install chromium firefox webkit
npm run check         # tudo de uma vez: HTML, JavaScript, tipos e testes E2E
npm test              # só os testes E2E (o servidor sobe sozinho)
npm run lint:html     # validação do HTML e de regras de acessibilidade
npm run lint:js       # sintaxe dos scripts do site
npm run typecheck     # checagem de tipos dos testes
npm run test:links    # links dos certificados (depende da internet)
npm run report        # abre o relatório HTML da última execução
```

| Arquivo | O que verifica |
|---|---|
| `tests/layout.spec.ts` | Sem rolagem horizontal de 320px a 1920px, menu sem sobrepor o nome, terminal sem quebrar no meio, console sem erros e fontes carregadas |
| `tests/navegacao.spec.ts` | Menu leva a cada seção sem esconder o título atrás da barra fixa e destaca a seção atual, âncoras e ids válidos, `rel="noopener"` e links e ícones de contato |
| `tests/acessibilidade.spec.ts` | Idioma, hierarquia de títulos, navegação por teclado, foco visível, contraste WCAG AA nos temas claro e escuro e animação com "reduzir movimento" |
| `tests/ferramentas.spec.ts` | Cada ferramenta tem nome e logo, a faixa anda nos dois sentidos, para com o mouse em cima e fica parada com "reduzir movimento", e os logos recebem o filtro certo em cada tema |
| `tests/constelacao.spec.ts` | A constelação cobre a janela atrás do conteúdo sem bloquear cliques, anima, fica parada com "reduzir movimento", rareia até o rodapé, reage ao ponteiro, não estica ao mudar a altura da janela e some na impressão |
| `tests/seguranca.spec.ts` | Política de segurança de conteúdo restritiva, sem violações ao carregar, script inline injetado bloqueado e nenhuma requisição a outros domínios |
| `tests/links.spec.ts` | Cada certificado abre o curso certo, no meu nome |
