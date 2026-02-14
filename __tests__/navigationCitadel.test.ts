import type { App } from 'vue';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createNavigationCitadel } from '../src/navigationCitadel';
import { NavigationOutpostScopes } from '../src/types';
import { createMockRouter, createMockLogger, createAllowHandler } from './helpers/setup';

describe('navigationCitadel', () => {
  let router: ReturnType<typeof createMockRouter>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(async () => {
    router = createMockRouter();
    mockLogger = createMockLogger();
    await router.push('/');
    await router.isReady();
  });

  describe('createNavigationCitadel', () => {
    it('returns API object with all methods', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      expect(citadel).toHaveProperty('deployOutpost');
      expect(citadel).toHaveProperty('abandonOutpost');
      expect(citadel).toHaveProperty('getOutpostNames');
      expect(citadel).toHaveProperty('assignOutpostToRoute');
      expect(citadel).toHaveProperty('destroy');

      citadel.destroy();
    });

    it('registers router hooks', () => {
      const beforeEachSpy = vi.spyOn(router, 'beforeEach');
      const beforeResolveSpy = vi.spyOn(router, 'beforeResolve');
      const afterEachSpy = vi.spyOn(router, 'afterEach');

      const citadel = createNavigationCitadel(router, { log: false });

      expect(beforeEachSpy).toHaveBeenCalled();
      expect(beforeResolveSpy).toHaveBeenCalled();
      expect(afterEachSpy).toHaveBeenCalled();

      citadel.destroy();
    });

    it('deploys initial outposts from options', () => {
      const citadel = createNavigationCitadel(router, {
        log: false,
        outposts: [
          { scope: NavigationOutpostScopes.GLOBAL, name: 'auth', handler: createAllowHandler() },
          { scope: NavigationOutpostScopes.ROUTE, name: 'admin', handler: createAllowHandler() },
        ],
      });

      expect(citadel.getOutpostNames('global')).toContain('auth');
      expect(citadel.getOutpostNames('route')).toContain('admin');

      citadel.destroy();
    });

    it('uses custom logger', () => {
      const citadel = createNavigationCitadel(router, {
        log: true,
        logger: mockLogger,
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'test',
        handler: createAllowHandler(),
      });

      expect(mockLogger.calls.some((c) => c.level === 'info')).toBe(true);

      citadel.destroy();
    });
  });

  describe('deployOutpost', () => {
    it('deploys single outpost', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'auth',
        handler: createAllowHandler(),
      });

      expect(citadel.getOutpostNames('global')).toContain('auth');

      citadel.destroy();
    });

    it('deploys outpost with default scope (global)', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      /**
       * scope is optional, defaults to 'global'
       */
      citadel.deployOutpost({
        name: 'auth',
        handler: createAllowHandler(),
      });

      expect(citadel.getOutpostNames('global')).toContain('auth');
      expect(citadel.getOutpostNames('route')).not.toContain('auth');

      citadel.destroy();
    });

    it('deploys multiple outposts (array)', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost([
        { scope: NavigationOutpostScopes.GLOBAL, name: 'auth', handler: createAllowHandler() },
        { scope: NavigationOutpostScopes.GLOBAL, name: 'logger', handler: createAllowHandler() },
      ]);

      const names = citadel.getOutpostNames('global');
      expect(names).toContain('auth');
      expect(names).toContain('logger');

      citadel.destroy();
    });
  });

  describe('abandonOutpost', () => {
    it('removes single outpost and returns true', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'auth',
        handler: createAllowHandler(),
      });

      const result = citadel.abandonOutpost('global', 'auth');

      expect(result).toBe(true);
      expect(citadel.getOutpostNames('global')).not.toContain('auth');

      citadel.destroy();
    });

    it('returns false if outpost not found', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      const result = citadel.abandonOutpost('global', 'nonexistent');

      expect(result).toBe(false);

      citadel.destroy();
    });

    it('removes multiple outposts and returns true if all deleted', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost([
        { scope: NavigationOutpostScopes.GLOBAL, name: 'auth', handler: createAllowHandler() },
        { scope: NavigationOutpostScopes.GLOBAL, name: 'logger', handler: createAllowHandler() },
      ]);

      const result = citadel.abandonOutpost('global', ['auth', 'logger']);

      expect(result).toBe(true);
      expect(citadel.getOutpostNames('global')).toHaveLength(0);

      citadel.destroy();
    });

    it('returns false if any outpost not found', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'auth',
        handler: createAllowHandler(),
      });

      const result = citadel.abandonOutpost('global', ['auth', 'nonexistent']);

      expect(result).toBe(false);

      citadel.destroy();
    });
  });

  describe('getOutpostNames', () => {
    it('returns global outpost names', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'auth',
        handler: createAllowHandler(),
      });

      expect(citadel.getOutpostNames('global')).toEqual(['auth']);

      citadel.destroy();
    });

    it('returns route outpost names', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.ROUTE,
        name: 'admin-only',
        handler: createAllowHandler(),
      });

      expect(citadel.getOutpostNames('route')).toEqual(['admin-only']);

      citadel.destroy();
    });

    it('returns empty array when no outposts', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      expect(citadel.getOutpostNames('global')).toEqual([]);
      expect(citadel.getOutpostNames('route')).toEqual([]);

      citadel.destroy();
    });
  });

  describe('assignOutpostToRoute', () => {
    it('assigns outpost to existing route', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      const result = citadel.assignOutpostToRoute('dashboard', 'premium');

      expect(result).toBe(true);

      const route = router.getRoutes().find((r) => r.name === 'dashboard');
      expect(route?.meta.outposts).toContain('premium');

      citadel.destroy();
    });

    it('assigns multiple outposts to route', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.assignOutpostToRoute('dashboard', ['premium', 'verified']);

      const route = router.getRoutes().find((r) => r.name === 'dashboard');
      expect(route?.meta.outposts).toContain('premium');
      expect(route?.meta.outposts).toContain('verified');

      citadel.destroy();
    });

    it('does not duplicate outposts', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.assignOutpostToRoute('dashboard', 'premium');
      citadel.assignOutpostToRoute('dashboard', 'premium');

      const route = router.getRoutes().find((r) => r.name === 'dashboard');
      expect(route?.meta.outposts?.filter((o) => o === 'premium')).toHaveLength(1);

      citadel.destroy();
    });

    it('returns false if route not found', () => {
      const citadel = createNavigationCitadel(router, {
        log: true,
        logger: mockLogger,
      });

      const result = citadel.assignOutpostToRoute('nonexistent', 'premium');

      expect(result).toBe(false);
      expect(
        mockLogger.calls.some(
          (c) => c.level === 'warn' && (c.args[0] as string).includes('not found'),
        ),
      ).toBe(true);

      citadel.destroy();
    });
  });

  describe('destroy', () => {
    it('removes hooks and clears registry', () => {
      const citadel = createNavigationCitadel(router, { log: false });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'auth',
        handler: createAllowHandler(),
      });

      citadel.destroy();

      expect(citadel.getOutpostNames('global')).toHaveLength(0);
      expect(citadel.getOutpostNames('route')).toHaveLength(0);
    });
  });

  describe('install', () => {
    it('is callable as Vue plugin', () => {
      const citadel = createNavigationCitadel(router, { log: false, devtools: false });

      /**
       * install() should be callable without throwing
       */
      expect(() => {
        citadel.install({ config: {}, use: vi.fn() } as unknown as App);
      }).not.toThrow();

      citadel.destroy();
    });

    it('does nothing when devtools disabled', () => {
      const citadel = createNavigationCitadel(router, { log: false, devtools: false });

      const mockApp = { config: {}, use: vi.fn() } as unknown as App;

      /**
       * Should not throw and should do nothing
       */
      citadel.install(mockApp);

      citadel.destroy();
    });
  });

  describe('logging', () => {
    it('logs assignOutpostToRoute when log enabled', () => {
      const citadel = createNavigationCitadel(router, {
        log: true,
        logger: mockLogger,
      });

      citadel.assignOutpostToRoute('dashboard', 'premium');

      expect(
        mockLogger.calls.some(
          (c) => c.level === 'info' && (c.args[0] as string).includes('Assigned outposts'),
        ),
      ).toBe(true);

      citadel.destroy();
    });

    it('logs destroy when log enabled', () => {
      const citadel = createNavigationCitadel(router, {
        log: true,
        logger: mockLogger,
      });

      citadel.destroy();

      expect(
        mockLogger.calls.some(
          (c) => c.level === 'info' && (c.args[0] as string).includes('Destroying'),
        ),
      ).toBe(true);
    });
  });
});
