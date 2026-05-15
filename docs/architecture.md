# Arquitetura do Laboratorio de Cinco Projetos

Esta aplicacao e uma suite fixa com cinco modulos internos. Ela nao deve evoluir como uma plataforma generica para criar projetos. A arquitetura deve proteger a identidade e a autonomia de cada produto:

- Ritmo de Foco / Focus Rhythm: produtividade, Pomodoro e foco.
- Bussola Financeira / Money Compass: controle de financas pessoais.
- Radar GitHub / GitHub Radar: consumo da API publica do GitHub.
- Triagem CSV / CSV Triage: limpeza, analise e tratamento de CSV.
- Sentinela de Logs / Log Sentinel: logs, operacoes e monitoramento.

## Organizacao Atual

```txt
src/
  App.tsx
  App.css
  hooks/
    useLanguagePreference.ts
    useProjectRoute.ts
  i18n/
    copy.ts
  layout/
    IntroPage.tsx
    ProjectBrief.tsx
    Sidebar.tsx
    SuiteHeader.tsx
    SuiteMetrics.tsx
  modules/
    budget/
      BudgetModule.tsx
      budgetModel.ts
      useBudgetModule.ts
    csv/
      CsvModule.tsx
      csvModel.ts
      useCsvModule.ts
    focus/
      FocusModule.tsx
      focusModel.ts
      useFocusModule.ts
    github/
      GithubModule.tsx
      githubTypes.ts
      useGithubModule.ts
    logs/
      LogsModule.tsx
      logModel.ts
      useLogsModule.ts
  services/
    fileDownload.ts
    githubApi.ts
  shared/
    components/
      LanguageSwitch.tsx
    types.ts
  utils/
    formatters.ts
    ids.ts
  suiteData.ts
  suiteData.test.ts
```

## Responsabilidades

`App.tsx` continua como orquestrador da suite. Ele escolhe o modulo ativo, liga os hooks de cada produto aos componentes visuais e preserva o comportamento atual.

`i18n/` contem a copy bilingue da suite. Textos de produto, shell, entrada e modulos ficam fora do orquestrador principal.

`layout/` contem estrutura de experiencia da suite: pagina inicial, sidebar, navegacao, cabecalho, metricas globais e resumo do modulo ativo. Essas pecas nao devem conter regra especifica de um modulo.

`shared/` contem componentes e tipos reutilizaveis e neutros, como o seletor de idioma e estados comuns de copia.

`hooks/` contem estado transversal da aplicacao. `useLanguagePreference` cuida de idioma, persistencia e `document.lang`. `useProjectRoute` cuida do hash, modulo ativo e scroll para o laboratorio.

`modules/` contem as telas, configuracoes, hooks, tipos e modelos de cada produto. Cada modulo tem um ponto de entrada visual proprio, como `FocusModule.tsx`, e um hook de estado, como `useFocusModule.ts`, para poder evoluir sem alterar a estrutura visual dos outros modulos.

`services/` contem integracoes externas ou APIs do navegador. GitHub fica em `githubApi.ts`; download de arquivos fica em `fileDownload.ts`.

`utils/` contem funcoes puras e sem dependencia de UI, como formatacao de timer, nomes de eventos e geracao de ids.

`suiteData.ts` concentra dados e calculos puros compartilhados pela suite. Helpers testaveis permanecem cobertos por `suiteData.test.ts`.

## Como Evoluir Cada Modulo

Novas funcionalidades devem entrar primeiro na pasta do modulo correspondente:

```txt
src/modules/focus/
  focusModel.ts
  FocusModule.tsx
  useFocusModule.ts
  focusUtils.ts
  focus.test.ts
```

Use o mesmo padrao para `budget`, `github`, `csv` e `logs`. Isso evita que o `App.tsx` volte a virar um arquivo com todas as regras de negocio.

## Regras de Evolucao

- Preserve os cinco modulos fixos da suite.
- Nao introduza abstracoes de "criador de projetos".
- Mantenha regra de negocio fora de componentes visuais quando ela puder ser testada como funcao pura.
- Coloque fetch, clipboard, download e browser APIs em `services/`.
- Coloque estado reutilizavel ou transversal em `hooks/`.
- Coloque UI compartilhada em `shared/components/`.
- Coloque UI especifica do produto em `modules/<module>/`.
- Reaproveite componentes compartilhados apenas quando eles forem realmente neutros.
- Adicione testes perto da regra de negocio alterada.

## Proximo Passo Recomendado

O proximo corte natural e criar testes especificos para os hooks ou utilitarios de cada modulo quando uma nova regra de negocio for adicionada. O `App.tsx` nao deve voltar a receber estado interno detalhado dos produtos.
