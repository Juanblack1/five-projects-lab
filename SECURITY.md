# Security Policy

Five Projects Lab is a browser-only product lab and does not require private credentials.

## Secret rules

- Never commit `.env`, `.env.local`, tokens, API keys, private keys, service-role keys, or real customer data.
- Treat all `VITE_*` variables as public browser values.
- Use `.env.example` only for placeholders.
- Store future production secrets in a backend runtime or GitHub Actions secrets.

## Data notes

- CSV Clinic processes pasted text locally in the browser.
- Log Forge processes pasted log text locally in the browser.
- GitHub Pulse reads public GitHub activity without a token.
