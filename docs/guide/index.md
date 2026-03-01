---
description: Learn what Vue Router Citadel is — a middleware-driven navigation control system for Vue Router with layered outpost-based route protection.
---

<img src="/og_image.png" alt="Vue Router Citadel — Structured navigation defense for Vue Router" style="width: 100%; border-radius: 12px; margin-bottom: 24px;" />

# 🏰 What is Citadel?

**Vue Router Citadel** is a middleware-driven navigation control system for Vue Router 4 & 5 that
lets you build **layered, predictable, and scalable route protection**.

Where Vue Router gives you guards at the entrance, Citadel introduces **navigation outposts** —
internal checkpoints that control access, preload data, enforce permissions, and orchestrate complex
navigation flows.

Think of it as turning your router into a fortress.

## 🧱 The Fortress Philosophy

Multiple layers of control — just like a real fortress.

```
🏰 Citadel → ✋ Outposts (🛡 Guards) → 📍 Final point
```

## ✨ Designed for Scalable Apps

**Access Control:**

- **RBAC systems** — role checks, permission gates, admin areas
- **Multi-tenant apps** — tenant validation, subscription tiers, feature flags

**Architecture:**

- **Large-scale modular apps** — type-safe declarations per module
  ([advanced patterns](/advanced/modular-apps))
- **Dynamic management** — deploy/abandon outposts and assign/revoke to routes at runtime
  ([dynamic management](/guide/dynamic-management))

**Navigation Logic:**

- **Complex auth flows** — SSO, MFA, session refresh, token validation
- **Data preloading** — fetch data before navigation completes

## 🔄 Before & After

As an application grows, navigation logic tends to scatter across multiple `beforeEach` calls —
each one independent, unordered, and hard to reason about:

**Before — scattered guards:**

```typescript
// auth.ts
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { name: 'login' };
  }
});

// roles.ts
router.beforeEach((to) => {
  if (to.meta.role && getUser().role !== to.meta.role) {
    return { name: 'forbidden' };
  }
});

// onboarding.ts
router.beforeEach((to) => {
  if (to.meta.requiresOnboarding && !getUser().completedRegistration) {
    return { name: 'onboarding' };
  }
});

// analytics.ts
router.afterEach((to) => {
  trackPageView(to.path);
});
```

No guaranteed execution order, no error handling, no timeouts, guards don't know about each other,
removing a guard at runtime requires manual bookkeeping.

**After — unified citadel:**

```typescript
const citadel = createNavigationCitadel(router, {
  outposts: [
    { name: 'auth', priority: 10, handler: authHandler },
    { name: 'role-access', scope: 'route', priority: 20, handler: roleHandler },
    { name: 'onboarding', scope: 'route', handler: onboardingHandler },
    { name: 'analytics', hooks: ['afterEach'], handler: analyticsHandler },
  ],
  defaultTimeout: 5000,
  onError: ({ error }) => {
    reportError(error);
    return verdicts.BLOCK;
  },
});
```

One entry point, explicit priority, scoped activation, timeout protection, structured error
handling — all in a single declaration.

## 🔑 Key Concepts

### Outpost

A navigation outpost is a named, prioritized handler that runs during navigation. Each outpost
receives context (route info, router instance) and returns a **verdict**: allow, block, or redirect.

### Scope

Outposts come in two scopes:

- **Global** — runs on every navigation
- **Route** — runs only when referenced in `route.meta.outposts`

### Verdict

Instead of `next()` callbacks, outposts return values:

- `verdicts.ALLOW` — continue navigation
- `verdicts.BLOCK` — cancel navigation
- `RouteLocationRaw` — redirect to another route

### Priority

Lower number = earlier execution. This gives you fine-grained control over processing order.

## 🚀 Next Steps

- [Getting Started](/guide/getting-started) — install and set up your first outpost
- [Comparison](/guide/comparison) — how Citadel compares to alternatives
