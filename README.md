# Five Projects Lab

Five Projects Lab is a private portfolio suite with five polished, working mini-products built in React and TypeScript. The interface supports English and Brazilian Portuguese with a persistent language switch.

## Projects

- Focus Forge: Pomodoro timer with focus and break modes, editable checklist, sprint intent and session counter.
- Budget Pulse: income and expense tracker with derived totals, savings rate, category mix and removable entries.
- GitHub Pulse: public GitHub activity lookup without a token, loading/error states, profile card and event timeline.
- CSV Clinic: CSV cleaner with duplicate and missing-cell detection, preview table, copy action and CSV download.
- Log Forge: log severity analyzer with filters, risk level, safe archive-name generation and copyable summary.

## Interface

- Language switch: PT-BR and EN.
- Responsive product layout for desktop and mobile.
- Keyboard-visible focus states and reduced-motion support.
- No client-side secrets required.

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

The app does not require secrets. Copy `.env.example` only if you want to customize public labels.

Important: every `VITE_*` value is exposed to the browser. Do not put API keys, tokens, database URLs, service-role keys, private keys, or credentials in `VITE_*` variables.

## Security

- `.env` and `.env.*` are ignored by Git.
- `.env.example` contains placeholders only.
- GitHub Pulse uses public unauthenticated GitHub endpoints.
- Future private integrations should use a backend or GitHub Actions secrets.

## License

MIT
