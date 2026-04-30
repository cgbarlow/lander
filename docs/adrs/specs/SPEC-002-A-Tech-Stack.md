# SPEC-002-A: Tech Stack — Build, Test, Deploy

Implements: [ADR-002](../ADR-002-Tech-Stack.md)

## Project layout

```
lander/
├── index.html                 # entry HTML, includes /src/main.js
├── src/                       # ES module source (no transpile)
├── test/                      # Vitest specs (*.test.js)
├── docs/adrs/                 # decision records
├── public/                    # static assets (none currently)
├── package.json               # type: module
├── vite.config.js             # minimal — root + base + build target
└── .gitignore
```

## Tooling versions (verified 2026-04-30)

| Package | Version | Role |
|---|---|---|
| `vite` | 8.0.10 | dev server + production bundler |
| `vitest` | 4.1.5 | test runner |
| `jsdom` | 29.1.0 | DOM env for tests that touch `document` |

Update procedure: re-run `npm view <pkg> version` before `npm install`; record the verified date in the commit message.

## NPM scripts

| Script | Effect |
|---|---|
| `npm run dev` | Vite dev server on :5173 with HMR |
| `npm run build` | Production bundle to `dist/` |
| `npm run preview` | Serve `dist/` for smoke testing |
| `npm test` | Run Vitest in CI mode |
| `npm run test:watch` | Vitest in watch mode |

## Acceptance criteria

- [ ] `npm install` succeeds on Node 20+
- [ ] `npm test` exits 0 with no failures
- [ ] `npm run build` produces a `dist/` < 200KB total
- [ ] `npm run preview` serves a working game at `http://localhost:4173`

## Notes

No transpilation — the source `.js` files are what runs in the browser. JSDoc comments are encouraged on public functions but not enforced.
