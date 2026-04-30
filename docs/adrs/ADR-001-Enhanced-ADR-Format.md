# ADR-001: Enhanced ADR Format

- **Status**: Accepted
- **Date**: 2026-04-30
- **Supersedes**: —
- **Superseded by**: —
- **Dependencies**: —

## Why (the problem)

We need a consistent, durable record of architectural and significant design decisions for this project so future contributors (and future-us) can understand *why* things are the way they are without spelunking through commit history. Decisions made during planning rarely survive in code without being captured.

## Why not (rejected alternatives)

- **No ADRs / commit-message-only documentation** — rejected: commits are the wrong granularity (many commits per decision; many decisions implicit in a single commit). Hard to discover after the fact.
- **Plain Markdown design docs without structure** — rejected: inconsistent shape makes them hard to scan; no obvious supersession trail.
- **Architecture wiki (Confluence / GitHub wiki)** — rejected: lives outside the repo so drifts from the code; not versioned with the code.
- **Lightweight Nygard-style ADRs only** — close, but we want explicit *rejected alternatives* and *dependencies* sections, hence "enhanced".

## What (the decision)

All architectural, technical, and significant design decisions are captured as ADRs in `/docs/adrs/` using the **WH(Y) format** below. ADRs are immutable once accepted — supersede with a new ADR rather than editing.

### Mandatory sections

1. **Header**: status, date, supersedes/superseded-by, dependencies
2. **Why (the problem)**: the forcing function — what problem the decision solves
3. **Why not (rejected alternatives)**: each alternative with one-line rejection rationale
4. **What (the decision)**: the chosen solution, concretely
5. **How (consequences)**: positive, negative, neutral consequences

### File naming

`ADR-{number}-{Title-In-Kebab-Case}.md` — three-digit zero-padded number, then kebab title.

### Spec linkage

ADRs that have implementation details get a corresponding spec in `/docs/adrs/specs/` named `SPEC-{adr-number}-{letter}-{Title}.md`. Specs evolve with the implementation; ADRs do not.

## How (consequences)

**Positive**: Permanent decision trail; new contributors onboard faster; easy to see what's been considered and rejected.

**Negative**: Small documentation overhead per decision; risk of ADRs drifting from reality if specs aren't kept current.

**Neutral**: Sets a precedent — every meaningful decision now needs an ADR.
