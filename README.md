# Five Projects Lab

Five Projects Lab e uma suite interativa com cinco mini-produtos prontos para uso, feita em React, TypeScript e Vite. A proposta e mostrar diferentes fluxos de produto em uma unica experiencia: produtividade, financas, GitHub, tratamento de CSV e analise de logs.

[Acessar demo publica](https://juanblack1.github.io/five-projects-lab/) · [Ver repositorio](https://github.com/Juanblack1/five-projects-lab)

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=06131d)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-tested-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

## Destaques

- Cinco produtos funcionando dentro da mesma interface.
- Entrada bilingue em PT-BR e EN, com idioma persistente.
- Tema claro/escuro e visual proprio para cada modulo.
- Layout responsivo para desktop e mobile.
- Navegacao por hash: `#focus`, `#budget`, `#github`, `#csv` e `#logs`.
- Estados de foco visiveis, suporte a `prefers-reduced-motion` e sem segredos no cliente.

## Produtos

| Produto | O que faz | Ideal para testar |
| --- | --- | --- |
| Focus Rhythm | Timer Pomodoro com presets, checklist, distracoes, intencao de sprint e relatorio. | Estado local, timers e UX de produtividade. |
| Money Compass | Controle de receitas/despesas com metas, limites, filtros e resumo por categoria. | Formularios, validacao e dados derivados. |
| GitHub Radar | Consulta perfil, repositorios e atividade publica do GitHub sem token. | Fetch, estados de API, erros e rate limit. |
| CSV Triage | Limpa CSV colado ou enviado, detecta duplicados/campos vazios e exporta resultado. | Parsing, qualidade de dados e download. |
| Log Sentinel | Analisa severidade de logs, sinais de risco e gera relatorio de incidente. | Processamento de texto e ferramentas de ops. |

## Experiencia

O app abre com uma pagina de apresentacao do Laboratorio de Cinco Projetos / Five Projects Lab. A partir dela, a pessoa pode entrar direto em qualquer modulo e alternar entre idioma, tema e produtos sem precisar recarregar a pagina.

Cada modulo tem uma identidade visual propria: cockpit de foco, ledger financeiro, console de API, laboratorio de planilhas e command center de operacoes.

## Stack

- React 19
- TypeScript
- Vite 8
- Vitest
- ESLint
- Tailwind CSS 4 via Vite plugin

## Rodando localmente

```bash
npm install
npm run dev
```

O servidor local do Vite normalmente fica disponivel em `http://localhost:5173/`.

## Scripts

```bash
npm run dev      # inicia o ambiente local
npm run lint     # valida padroes de codigo
npm run test     # executa testes com Vitest
npm run build    # gera a versao de producao
npm run check    # roda lint, test e build em sequencia
```

## Deploy

Este repositorio publica automaticamente no GitHub Pages quando ha push na branch `main`.

- Link publico: https://juanblack1.github.io/five-projects-lab/
- Workflow: `.github/workflows/deploy.yml`
- Build: `npm run build`
- Pasta publicada: `dist`

Para Vercel, importe o repositorio pelo painel da Vercel e mantenha os defaults de Vite:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

## Arquitetura

A codebase e organizada em cinco modulos fixos da suite. Consulte [`docs/architecture.md`](docs/architecture.md) para ver responsabilidades de pastas, regras de evolucao e proximos passos recomendados.

## Variaveis de ambiente

O app nao precisa de credenciais privadas.

Importante: todo valor `VITE_*` e exposto no navegador. Nao coloque API keys, tokens, URLs privadas, service-role keys, chaves privadas ou credenciais em variaveis `VITE_*`.

## Seguranca

- `.env` e `.env.*` sao ignorados pelo Git.
- `.env.example` contem apenas instrucoes e placeholders.
- GitHub Radar usa endpoints publicos e nao autenticados do GitHub.
- Integracoes privadas futuras devem usar backend, secrets da Vercel ou GitHub Actions secrets.

## Licenca

MIT
