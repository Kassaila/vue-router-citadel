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

#### API Methods

- `citadel.deploy(options)` — register one or multiple outposts
- `citadel.abandon(scope, name)` — remove outposts by scope and name
- `citadel.getOutposts(scope)` — get registered outpost names
- `citadel.assignOutpostToRoute(routeName, outpostNames)` — dynamically assign outposts to routes
- `citadel.destroy()` — remove all hooks and clear registry

#### Features

- Priority-based execution order for global and route outposts
- Route outposts inheritance from parent routes
- Route outposts deduplication with warning log
- Route validation for redirect returns
- Default error handler (`console.error` + `BLOCK`)

#### Developer Experience

- `log` option — console logging for navigation flow (default: `true`)
- `debug` option — logging + debugger breakpoints (default: `false`)
- Optimized execution — outposts sorted at registration, direct calls from registry
