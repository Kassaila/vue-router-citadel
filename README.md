# 🏰 Vue Router Citadel

> _Place guards at the gates. Outposts along the way._

[![npm version](https://img.shields.io/npm/v/vue-router-citadel.svg)](https://www.npmjs.com/package/vue-router-citadel)
[![license](https://img.shields.io/npm/l/vue-router-citadel.svg)](https://github.com/Kassaila/vue-router-citadel/blob/main/LICENSE)

**Structured navigation defense for Vue Router 4 & 5.**

Citadel is a middleware-driven navigation control system for Vue Router that lets you build
**layered, predictable, and scalable route protection**.

Where Vue Router gives you guards at the entrance, Citadel introduces **navigation outposts** ---
internal checkpoints that control access, preload data, enforce permissions, and orchestrate complex
navigation flows.

Think of it as turning your router into a fortress.

---

<!-- TOC -->

- [🏰 Vue Router Citadel](#-vue-router-citadel)
  - [🧱 The Fortress Philosophy](#-the-fortress-philosophy)
  - [✨ Designed for scalable apps](#-designed-for-scalable-apps)
  - [📦 Installation](#-installation)
  - [🚀 Quick Start](#-quick-start)
  - [🎯 Outpost Scopes](#-outpost-scopes)
  - [🪝 Navigation Hooks](#-navigation-hooks)
  - [↩️ Outpost Handler Return Values](#-outpost-handler-return-values)
  - [⏱️ Outpost Timeout](#-outpost-timeout)
  - [🦥 Lazy Outposts](#-lazy-outposts)
  - [📚 API](#-api)
  - [🔍 Logging & Debug](#-logging--debug)
  - [🛠️ Vue DevTools](#-vue-devtools)
  - [🔒 Type-Safe Outpost Names](#-type-safe-outpost-names)
  - [💡 Examples](#-examples)
  - [📦 Exports](#-exports)
  - [📖 Internals](#-internals)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)

<!-- /TOC -->

---

## 🧱 The Fortress Philosophy

Multiple layers of control --- just like a real fortress.

    🏰 Citadel → 🗼 Outposts (🛡 Guards) → 🎯 Final point

## ✨ Designed for scalable apps

**Access Control:**

- **RBAC systems** — role checks, permission gates, admin areas
- **Multi-tenant apps** — tenant validation, subscription tiers, feature flags

**Architecture:**

- **Large-scale modular apps** — type-safe declarations per module, DI support
  ([advanced patterns](./docs/type-safe-names-advanced.md))

**Navigation Logic:**

- **Complex auth flows** — SSO, MFA, session refresh, token validation
- **Data preloading** — fetch data before navigation completes

## 📦 Installation

```bash
npm install vue-router-citadel
```

## 🚀 Quick Start

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { createNavigationCitadel } from 'vue-router-citadel';
import { createApp } from 'vue';
import App from './App.vue';

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

// 2. Create navigation citadel with outposts
const citadel = createNavigationCitadel(router, {
  outposts: [
    {
      name: 'auth', // scope defaults to 'global'
      handler: ({ verdicts, to }) => {
        const isAuthenticated = Boolean(localStorage.getItem('token'));

        if (to.meta.requiresAuth && !isAuthenticated) {
          return { name: 'login' };
        }

        return verdicts.ALLOW;
      },
    },
  ],
});

// 3. Create app and install plugins
const app = createApp(App);

app.use(router);
app.use(citadel); // DevTools auto-initialized
app.mount('#app');

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

## ⏱️ Outpost Timeout

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

## 🦥 Lazy Outposts

Load heavy outpost handlers on-demand for better code splitting.

```typescript
// Eager — loaded immediately (default)
import { authCheck } from './outposts/auth';

citadel.deployOutpost({ name: 'auth', handler: authCheck });

// Lazy — loaded on first navigation
citadel.deployOutpost({
  name: 'heavy-validation',
  lazy: true,
  handler: () => import('./outposts/heavy-validation'),
});
```

> See [Lazy Outposts](./docs/internals.md#-lazy-outposts) for how it works, timeout behavior, and
> detailed examples.

## 📚 API

| Method                                      | Description                 |
| ------------------------------------------- | --------------------------- |
| `createNavigationCitadel(router, options?)` | Creates citadel instance    |
| `deployOutpost(options)`                    | Deploys outpost(s)          |
| `abandonOutpost(scope, name)`               | Removes outpost(s)          |
| `getOutpostNames(scope)`                    | Returns deployed names      |
| `assignOutpostToRoute(routeName, names)`    | Assigns outposts to route   |
| `destroy()`                                 | Removes hooks, clears state |

```typescript
// Deploy outpost
citadel.deployOutpost({
  name: 'auth',
  handler: ({ verdicts, to }) => {
    if (to.meta.requiresAuth && !isAuthenticated()) {
      return { name: 'login' };
    }
    return verdicts.ALLOW;
  },
});

// Remove outpost
citadel.abandonOutpost(NavigationOutpostScopes.GLOBAL, 'auth');
```

> See [API Usage](./docs/internals.md#-api-usage) for all options and detailed examples.

## 🔍 Logging & Debug

| Option         | Type            | Default                       | Description                                       |
| -------------- | --------------- | ----------------------------- | ------------------------------------------------- |
| `log`          | `boolean`       | `__DEV__`                     | Enable non-critical logs. Critical always logged. |
| `logger`       | `CitadelLogger` | `createDefaultLogger()`       | Custom logger implementation                      |
| `debug`        | `boolean`       | `false`                       | Enables logging + `debugger` breakpoints          |
| `debugHandler` | `DebugHandler`  | `createDefaultDebugHandler()` | Custom debug handler for breakpoints              |

```typescript
createNavigationCitadel(router, { log: false }); // Disable non-critical logging
createNavigationCitadel(router, { debug: true }); // Enable debug breakpoints
```

> See [Logging & Custom Logger](./docs/internals.md#-logging--custom-logger) for custom logger
> examples and [Debug Reference](./docs/internals.md#-debug-reference) for breakpoint details.

## 🛠️ Vue DevTools

Custom inspector for viewing deployed outposts. Enabled automatically in development.

```typescript
app.use(citadel); // DevTools enabled (default: __DEV__)
```

| Option     | Type      | Default   | Description                          |
| ---------- | --------- | --------- | ------------------------------------ |
| `devtools` | `boolean` | `__DEV__` | Enable Vue DevTools custom inspector |

> See [DevTools Integration](./docs/internals.md#-devtools-integration) for inspector features and
> settings panel details.

## 🔒 Type-Safe Outpost Names

Enable autocomplete and compile-time validation using TypeScript declaration merging.

```typescript
// src/outposts.d.ts
declare module 'vue-router-citadel' {
  interface GlobalOutpostRegistry {
    auth: true;
  }
  interface RouteOutpostRegistry {
    'admin-only': true;
  }
}
```

```typescript
citadel.deployOutpost({ name: 'auth', handler }); // ✓ autocomplete
citadel.deployOutpost({ name: 'typo', handler }); // ✗ TypeScript error
```

> Registries are optional. Without them, names fall back to `string`.
>
> See [Type-Safe Outpost Names](./docs/internals.md#-type-safe-outpost-names) for advanced patterns
> and naming conventions.

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
  type NavigationOutpost,
  type NavigationOutpostHandler,
} from 'vue-router-citadel';
```

> See [Exports Reference](./docs/internals.md#-exports-reference) for all constants, types, and
> interfaces.

## 📖 Internals

Deep dive into how vue-router-citadel works:

**[View Internals](./docs/internals.md)** — diagrams, logging details, and debug breakpoints.

## 🤝 Contributing

Contributions are welcome! See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for guidelines.

For testing details and all test cases, see **[docs/testing.md](./docs/testing.md)**.

## 📄 License

MIT
