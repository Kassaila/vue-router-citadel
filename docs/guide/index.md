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

- **Large-scale modular apps** — type-safe declarations per module, DI support
  ([advanced patterns](/advanced/modular-apps))
- **Dynamic management** — deploy/abandon outposts and assign/revoke to routes at runtime
  ([dynamic management](/guide/dynamic-management))

**Navigation Logic:**

- **Complex auth flows** — SSO, MFA, session refresh, token validation
- **Data preloading** — fetch data before navigation completes

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
