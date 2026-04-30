# ADR-002: Tech Stack — Pure JavaScript + Vite + Canvas 2D + Vitest

- **Status**: Accepted
- **Date**: 2026-04-30
- **Supersedes**: —
- **Superseded by**: —
- **Dependencies**: ADR-001

## Why (the problem)

We are building a faithful browser recreation of the 1987 Acorn Archimedes game *Lander*. The product must:

- Run **entirely client-side** as a static site (no backend)
- Look and feel like the original (~1500 filled triangles per frame at 50 fps)
- Allow **fast feel-tuning iteration** (damping, sensitivity, camera angle will all need many tweaks against video reference)
- Comply with `protocols.md` — TDD, latest stable deps, DRY, production-ready

We need a stack that minimises ceremony and download size while being expressive enough for vector/matrix maths and a software 3D pipeline.

## Why not (rejected alternatives)

- **TypeScript** — types catch bugs in 3D math, but adds a build step, `tsconfig`, and a transpile cycle. For a one-shot ~2k-line codebase the extra ceremony outweighs the benefit. JSDoc comments cover the readability gap.
- **Rust + WASM (any rendering target)** — strong perf and types, but ~500KB–1.5MB bundle, slow `cargo build` cycle, harder browser debugging, and the game is nowhere near CPU-bound. Unused headroom.
- **Python (Pyodide / PyScript)** — Python doesn't run natively in browsers. Pyodide adds 5–10MB runtime + 1–3s cold start; calling Canvas from Python at 60fps is marginal. Contradicts "small, fast, browser-native".
- **WebGL** — overkill for ~1500 tris/frame; adds shader complexity. Canvas 2D matches the original's painter-fill rendering model more directly. Will reconsider if profiling shows Canvas can't sustain frame rate.
- **No build step at all** (just static files) — viable, but Vite gives us minification for production and fast HMR for dev with zero config; cost is one devDep.
- **Jest** for testing — heavier than Vitest, slower, not Vite-native. Vitest reuses our Vite config.

## What (the decision)

| Layer | Choice | Version pinned |
|---|---|---|
| Language | **Pure JavaScript** (ES modules, `"type": "module"`) | — |
| Dev/build tool | **Vite** | latest stable verified 2026-04-30 (8.0.10) |
| Test runner | **Vitest** + jsdom | latest stable verified 2026-04-30 (Vitest 4.1.5, jsdom 29.1.0) |
| Renderer | **HTML5 Canvas 2D** | browser-native |
| Runtime deps | **None** | — |
| Type hints | **JSDoc** comments where they aid readability | — |

Internal frame buffer: render to a 320×256 canvas (original Mode 13 resolution), upscale via CSS `image-rendering: pixelated`. Guarantees the original chunky look on any monitor.

## How (consequences)

**Positive**: Zero transpile step → fast iteration. Tiny bundle (~50–80KB minified). Easy debugging (real source in DevTools). Vitest works on `.js` with no config. Stack is web-standard, contributors onboard instantly.

**Negative**: No compile-time type checking — vector/matrix bugs may show as runtime NaN. Mitigation: comprehensive Vitest unit tests on all maths modules, JSDoc hints on critical functions. Canvas 2D fill performance has a ceiling (~2k tris/frame). Mitigation: view-distance setting in `constants.js`.

**Neutral**: Constrains future choices toward the JS ecosystem; if the project grew to need shared logic across server/client we'd reconsider.
