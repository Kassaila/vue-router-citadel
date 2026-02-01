# vue-router-citadel — Development Plan

---

## Done

### Infrastructure

- [x] Project structure (`src/`, `examples/`)
- [x] `.gitignore`
- [x] `package.json` (name, version, exports, peerDependencies)
- [x] `tsconfig.json` (ES2020, ESNext, strict)
- [x] Build system — `tsup` (ESM, CJS, .d.ts)
- [x] Code formatting — Prettier + Husky + lint-staged
- [x] LICENSE (MIT)

### Source Code

- [x] `src/index.ts` — entry point, exports
- [x] `src/types.ts` — TypeScript types and interfaces
- [x] `src/consts.ts` — constants (LOG_PREFIX, DEFAULT_PRIORITY)
- [x] `src/helpers.ts` — utilities (debugPoint, logger)
- [x] `src/navigationCitadel.ts` — main factory
- [x] `src/navigationRegistry.ts` — outposts registry
- [x] `src/navigationOutposts.ts` — patrol logic

### Documentation

- [x] `README.md` — API reference with section links to internals
- [x] `docs/internals.md` — deep dive with Mermaid diagrams
- [x] `docs/testing.md` — testing guide and all test cases
- [x] `CONTRIBUTING.md` — contributor guide
- [x] `CHANGELOG.md` — release notes
- [x] Usage examples (`examples/`)
- [x] Exports Reference section (constants + types)
- [x] Logging & Debug sections with colored output reference

### Features

- [x] Global and route-scoped outposts
- [x] Priority-based processing (global + route)
- [x] Route outposts deduplication with warning
- [x] Route validation for redirects
- [x] `log` / `logger` / `debug` options with colored output (🔵 info, 🟡 warn, 🔴 error, 🟣 debug)
- [x] Custom logger support via `CitadelLogger` interface (`createDefaultLogger`)
- [x] Critical events always logged (errors, timeouts, missing routes)
- [x] Named debug breakpoints (navigation-start, before-outpost, patrol-stopped, error-caught)
- [x] Default error handler (`console.error` + `BLOCK`)
- [x] `assignOutpostToRoute()` method
- [x] Optimized processing (sorting at deploy, direct registry calls)
- [x] Type-safe outpost names (declaration merging with `GlobalOutpostRegistry` /
      `RouteOutpostRegistry`)

### Build

- [x] `npm run build` — production (minified)
- [x] `npm run build:dev` — development (sourcemap)

---

## TODO

### Priority 1 — Before Release

#### ~~Timeout for Outposts~~ ✅

Implemented: `defaultTimeout`, `timeout`, `onTimeout`

---

#### ~~Testing~~ ✅

Implemented: vitest + happy-dom, 67 tests across 5 test files.

```
src/__tests__/
├── helpers/setup.ts             # Mock router, logger, handlers
├── navigationCitadel.test.ts    # 18 tests
├── navigationRegistry.test.ts   # 12 tests
├── navigationOutposts.test.ts   # 19 tests
├── timeout.test.ts              # 5 tests
└── integration.test.ts          # 13 tests
```

---

#### CI/CD

**`.github/workflows/ci.yml`:**

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npm test
```

**`.github/workflows/release.yml`:**

```yaml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, registry-url: 'https://registry.npmjs.org' }
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

#### ~~Type-safe Outpost Names~~ ✅

Implemented: `GlobalOutpostRegistry`, `RouteOutpostRegistry`, scope-aware typing for all API
methods.

See [Type-Safe Outpost Names](./internals.md#-type-safe-outpost-names) for usage examples.

---

### Priority 2 — Post-Release

#### DevTools Integration

Vue DevTools plugin for visualizing outposts and navigation flow.

**Features:**

- List of deployed outposts (global/route, priority, hooks)
- Navigation timeline with outpost processing
- Outpost processing time
- Click to see outpost source location

**Implementation:**

- Use `@vue/devtools-api`
- Create `src/devtools.ts`
- Register on `createNavigationCitadel` if devtools available
- Export `setupDevtools(citadel)` for manual setup

---

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

#### Lazy Outposts

Dynamic import of outpost handlers for code splitting.

```typescript
citadel.deployOutpost({
  name: 'heavy-outpost',
  handler: () => import('./outposts/heavy').then((m) => m.default),
  // or
  handler: lazy(() => import('./outposts/heavy')),
});
```

**Implementation:**

- Detect if handler returns Promise with `handler` property
- Cache resolved handler after first load
- Add `lazy()` helper function

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

### Priority 3 — Documentation

#### Restructure docs: README.md → API reference, internals.md → deep dive ✅

**README.md** — concise API reference:

- [x] Logical section order (concepts before API)
- [x] Section-specific links to internals.md
- [x] Simplified API headers (Citadel, deployOutpost, abandonOutpost, etc.)
- [x] "📦 Exports" section with link to detailed reference
- [x] "📖 Internals" section at the end

**docs/internals.md** — deep dive:

- [x] Restructured to match README sections
- [x] Added emojis to section headers
- [x] Expanded content for each section (Navigation Hooks, Outpost Scopes, Handler Return Values)
- [x] "🔄 Complete Navigation Example" moved before API Internals
- [x] "📦 Exports Reference" section (constants + types + interfaces)
- [x] Logging Reference + Debug Reference tables

---

## Project Structure

```
src/                             # Source code
├── index.ts                     # Public API exports
├── types.ts
├── consts.ts
├── helpers.ts
├── navigationCitadel.ts
├── navigationOutposts.ts
└── navigationRegistry.ts

__tests__/                       # Tests
├── helpers/setup.ts
├── navigationCitadel.test.ts
├── navigationRegistry.test.ts
├── navigationOutposts.test.ts
├── timeout.test.ts
└── integration.test.ts

devtools/                        # Future Vue DevTools plugin
└── index.ts

docs/
├── internals.md
└── plan.md

examples/
├── auth.ts
├── global-different-hooks.ts
├── nested-routes.ts
└── route-multiple-hooks.ts

.github/workflows/               # TODO
├── ci.yml
└── release.yml
```

---

## Commands

```bash
npm install          # Install dependencies
npm run build        # Build for production
npm run build:dev    # Build for development
npm run format       # Format code
npm test             # Run tests
npm run test:coverage # Run tests with coverage
npm pack --dry-run   # Check package contents
npm publish          # Publish to npm
```
