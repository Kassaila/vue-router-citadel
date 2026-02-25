---
description: Production patterns — route-scoped outposts for RBAC, onboarding, payment validation, and async account checks with meta-driven configuration.
---

# 🏭 Production Patterns

Route-scoped outposts with meta-driven configuration from fintech projects.

## 📋 Overview

This example shows four route-scoped outposts commonly found in production applications:

- **role-access** (priority 20) — RBAC check via route meta role
- **onboarding-complete** (priority 100) — redirects if registration is incomplete
- **payment-supported** (priority 100) — validates payment method support with fallback redirect
- **account-setup** (priority 100) — async account completeness check with store loading

## 💻 Code

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { createNavigationCitadel, NavigationOutpostScopes } from 'vue-router-citadel';

// RBAC — role check via route meta
const roleAccessNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'role-access',
  priority: 20,
  handler: ({ verdicts, to }) => {
    const user = useAuth().user();

    if (user.role !== to.meta.role) {
      return { name: 'forbidden' };
    }

    return verdicts.ALLOW;
  },
};

// Onboarding — redirect if registration is not completed
const onboardingNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'onboarding-complete',
  handler: ({ verdicts }) => {
    if (!useAuth().user().completedRegistration) {
      return { name: 'onboarding' };
    }

    return verdicts.ALLOW;
  },
};

// Payment validation — check payment method support with fallback redirect
const paymentNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'payment-supported',
  handler: ({ verdicts, to }) => {
    const settings = useTransactionSettings();

    if (!settings.hasPaymentMethod(to.meta.paymentMethod)) {
      return to.meta.redirect ?? { name: 'dashboard' };
    }

    return verdicts.ALLOW;
  },
};

// Account completeness — async check with store data loading
const accountSetupNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'account-setup',
  handler: async ({ verdicts }) => {
    const accountStore = useAccountStore();

    await accountStore.loadChecks();

    if (accountStore.isBlocked) {
      return { name: 'account-completeness' };
    }

    return verdicts.ALLOW;
  },
};

const outposts = [
  roleAccessNavigationOutpost,
  onboardingNavigationOutpost,
  paymentNavigationOutpost,
  accountSetupNavigationOutpost,
];

// Routes reference outposts by name — decoupled from implementation
const routes = [
  { path: '/', name: 'home', component: () => import('./pages/Home.vue') },
  { path: '/login', name: 'login', component: () => import('./pages/Login.vue') },
  { path: '/forbidden', name: 'forbidden', component: () => import('./pages/Forbidden.vue') },
  { path: '/onboarding', name: 'onboarding', component: () => import('./pages/Onboarding.vue') },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('./pages/Admin.vue'),
    meta: { outposts: [roleAccessNavigationOutpost.name], role: 'admin' },
  },
  {
    path: '/account',
    name: 'account',
    component: () => import('./pages/Account.vue'),
    meta: { outposts: [onboardingNavigationOutpost.name, accountSetupNavigationOutpost.name] },
  },
  {
    path: '/account/completeness',
    name: 'account-completeness',
    component: () => import('./pages/AccountCompleteness.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('./pages/Dashboard.vue'),
  },
  {
    path: '/payment/card',
    name: 'payment-card',
    component: () => import('./pages/PaymentCard.vue'),
    meta: {
      outposts: [paymentNavigationOutpost.name],
      paymentMethod: 'card',
      redirect: { name: 'payment-methods' },
    },
  },
  {
    path: '/payment/methods',
    name: 'payment-methods',
    component: () => import('./pages/PaymentMethods.vue'),
  },
];

// 1. Create router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 2. Create navigation citadel with outposts
const citadel = createNavigationCitadel(router, {
  outposts,
});

export { router, citadel };
```

## 🔑 Key Points

- **Route scope** — outposts activate only on routes that reference them via `meta.outposts`
- **Meta-driven config** — routes pass data (`role`, `paymentMethod`, `redirect`) to outposts through `meta`
- **Fallback redirect** — `to.meta.redirect ?? { name: 'dashboard' }` provides per-route redirect override
- **Async handlers** — `account-setup` loads store data before checking, works seamlessly with sync outposts
