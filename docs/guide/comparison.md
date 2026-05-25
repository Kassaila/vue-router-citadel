---
title: Comparison
description: Compare Vue Router Citadel with alternative Vue Router middleware libraries — feature matrix, code examples, and key differences.
---

# ⚔️ Comparison

**Vue Router** provides built-in navigation guards (`beforeEach`, `beforeResolve`, `afterEach`), but as
applications grow, managing multiple guards becomes complex. Several libraries attempt to solve this
problem. Here's how they compare to **Vue Router Citadel**.

## 📊 Feature Matrix

| Feature                                         | Citadel | [route-guard] | [router-shield] | [easy-route] | [programic] | [vite-mw] |
| ----------------------------------------------- | :-----: | :-----------: | :-------------: | :----------: | :---------: | :-------: |
| TypeScript (native)                             |   ✅    |      ✅       |       ❌        |      ✅      |     ✅      |    ✅     |
| [Return-based API](/guide/verdicts)             |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |    ✅     |
| [Dynamic management](/guide/dynamic-management) |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |    ❌     |
| [Multiple hooks](/guide/hooks)                  |    3    |       1       |        1        |      1       |      2      |     1     |
| [Global scope](/guide/scopes)                   |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |    ✅     |
| [Route scope](/guide/scopes)                    |   ✅    |      ✅       |       ✅        |      ✅      |     ✅      |    ✅     |
| [Priority ordering](/guide/scopes#priority)     |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |    ✅     |
| [Timeout control](/guide/timeout)               |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |    ❌     |
| [Lazy loading](/guide/lazy-outposts)            |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |    ❌     |
| [Type-safe names](/guide/type-safety)           |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |    ✅     |
| [Error handling](/guide/error-handling)         |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |    ❌     |
| [Vue DevTools](/guide/devtools)                 |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |    ❌     |
| [Logging & debug](/advanced/logging)            |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |    ❌     |
| Bundle size (brotli)                            |  ≤3 KB  |     ~3 KB     |      ~1 KB      |    ~3 KB     |    ~1 KB    |   ~1 KB   |

[route-guard]: #vue-route-guard
[router-shield]: #vue-router-shield
[easy-route]: #easy-route-vue
[programic]: #programic-middleware
[vite-mw]: #vite-plugin-vue-middleware

## 📦 Alternatives

### @this-dot/vue-route-guard {#vue-route-guard}

[npm](https://www.npmjs.com/package/@this-dot/vue-route-guard) — From This Dot Labs. Declarative
authentication guard with token management and permission-based access control. Vue Router 4,
TypeScript.

```js
setupGuard({
  router,
  token: { name: 'AUTH_TOKEN', storage: StorageType.sessionStorage },
  redirect: { noAuthentication: '/login', noPermission: '/forbidden' },
  options: { fetchAuthentication: () => fetchUser() },
});

// Routes use meta fields:
// { path: '/dashboard', meta: { requiresAuth: true, access: ['admin'] } }
```

### vue-router-shield {#vue-router-shield}

[npm](https://www.npmjs.com/package/vue-router-shield) — Provides `BeforeEach`, `BeforeEnter`, and
`BeforeUpdate` guard types within a single `beforeEach` hook. Guards are defined in
`route.meta.guard`. Plain JavaScript.

```js
const route = {
  path: '/profile',
  meta: {
    guard: [new BeforeEach(authMiddleware), new BeforeUpdate(trackMiddleware)],
  },
};
```

### @warhsn/easy-route-vue {#easy-route-vue}

[npm](https://www.npmjs.com/package/@warhsn/easy-route-vue) — Laravel-inspired middleware system.
Supports TypeScript and Vue Router 4.

```js
const route = {
  path: '/admin',
  meta: {
    middleware: ['auth', 'admin'],
  },
};
```

### @programic/vue-router-middleware {#programic-middleware}

[npm](https://www.npmjs.com/package/@programic/vue-router-middleware) — Modern middleware
abstraction for Vue Router 4. Built with Vite and vitest. Native TypeScript.

```js
const route = {
  path: '/dashboard',
  meta: {
    middleware: [authMiddleware],
  },
};
```

### vite-plugin-vue-middleware {#vite-plugin-vue-middleware}

[npm](https://www.npmjs.com/package/vite-plugin-vue-middleware) — File-based middleware system
powered by Vite.

```js
// src/middleware/01.auth.global.ts
export default defineMiddleware((to, from) => {
  if (!isLoggedIn()) return '/login';
});

// src/middleware/admin.ts
export default defineMiddleware((to, from) => {
  if (!isAdmin()) return '/forbidden';
});

// route definition
const route = {
  path: '/admin',
  meta: { middleware: ['admin'] }, // type-checked via generated .d.ts
};
```

## 🏰 Why Citadel?

Vue Router Citadel is designed for applications that outgrow simple guard combinations:

- **Return-based API** — no `next()` callbacks, clean control flow with verdicts
- **Dynamic management** — deploy/abandon outposts and assign/revoke to routes at runtime
- **Multiple hooks** — `beforeEach`, `beforeResolve`, and `afterEach` support
- **Two scopes** — global outposts for app-wide checks, route outposts for page-specific logic
- **Priority ordering** — fine-grained control over execution order across all outposts
- **Timeout control** — global and per-outpost timeout with custom handlers
- **Lazy loading** — dynamic imports for code splitting heavy handlers
- **Type-safe names** — declaration merging for compile-time validation and IDE autocomplete
- **Error handling** — structured `onError` / `onTimeout` handlers with context and custom outcomes
- **Vue DevTools** — custom inspector for viewing and debugging deployed outposts
- **Logging & debug** — customizable logger, debug breakpoints, runtime log level control
- **≤3 KB** — minimal footprint (minified + brotli)

::: tip
See the [Getting Started](/guide/getting-started) guide to set up your first outpost in under 5
minutes.
:::

---

::: details Footnote
Of course, you can always write your own middleware system with `router.beforeEach` and
`route.meta` — it's only about 20 lines of code. Then add error handling, timeouts, priority
sorting, scoping, logging, devtools, types... and before you know it, you've written your own
library. We've been there. That's why this one exists.
:::
