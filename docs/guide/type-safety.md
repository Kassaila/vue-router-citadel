---
description: Enable TypeScript autocomplete and compile-time validation for outpost names using declaration merging in Vue Router Citadel.
---

# 🔒 Type-Safe Outpost Names

Enable autocomplete and compile-time validation for outpost names using TypeScript declaration
merging.

## 🔧 How It Works

The library exports two empty interfaces that you can extend:

- `GlobalOutpostRegistry` — for global outpost names
- `RouteOutpostRegistry` — for route outpost names

When extended, TypeScript infers the allowed names and provides:

- Autocomplete in IDE
- Compile-time error on typos
- Scope-aware validation (global names can't be used where route names expected)

If registries are not extended, names fall back to `string` (no type checking).

## 💡 Simple Example

Create a declaration file in your project:

```typescript
// src/outposts.d.ts
declare module 'vue-router-citadel' {
  interface GlobalOutpostRegistry {
    auth: true;
    maintenance: true;
    analytics: true;
  }

  interface RouteOutpostRegistry {
    'admin-only': true;
    'verified-email': true;
    'premium': true;
  }
}
```

Now TypeScript validates names everywhere:

```typescript
import { createNavigationCitadel, NavigationOutpostScopes } from 'vue-router-citadel';

const citadel = createNavigationCitadel(router, {
  outposts: [
    {
      scope: NavigationOutpostScopes.GLOBAL,
      name: 'auth', // ✓ autocomplete: auth, maintenance, analytics
      handler: authHandler,
    },
    {
      scope: NavigationOutpostScopes.ROUTE,
      name: 'admin-only', // ✓ autocomplete: admin-only, verified-email, premium
      handler: adminHandler,
    },
  ],
});

// Scope-aware validation
citadel.abandonOutpost('global', 'auth'); // ✓
citadel.abandonOutpost('global', 'admin-only'); // ✗ Error: not a global outpost
citadel.abandonOutpost('route', 'premium'); // ✓

// Route meta typed
const routes = [
  {
    path: '/admin',
    meta: { outposts: ['admin-only', 'premium'] }, // ✓ autocomplete
  },
  {
    path: '/settings',
    meta: { outposts: ['typo'] }, // ✗ TypeScript error
  },
];
```

## 📛 Naming Conventions

For modular projects, use namespace prefixes to avoid conflicts:

```typescript
// Pattern: 'module:action'
declare module 'vue-router-citadel' {
  interface GlobalOutpostRegistry {
    'app:maintenance': true;
    'app:feature-flags': true;
    'auth:check': true;
    'auth:refresh': true;
    'analytics:track': true;
  }

  interface RouteOutpostRegistry {
    'auth:require-login': true;
    'auth:require-verified': true;
    'auth:guest-only': true;
    'admin:require-role': true;
    'billing:require-premium': true;
  }
}
```

**Benefits:**

- Clear module ownership
- No naming conflicts between modules
- Easy to filter/search by module

**Dynamic names (advanced):**

```typescript
declare module 'vue-router-citadel' {
  interface RouteOutpostRegistry {
    'tenant:access': true;
    [key: `tenant:${string}:admin`]: true; // tenant:foo:admin, tenant:bar:admin
  }
}
```

## 🚀 Advanced Patterns

For large applications, see [Modular Apps](/advanced/modular-apps) for:

- **Modular Architecture** — each module extends registries in its own declaration file
- **Dependency Injection** — outposts as injectable services (InversifyJS, tsyringe)
