---
description: Vue Router Citadel API reference — createNavigationCitadel, deployOutpost, abandonOutpost, and all public methods with examples.
---

# 📚 API Methods

## createNavigationCitadel

Factory function that creates a navigation citadel instance.

```typescript
import { createNavigationCitadel } from 'vue-router-citadel';

const citadel = createNavigationCitadel(router, {
  outposts: [], // Initial outposts to deploy on creation
  log: true, // Enable non-critical logging (default: __DEV__)
  logger: myLogger, // Custom logger (default: createDefaultLogger())
  debug: false, // Enable logging + debugger breakpoints (default: false)
  debugHandler: myDebugHandler, // Custom debug handler (default: createDefaultDebugHandler())
  devtools: true, // Enable Vue DevTools integration (default: __DEV__)
  onError: (error, ctx) => {
    // Custom error handler (default: console.error + BLOCK)
    return { name: 'error' };
  },
  defaultPriority: 100, // Default priority for outposts
  defaultTimeout: 10000, // Default timeout for outposts in ms (default: undefined)
  onTimeout: (outpostName, ctx) => {
    // Custom timeout handler (default: console.warn + BLOCK)
    return { name: 'error' };
  },
});
```

## install

Installs citadel as a Vue plugin. Required for DevTools integration.

```typescript
const app = createApp(App);
app.use(router);
app.use(citadel); // DevTools initialized here
app.mount('#app');
```

Returns `void`.

## deployOutpost

Deploys one or multiple navigation outposts.

```typescript
// Global outpost (scope defaults to 'global')
citadel.deployOutpost({
  name: 'auth',
  handler: ({ verdicts, to, from, router, hook }) => {
    return verdicts.ALLOW;
  },
  priority: 10, // Optional, lower = processed first
  hooks: [NavigationHooks.BEFORE_EACH], // Optional, default: ['beforeEach']
  timeout: 5000, // Optional, overrides defaultTimeout
  lazy: false, // Optional, enable lazy loading (default: false)
});

// Route outpost (scope must be specified)
citadel.deployOutpost({
  scope: NavigationOutpostScopes.ROUTE,
  name: 'admin-only',
  handler: adminHandler,
});

// Deploy multiple outposts at once
citadel.deployOutpost([outpost1, outpost2, outpost3]);
```

Returns `void`.

## abandonOutpost

Removes outpost(s) by scope and name.

```typescript
// Remove single outpost
citadel.abandonOutpost(NavigationOutpostScopes.GLOBAL, 'auth');

// Remove multiple outposts
citadel.abandonOutpost(NavigationOutpostScopes.ROUTE, ['admin-only', 'premium']);
```

Returns `true` if outpost was found and removed. When passing an array, returns `true` only if
**all** outposts were removed, `false` if any were not found.

## getOutpostNames

Returns array of deployed outpost names for a given scope.

```typescript
citadel.getOutpostNames(NavigationOutpostScopes.GLOBAL); // ['auth', 'analytics']
citadel.getOutpostNames(NavigationOutpostScopes.ROUTE); // ['admin-only', 'premium']
```

Returns `[]` if no outposts are deployed for the given scope.

## assignOutpostToRoute

Assigns outpost(s) to an existing route dynamically. Useful when routes are defined before outposts
are deployed.

```typescript
// Assign single outpost
citadel.assignOutpostToRoute('admin', 'admin-only');

// Assign multiple outposts
citadel.assignOutpostToRoute('settings', ['auth', 'verified']);
```

Returns `true` if route was found and outposts assigned, `false` otherwise. Duplicates are
automatically filtered — calling multiple times with the same outpost name is safe.

## revokeOutpostFromRoute

Removes outpost(s) from an existing route dynamically. Opposite of
[assignOutpostToRoute](#assignoutposttoroute).

```typescript
// Remove single outpost
citadel.revokeOutpostFromRoute('admin', 'admin-only');

// Remove multiple outposts
citadel.revokeOutpostFromRoute('settings', ['auth', 'verified']);
```

Returns `true` if route was found, `false` otherwise. Warns if an outpost name is not present in the
route's outposts.

## destroy

Removes all navigation hooks and clears registry. Use when unmounting the application or replacing
citadel instance.

```typescript
citadel.destroy();
```

Returns `void`. After calling `destroy()`, the citadel instance should not be used.
