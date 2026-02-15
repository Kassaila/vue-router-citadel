# vue-router-citadel — Development Plan

---

## Done

### Infrastructure

- [x] Project structure (`src/`)
- [x] `.gitignore`, `tsconfig.json` (ES2020, ESNext, strict)
- [x] `package.json` (name, version, exports, peerDependencies)
- [x] Build system — `tsup` (ESM, CJS, .d.ts)
- [x] Code formatting — Prettier + Husky + lint-staged + commitlint
- [x] LICENSE (MIT)
- [x] CI/CD — GitHub Actions (`ci.yml`, `release.yml`)

### Source Code

- [x] Core modules: `index.ts`, `types.ts`, `consts.ts`, `helpers.ts`
- [x] `navigationCitadel.ts` — main factory
- [x] `navigationRegistry.ts` — outposts registry
- [x] `navigationOutposts.ts` — patrol logic
- [x] `devtools/` — Vue DevTools integration

### Features

- [x] Global and route-scoped outposts (scope defaults to `'global'`)
- [x] Priority-based processing (global + route)
- [x] Route outposts deduplication with warning
- [x] Route outposts inheritance from parent routes
- [x] Route validation for redirects
- [x] Verdict system: `ALLOW`, `BLOCK`, redirect
- [x] `log` / `logger` / `debug` options with colored output
- [x] Custom logger support via `CitadelLogger` interface (`createDefaultLogger`)
- [x] Critical events always logged (errors, timeouts, missing routes)
- [x] Named debug breakpoints (navigation-start, before-outpost, patrol-stopped, timeout,
      error-caught, devtools-init, devtools-inspector)
- [x] Custom `debugHandler` option (`createDefaultDebugHandler`)
- [x] Default error handler (`console.error` + `BLOCK`)
- [x] Timeout support (`defaultTimeout`, `timeout`, `onTimeout`)
- [x] Lazy outposts (`lazy: true`) — on-demand handler loading for code splitting
- [x] `assignOutpostToRoute()` method
- [x] `revokeOutpostFromRoute()` method
- [x] Optimized processing (sorting at deploy, direct registry calls)
- [x] Type-safe outpost names (`GlobalOutpostRegistry` / `RouteOutpostRegistry`)
- [x] Vue DevTools integration (`devtools` option, custom inspector, settings panel)
- [x] Tree-shakeable devtools via dynamic import
- [x] Vue Plugin API (`app.use(citadel)`)

### NPM Scripts

- [x] `build`, `build:dev`
- [x] `check:types`, `check:format`, `check:all`
- [x] `release:check`, `release:publish`, `release:publish:beta`

### Testing

- [x] Vitest + happy-dom — 134 tests across 9 test files

### Documentation

- [x] `README.md` — concise project overview with quick start, links to VitePress docs
- [x] VitePress documentation site (`docs/`) — guides, API reference, examples, advanced patterns
- [x] `docs/release.md` — release process for maintainers
- [x] `CONTRIBUTING.md` — concise contributor guide with link to full VitePress docs
- [x] `CHANGELOG.md` — release notes
- [x] Exports Reference section (constants + types)
- [x] Logging & Debug sections with colored output reference
- [x] Source docs consolidated into VitePress (`internals.md`, `testing.md`, `type-safe-names-advanced.md` deleted)
- [x] `examples/` directory removed — examples live in `docs/examples/` only
- [x] Error Handling — separate page (`docs/guide/error-handling.md`)
- [x] Mermaid diagram legend (`docs/_snippets/legend.md`) with emoji markers across all diagram pages
- [x] Prettier `proseWrap: "preserve"` override for docs to preserve VitePress containers
- [x] Contributing guide — code style, architecture guidelines, naming conventions with real examples
- [x] Conventional Commits — commitlint + husky `commit-msg` hook
- [x] API types docs aligned with source code (lazy generics, `install`, async return types)

---

## TODO

### Priority 2 — Post-Release

#### Metrics

Performance metrics for outpost execution.

```typescript
const citadel = createNavigationCitadel(router, {
  metrics: true,
});

// Get metrics
citadel.getMetrics(); // { 'auth': { calls: 42, avgTime: 12, maxTime: 45 }, ... }
citadel.resetMetrics();
```

**Implementation:**

- Track in `processOutpost`: start time, end time, success/fail
- Store in registry alongside outpost
- Add `getMetrics()` and `resetMetrics()` to API

---

#### JSON Schema for Config

Validate citadel and outpost configuration.

**Files:**

- `schemas/citadel-options.json`
- `schemas/outpost-options.json`

**Usage:**

- IDE validation in JSON/YAML configs
- Runtime validation with `ajv` (optional)

---

#### Playground

Interactive demo for trying the library.

**Options:**

1. StackBlitz template
2. GitHub Pages with Vue app
3. Link in README

**Content:**

- Basic auth example
- Nested routes example
- All features demonstrated

---
