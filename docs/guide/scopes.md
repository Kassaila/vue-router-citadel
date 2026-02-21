---
description: Global and route outpost scopes in Vue Router Citadel — priority sorting, processing order, nested route deduplication.
---

# ⭕ Outpost Scopes

Outposts are organized into two scopes that determine when they are processed during navigation.

## 🌐 Scope Types

| Scope    | Processing                  | Priority Sorting | Use Case                     |
| -------- | --------------------------- | ---------------- | ---------------------------- |
| `GLOBAL` | Every navigation            | Yes              | Auth, maintenance, analytics |
| `ROUTE`  | Only when assigned to route | Yes              | Route-specific permissions   |

## 🔢 Priority

Outposts within each scope are sorted by priority. Lower number = earlier execution.

```typescript
citadel.deployOutpost([
  { name: 'analytics', handler: analyticsHandler, priority: 200 }, // runs third
  { name: 'auth', handler: authHandler, priority: 10 }, // runs first
  { name: 'permissions', handler: permHandler, priority: 50 }, // runs second
]);
```

The default priority is `100` (configurable via `defaultPriority` option). Sorting happens at
deploy time, not during navigation — so there is no runtime overhead.

## 📊 Processing Order

**Processing order:**

1. Global outposts (sorted by priority, lower = first)
2. Route outposts (sorted by priority, filtered by `meta.outposts`)

```mermaid
flowchart LR
    A[Navigation Start] --> B

    subgraph B[Global Scope]
        B1[Outposts<br/>sorted by priority] --> B2{All ALLOW?}
    end

    B2 -->|Yes| D
    B2 -->|No| E[🔴 BLOCK / Redirect]

    subgraph D[Route Scope]
        D1[Outposts<br/>sorted by priority] --> D2{All ALLOW?}
    end

    D2 -->|Yes| G[🟢 Navigation Completes]
    D2 -->|No| E
```

## 🗺️ Route Outposts

Route outposts only run when referenced in a route's `meta.outposts` array:

```typescript
// Static assignment in route definition
const routes = [
  {
    path: '/admin',
    component: AdminPage,
    meta: { outposts: ['admin-only'] },
  },
];
```

```typescript
// Dynamic assignment via API
citadel.assignOutpostToRoute('admin', ['admin-only', 'audit']);

// Dynamic removal via API
citadel.revokeOutpostFromRoute('admin', 'audit');
```

## 🔄 Nested Routes & Deduplication

When navigating to nested routes, outposts from all matched routes in the hierarchy are collected.
Duplicates are automatically removed with a warning.

```mermaid
flowchart TD
    subgraph Routes["Route Definition"]
        A["'/admin'<br/>meta.outposts: ['auth']"]
        B["'/admin/users'<br/>meta.outposts: ['auth', 'audit']"]
        A --> B
    end

    subgraph Collection["Navigation to /admin/users"]
        C["Collect outpost names from matched stack"]
        D["['auth', 'auth', 'audit']"]
        E["🟡 Deduplicate"]
        F["🟡 log.warn: duplicates detected"]
    end

    subgraph Execution["Processing"]
        G["Get deployed outposts"]
        H["Filter assigned outposts"]
        I["🟢 Process by priority"]
    end

    B -.-> C
    C --> D
    D --> E
    D --> F
    E --> G
    G --> H
    H --> I
```

**Best practice:** Avoid duplicating outpost names in nested routes. Place shared outposts only on
the parent route.

<!--@include: ../_snippets/legend.md-->
