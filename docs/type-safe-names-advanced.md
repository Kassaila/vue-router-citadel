# 🔐 Advanced Type-Safe Outpost Names

Advanced patterns for organizing type-safe outpost names in large applications.

For basics, see [Type-Safe Outpost Names](./internals.md#-type-safe-outpost-names) in internals.

---

<!-- TOC -->

- [🔐 Advanced Type-Safe Outpost Names](#-advanced-type-safe-outpost-names)
  - [📦 Modular Architecture](#-modular-architecture)
  - [💉 Dependency Injection](#-dependency-injection)

<!-- /TOC -->

---

## 📦 Modular Architecture

For large applications with modular structure, each module can extend the registries in its own
declaration file.

**Project structure:**

```
src/
├── core/
│   └── citadel/
│       ├── index.ts
│       └── outposts.d.ts      # core outposts
├── modules/
│   ├── auth/
│   │   ├── outposts/
│   │   │   ├── index.ts       # handlers
│   │   │   └── outposts.d.ts  # auth registry
│   │   └── routes.ts
│   ├── admin/
│   │   └── outposts/
│   │       └── outposts.d.ts  # admin registry
│   └── billing/
│       └── outposts/
│           └── outposts.d.ts  # billing registry
└── main.ts
```

**Core module — src/core/citadel/outposts.d.ts:**

```typescript
declare module 'vue-router-citadel' {
  interface GlobalOutpostRegistry {
    'app:maintenance': true;
    'app:feature-flags': true;
  }
}
```

**Auth module — src/modules/auth/outposts/outposts.d.ts:**

```typescript
declare module 'vue-router-citadel' {
  interface GlobalOutpostRegistry {
    'auth:check': true;
    'auth:refresh-token': true;
  }

  interface RouteOutpostRegistry {
    'auth:require-login': true;
    'auth:require-verified': true;
    'auth:guest-only': true;
  }
}
```

**Auth module — src/modules/auth/outposts/index.ts:**

```typescript
import type { NavigationOutpostHandler } from 'vue-router-citadel';
import { useAuthStore } from '../store';

export const authCheckHandler: NavigationOutpostHandler = ({ verdicts }) => {
  const auth = useAuthStore();
  auth.checkSession();
  return verdicts.ALLOW;
};

export const requireLoginHandler: NavigationOutpostHandler = ({ verdicts, to }) => {
  const auth = useAuthStore();
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  return verdicts.ALLOW;
};

export const guestOnlyHandler: NavigationOutpostHandler = ({ verdicts }) => {
  const auth = useAuthStore();
  if (auth.isAuthenticated) {
    return { name: 'dashboard' };
  }
  return verdicts.ALLOW;
};
```

**Auth module — src/modules/auth/index.ts:**

```typescript
import { citadel } from '@/core/citadel';
import { authCheckHandler, requireLoginHandler, guestOnlyHandler } from './outposts';

export function registerAuthModule() {
  citadel.deployOutpost([
    {
      scope: 'global',
      name: 'auth:check', // ✓ typed
      priority: 5,
      handler: authCheckHandler,
    },
    {
      scope: 'route',
      name: 'auth:require-login', // ✓ typed
      handler: requireLoginHandler,
    },
    {
      scope: 'route',
      name: 'auth:guest-only', // ✓ typed
      handler: guestOnlyHandler,
    },
  ]);
}
```

**Auth module — src/modules/auth/routes.ts:**

```typescript
export const authRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./pages/Login.vue'),
    meta: { outposts: ['auth:guest-only'] }, // ✓ typed
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('./pages/Dashboard.vue'),
    meta: { outposts: ['auth:require-login'] }, // ✓ typed
  },
];
```

**Admin module — src/modules/admin/outposts/outposts.d.ts:**

```typescript
declare module 'vue-router-citadel' {
  interface RouteOutpostRegistry {
    'admin:require-role': true;
    'admin:audit-log': true;
  }
}
```

**Main entry — src/main.ts:**

```typescript
import { registerAuthModule } from './modules/auth';
import { registerAdminModule } from './modules/admin';
import { registerBillingModule } from './modules/billing';

registerAuthModule();
registerAdminModule();
registerBillingModule();
```

---

## 💉 Dependency Injection

For applications using DI containers (InversifyJS, tsyringe), outposts can be organized as
injectable services.

**DI tokens — src/di/tokens.ts:**

```typescript
export const TOKENS = {
  Citadel: Symbol('Citadel'),
  Router: Symbol('Router'),
  AuthService: Symbol('AuthService'),
} as const;
```

**Citadel service — src/core/citadel/citadel.service.ts:**

```typescript
import { injectable, inject } from 'inversify';
import { createNavigationCitadel, type NavigationCitadelAPI } from 'vue-router-citadel';
import type { Router } from 'vue-router';
import { TOKENS } from '@/di/tokens';

@injectable()
export class CitadelService {
  private citadel: NavigationCitadelAPI;

  constructor(@inject(TOKENS.Router) router: Router) {
    this.citadel = createNavigationCitadel(router);
  }

  get api() {
    return this.citadel;
  }
}
```

**Auth outposts — src/modules/auth/outposts/auth.outposts.ts:**

```typescript
import { injectable, inject } from 'inversify';
import type { NavigationOutpost } from 'vue-router-citadel';
import { TOKENS } from '@/di/tokens';
import type { AuthService } from '../services/auth.service';

@injectable()
export class AuthOutposts {
  constructor(@inject(TOKENS.AuthService) private authService: AuthService) {}

  getOutposts(): NavigationOutpost[] {
    return [
      {
        scope: 'global',
        name: 'auth:check', // ✓ typed
        priority: 5,
        handler: ({ verdicts }) => {
          this.authService.checkSession();
          return verdicts.ALLOW;
        },
      },
      {
        scope: 'route',
        name: 'auth:require-login', // ✓ typed
        handler: ({ verdicts, to }) => {
          if (!this.authService.isAuthenticated) {
            return { name: 'login', query: { redirect: to.fullPath } };
          }
          return verdicts.ALLOW;
        },
      },
    ];
  }
}
```

**Auth module — src/modules/auth/auth.module.ts:**

```typescript
import { injectable, inject } from 'inversify';
import { TOKENS } from '@/di/tokens';
import type { CitadelService } from '@/core/citadel/citadel.service';
import { AuthOutposts } from './outposts/auth.outposts';

@injectable()
export class AuthModule {
  constructor(
    @inject(TOKENS.Citadel) private citadel: CitadelService,
    @inject(AuthOutposts) private outposts: AuthOutposts,
  ) {}

  register() {
    this.citadel.api.deployOutpost(this.outposts.getOutposts());
  }
}
```
