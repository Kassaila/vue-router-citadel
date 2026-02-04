import { describe, it, expect, beforeEach } from 'vitest';

import { normalizeOutcome, patrol, toNavigationGuardReturn } from '../src/navigationOutposts';
import { createRegistry, register } from '../src/navigationRegistry';
import type { NavigationRegistry, NavigationOutpostContext } from '../src/types';
import { NavigationOutpostVerdicts, NavigationHooks } from '../src/types';
import {
  createMockRouter,
  createMockLogger,
  createAllowHandler,
  createBlockHandler,
  createRedirectHandler,
  createRegisteredOutpost,
} from './helpers/setup';

describe('navigationOutposts', () => {
  describe('normalizeOutcome', () => {
    const router = createMockRouter();

    it('returns ALLOW as-is', () => {
      const result = normalizeOutcome(NavigationOutpostVerdicts.ALLOW, router);
      expect(result).toBe('allow');
    });

    it('returns BLOCK as-is', () => {
      const result = normalizeOutcome(NavigationOutpostVerdicts.BLOCK, router);
      expect(result).toBe('block');
    });

    it('validates RouteLocationRaw string path', () => {
      const result = normalizeOutcome('/login', router);
      expect(result).toBe('/login');
    });

    it('validates RouteLocationRaw object with name', () => {
      const result = normalizeOutcome({ name: 'login' }, router);
      expect(result).toEqual({ name: 'login' });
    });

    it('validates RouteLocationRaw object with path', () => {
      const result = normalizeOutcome({ path: '/login' }, router);
      expect(result).toEqual({ path: '/login' });
    });

    it('throws on invalid route', () => {
      expect(() => normalizeOutcome({ name: 'nonexistent' }, router)).toThrow('No match for');
    });

    it('throws Error outcome', () => {
      const error = new Error('Test error');
      expect(() => normalizeOutcome(error, router)).toThrow('Test error');
    });

    it('throws on invalid outcome type', () => {
      expect(() => normalizeOutcome(123 as unknown as 'allow', router)).toThrow(
        'Invalid outpost outcome',
      );
    });
  });

  describe('toNavigationGuardReturn', () => {
    it('converts ALLOW to true', () => {
      expect(toNavigationGuardReturn(NavigationOutpostVerdicts.ALLOW)).toBe(true);
    });

    it('converts BLOCK to false', () => {
      expect(toNavigationGuardReturn(NavigationOutpostVerdicts.BLOCK)).toBe(false);
    });

    it('returns RouteLocationRaw as-is', () => {
      const redirect = { name: 'login' };
      expect(toNavigationGuardReturn(redirect)).toBe(redirect);
    });
  });

  describe('patrol', () => {
    let registry: NavigationRegistry;
    let router: ReturnType<typeof createMockRouter>;
    let mockLogger: ReturnType<typeof createMockLogger>;
    let ctx: NavigationOutpostContext;

    beforeEach(async () => {
      registry = createRegistry();
      router = createMockRouter();
      mockLogger = createMockLogger();

      // Initialize router
      await router.push('/');
      await router.isReady();

      ctx = {
        verdicts: NavigationOutpostVerdicts,
        to: router.currentRoute.value,
        from: router.currentRoute.value,
        router,
        hook: NavigationHooks.BEFORE_EACH,
      };
    });

    it('returns ALLOW when no outposts', async () => {
      const result = await patrol(registry, ctx, {}, mockLogger, { log: false, debug: false });
      expect(result).toBe('allow');
    });

    it('processes global outposts in priority order', async () => {
      const order: string[] = [];

      register(
        registry,
        'global',
        createRegisteredOutpost({
          name: 'second',
          priority: 20,
          handler: () => {
            order.push('second');
            return 'allow';
          },
        }),
        100,
        mockLogger,
      );

      register(
        registry,
        'global',
        createRegisteredOutpost({
          name: 'first',
          priority: 10,
          handler: () => {
            order.push('first');
            return 'allow';
          },
        }),
        100,
        mockLogger,
      );

      await patrol(registry, ctx, {}, mockLogger, { log: false, debug: false });

      expect(order).toEqual(['first', 'second']);
    });

    it('stops on BLOCK', async () => {
      const order: string[] = [];

      register(
        registry,
        'global',
        createRegisteredOutpost({
          name: 'blocker',
          priority: 10,
          handler: () => {
            order.push('blocker');
            return 'block';
          },
        }),
        100,
        mockLogger,
      );

      register(
        registry,
        'global',
        createRegisteredOutpost({
          name: 'after',
          priority: 20,
          handler: () => {
            order.push('after');
            return 'allow';
          },
        }),
        100,
        mockLogger,
      );

      const result = await patrol(registry, ctx, {}, mockLogger, { log: false, debug: false });

      expect(result).toBe('block');
      expect(order).toEqual(['blocker']);
    });

    it('stops on redirect', async () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({
          name: 'redirector',
          handler: createRedirectHandler({ name: 'login' }),
        }),
        100,
        mockLogger,
      );

      const result = await patrol(registry, ctx, {}, mockLogger, { log: false, debug: false });

      expect(result).toEqual({ name: 'login' });
    });

    it('filters outposts by hook', async () => {
      const order: string[] = [];

      register(
        registry,
        'global',
        createRegisteredOutpost({
          name: 'beforeEach',
          hooks: [NavigationHooks.BEFORE_EACH],
          handler: () => {
            order.push('beforeEach');
            return 'allow';
          },
        }),
        100,
        mockLogger,
      );

      register(
        registry,
        'global',
        createRegisteredOutpost({
          name: 'beforeResolve',
          hooks: [NavigationHooks.BEFORE_RESOLVE],
          handler: () => {
            order.push('beforeResolve');
            return 'allow';
          },
        }),
        100,
        mockLogger,
      );

      await patrol(registry, ctx, {}, mockLogger, { log: false, debug: false });

      expect(order).toEqual(['beforeEach']);
    });

    it('processes route outposts after global', async () => {
      const order: string[] = [];

      // Create route with outposts meta
      const routerWithMeta = createMockRouter([
        {
          path: '/',
          name: 'home',
          component: { template: '<div/>' },
          meta: { outposts: ['route-guard'] },
        },
        { path: '/login', name: 'login', component: { template: '<div/>' } },
      ]);

      await routerWithMeta.push('/');
      await routerWithMeta.isReady();

      const ctxWithMeta: NavigationOutpostContext = {
        verdicts: NavigationOutpostVerdicts,
        to: routerWithMeta.currentRoute.value,
        from: routerWithMeta.currentRoute.value,
        router: routerWithMeta,
        hook: NavigationHooks.BEFORE_EACH,
      };

      register(
        registry,
        'global',
        createRegisteredOutpost({
          name: 'global-guard',
          priority: 10,
          handler: () => {
            order.push('global');
            return 'allow';
          },
        }),
        100,
        mockLogger,
      );

      register(
        registry,
        'route',
        createRegisteredOutpost({
          name: 'route-guard',
          priority: 10,
          handler: () => {
            order.push('route');
            return 'allow';
          },
        }),
        100,
        mockLogger,
      );

      await patrol(registry, ctxWithMeta, {}, mockLogger, { log: false, debug: false });

      expect(order).toEqual(['global', 'route']);
    });

    it('warns on duplicate route outposts', async () => {
      // Create route with duplicate outposts
      const routerWithDuplicates = createMockRouter([
        {
          path: '/parent',
          component: { template: '<router-view/>' },
          meta: { outposts: ['shared'] },
          children: [
            {
              path: 'child',
              name: 'child',
              component: { template: '<div/>' },
              meta: { outposts: ['shared'] },
            },
          ],
        },
        { path: '/login', name: 'login', component: { template: '<div/>' } },
      ]);

      await routerWithDuplicates.push('/parent/child');
      await routerWithDuplicates.isReady();

      const ctxWithDuplicates: NavigationOutpostContext = {
        verdicts: NavigationOutpostVerdicts,
        to: routerWithDuplicates.currentRoute.value,
        from: routerWithDuplicates.currentRoute.value,
        router: routerWithDuplicates,
        hook: NavigationHooks.BEFORE_EACH,
      };

      register(
        registry,
        'route',
        createRegisteredOutpost({ name: 'shared', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      await patrol(registry, ctxWithDuplicates, {}, mockLogger, { log: false, debug: false });

      expect(
        mockLogger.calls.some(
          (c) => c.level === 'warn' && (c.args[0] as string).includes('Duplicate'),
        ),
      ).toBe(true);
    });

    it('silently skips route outposts not found in registry', async () => {
      const routerWithMeta = createMockRouter([
        {
          path: '/',
          name: 'home',
          component: { template: '<div/>' },
          meta: { outposts: ['nonexistent'] },
        },
      ]);

      await routerWithMeta.push('/');
      await routerWithMeta.isReady();

      const ctxWithMeta: NavigationOutpostContext = {
        verdicts: NavigationOutpostVerdicts,
        to: routerWithMeta.currentRoute.value,
        from: routerWithMeta.currentRoute.value,
        router: routerWithMeta,
        hook: NavigationHooks.BEFORE_EACH,
      };

      // Should not throw, just skip missing outposts
      const result = await patrol(registry, ctxWithMeta, {}, mockLogger, {
        log: false,
        debug: false,
      });

      expect(result).toBe('allow');
    });
  });
});
