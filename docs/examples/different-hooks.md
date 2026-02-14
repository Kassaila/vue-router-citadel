# 🔀 Different Hooks

Global outposts using beforeEach, beforeResolve, and afterEach hooks.

## 📋 Overview

This example shows four global outposts, each using a different hook:

- **auth** (`beforeEach`) — checks authentication
- **data-loader** (`beforeResolve`) — loads async data
- **analytics** (`afterEach`) — tracks page views
- **page-title** (`afterEach`) — updates document title

## 💻 Code

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { createNavigationCitadel, NavigationHooks } from 'vue-router-citadel';

// Auth outpost (beforeEach) - checks authentication on every navigation
// scope defaults to 'global', so it can be omitted
const authNavigationOutpost = {
  name: 'auth',
  priority: 10,
  handler: ({ verdicts, to }) => {
    const isAuthenticated = Boolean(localStorage.getItem('token'));

    if (to.meta.requiresAuth && !isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    return verdicts.ALLOW;
  },
};

// Data loader outpost (beforeResolve) - loads async data before component resolves
const dataLoaderNavigationOutpost = {
  name: 'data-loader',
  hooks: [NavigationHooks.BEFORE_RESOLVE],
  handler: async ({ verdicts, to }) => {
    // await loadPageData(to);

    return verdicts.ALLOW;
  },
};

// Analytics outpost (afterEach) - tracks page views after navigation completes
const analyticsNavigationOutpost = {
  name: 'analytics',
  hooks: [NavigationHooks.AFTER_EACH],
  handler: ({ verdicts, to }) => {
    // analytics.track('page_view', { path: to.path });

    return verdicts.ALLOW;
  },
};

// Page title outpost (afterEach) - updates document title after navigation
const pageTitleNavigationOutpost = {
  name: 'page-title',
  hooks: [NavigationHooks.AFTER_EACH],
  handler: ({ verdicts, to }) => {
    document.title = (to.meta.title as string) || 'My App';

    return verdicts.ALLOW;
  },
};

const outposts = [
  authNavigationOutpost,
  dataLoaderNavigationOutpost,
  analyticsNavigationOutpost,
  pageTitleNavigationOutpost,
];

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./pages/Home.vue'),
    meta: { title: 'Home' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('./pages/About.vue'),
    meta: { title: 'About Us' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const citadel = createNavigationCitadel(router, {
  outposts,
  debug: true,
});

export { router, citadel };
```

## 🔄 Navigation Flow

For a navigation to `/about`:

| Phase      | Outpost       | Hook            | Action             |
| ---------- | ------------- | --------------- | ------------------ |
| 1. Before  | `auth`        | `beforeEach`    | Check auth         |
| 2. Resolve | `data-loader` | `beforeResolve` | Load page data     |
| 3. After   | `analytics`   | `afterEach`     | Track page view    |
| 4. After   | `page-title`  | `afterEach`     | Set document title |

Each hook phase processes only the outposts registered for that hook.
