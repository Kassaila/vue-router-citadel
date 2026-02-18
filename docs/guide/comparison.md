# ⚔️ Comparison

**Vue Router** provides built-in navigation guards (`beforeEach`, `beforeResolve`, `afterEach`), but as
applications grow, managing multiple guards becomes complex. Several libraries attempt to solve this
problem. Here's how they compare to **Vue Router Citadel**.

## 📊 Feature Matrix

| Feature                                         | Citadel | [route-guard] | [router-shield] | [easy-route] | [programic] |
| ----------------------------------------------- | :-----: | :-----------: | :-------------: | :----------: | :---------: |
| TypeScript (native)                             |   ✅    |      ✅       |       ❌        |      ✅      |     ✅      |
| [Return-based API](/guide/verdicts)             |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |
| [Dynamic management](/guide/dynamic-management) |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |
| [Multiple hooks](/guide/hooks)                  |    3    |       1       |        3        |      1       |      1      |
| [Global scope](/guide/scopes)                   |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |
| [Route scope](/guide/scopes)                    |   ✅    |      ✅       |       ✅        |      ✅      |     ✅      |
| [Priority ordering](/guide/scopes#priority)     |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |
| [Timeout control](/guide/timeout)               |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |
| [Lazy loading](/guide/lazy-outposts)            |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |
| [Type-safe names](/guide/type-safety)           |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |
| [Error handling](/guide/error-handling)         |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |
| [Vue DevTools](/guide/devtools)                 |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |
| [Logging & debug](/advanced/logging)            |   ✅    |      ❌       |       ❌        |      ❌      |     ❌      |
| Bundle size (brotli)                            |  ≤4 KB  |     ~3 KB     |      ~1 KB      |    ~3 KB     |    ~1 KB    |

[route-guard]: https://www.npmjs.com/package/@this-dot/vue-route-guard
[router-shield]: https://www.npmjs.com/package/vue-router-shield
[easy-route]: https://www.npmjs.com/package/@warhsn/easy-route-vue
[programic]: https://www.npmjs.com/package/@programic/vue-router-middleware

## 📦 Alternatives

**[@this-dot/vue-route-guard](https://www.npmjs.com/package/@this-dot/vue-route-guard)**
— From This Dot Labs. Angular-style guard configuration with `canActivate` / `canDeactivate`
checks. Vue Router 4, TypeScript.

```js
createRouteGuard({
  routes: [{ path: '/dashboard', canActivate: [isAuthenticated] }],
});
```

**[vue-router-shield](https://www.npmjs.com/package/vue-router-shield)** — Adds `beforeUpdate` and
`beforeLeave` guards to Vue Router 4 via a plugin. Guards are defined in `route.meta.shield`. Plain
JavaScript.

```js
const route = {
  path: '/profile',
  meta: {
    shield: {
      beforeEach: [authMiddleware],
      beforeUpdate: [trackMiddleware],
    },
  },
};
```

**[@warhsn/easy-route-vue](https://www.npmjs.com/package/@warhsn/easy-route-vue)** — Laravel-inspired
middleware system. Supports TypeScript and Vue Router 4.

```js
const route = {
  path: '/admin',
  meta: {
    middleware: ['auth', 'admin'],
  },
};
```

**[@programic/vue-router-middleware](https://www.npmjs.com/package/@programic/vue-router-middleware)** — Modern
middleware abstraction for Vue Router 4. Built with Vite and vitest. Native TypeScript.

```js
const route = {
  path: '/dashboard',
  meta: {
    middleware: [authMiddleware],
  },
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
- **≤4 KB** — minimal footprint (minified + brotli)

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
