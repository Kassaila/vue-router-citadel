# 🏷️ Types

All TypeScript types exported from `vue-router-citadel`.

## NavigationOutpostContext

Context passed to outpost handler:

```typescript
interface NavigationOutpostContext {
  verdicts: { ALLOW: 'allow'; BLOCK: 'block' };
  to: RouteLocationNormalized;
  from: RouteLocationNormalized;
  router: Router;
  hook: 'beforeEach' | 'beforeResolve' | 'afterEach';
}
```

## NavigationOutpostOutcome

Return type from outpost handlers:

```typescript
type NavigationOutpostOutcome = NavigationOutpostVerdict | RouteLocationRaw | Error;
```

## NavigationOutpostHandler

Handler function signature:

```typescript
type NavigationOutpostHandler = (
  ctx: NavigationOutpostContext,
) => NavigationOutpostOutcome | Promise<NavigationOutpostOutcome>;
```

## LazyOutpostLoader

Loader function for lazy outposts — must return a module with `default` export:

```typescript
type LazyOutpostLoader = () => Promise<{ default: NavigationOutpostHandler }>;
```

## NavigationOutpost

Configuration for deploying an outpost. Generic `S` constrains name by scope, generic `L` switches handler type for lazy loading:

```typescript
interface NavigationOutpost<
  S extends NavigationOutpostScope = 'global',
  L extends boolean = false,
> {
  scope?: S; // Default: 'global'
  name: OutpostNameByScope<S>; // Type-safe when registries extended
  handler: L extends true ? LazyOutpostLoader : NavigationOutpostHandler;
  priority?: number; // Default: 100
  hooks?: NavigationHook[]; // Default: ['beforeEach']
  timeout?: number; // Overrides defaultTimeout
  lazy?: L; // Default: false
}
```

## NavigationCitadelOptions

Options for creating citadel:

```typescript
interface NavigationCitadelOptions {
  outposts?: NavigationOutpost[]; // Initial outposts to deploy
  log?: boolean; // Default: __DEV__
  logger?: CitadelLogger; // Default: createDefaultLogger()
  debug?: boolean; // Default: false
  debugHandler?: DebugHandler; // Default: createDefaultDebugHandler()
  devtools?: boolean; // Default: __DEV__
  defaultPriority?: number; // Default: 100
  defaultTimeout?: number; // Default: undefined (no timeout)
  onError?: (
    error: Error,
    ctx: NavigationOutpostContext,
  ) => NavigationOutpostOutcome | Promise<NavigationOutpostOutcome>;
  onTimeout?: (
    outpostName: string,
    ctx: NavigationOutpostContext,
  ) => NavigationOutpostOutcome | Promise<NavigationOutpostOutcome>;
}
```

## NavigationCitadelAPI

Public API returned by `createNavigationCitadel`:

```typescript
interface NavigationCitadelAPI {
  install(app: App): void; // Vue Plugin API (required for DevTools)

  deployOutpost<S extends NavigationOutpostScope = 'global', L extends boolean = false>(
    options: NavigationOutpost<S, L> | NavigationOutpost<S, L>[],
  ): void;

  // Scope-aware overloads
  abandonOutpost(scope: 'global', name: GlobalOutpostName | GlobalOutpostName[]): boolean;
  abandonOutpost(scope: 'route', name: RouteOutpostName | RouteOutpostName[]): boolean;

  getOutpostNames(scope: 'global'): GlobalOutpostName[];
  getOutpostNames(scope: 'route'): RouteOutpostName[];

  assignOutpostToRoute(
    routeName: string,
    outpostNames: RouteOutpostName | RouteOutpostName[],
  ): boolean;

  destroy(): void;
}
```

## CitadelLogger

Logger interface:

```typescript
interface CitadelLogger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}
```

## Debug Types

```typescript
type DebugHandler = (name: DebugPoint) => void;

type DebugPoint =
  | 'navigation-start'
  | 'before-outpost'
  | 'patrol-stopped'
  | 'timeout'
  | 'error-caught'
  | 'devtools-init'
  | 'devtools-inspector';
```

## Type-Safe Outpost Names

Interfaces for declaration merging (extend in your project):

```typescript
// Empty by default — extend to enable type checking
interface GlobalOutpostRegistry {}
interface RouteOutpostRegistry {}

// Conditional types (fall back to string if registries empty)
type GlobalOutpostName = keyof GlobalOutpostRegistry extends never
  ? string
  : keyof GlobalOutpostRegistry;
type RouteOutpostName = keyof RouteOutpostRegistry extends never
  ? string
  : keyof RouteOutpostRegistry;
type OutpostName = GlobalOutpostName | RouteOutpostName;
```

## Route Meta Extension

The library extends Vue Router's `RouteMeta` interface:

```typescript
declare module 'vue-router' {
  interface RouteMeta {
    outposts?: RouteOutpostName[]; // Type-safe when RouteOutpostRegistry extended
  }
}
```
