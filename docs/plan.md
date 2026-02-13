# vue-router-citadel — Development Plan

---

## Done

### Infrastructure

- [x] Project structure (`src/`, `examples/`)
- [x] `.gitignore`, `tsconfig.json` (ES2020, ESNext, strict)
- [x] `package.json` (name, version, exports, peerDependencies)
- [x] Build system — `tsup` (ESM, CJS, .d.ts)
- [x] Code formatting — Prettier + Husky + lint-staged
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

- [x] `README.md` — API reference with section links to internals
- [x] `docs/internals.md` — deep dive with Mermaid diagrams
- [x] `docs/testing.md` — testing guide and all test cases
- [x] `docs/type-safe-names-advanced.md` — advanced patterns (DI, modules)
- [x] `docs/release.md` — release process for maintainers
- [x] `CONTRIBUTING.md` — contributor guide
- [x] `CHANGELOG.md` — release notes
- [x] Usage examples (`examples/`)
- [x] Exports Reference section (constants + types)
- [x] Logging & Debug sections with colored output reference

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

#### VitePress Documentation Site

Documentation website generated from existing docs, hosted on GitHub Pages.

**Approach:** Add VitePress on top of existing `docs/` directory — `.vitepress/` config + new pages,
existing files reused with minimal changes (frontmatter added).

**Dependencies:** `vitepress`, `vitepress-plugin-mermaid`

**Site Structure:**

```
docs/
├── .vitepress/
│   └── config.ts                  # VitePress config (nav, sidebar, theme)
├── index.md                       # Homepage (hero + features cards)
├── guide/
│   ├── index.md                   # Introduction (philosophy, concepts)
│   ├── getting-started.md         # Installation + Quick Start
│   ├── scopes.md                  # Outpost Scopes (global/route)
│   ├── hooks.md                   # Navigation Hooks
│   ├── verdicts.md                # Handler Return Values
│   ├── timeout.md                 # Timeout handling
│   ├── lazy-outposts.md           # Lazy Outposts
│   └── devtools.md                # Vue DevTools integration
├── api/
│   ├── index.md                   # API methods (createNavigationCitadel, etc.)
│   ├── types.md                   # TypeScript types & interfaces
│   └── exports.md                 # Constants, utilities
├── advanced/
│   ├── architecture.md            # Registry, processing internals
│   ├── type-safety.md             # Type-safe outpost names
│   ├── modular-apps.md            # Large-scale patterns (DI, modules)
│   └── logging.md                 # Logging, custom logger, debug
├── examples/
│   ├── auth.md                    # Auth guard example
│   ├── nested-routes.md           # Nested routes with priorities
│   ├── multiple-hooks.md          # Multiple hooks per outpost
│   └── different-hooks.md         # Different hook types
├── contributing/
│   ├── index.md                   # From CONTRIBUTING.md
│   ├── testing.md                 # From docs/testing.md
│   └── release.md                 # From docs/release.md
└── changelog.md                   # From CHANGELOG.md
```

**Content source mapping:**

| VitePress page             | Source                                                |
| -------------------------- | ----------------------------------------------------- |
| `index.md`                 | New (hero from README badges/description)             |
| `guide/*`                  | Split from `README.md` sections                       |
| `api/*`                    | Split from `README.md` API + `internals.md` API Usage |
| `advanced/architecture.md` | From `internals.md` (Registry, Processing, Diagrams)  |
| `advanced/type-safety.md`  | From `internals.md` Type-Safe section                 |
| `advanced/modular-apps.md` | From `type-safe-names-advanced.md`                    |
| `advanced/logging.md`      | From `internals.md` Logging + Debug sections          |
| `examples/*`               | From `examples/*.ts` wrapped in markdown              |
| `contributing/*`           | From `CONTRIBUTING.md`, `testing.md`, `release.md`    |
| `changelog.md`             | From `CHANGELOG.md`                                   |

**NPM scripts:**

```bash
docs:dev        # vitepress dev docs
docs:build      # vitepress build docs
docs:preview    # vitepress preview docs
```

**GitHub Actions:** `.github/workflows/deploy-docs.yml` — build + deploy to GitHub Pages on push to
`main`.

**Features:**

- Mermaid diagrams (12+ existing diagrams rendered natively)
- Local search (built-in VitePress)
- Dark mode (default theme)
- TypeScript syntax highlighting (Shiki)
- Mobile responsive

**Excluded from site:** `docs/plan.md` (internal roadmap)

**Checklist:**

- [ ] Install `vitepress` + `vitepress-plugin-mermaid`
- [ ] Create `.vitepress/config.ts` (nav, sidebar, base path, mermaid plugin)
- [ ] Create `docs/index.md` homepage
- [ ] Split README.md → `guide/` pages
- [ ] Split internals.md → `advanced/` + `api/` pages
- [ ] Migrate examples → `examples/` markdown pages
- [ ] Migrate contributing docs → `contributing/`
- [ ] Add frontmatter to all pages
- [ ] Create `.github/workflows/deploy-docs.yml`
- [ ] Add npm scripts (`docs:dev`, `docs:build`, `docs:preview`)
- [ ] Test local build and preview
- [ ] Update README.md with docs site link
- [ ] Update CLAUDE.md with docs commands and structure

---
