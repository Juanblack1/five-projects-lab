# Five Projects Lab

Five Projects Lab is a private portfolio suite with five small, polished, working mini-products built in React and TypeScript.

## Projects

- Focus Forge: Pomodoro timer with focus and break modes.
- Budget Pulse: income and expense tracker with derived totals.
- GitHub Pulse: public GitHub activity lookup without a token.
- CSV Clinic: CSV cleaner with duplicate and missing-cell detection.
- Log Forge: log severity analyzer with safe archive-name generation.

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
