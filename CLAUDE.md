# CLAUDE.md

## Project Overview

**vue-router-citadel** is a TypeScript middleware system for Vue Router 4 that provides structured
navigation defense through a hierarchical outpost-based architecture. It offers type-safe route
guards with a return-based API.

**Core Metaphor**: Citadel -> Outposts (Guards) -> Final destination

**Use Cases**: RBAC systems, multi-tenant apps, complex authorization flows, data preloading
pipelines

## Key Documents

- `docs/plan.md` — roadmap and TODO priorities
- `docs/release.md` — release guide for maintainers
- `docs/guide/` — canonical docs for scopes, hooks, verdicts (do not duplicate here)

## Module Purposes (`src/`)

- `index.ts` — public API exports
- `types.ts` — type definitions, constants (`DebugPoints`, `NavigationHooks`, etc.)
- `consts.ts` — `__DEV__` flag, `LOG_PREFIX`
- `helpers.ts` — `debugPoint`, default logger factory
- `navigationCitadel.ts` — main factory, hook registration, public API
- `navigationOutposts.ts` — patrol logic, timeout/error handling
- `navigationRegistry.ts` — registry CRUD, priority sorting
- `devtools/` — Vue DevTools integration (tree-shakeable, dynamic import)

## Architecture (non-obvious)

- **Registry**: Maps for O(1) lookup, sorted arrays for iteration
- **Sorting**: Done at deploy/abandon time, not during navigation
- **Timeout**: `raceWithTimeout` wraps `Promise.race()` with `clearTimeout` in `finally` — no leaked
  timers; symbol-based detection identifies timeout errors
- **Deduplication**: Route outposts deduplicated from nested matched routes

## Conventions

- Priority: lower number = earlier execution
- Critical events (errors, timeouts, missing routes) always logged regardless of `log` option
- Debug mode adds `debugger` breakpoints via `debugHandler`

## Composite Scripts

- `check:all` = format + lint + types + tests + build + size
- `release:check` = `check:all` + `npm pack --dry-run`
- `release:publish` = `release:check` + `npm publish`
