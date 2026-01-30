# 🏰 Vue Router Citadel

> _Place guards at the gates. Outposts along the way._

[![npm version](https://img.shields.io/npm/v/vue-router-citadel.svg)](https://www.npmjs.com/package/vue-router-citadel)
[![license](https://img.shields.io/npm/l/vue-router-citadel.svg)](https://github.com/Kassaila/vue-router-citadel/blob/main/LICENSE)

**Structured navigation defense for Vue Router 4.**

Citadel is a middleware-driven navigation control system for Vue Router that lets you build
**layered, predictable, and scalable route protection**.

Where Vue Router gives you guards at the entrance, Citadel introduces **navigation outposts** ---
internal checkpoints that control access, preload data, enforce permissions, and orchestrate complex
navigation flows.

Think of it as turning your router into a fortress.

---

<!-- TOC -->

- [🧱 The Fortress Philosophy](#-the-fortress-philosophy)
- [✨ Designed for scalable apps](#-designed-for-scalable-apps)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [🎯 Outpost Scopes](#-outpost-scopes)
- [🪝 Navigation Hooks](#-navigation-hooks)
- [↩️ Outpost Handler Return Values](#️-outpost-handler-return-values)
- [⏱️ Timeout](#️-timeout)
- [📚 API](#-api)
  - [Citadel](#citadel)
  - [deployOutpost](#deployoutpost)
  - [abandonOutpost](#abandonoutpost)
  - [getOutpostNames](#getoutpostnames)
  - [assignOutpostToRoute](#assignoutposttoroute)
  - [destroy](#destroy)
- [🔍 Logging & Debug](#-logging--debug)
- [💡 Examples](#-examples)
- [📦 Exports](#-exports)
- [📖 Internals](#-internals)
- [📄 License](#-license)

<!-- /TOC -->

---

## 🧱 The Fortress Philosophy

Multiple layers of control --- just like a real fortress.

    🏰 Citadel → 🗼 Outposts (🛡 Guards) → 🎯 Final point

## ✨ Designed for scalable apps

Citadel is built for:

- Role-Based Access Control (RBAC) systems
- multi-tenant apps
- complex authorization flows
- data preloading pipelines

## 📦 Installation

```bash
npm install vue-router-citadel
```

## 🚀 Quick Start

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { createNavigationCitadel, NavigationOutpostScopes } from 'vue-router-citadel';

const routes = [
  { path: '/', name: 'home', component: () => import('./pages/Home.vue') },
  { path: '/login', name: 'login', component: () => import('./pages/Login.vue') },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('./pages/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
];

// 1. Create router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 2. Create navigation citadel
const citadel = createNavigationCitadel(router);

// 3. Deploy outpost
citadel.deployOutpost({
  scope: NavigationOutpostScopes.GLOBAL,
  name: 'auth',
  handler: ({ verdicts, to }) => {
    const isAuthenticated = Boolean(localStorage.getItem('token'));

    if (to.meta.requiresAuth && !isAuthenticated) {
      return { name: 'login' };
    }

    return verdicts.ALLOW;
  },
});

export { router, citadel };
```

## 🎯 Outpost Scopes

| Scope    | Description                                                                     |
| -------- | ------------------------------------------------------------------------------- |
| `GLOBAL` | Calls on every navigation, sorted by priority                                   |
| `ROUTE`  | Calls only when referenced in `meta.outposts`, sorted by priority, deduplicated |

```typescript
// Route outposts usage
const routes = [
  {
    path: '/admin',
    component: AdminPage,
    meta: { outposts: ['admin-only'] },
  },
];
```

> Route outposts from nested routes are automatically deduplicated. If the same outpost is
> referenced in parent and child routes, it will only be processed once. A warning is logged when
> duplicates are detected.
>
> See [Outpost Scopes](./docs/internals.md#-outpost-scopes) for diagrams and detailed processing
> flow.

## 🪝 Navigation Hooks

| Hook             | Description                     |
| ---------------- | ------------------------------- |
| `BEFORE_EACH`    | Before navigation (default)     |
| `BEFORE_RESOLVE` | After async components resolved |
| `AFTER_EACH`     | After navigation completed      |

> For best understanding you can read
> [Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html#Navigation-Guards)
> and
> [The Full Navigation Resolution Flow](https://router.vuejs.org/guide/advanced/navigation-guards.html#The-Full-Navigation-Resolution-Flow)
>
> See [Navigation Hooks](./docs/internals.md#-navigation-hooks) for detailed flow diagrams.

## ↩️ Outpost Handler Return Values

| Return              | Result                    |
| ------------------- | ------------------------- |
| `verdicts.ALLOW`    | Continue navigation       |
| `verdicts.BLOCK`    | Cancel navigation         |
| `{ name: 'route' }` | Redirect to named route   |
| `{ path: '/path' }` | Redirect to path          |
| `'/path'`           | Redirect to path (string) |

> Redirect routes are validated against the router. If route is not found, an error is thrown.
>
> See [Handler Return Values](./docs/internals.md#️-outpost-handler-return-values) for verdict flow
> diagram and handler context details.

## ⏱️ Timeout

Prevent outposts from hanging navigation indefinitely.

```typescript
const citadel = createNavigationCitadel(router, {
  defaultTimeout: 5000, // 5 seconds for all outposts
  onTimeout: (name, ctx) => ({ name: 'error' }), // redirect on timeout
});

// auth — uses defaultTimeout (5s)
citadel.deployOutpost({
  name: 'auth',
  handler: async ({ verdicts }) => {
    await checkAuth(); // must complete within 5 seconds
    return verdicts.ALLOW;
  },
});

// data-loader — needs more time (30s)
citadel.deployOutpost({
  name: 'data-loader',
  timeout: 30000, // override: 30 seconds
  handler: async ({ verdicts }) => {
    await loadHeavyData(); // can take up to 30 seconds
    return verdicts.ALLOW;
  },
});

// analytics — no timeout (runs in afterEach, shouldn't block)
citadel.deployOutpost({
  name: 'analytics',
  timeout: 0, // disabled
  hooks: [NavigationHooks.AFTER_EACH],
  handler: async ({ verdicts }) => {
    await sendAnalytics(); // can take as long as needed
    return verdicts.ALLOW;
  },
});
```

| Outpost       | `timeout`   | `defaultTimeout` | Result                |
| ------------- | ----------- | ---------------- | --------------------- |
| `auth`        | `undefined` | `5000`           | 5 seconds             |
| `data-loader` | `30000`     | `5000`           | 30 seconds (override) |
| `analytics`   | `0`         | `5000`           | No timeout (disabled) |

> See [Outpost Timeout](./docs/internals.md#outpost-timeout) for diagrams and detailed examples.

## 📚 API

### Citadel

```typescript
createNavigationCitadel(router, options?)
```

Creates a navigation citadel instance.

```typescript
const citadel = createNavigationCitadel(router, {
  log: true, // Enable console logging (default: __DEV__)
  debug: false, // Enable logging + debugger breakpoints (default: false)
  defaultPriority: 100, // Default priority for outposts
  defaultTimeout: 10000, // Default timeout for outposts in ms (default: undefined)
  onError: (error, ctx) => {
    // Custom error handler (default: console.error + BLOCK)
    return { name: 'error' };
  },
  onTimeout: (outpostName, ctx) => {
    // Custom timeout handler (default: console.warn + BLOCK)
    return { name: 'error' };
  },
});
```

### deployOutpost

```typescript
citadel.deployOutpost(options);
```

Deploys one or multiple navigation outposts.

```typescript
citadel.deployOutpost({
  scope: NavigationOutpostScopes.GLOBAL, // or NavigationOutpostScopes.ROUTE
  name: 'outpost-name',
  handler: ({ verdicts, to, from, router, hook }) => {
    return verdicts.ALLOW;
  },
  priority: 10, // Optional, lower = processed first
  hooks: [NavigationHooks.BEFORE_EACH], // Optional, default: ['beforeEach']
  timeout: 5000, // Optional, overrides defaultTimeout
});

// Deploy multiple
citadel.deployOutpost([outpost1, outpost2, outpost3]);
```

### abandonOutpost

```typescript
citadel.abandonOutpost(scope, name);
```

Removes outpost(s) by scope and name.

```typescript
citadel.abandonOutpost(NavigationOutpostScopes.ROUTE, 'outpost-name');
citadel.abandonOutpost(NavigationOutpostScopes.ROUTE, ['name1', 'name2']);
```

### getOutpostNames

```typescript
citadel.getOutpostNames(scope);
```

Returns array of deployed outpost names.

```typescript
citadel.getOutpostNames(NavigationOutpostScopes.GLOBAL); // ['auth', 'analytics']
```

### assignOutpostToRoute

```typescript
citadel.assignOutpostToRoute(routeName, outpostNames);
```

Assigns outpost(s) to an existing route dynamically.

```typescript
citadel.assignOutpostToRoute('admin', 'admin-only');
citadel.assignOutpostToRoute('settings', ['auth', 'verified']);
```

Returns `true` if route was found and outposts assigned, `false` otherwise.

### destroy

```typescript
citadel.destroy();
```

Removes all navigation hooks and clears registry.

> See [API Internals](./docs/internals.md#️-api-internals) for registry structure and outpost
> processing diagrams.

## 🔍 Logging & Debug

Citadel provides two options for development insights:

```typescript
const citadel = createNavigationCitadel(router, {
  log: true, // Console logging (default: __DEV__)
  debug: false, // Logging + debugger breakpoints (default: false)
});
```

| Option  | Default   | Description                                 |
| ------- | --------- | ------------------------------------------- |
| `log`   | `__DEV__` | Enables console logging for navigation flow |
| `debug` | `false`   | Enables logging + `debugger` breakpoints    |

> `__DEV__` is `true` in development (`import.meta.env.DEV` or `NODE_ENV !== 'production'`), `false`
> in production.

> `debug: true` automatically enables logging.
>
> See [Logging Reference](./docs/internals.md#-logging-reference) and
> [Debug Reference](./docs/internals.md#-debug-reference) for detailed events and breakpoints.

## 💡 Examples

See [examples](./examples) directory for more usage patterns:

- [auth.ts](./examples/auth.ts) — Global outposts with BLOCK and redirect verdicts
- [global-different-hooks.ts](./examples/global-different-hooks.ts) — Global outposts using
  beforeEach, beforeResolve, afterEach
- [nested-routes.ts](./examples/nested-routes.ts) — Route outposts inheritance with priority sorting
- [route-multiple-hooks.ts](./examples/route-multiple-hooks.ts) — Single outpost handling multiple
  hooks, role-based access

## 📦 Exports

```typescript
import {
  createNavigationCitadel,
  NavigationOutpostScopes,
  NavigationHooks,
  NavigationOutpostVerdicts,
} from 'vue-router-citadel';
```

> See [Exports Reference](./docs/internals.md#-exports-reference) for all constants, types, and
> interfaces.

## 📖 Internals

Deep dive into how vue-router-citadel works:

**[View Internals](./docs/internals.md)** — diagrams, logging details, and debug breakpoints.

## 📄 License

MIT
