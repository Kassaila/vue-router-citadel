---
description: Nested routes example — route outpost inheritance from parent routes with priority-based auth, verification, and premium checks.
---

# 🪆 Nested Routes

Route outposts inheritance from parent routes with priority sorting.

## 📋 Overview

This example shows three route outposts with different priorities:

- **auth** (priority 10) — redirects unauthenticated users
- **verified** (priority 20) — requires verified email
- **premium** (priority 30) — requires premium subscription

Outposts are inherited from parent routes and deduplicated.

## 💻 Code

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { createNavigationCitadel, NavigationOutpostScopes } from 'vue-router-citadel';

// Auth outpost - redirects to home if user is not authenticated
// Priority 10 - runs first (lower = earlier)
const authNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'auth',
  priority: 10,
  handler: ({ verdicts }) => {
    const token = localStorage.getItem('token');

    if (!token) {
      return { name: 'home' };
    }

    return verdicts.ALLOW;
  },
};

// Verified outpost - requires user email to be verified
// Priority 20 - runs after auth
const verifiedNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'verified',
  priority: 20,
  handler: ({ verdicts }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.emailVerified) {
      return { name: 'account' }; // redirect to account page to verify email
    }

    return verdicts.ALLOW;
  },
};

// Premium outpost - requires user to have premium subscription
// Priority 30 - runs after verified
const premiumNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'premium',
  priority: 30,
  handler: ({ verdicts }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.isPremium) {
      return { name: 'account-settings' };
    }

    return verdicts.ALLOW;
  },
};

const outposts = [authNavigationOutpost, verifiedNavigationOutpost, premiumNavigationOutpost];

const routes = [
  { path: '/', name: 'home', component: () => import('./pages/Home.vue') },
  {
    path: '/account',
    component: () => import('./layouts/AccountLayout.vue'),
    meta: {
      outposts: [authNavigationOutpost.name], // all child routes inherit auth
    },
    children: [
      {
        path: '',
        name: 'account',
        component: () => import('./pages/Account.vue'),
        // inherits auth outpost from parent
      },
      {
        path: 'settings',
        name: 'account-settings',
        component: () => import('./pages/AccountSettings.vue'),
        meta: {
          outposts: [verifiedNavigationOutpost.name], // inherits auth, adds verified
        },
      },
      {
        path: 'billing',
        name: 'account-billing',
        component: () => import('./pages/AccountBilling.vue'),
        meta: {
          outposts: [verifiedNavigationOutpost.name, premiumNavigationOutpost.name],
          // inherits auth, adds verified and premium
        },
      },
    ],
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

## 🔄 Route Outpost Resolution

| Route               | Outposts (inherited + own)    |
| ------------------- | ----------------------------- |
| `/account`          | `auth`                        |
| `/account/settings` | `auth`, `verified`            |
| `/account/billing`  | `auth`, `verified`, `premium` |

All outposts run in priority order regardless of where they were declared.
