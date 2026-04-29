---
title: Contributing
description: Contributing guide for Vue Router Citadel — setup, development commands, code style, naming conventions, and pull request process.
---

# 🤝 Contributing

Thanks for your interest in contributing to Vue Router Citadel!

## 📋 Requirements

- Node.js >= 22.0.0
- npm >= 9.0.0

## ⚙️ Setup

```bash
# Clone the repository
git clone https://github.com/Kassaila/vue-router-citadel.git
cd vue-router-citadel

# Install dependencies
npm install
```

## 🛠️ Development Commands

```bash
npm run build        # Production build (ESM + CJS + types)
npm run build:dev    # Development build with sourcemaps
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## 📁 Project Structure

```
src/                     # Source code
├── index.ts             # Public API exports
├── types.ts             # TypeScript types and interfaces
├── consts.ts            # Constants (__DEV__, LOG_PREFIX)
├── helpers.ts           # Utilities (debugPoint, logger)
├── navigationCitadel.ts # Main factory function
├── navigationOutposts.ts # Patrol logic, timeout handling
├── navigationRegistry.ts # Registry CRUD operations
└── devtools/            # Vue DevTools integration
    ├── index.ts         # Setup functions, auto-init
    ├── inspector.ts     # Custom inspector logic
    └── types.ts         # DevTools-specific types

__tests__/               # Tests (vitest + happy-dom)
├── helpers/setup.ts     # Mock router, logger, handlers
└── *.test.ts            # Test files

docs/                    # VitePress documentation site
```

## 🔄 Workflow

### Branch Naming

- `feature/` — new features
- `fix/` — bug fixes
- `docs/` — documentation changes
- `refactor/` — code refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification. Commit messages are validated automatically via [commitlint](https://commitlint.js.org/) on the `commit-msg` hook.

```
feat: add new feature
fix: resolve bug
docs: update documentation
test: add tests
refactor: improve code structure
chore: maintenance tasks
```

::: tip
Commits that don't follow the convention will be rejected by the git hook.
:::

### Pull Request Process

1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes
4. Ensure all tests pass (`npm run test:run`)
5. Ensure code is formatted (`npm run format`)
6. Submit PR to `develop` branch

## ✨ Code Style

### Formatting & Checks

- **Prettier** — formatting, **ESLint** — linting + style rules; both run automatically on commit via `lint-staged`
- **TypeScript strict mode** — `strict: true`, `forceConsistentCasingInFileNames: true`
- **No runtime dependencies** — only `@vue/devtools-api`; peer deps: `vue`, `vue-router`

### Naming Conventions

| Entity                           | Convention                                   | Example                                             |
| -------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| Files                            | camelCase                                    | `navigationCitadel.ts`                              |
| Variables, functions             | camelCase                                    | `createContext()`, `runtimeState`                   |
| Types, interfaces                | PascalCase + descriptive suffix              | `NavigationCitadelAPI`, `NavigationOutpostContext`  |
| Constants                        | UPPER_SNAKE_CASE, centralized in `consts.ts` | `LOG_PREFIX`, `DEFAULT_NAVIGATION_OUTPOST_PRIORITY` |
| Const objects (enum replacement) | PascalCase                                   | `NavigationHooks`, `DebugPoints`                    |

### Type Patterns

**`as const` objects instead of TypeScript `enum`** — better tree-shaking and type inference:

```typescript
// ✅ Do
export const NavigationHooks = {
  BEFORE_EACH: 'beforeEach',
  BEFORE_RESOLVE: 'beforeResolve',
  AFTER_EACH: 'afterEach',
} as const;

export type NavigationHook = (typeof NavigationHooks)[keyof typeof NavigationHooks];

// ❌ Don't
enum NavigationHooks { ... }
```

**Selective exports** — only types, constants, and helpers are public. Implementation modules (`navigationRegistry`, `navigationOutposts`) are internal:

```typescript
// src/index.ts — public API surface
export type { NavigationOutpost, NavigationCitadelAPI, ... } from './types';
export { NavigationHooks, NavigationOutpostVerdicts } from './types';
export { createDefaultLogger } from './helpers';
export { createNavigationCitadel } from './navigationCitadel';
// NOT exported: registry, outposts internals
```

### Function Patterns

**Factory + closure** instead of classes — all state is encapsulated via closures:

```typescript
// ✅ Do
export const createNavigationCitadel = (router, options) => {
  const registry = createRegistry(); // private state
  const deployOne = (opts) => { ... }; // private helper

  return { deployOutpost, destroy }; // public API
};

// ❌ Don't
class NavigationCitadel { ... }
```

## 🏗️ Architecture Guidelines

### Registry Structure

- **Maps** for O(1) name lookup: `Map<string, RegisteredNavigationOutpost>`
- **Sorted arrays** for priority-ordered iteration: `string[]` of names
- **Sorting at deploy/abandon time**, never during navigation — O(n log n) once vs O(1) per navigation

### Navigation Processing

- **Hierarchical order**: global outposts first (sorted by priority), then route outposts (sorted, deduplicated via `Set`)
- **Early exit**: on `BLOCK` or redirect — remaining outposts are skipped
- **Hook filtering**: `shouldRunOnHook()` skips outposts not registered for the current hook
- **All handlers are async** — even sync handlers are awaited. `Promise.race()` for timeout

### Logging

Three levels with critical/non-critical distinction:

| Level             | Method         | When logged                                   |
| ----------------- | -------------- | --------------------------------------------- |
| Non-critical      | `logger.info`  | Only when `log: true` or `debug: true`        |
| Critical warnings | `logger.warn`  | Always (duplicates, timeouts, missing routes) |
| Critical errors   | `logger.error` | Always (handler errors, afterEach failures)   |

Mark critical log paths with `// Critical: always log` comment.

### Error Handling

- **Symbol-based identification** for timeout errors — `TIMEOUT_SYMBOL` attached to error object, checked via `in` operator
- **Outcome normalization** — `normalizeOutcome()` validates all handler returns, checks routes via `router.resolve()`
- **Error boundaries** at handler execution level — never re-throw unhandled errors
- **Retry support** for lazy loaders — on load failure, `loadPromise` is reset to `null`

## 🔗 Local Testing with npm link

To test the package in a real Vue project:

**In this repository:**

```bash
npm run build
npm link
```

**In your test project:**

```bash
npm link vue-router-citadel
```

After changes, rebuild — the symlink picks up changes automatically.

## ❓ Questions?

[Open an issue](https://github.com/Kassaila/vue-router-citadel/issues/new) for questions or suggestions.
