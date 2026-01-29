# Router Middleware Pipeline

Vue Router middleware plugin with return-based API and parent route inheritance.

## Setup

### 1. Create pipeline

```typescript
// src/router/middleware.ts
import { createMiddlewarePipeline } from '@/plugin/router-middleware-pipeline';
import router from '@/router';

export const middleware = createMiddlewarePipeline(router, {
    debug: true,
    onError: (error, ctx) => {
        console.error(error);
        return { name: 'error' };
    },
});
```

### 2. Register global middlewares

Global middlewares run on every route navigation.

```typescript
// src/router/middleware.ts
import { RouterHook, MiddlewareType } from '@/plugin/router-middleware-pipeline';

// Auth middleware - runs first (priority: 10)
middleware.register({
    type: MiddlewareType.GLOBAL,
    name: 'auth',
    priority: 10,
    handler: async ({ action: { ALLOW }, to }) => {
        const isAuthenticated = !!localStorage.getItem('token');

        if (to.meta.requiresAuth && !isAuthenticated) {
            return { name: 'login', query: { redirect: to.fullPath } };
        }

        if (to.meta.guestOnly && isAuthenticated) {
            return { name: 'dashboard' };
        }

        return ALLOW;
    },
});

// Page title middleware - runs after navigation
middleware.register({
    type: MiddlewareType.GLOBAL,
    name: 'page-title',
    hooks: [RouterHook.AFTER_EACH],
    handler: ({ to }) => {
        document.title = to.meta.title || 'My App';
    },
});
```

### 3. Register route middlewares

Route middlewares run only when specified in route's `meta.middleware`.

```typescript
// src/router/middleware.ts
import { MiddlewareType } from '@/plugin/router-middleware-pipeline';

middleware.register({
    type: MiddlewareType.ROUTE,
    name: 'admin',
    handler: async ({ action: { ALLOW } }) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (user.role !== 'admin') {
            return { name: 'forbidden' };
        }

        return ALLOW;
    },
});

middleware.register({
    type: MiddlewareType.ROUTE,
    name: 'verified',
    handler: async ({ action: { ALLOW } }) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!user.emailVerified) {
            return { name: 'verify-email' };
        }

        return ALLOW;
    },
});
```

### 4. Define routes

```typescript
// src/router/routes.ts
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

    // Route with specific middleware
    {
        path: '/admin',
        name: 'admin',
        component: () => import('@/pages/Admin.vue'),
        meta: {
            middleware: ['admin'],
            title: 'Admin Panel',
        },
    },

    // Nested routes - children inherit parent middlewares
    {
        path: '/account',
        component: () => import('@/layouts/AccountLayout.vue'),
        meta: {
            middleware: ['verified'],
        },
        children: [
            {
                path: 'profile',
                name: 'profile',
                component: () => import('@/pages/Profile.vue'),
                // inherits: requiresAuth + verified
            },
            {
                path: 'settings',
                name: 'settings',
                component: () => import('@/pages/Settings.vue'),
                meta: {
                    middleware: ['admin'], // inherits verified, adds admin
                },
            },
        ],
    },
];
```

### 5. Import middleware in main

```typescript
// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './router/middleware'; // Initialize middleware

createApp(App).use(router).mount('#app');
```

## Middleware Return Values

| Return                 | Result                      |
| ---------------------- | --------------------------- |
| MiddlewareAction.ALLOW | Continue to next middleware |
| MiddlewareAction.BLOCK | Cancel navigation           |
| `{ name: 'route' }`    | Redirect                    |
| `{ path: '/path' }`    | Redirect                    |
| `throw Error`          | Handled by `onError`        |

## Execution Order

```
Navigation: /account/settings

1. Global middlewares (by priority)
   └── auth (priority: 10)

2. Parent route middlewares
   └── verified (from /account)

3. Current route middlewares
   └── admin (from /account/settings)
```

## API

```typescript
import { MiddlewareType } from '@/plugin/router-middleware-pipeline';

// Add single middleware
middleware.register({ type: MiddlewareType.GLOBAL, name, handler, priority?, hooks? });

// Add multiple middlewares
middleware.register([
    { type: MiddlewareType.GLOBAL, name: 'auth', handler: authHandler, priority: 10 },
    { type: MiddlewareType.ROUTE, name: 'admin', handler: adminHandler },
    { type: MiddlewareType.ROUTE, name: 'verified', handler: verifiedHandler },
]);

// Remove single middleware
middleware.delete(MiddlewareType.ROUTE, 'admin');

// Remove multiple middlewares (same type)
middleware.delete(MiddlewareType.ROUTE, ['admin', 'verified']); // returns true if all deleted

// List registered
middleware.getMiddlewares(MiddlewareType.GLOBAL); // ['auth', 'page-title']
middleware.getMiddlewares(MiddlewareType.ROUTE);  // ['admin', 'verified']

// Cleanup
middleware.destroy();
```

## Route Meta Types

Available in `to.meta`:

```typescript
interface RouteMeta {
    middleware?: (string | Middleware)[];
}
```
