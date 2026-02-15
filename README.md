# 🏰 Vue Router Citadel

> _Place guards at the gates. Outposts along the way._

[![npm version](https://img.shields.io/npm/v/vue-router-citadel.svg)](https://www.npmjs.com/package/vue-router-citadel)
[![license](https://img.shields.io/npm/l/vue-router-citadel.svg)](https://github.com/Kassaila/vue-router-citadel/blob/main/LICENSE)
[![docs](https://img.shields.io/badge/docs-VitePress-blue)](https://kassaila.github.io/vue-router-citadel/)

**Structured navigation defense for Vue Router 4 & 5.**

Citadel is a middleware-driven navigation control system for Vue Router that lets you build
**layered, predictable, and scalable route protection**.

Where Vue Router gives you guards at the entrance, Citadel introduces **navigation outposts** ---
internal checkpoints that control access, preload data, enforce permissions, and orchestrate complex
navigation flows.

Think of it as turning your router into a fortress.

    🏰 Citadel → ✋ Outposts (🛡 Guards) → 📍 Final point

## ✨ Features

- 🎯 **Outpost scopes** — global guards for every navigation, route-scoped guards for specific pages
- 🪝 **Navigation hooks** — beforeEach, beforeResolve, afterEach with priority-based execution order
- ↩️ **Return-based verdicts** — allow, block, or redirect with type-safe return values
- ⏱️ **Timeout protection** — prevent outposts from hanging navigation indefinitely
- 🦥 **Lazy outposts** — dynamic imports for code splitting
- 🔒 **Type-safe outpost names** — declaration merging for autocomplete and compile-time validation
- 🛠️ **Vue DevTools** — custom inspector for viewing deployed outposts
- 🔍 **Logging & debug** — configurable logging with debugger breakpoints

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

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const citadel = createNavigationCitadel(router, {
  outposts: [
    {
      name: 'auth',
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

const app = createApp(App);

app.use(router);
app.use(citadel);
app.mount('#app');
```

## 📖 Documentation

**[View full documentation](https://kassaila.github.io/vue-router-citadel/)** — guides, API
reference, examples, and advanced patterns.

## 🤝 Contributing

Contributions are welcome! See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for guidelines.

## 📄 License

MIT
