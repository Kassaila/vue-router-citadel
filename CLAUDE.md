# CLAUDE.md

This file provides guidance for Claude Code when working with the vue-router-citadel repository.

## Project Overview

**vue-router-citadel** is a TypeScript middleware system for Vue Router 4 that provides structured
navigation defense through a hierarchical outpost-based architecture. It offers type-safe route
guards with a return-based API.

**Core Metaphor**: Citadel -> Outposts (Guards) -> Final destination

**Use Cases**: RBAC systems, multi-tenant apps, complex authorization flows, data preloading
pipelines

## Key Documentation

| File                | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `README.md`         | API reference, quick start, usage examples |
| `docs/internals.md` | Deep dive with Mermaid diagrams            |
| `docs/plan.md`      | Development roadmap and TODO priorities    |
| `CHANGELOG.md`      | Release notes                              |

## Repository Structure

```
src/
├── index.ts              # Public API exports
├── types.ts              # Type definitions, constants, interfaces
├── consts.ts             # __DEV__ flag, LOG_PREFIX
├── helpers.ts            # Utility (debugPoint)
├── navigationCitadel.ts  # Main factory, hook registration, public API
├── navigationOutposts.ts # Outpost processing, patrol logic, timeout/error
└── navigationRegistry.ts # Registry CRUD, priority sorting

examples/                 # Usage examples (auth, hooks, nested routes)
docs/internals.md         # Deep dive documentation with diagrams
```

## Key Concepts

### Scopes

- **GLOBAL**: Execute on every navigation
- **ROUTE**: Execute only when referenced in `route.meta.outposts`

### Navigation Hooks

- **beforeEach**: Before navigation (can block)
- **beforeResolve**: After async components resolved (can block)
- **afterEach**: After navigation (side effects only)

### Verdicts

- `verdicts.ALLOW` ('allow'): Continue to next outpost
- `verdicts.BLOCK` ('block'): Cancel navigation
- `RouteLocationRaw`: Redirect (string or object)
- `Error`: Caught by custom `onError` handler

## Core Types

```typescript
interface NavigationOutpostOptions {
  scope: 'global' | 'route';
  name: string;
  handler: NavigationOutpost;
  priority?: number; // Default: 100 (lower = earlier)
  hooks?: NavigationHook[]; // Default: ['beforeEach']
  timeout?: number; // Per-outpost timeout override
}

interface NavigationOutpostContext {
  verdicts: { ALLOW: 'allow'; BLOCK: 'block' };
  to: RouteLocationNormalized;
  from: RouteLocationNormalized;
  router: Router;
  hook: NavigationHook;
}

interface NavigationCitadelAPI {
  deployOutpost(options);
  abandonOutpost(scope, name);
  getOutpostNames(scope);
  assignOutpostToRoute(routeName, outpostNames);
  destroy();
}
```

## Build Commands

```bash
npm run build        # Production build (ESM + CJS)
npm run build:dev    # Development build with sourcemaps
npm run format       # Format with Prettier
npm run format:check # Check formatting
```

## Architecture Notes

- **Registry**: Maps for O(1) lookup, sorted arrays for iteration
- **Sorting**: Done at deploy/abandon time, not during navigation
- **Timeout**: Uses Promise.race() with symbol-based detection
- **Deduplication**: Route outposts deduplicated from nested matched routes

## Important Files for Changes

| Feature             | Primary File                |
| ------------------- | --------------------------- |
| Public API          | `src/navigationCitadel.ts`  |
| Outpost processing  | `src/navigationOutposts.ts` |
| Registry management | `src/navigationRegistry.ts` |
| Types/interfaces    | `src/types.ts`              |
| Constants           | `src/consts.ts`             |

## Code Patterns

- Factory pattern: `createNavigationCitadel(router, options)`
- All outposts are async handlers returning `NavigationOutpostOutcome`
- Priority: lower number = earlier execution
- Logging controlled by `log` option (default: `__DEV__`)
- Debug mode adds debugger breakpoints

## Route Meta Extension

```typescript
// Routes reference outposts by name
{
  path: '/dashboard',
  meta: { outposts: ['auth', 'premium'] }
}
```

## Type-Safe Outpost Names

Declaration merging for autocomplete and compile-time validation:

```typescript
// User extends registries in outposts.d.ts
declare module 'vue-router-citadel' {
  interface GlobalOutpostRegistry {
    auth: true;
  }
  interface RouteOutpostRegistry {
    'admin-only': true;
  }
}
```

Key types: `GlobalOutpostRegistry`, `RouteOutpostRegistry`, `GlobalOutpostName`, `RouteOutpostName`

## Development Roadmap (see docs/plan.md)

### Priority 1 — Before Release

- [ ] **Testing**: vitest + @vue/test-utils + happy-dom
  - Test files: `src/__tests__/*.test.ts`
  - Cases: citadel API, registry, patrol, deduplication, timeout, errors
- [ ] **CI/CD**: GitHub Actions (ci.yml, release.yml)
- [x] **Type-safe Outpost Names**: Declaration merging with
      GlobalOutpostRegistry/RouteOutpostRegistry

### Priority 2 — Post-Release

- [ ] DevTools Integration (Vue DevTools plugin)
- [ ] Metrics (performance tracking per outpost)
- [ ] Lazy Outposts (dynamic import for code splitting)
- [ ] JSON Schema for config validation
- [ ] Interactive Playground

## Commands

```bash
npm install          # Install dependencies
npm run build        # Build for production
npm run build:dev    # Build for development
npm run format       # Format code
npm test             # Run tests (after setup)
npm pack --dry-run   # Check package contents
```

## Current State

- Version: 0.1.0 (unreleased)
- Branch: develop -> main
- Peer dependency: vue-router@^4.0.0
- TypeScript strict mode, ESM + CJS dual package

## Workflow Optimization

### File Editing

- **Mass cleanup/deletion**: Use ONE large Edit replacing all unwanted content at once, not
  incremental small edits
- **Avoid**: Multiple small replacements that can fail on whitespace mismatches
- **Pattern**: `Read -> single Edit with full replacement -> done`

### Token Efficiency

- Read file once, plan all changes, execute in minimal operations
- For file search: use Glob/Grep directly for specific queries, Task agent for open-ended
  exploration
- Parallel tool calls when operations are independent
