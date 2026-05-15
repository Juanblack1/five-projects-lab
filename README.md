# Five Projects Lab

Five Projects Lab is a product lab with five polished, working mini-products built in React and TypeScript. The interface supports English and Brazilian Portuguese with a persistent language switch.

## Entry page

The app opens with a bilingual product entrance for Laboratorio de Cinco Projetos / Five Projects Lab. It explains the lab, previews the active flow, shows all five modules and lets the user jump directly into any project.

## Projects

- Focus Forge: Pomodoro timer with custom focus/break durations, presets, editable checklist, sprint intent, session counter, distraction log and sprint report.
- Budget Pulse: income and expense tracker with goals, category limits, filters, derived totals, savings rate, category mix and removable entries.
- GitHub Pulse: public GitHub activity lookup without a token, loading/error states, profile card, event distribution, repository cards and language summary.
- CSV Clinic: CSV cleaner with duplicate and missing-cell detection, row filtering, find/replace, header normalization, column profile, copy action and CSV download.
- Log Forge: log severity analyzer with search, severity distribution, signal detection, risk level, safe archive-name generation and incident export.

## Interface

- Language switch: PT-BR and EN.
- Each project has a distinct visual treatment for its domain: focus cockpit, finance ledger, API console, spreadsheet lab and ops command center.
- Project hashes select the active module: `#focus`, `#budget`, `#github`, `#csv` and `#logs`.
- Responsive product layout for desktop and mobile.
- Modern motion layer with entrance, panel, hover and progress animations.
- Keyboard-visible focus states and reduced-motion support.
- No client-side secrets required.

## Architecture

The codebase is organized around the five fixed modules of the suite. See [`docs/architecture.md`](docs/architecture.md) for the folder responsibilities and evolution rules.

## Stack

- React 19
- TypeScript
- Vite
- Vitest
- ESLint

## Getting started

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run test
npm run build
npm run check
```

## Environment variables

The app does not require secrets.

Important: every `VITE_*` value is exposed to the browser. Do not put API keys, tokens, database URLs, service-role keys, private keys, or credentials in `VITE_*` variables.

## Security

- `.env` and `.env.*` are ignored by Git.
- `.env.example` contains placeholders only.
- GitHub Pulse uses public unauthenticated GitHub endpoints.
- Future private integrations should use a backend or GitHub Actions secrets.

## License

MIT
