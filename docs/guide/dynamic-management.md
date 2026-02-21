---
description: Deploy, abandon, assign, and revoke outposts at runtime — dynamic navigation guard management in Vue Router Citadel.
---

# 🔄 Dynamic Management

Add, remove, and reassign outposts at runtime without restarting the application.

## ⚡ Static vs Dynamic

**Static setup** — all outposts defined at initialization:

```typescript
const citadel = createNavigationCitadel(router, {
  outposts: [
    { name: 'auth', handler: authHandler },
    { name: 'analytics', handler: analyticsHandler, hooks: [NavigationHooks.AFTER_EACH] },
  ],
});
```

**Dynamic management** — outposts added, removed, or reassigned at runtime:

```typescript
// Later, when admin module loads
citadel.deployOutpost({
  scope: NavigationOutpostScopes.ROUTE,
  name: 'admin-only',
  handler: adminHandler,
});

// When feature is disabled
citadel.abandonOutpost(NavigationOutpostScopes.ROUTE, 'admin-only');
```

Both approaches can be combined — start with core outposts, add module-specific ones dynamically.

## 📦 Deploy & Abandon

### Adding Outposts

```typescript
// Module loaded lazily — registers its guards
export function registerBillingModule(citadel: NavigationCitadelAPI) {
  citadel.deployOutpost([
    {
      scope: NavigationOutpostScopes.ROUTE,
      name: 'billing:premium',
      handler: premiumHandler,
    },
    {
      scope: NavigationOutpostScopes.ROUTE,
      name: 'billing:trial-expired',
      handler: trialHandler,
    },
  ]);
}
```

### Removing Outposts

```typescript
// Feature flag disabled — remove the guard
citadel.abandonOutpost(NavigationOutpostScopes.GLOBAL, 'feature-flags');

// Module unloaded
citadel.abandonOutpost(NavigationOutpostScopes.ROUTE, ['billing:premium', 'billing:trial-expired']);
```

`abandonOutpost` returns `true` if the outpost was found and removed, `false` otherwise.

## 🗺️ Assign & Revoke Routes

Outpost-to-route binding can also be managed dynamically, without changing route definitions.

**Static assignment** (in route config):

```typescript
const routes = [
  {
    path: '/admin',
    name: 'admin',
    meta: { outposts: ['admin-only'] },
  },
];
```

**Dynamic assignment** (at runtime):

```typescript
// Add outpost requirement to a route
citadel.assignOutpostToRoute('admin', 'audit-log');

// Route now requires both: ['admin-only', 'audit-log']
```

**Dynamic revocation:**

```typescript
// Remove outpost requirement from a route
citadel.revokeOutpostFromRoute('admin', 'audit-log');

// Route now requires only: ['admin-only']
```

Duplicates are automatically filtered — calling `assignOutpostToRoute` multiple times with the same
name is safe.

## 💡 Use Cases

| Scenario             | Deploy / Abandon                               | Assign / Revoke                       |
| -------------------- | ---------------------------------------------- | ------------------------------------- |
| Lazy feature modules | Module registers outposts on load              | Module assigns outposts to its routes |
| Role-based access    | Deploy role-specific outposts after login      | —                                     |
| Multi-tenant         | Deploy tenant-specific guards on tenant switch | Assign tenant guards to routes        |
| A/B testing          | Deploy variant guard, abandon when test ends   | —                                     |
| Maintenance mode     | Deploy maintenance outpost globally            | —                                     |
| Feature flags        | Deploy/abandon based on flag changes           | Assign/revoke based on flag state     |

::: tip
For full method signatures, see [API Methods](/api/#deployoutpost). For organizing outposts across
modules, see [Modular Apps](/advanced/modular-apps).
:::
