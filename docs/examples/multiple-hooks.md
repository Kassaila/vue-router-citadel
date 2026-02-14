# 🪝 Multiple Hooks

Single route outpost handling multiple hooks with role-based access.

## 📋 Overview

This example shows:

- **admin-only** outpost handling both `beforeResolve` and `afterEach` hooks
- **moderator-only** outpost with default `beforeEach` hook

## 💻 Code

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import {
  createNavigationCitadel,
  NavigationOutpostScopes,
  NavigationHooks,
} from 'vue-router-citadel';

// Admin only outpost - restricts access to admin role,
// handles beforeResolve and afterEach hooks
const adminOnlyNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'admin-only',
  hooks: [NavigationHooks.BEFORE_RESOLVE, NavigationHooks.AFTER_EACH],
  handler: ({ verdicts, hook }) => {
    switch (hook) {
      case NavigationHooks.BEFORE_RESOLVE: {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (user.role !== 'admin') {
          return { name: 'home' };
        }

        return verdicts.ALLOW;
      }
      case NavigationHooks.AFTER_EACH: {
        // track admin page view or perform cleanup

        return verdicts.ALLOW;
      }
      default: {
        return verdicts.ALLOW;
      }
    }
  },
};

// Moderator only outpost - allows access to admin and moderator roles
const moderatorOnlyNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'moderator-only',
  handler: ({ verdicts }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!['admin', 'moderator'].includes(user.role)) {
      return { name: 'home' };
    }

    return verdicts.ALLOW;
  },
};

const outposts = [adminOnlyNavigationOutpost, moderatorOnlyNavigationOutpost];

const routes = [
  { path: '/', name: 'home', component: () => import('./pages/Home.vue') },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('./pages/Admin.vue'),
    meta: {
      outposts: [adminOnlyNavigationOutpost.name],
    },
  },
  {
    path: '/moderator',
    name: 'moderator',
    component: () => import('./pages/Moderator.vue'),
    meta: {
      outposts: [moderatorOnlyNavigationOutpost.name],
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const citadel = createNavigationCitadel(router, {
  outposts,
});

export { router, citadel };
```

## 🔑 Key Points

- A single outpost can handle **multiple hooks** via the `hooks` array
- Use the `hook` property from context to branch logic per hook
- `afterEach` handler return values are ignored (post-navigation, can't block)
- `switch` on `hook` is the recommended pattern for multi-hook outposts
