# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

### Added

#### Core

- `createNavigationCitadel(router, options?)` — main factory function
- Global and route-scoped navigation outposts
- Support for `beforeEach`, `beforeResolve`, `afterEach` hooks
- Verdict system: `ALLOW`, `BLOCK`, redirect
- TypeScript support with full type definitions
- Peer dependencies: `vue@^3.0.0`, `vue-router@^4.0.0 || ^5.0.0`

#### API Methods

- `citadel.deployOutpost(options)` — deploy one or multiple outposts (scope defaults to `'global'`)
- `citadel.abandonOutpost(scope, name)` — abandon outposts by scope and name
- `citadel.getOutpostNames(scope)` — get deployed outpost names
- `citadel.assignOutpostToRoute(routeName, outpostNames)` — dynamically assign outposts to routes
- `citadel.revokeOutpostFromRoute(routeName, outpostNames)` — dynamically remove outposts from
  routes
- `citadel.destroy()` — remove all hooks and clear registry

#### Features

- Priority-based processing order for global and route outposts
- Route outposts inheritance from parent routes
- Route outposts deduplication with warning log
- Route validation for redirect returns
- Default error handler (`console.error` + `BLOCK`)
- Timeout support (`defaultTimeout`, `timeout`, `onTimeout`)
- Lazy outposts (`lazy: true`) — load handler modules on-demand for code splitting
- Type-safe outpost names via declaration merging (`GlobalOutpostRegistry`, `RouteOutpostRegistry`)
- Optional `scope` in outpost config (defaults to `'global'`)

#### Developer Experience

- `log` option — enable/disable non-critical logging (default: `__DEV__`)
- `logger` option — custom logger with `CitadelLogger` interface (default: `createDefaultLogger()`)
- Critical events (errors, timeouts, missing routes) always logged regardless of `log` setting
- `createDefaultLogger()` — factory for default console logger with emoji prefixes
- `debug` option — logging + debugger breakpoints (default: `false`)
- Colored console output: 🔵 info, 🟡 warn, 🔴 error, 🟣 debug
- Named debug breakpoints: `navigation-start`, `before-outpost`, `patrol-stopped`, `timeout`,
  `error-caught`, `devtools-init`, `devtools-inspector`
- Optimized processing — outposts sorted at deploy, direct calls from registry

#### NPM Scripts

- `lint` / `lint:fix` — ESLint check / auto-fix
- `check:lint` — ESLint check (alias)
- `check:types` — TypeScript type checking (`tsc --noEmit`)
- `check:format` — format check alias
- `check:all` — full validation chain (format + lint + types + tests)
- `release:check` — pre-release verification (check:all + build + pack --dry-run)
- `release:publish` — publish to npm with full checks
- `release:publish:beta` — publish beta version

#### Vue DevTools Integration

- `devtools` option — enable/disable Vue DevTools integration (default: `__DEV__`)
- Custom inspector with outpost tree (Global/Route groups)
- Tags showing priority and hooks count
- State panel with outpost details (name, scope, priority, hooks, timeout)
- Auto-refresh on deploy/abandon
- Vue Plugin API integration via `app.use(citadel)`
- Tree-shakeable via dynamic import — devtools code eliminated when `devtools: false`
- **Settings panel** — runtime Log level selector (`Off | Log | Log + Debug`)
- Settings persist in `localStorage` with priority: `localStorage → citadel options → defaults`

#### Debug Handler

- `debugHandler` option — custom debug handler for reliable breakpoints (default:
  `createDefaultDebugHandler()`)
- Exports: `DebugHandler`, `DebugPoint`, `DebugPoints`, `createDefaultDebugHandler`
- Solves bundler issue where `debugger` statements are stripped from dependencies

#### Types

- `NavigationOutpost` — outpost configuration interface (scope optional, defaults to `'global'`)
- `NavigationOutpostHandler` — handler function type
- `LazyOutpostLoader` — lazy loader function type for code splitting
- `NavigationOutpostContext` — handler context with verdicts, to, from, router, hook
- `NavigationCitadelOptions` — citadel creation options
- `NavigationCitadelAPI` — public API interface

#### Testing

- Vitest + happy-dom test setup
- 134 tests across 9 test files
- `__tests__/navigationCitadel.test.ts` — citadel creation, hooks, destroy
- `__tests__/navigationRegistry.test.ts` — registry CRUD, priority sorting
- `__tests__/navigationOutposts.test.ts` — patrol logic, verdicts, redirects
- `__tests__/timeout.test.ts` — timeout handling, onTimeout callback
- `__tests__/integration.test.ts` — end-to-end navigation scenarios
- `__tests__/lazy.test.ts` — lazy loading, caching, retry, timeout behavior
- `__tests__/devtools-settings.test.ts` — DevTools settings, localStorage persistence
- `__tests__/debugHandler.test.ts` — debugHandler invocation, custom handlers
- VitePress testing guide (`docs/contributing/testing`) and test case reference
  (`docs/contributing/test-cases`)

#### CI/CD

- GitHub Actions CI workflow (`ci.yml`) — format, types, tests, build on push/PR to main/develop
- GitHub Actions Release workflow (`release.yml`) — full checks + npm publish with provenance on
  `v*` tags

#### Documentation

- `README.md` — concise project overview with quick start example, links to full docs
- `CONTRIBUTING.md` — concise contributor guide with link to full VitePress docs
- VitePress documentation site (`docs/`) — guides, API reference, examples, advanced patterns
- Error Handling — dedicated guide page with error flow diagram, `onError`, `onTimeout`
- Mermaid diagram legend with emoji markers (🟢🟡🔴🔵🟣) across all diagram pages
- API types documentation aligned with source code (lazy generics, async return types)
- Contributing guide — code style, naming conventions, architecture guidelines with examples
- Source docs consolidated into VitePress (`internals.md`, `testing.md` deleted, content
  distributed)
- `examples/` directory removed — examples live in `docs/examples/` only

#### Infrastructure

- [commitlint](https://commitlint.js.org/) — commit message validation via husky `commit-msg` hook
- [Conventional Commits](https://www.conventionalcommits.org/) specification enforced
- Prettier `proseWrap: "preserve"` override for `docs/**/*.md` to preserve VitePress containers
- [ESLint](https://eslint.org/) 9 with flat config (`eslint.config.ts`) and `defineConfig`
  - `typescript-eslint` with type-aware linting (`projectService: true`)
  - `eslint-config-prettier` for conflict-free coexistence with Prettier
  - 3 custom local rules: `switch-case-braces`, `jsdoc-comment-style`, `prefer-arrow-without-this`
  - npm scripts: `lint`, `lint:fix`, `check:lint`; integrated into `check:all` and `lint-staged`
