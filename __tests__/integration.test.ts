import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createNavigationCitadel } from '../src/navigationCitadel';
import { NavigationOutpostScopes, NavigationHooks } from '../src/types';
import {
  createMockRouter,
  createMockLogger,
  createAllowHandler,
  createBlockHandler,
  createRedirectHandler,
  createErrorHandler,
} from './helpers/setup';

describe('integration', () => {
  let router: ReturnType<typeof createMockRouter>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(async () => {
    router = createMockRouter();
    mockLogger = createMockLogger();
    await router.push('/');
    await router.isReady();
  });

  describe('navigation flow', () => {
    it('allows navigation when all outposts return ALLOW', async () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'allow1',
        handler: createAllowHandler(),
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'allow2',
        handler: createAllowHandler(),
      });

      await router.push('/dashboard');

      expect(router.currentRoute.value.name).toBe('dashboard');

      citadel.destroy();
    });

    it('blocks navigation when outpost returns BLOCK', async () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'blocker',
        handler: createBlockHandler(),
      });

      await router.push('/dashboard').catch(() => {});

      expect(router.currentRoute.value.name).toBe('home');

      citadel.destroy();
    });

    it('redirects when outpost returns RouteLocationRaw', async () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'redirector',
        handler: ({ to }) => {
          // Only redirect if not already on login
          if (to.name !== 'login') {
            return { name: 'login' };
          }
          return 'allow';
        },
      });

      await router.push('/dashboard');

      expect(router.currentRoute.value.name).toBe('login');

      citadel.destroy();
    });

    it('processes outposts in priority order', async () => {
      const order: string[] = [];

      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'third',
        priority: 30,
        handler: () => {
          order.push('third');
          return 'allow';
        },
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'first',
        priority: 10,
        handler: () => {
          order.push('first');
          return 'allow';
        },
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'second',
        priority: 20,
        handler: () => {
          order.push('second');
          return 'allow';
        },
      });

      await router.push('/dashboard');

      expect(order).toEqual(['first', 'second', 'third']);

      citadel.destroy();
    });
  });

  describe('error handling', () => {
    it('calls onError handler on error', async () => {
      const onError = vi.fn().mockReturnValue('allow');

      const citadel = createNavigationCitadel(router, {
        log: false,
        onError,
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'error-thrower',
        handler: createErrorHandler('Test error'),
      });

      await router.push('/dashboard');

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error' }),
        expect.objectContaining({ hook: NavigationHooks.BEFORE_EACH }),
      );

      citadel.destroy();
    });

    it('blocks navigation by default on error', async () => {
      const citadel = createNavigationCitadel(router, {
        log: false,
        logger: mockLogger,
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'error-thrower',
        handler: createErrorHandler('Test error'),
      });

      await router.push('/dashboard').catch(() => {});

      expect(router.currentRoute.value.name).toBe('home');
      expect(mockLogger.calls.some((c) => c.level === 'error')).toBe(true);

      citadel.destroy();
    });

    it('onError can redirect on error', async () => {
      const citadel = createNavigationCitadel(router, {
        log: false,
        onError: (_, ctx) => {
          // Only redirect if not already on error page
          if (ctx.to.name !== 'error') {
            return { name: 'error' };
          }
          return 'allow';
        },
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'error-thrower',
        handler: ({ to }) => {
          // Only throw error when navigating to dashboard
          if (to.name === 'dashboard') {
            throw new Error('Test error');
          }
          return 'allow';
        },
      });

      await router.push('/dashboard');

      expect(router.currentRoute.value.name).toBe('error');

      citadel.destroy();
    });
  });

  describe('hooks', () => {
    it('runs outpost on specified hooks only', async () => {
      const beforeEachCalls: string[] = [];
      const beforeResolveCalls: string[] = [];

      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'beforeEach-only',
        hooks: [NavigationHooks.BEFORE_EACH],
        handler: () => {
          beforeEachCalls.push('beforeEach');
          return 'allow';
        },
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'beforeResolve-only',
        hooks: [NavigationHooks.BEFORE_RESOLVE],
        handler: () => {
          beforeResolveCalls.push('beforeResolve');
          return 'allow';
        },
      });

      await router.push('/dashboard');

      expect(beforeEachCalls).toHaveLength(1);
      expect(beforeResolveCalls).toHaveLength(1);

      citadel.destroy();
    });

    it('runs outpost on multiple hooks', async () => {
      const calls: string[] = [];

      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'multi-hook',
        hooks: [NavigationHooks.BEFORE_EACH, NavigationHooks.BEFORE_RESOLVE],
        handler: ({ hook }) => {
          calls.push(hook);
          return 'allow';
        },
      });

      await router.push('/dashboard');

      expect(calls).toContain(NavigationHooks.BEFORE_EACH);
      expect(calls).toContain(NavigationHooks.BEFORE_RESOLVE);

      citadel.destroy();
    });

    it('afterEach runs for side effects only', async () => {
      const calls: string[] = [];

      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'afterEach-logger',
        hooks: [NavigationHooks.AFTER_EACH],
        handler: () => {
          calls.push('afterEach');
          return 'allow';
        },
      });

      await router.push('/dashboard');

      // Wait for afterEach to complete (it's async)
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(calls).toContain('afterEach');
      expect(router.currentRoute.value.name).toBe('dashboard');

      citadel.destroy();
    });
  });

  describe('route outposts', () => {
    it('processes route outposts from meta', async () => {
      const routerWithMeta = createMockRouter([
        { path: '/', name: 'home', component: { template: '<div/>' } },
        {
          path: '/admin',
          name: 'admin',
          component: { template: '<div/>' },
          meta: { outposts: ['admin-check'] },
        },
        { path: '/login', name: 'login', component: { template: '<div/>' } },
      ]);

      await routerWithMeta.push('/');
      await routerWithMeta.isReady();

      const citadel = createNavigationCitadel(routerWithMeta, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.ROUTE,
        name: 'admin-check',
        handler: createRedirectHandler({ name: 'login' }),
      });

      await routerWithMeta.push('/admin');

      expect(routerWithMeta.currentRoute.value.name).toBe('login');

      citadel.destroy();
    });

    it('skips route outposts for routes without meta', async () => {
      const calls: string[] = [];

      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.ROUTE,
        name: 'route-guard',
        handler: () => {
          calls.push('route-guard');
          return 'allow';
        },
      });

      await router.push('/dashboard');

      expect(calls).toHaveLength(0);
      expect(router.currentRoute.value.name).toBe('dashboard');

      citadel.destroy();
    });
  });

  describe('context', () => {
    it('provides correct context to handler', async () => {
      let capturedContext: unknown;

      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'context-checker',
        handler: (ctx) => {
          capturedContext = ctx;
          return 'allow';
        },
      });

      await router.push('/dashboard');

      expect(capturedContext).toMatchObject({
        verdicts: { ALLOW: 'allow', BLOCK: 'block' },
        to: expect.objectContaining({ name: 'dashboard' }),
        from: expect.objectContaining({ name: 'home' }),
        router: expect.any(Object),
        hook: NavigationHooks.BEFORE_EACH,
      });

      citadel.destroy();
    });
  });
});
