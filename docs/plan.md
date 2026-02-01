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
- [x] `src/helpers.ts` — utility functions (debugPoint)
- [x] `src/navigationCitadel.ts` — main factory
- [x] `src/navigationRegistry.ts` — outposts registry
- [x] `src/navigationOutposts.ts` — patrol logic

### Documentation

- [x] `README.md` — API reference with section links to internals
- [x] `docs/internals.md` — deep dive with Mermaid diagrams
- [x] `CHANGELOG.md` — release notes
- [x] Usage examples (`examples/`)
- [x] Exports Reference section (constants + types)
- [x] Logging & Debug sections with colored output reference

### Features

- [x] Global and route-scoped outposts
- [x] Priority-based processing (global + route)
- [x] Route outposts deduplication with warning
- [x] Route validation for redirects
- [x] `log` / `debug` options with colored output (🔵 info, 🟡 warn, 🔴 error, 🟣 debug)
- [x] Named debug breakpoints (navigation-start, before-outpost, patrol-stopped, error-caught)
- [x] Default error handler (`console.error` + `BLOCK`)
- [x] `assignOutpostToRoute()` method
- [x] Optimized processing (sorting at deploy, direct registry calls)

### Build

- [x] `npm run build` — production (minified)
- [x] `npm run build:dev` — development (sourcemap)

---

## TODO

### Priority 1 — Before Release

#### ~~Timeout for Outposts~~ ✅

Implemented: `defaultTimeout`, `timeout`, `onTimeout`

---

#### Testing

**Setup:**

1. Install: `npm install -D vitest @vue/test-utils vue vue-router happy-dom`
2. Add to `package.json`: `"test": "vitest"`, `"test:coverage": "vitest --coverage"`
3. Create `vitest.config.ts`

**Test files:**

```
src/__tests__/
├── navigationCitadel.test.ts    # createNavigationCitadel, destroy
├── navigationRegistry.test.ts   # deploy, abandon, getOutposts, sorting
├── navigationOutposts.test.ts   # patrol, deduplication
├── timeout.test.ts              # timeout functionality
└── integration.test.ts          # full navigation flow
```

**Test cases:**

- `createNavigationCitadel` — returns API, registers hooks
- `deployOutpost` — single, multiple, priority sorting, duplicate warning
- `abandonOutpost` — single, multiple, returns boolean
- `getOutpostNames` — returns names by scope
- `assignOutpostToRoute` — assigns, returns false if not found
- `patrol` — ALLOW/BLOCK/redirect flow
- Deduplication — warning logged, outpost runs once
- `onError` — custom handler called, default BLOCK
- Timeout — handler times out, onTimeout called

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

#### Type-safe meta.outposts

**Problem:** No autocomplete for outpost names in `meta.outposts`.

**Solution:** Declaration merging with generic registry.

```typescript
// User defines their outpost names
declare module 'vue-router-citadel' {
  interface OutpostRegistry {
    'auth': true;
    'admin-only': true;
    'verified': true;
  }
}

// Now meta.outposts has autocomplete
const routes = [
  {
    path: '/admin',
    meta: {
      outposts: ['auth', 'admin-only'], // ✓ autocomplete works
      // outposts: ['typo'],            // ✗ TypeScript error
    },
  },
];
```

**Implementation:**

1. Add to `types.ts`:
   ```typescript
   export interface OutpostRegistry {}
   export type RegisteredOutpostName = keyof OutpostRegistry extends never
     ? string
     : keyof OutpostRegistry;
   ```
2. Update `RouteMeta.outposts` to use `RegisteredOutpostName`
3. Update `RouteMeta.outposts` type

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
src/
├── index.ts
├── types.ts
├── consts.ts
├── helpers.ts
├── navigationCitadel.ts
├── navigationOutposts.ts
├── navigationRegistry.ts
└── __tests__/
    ├── navigationCitadel.test.ts
    ├── navigationRegistry.test.ts
    ├── navigationOutposts.test.ts
    └── integration.test.ts

docs/
└── internals.md          # diagrams + logging + debug

examples/
├── auth.ts
├── global-different-hooks.ts
├── nested-routes.ts
└── route-multiple-hooks.ts

.github/workflows/
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
