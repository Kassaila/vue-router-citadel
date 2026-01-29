# Vue Router Citadel

[![npm version](https://img.shields.io/npm/v/vue-router-citadel.svg)](https://www.npmjs.com/package/vue-router-citadel)
[![license](https://img.shields.io/npm/l/vue-router-citadel.svg)](https://github.com/Kassaila/vue-router-citadel/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/vue-router-citadel.svg)](https://www.npmjs.com/package/vue-router-citadel)

Type-safe Vue Router guard system with return-based API. Features: global & route-scoped posts,
parent route inheritance, priority ordering, multiple hook support (beforeEach, beforeResolve,
afterEach). Guards return verdicts: ALLOW, BLOCK, or redirect. Zero boilerplate, full control.

## Setup

### 1. Create citadel

```typescript
import { createNavigationCitadel } from 'vue-router-citadel';
import router from '@/router';

export const citadel = createNavigationCitadel(router, {
  debug: true,
  defaultPriority: 100,
  onError: (error, ctx) => {
    console.error(error);
    return { name: 'error' };
  },
});
```

### 2. Register global posts

Global posts run on every route navigation.

```typescript
import { NavigationHooks, NavigationPostScopes } from 'vue-router-citadel';

// Auth post - runs first (priority: 10)
citadel.register({
  scope: NavigationPostScopes.GLOBAL,
  name: 'auth',
  priority: 10,
  handler: async ({ verdicts, to }) => {
    const isAuthenticated = !!localStorage.getItem('token');

    if (to.meta.requiresAuth && !isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    if (to.meta.guestOnly && isAuthenticated) {
      return { name: 'dashboard' };
    }

    return verdicts.ALLOW;
  },
});

// Page title post - runs after navigation
citadel.register({
  scope: NavigationPostScopes.GLOBAL,
  name: 'page-title',
  hooks: [NavigationHooks.AFTER_EACH],
  handler: ({ verdicts, to }) => {
    document.title = to.meta.title || 'My App';

    return verdicts.ALLOW;
  },
});
```

### 3. Register route posts

Route posts run only when specified in route's `meta.navigationPosts`.

```typescript
import { NavigationPostScopes } from 'vue-router-citadel';

citadel.register({
  scope: NavigationPostScopes.ROUTE,
  name: 'admin',
  handler: async ({ verdicts }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (user.role !== 'admin') {
      return { name: 'forbidden' };
    }

    return verdicts.ALLOW;
  },
});

citadel.register({
  scope: NavigationPostScopes.ROUTE,
  name: 'verified',
  handler: async ({ verdicts }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.emailVerified) {
      return { name: 'verify-email' };
    }

    return verdicts.ALLOW;
  },
});
```

### 4. Define routes

```typescript
const routes = [
  // Public routes
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/Login.vue'),
    meta: {
      title: 'Login',
    },
  },

  // Protected routes
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/pages/Dashboard.vue'),
    meta: {
      title: 'Dashboard',
    },
  },

  // Route with specific posts
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/pages/Admin.vue'),
    meta: {
      navigationPosts: ['admin'],
      title: 'Admin Panel',
    },
  },

  // Nested routes - children inherit parent posts
  {
    path: '/account',
    component: () => import('@/layouts/AccountLayout.vue'),
    meta: {
      navigationPosts: ['verified'],
    },
    children: [
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/pages/Profile.vue'),
        // inherits: verified
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/pages/Settings.vue'),
        meta: {
          navigationPosts: ['admin'], // inherits verified, adds admin
        },
      },
    ],
  },
];
```

### 5. Import citadel in main

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './router/citadel'; // Initialize citadel

createApp(App).use(router).mount('#app');
```

## Post Return Values

| Return              | Result                 |
| ------------------- | ---------------------- |
| `verdicts.ALLOW`    | Continue to next post  |
| `verdicts.BLOCK`    | Cancel navigation      |
| `{ name: 'route' }` | Redirect               |
| `{ path: '/path' }` | Redirect               |
| `'/path'`           | Redirect (string path) |
| `throw Error`       | Handled by `onError`   |

Returning `null`, `undefined`, or any other invalid value will throw an error.

## Execution Order

```
Navigation: /account/settings

1. Global posts (by priority)
   └── auth (priority: 10)

2. Parent route posts
   └── verified (from /account)

3. Current route posts
   └── admin (from /account/settings)
```

## API

```typescript
import { NavigationPostScopes } from 'vue-router-citadel';

// Add single post
citadel.register({ scope: NavigationPostScopes.GLOBAL, name, handler, priority?, hooks? });

// Add multiple posts
citadel.register([
  { scope: NavigationPostScopes.GLOBAL, name: 'auth', handler: authHandler, priority: 10 },
  { scope: NavigationPostScopes.ROUTE, name: 'admin', handler: adminHandler },
  { scope: NavigationPostScopes.ROUTE, name: 'verified', handler: verifiedHandler },
]);

// Remove single post
citadel.delete(NavigationPostScopes.ROUTE, 'admin');

// Remove multiple posts (same scope)
citadel.delete(NavigationPostScopes.ROUTE, ['admin', 'verified']);

// List registered
citadel.getPosts(NavigationPostScopes.GLOBAL); // ['auth', 'page-title']
citadel.getPosts(NavigationPostScopes.ROUTE);  // ['admin', 'verified']

// Cleanup
citadel.destroy();
```

## Route Meta Types

```typescript
interface RouteMeta {
  navigationPosts?: string[]; // registered post names
}
```

## License

MIT
