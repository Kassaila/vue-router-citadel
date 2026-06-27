---
title: Getting Started
description: Install Vue Router Citadel and set up your first navigation outpost with a step-by-step quick start guide.
---

# 🚀 Getting Started

## 📦 Installation

```bash
npm install vue-router-citadel
```

**Peer dependencies:** `vue@^3.0.0`, `vue-router@^4.0.0 || ^5.0.0`

## ⚡ Quick Start

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

## 💡 What Just Happened?

1. **Created a router** with standard Vue Router routes
2. **Created a citadel** with one global outpost (`auth`) that checks authentication
3. **Installed both plugins** — citadel hooks into the router's navigation lifecycle

Now every navigation goes through the `auth` outpost. If the target route has `meta.requiresAuth`
and the user isn't authenticated, they're redirected to the login page.

## 🚀 Next Steps

- [Outpost Verdicts](/guide/verdicts) — handler return values
- [Navigation Hooks](/guide/hooks) — beforeEach, beforeResolve, afterEach
- [Outpost Scopes](/guide/scopes) — global vs route-scoped outposts
- [Examples](/examples/) — more usage patterns
