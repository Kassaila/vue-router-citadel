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
- [📚 API](#-api)
  - [createNavigationCitadel(router, options?)](#createnavigationcitadelrouter-options)
  - [citadel.deploy(options)](#citadeldeployoptions)
  - [citadel.abandon(scope, name)](#citadelabandonscope-name)
  - [citadel.getOutposts(scope)](#citadelgetoutpostsscope)
  - [citadel.destroy()](#citadeldestroy)
- [📤 Exported Constants](#-exported-constants)
- [↩️ Handler Return Values](#️-handler-return-values)
- [🎯 Outpost Scopes](#-outpost-scopes)
- [🪝 Navigation Hooks](#-navigation-hooks)
- [🔍 Logging & Debug](#-logging--debug)
- [💡 Examples](#-examples)
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

// 3. Register outpost
citadel.deploy({
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

## 📚 API

### createNavigationCitadel(router, options?)

Creates a navigation citadel instance.

```typescript
const citadel = createNavigationCitadel(router, {
  log: true, // Enable console logging (default: true)
  debug: false, // Enable logging + debugger breakpoints (default: false)
  defaultPriority: 100, // Default priority for global outposts
  onError: (error, ctx) => {
    // Custom error handler (default: console.error + BLOCK)
    return { name: 'error' };
  },
});
```

### citadel.deploy(options)

Registers one or multiple navigation outposts.

```typescript
citadel.deploy({
  scope: NavigationOutpostScopes.GLOBAL, // or NavigationOutpostScopes.ROUTE
  name: 'outpost-name',
  handler: ({ verdicts, to, from, router, hook }) => {
    return verdicts.ALLOW;
  },
  priority: 10, // Optional, for global outposts (lower = earlier)
  hooks: [NavigationHooks.BEFORE_EACH], // Optional, default: ['beforeEach']
});

// Register multiple
citadel.deploy([outpost1, outpost2, outpost3]);
```

### citadel.abandon(scope, name)

Removes outpost(s) by scope and name.

```typescript
citadel.abandon(NavigationOutpostScopes.ROUTE, 'outpost-name');
citadel.abandon(NavigationOutpostScopes.ROUTE, ['name1', 'name2']);
```

### citadel.getOutposts(scope)

Returns array of registered outpost names.

```typescript
citadel.getOutposts(NavigationOutpostScopes.GLOBAL); // ['auth', 'analytics']
```

### citadel.destroy()

Removes all navigation hooks and clears registry.

## 📤 Exported Constants

```typescript
import {
  NavigationOutpostScopes, // { GLOBAL, ROUTE }
  NavigationHooks, // { BEFORE_EACH, BEFORE_RESOLVE, AFTER_EACH }
  NavigationOutpostVerdicts, // { ALLOW, BLOCK }
  DEFAULT_NAVIGATION_OUTPOST_PRIORITY, // 100
} from 'vue-router-citadel';
```

## ↩️ Handler Return Values

| Return              | Result                    |
| ------------------- | ------------------------- |
| `verdicts.ALLOW`    | Continue navigation       |
| `verdicts.BLOCK`    | Cancel navigation         |
| `{ name: 'route' }` | Redirect to named route   |
| `{ path: '/path' }` | Redirect to path          |
| `'/path'`           | Redirect to path (string) |

> Redirect routes are validated against the router. If route is not found, an error is thrown.

## 🎯 Outpost Scopes

| Scope    | Description                                   |
| -------- | --------------------------------------------- |
| `GLOBAL` | Calls on every navigation, sorted by priority |
| `ROUTE`  | Calls only when referenced in `meta.outposts` |

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

## 🔍 Logging & Debug

Citadel provides two options for development insights:

```typescript
const citadel = createNavigationCitadel(router, {
  log: true, // Console logging (default: true)
  debug: false, // Logging + debugger breakpoints (default: false)
});
```

### Options

| Option  | Default | Description                                 |
| ------- | ------- | ------------------------------------------- |
| `log`   | `true`  | Enables console logging for navigation flow |
| `debug` | `false` | Enables logging + `debugger` breakpoints    |

> `debug: true` automatically enables logging.

### Console Methods

| Method          | Usage                                                      |
| --------------- | ---------------------------------------------------------- |
| `console.info`  | Navigation flow, patrolling, running outposts, registering |
| `console.warn`  | Outpost not found, already exists, patrol stopped          |
| `console.error` | Outpost errors, unhandled exceptions                       |

### Debugger Breakpoints

When `debug: true`, breakpoints are triggered at:

| Location         | Description                                     |
| ---------------- | ----------------------------------------------- |
| Navigation start | Before `beforeEach`/`beforeResolve`/`afterEach` |
| Before outpost   | Before each outpost handler execution           |
| Patrol stopped   | When outpost returns `BLOCK` or redirect        |
| Error caught     | When outpost throws an error                    |

## 💡 Examples

See [examples](./examples) directory for more usage patterns:

- [auth.ts](./examples/auth.ts) — Global outposts with BLOCK and redirect
- [global-different-hooks.ts](./examples/global-different-hooks.ts) — Using different hooks
- [nested-routes.ts](./examples/nested-routes.ts) — Route outposts inheritance
- [route-multiple-hooks.ts](./examples/route-multiple-hooks.ts) — Single outpost with multiple hooks

## 📄 License

MIT
