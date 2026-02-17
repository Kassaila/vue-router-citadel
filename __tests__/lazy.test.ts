import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNavigationCitadel } from '../src/navigationCitadel';
import { createMockRouter, createMockLogger } from './helpers/setup';
import type { NavigationOutpostHandler } from '../src/types';

describe('Lazy Outposts', () => {
  let router: ReturnType<typeof createMockRouter>;
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    router = createMockRouter();
    logger = createMockLogger();
  });

  afterEach(() => {
    logger.clear();
  });

  describe('loading behavior', () => {
    it('should load lazy outpost on first navigation', async () => {
      const handler: NavigationOutpostHandler = () => 'allow';
      const loader = vi.fn().mockResolvedValue({ default: handler });

      const citadel = createNavigationCitadel(router, {
        log: true,
        logger,
        outposts: [
          {
            name: 'lazy-auth',
            lazy: true,
            handler: loader,
          },
        ],
      });

      /**
       * Loader not called yet
       */
      expect(loader).not.toHaveBeenCalled();

      /**
       * Navigate
       */
      await router.push('/dashboard');

      /**
       * Loader called once
       */
      expect(loader).toHaveBeenCalledTimes(1);

      citadel.destroy();
    });

    it('should cache handler after first load', async () => {
      const handler: NavigationOutpostHandler = () => 'allow';
      const loader = vi.fn().mockResolvedValue({ default: handler });

      const citadel = createNavigationCitadel(router, {
        logger,
        outposts: [
          {
            name: 'lazy-cached',
            lazy: true,
            handler: loader,
          },
        ],
      });

      /**
       * First navigation — loads module
       */
      await router.push('/dashboard');
      expect(loader).toHaveBeenCalledTimes(1);

      /**
       * Second navigation — uses cached handler
       */
      await router.push('/admin');
      expect(loader).toHaveBeenCalledTimes(1);

      /**
       * Third navigation — still cached
       */
      await router.push('/');
      expect(loader).toHaveBeenCalledTimes(1);

      citadel.destroy();
    });

    it('should not load eager outpost lazily', async () => {
      const handler = vi.fn().mockReturnValue('allow');

      const citadel = createNavigationCitadel(router, {
        logger,
        outposts: [
          {
            name: 'eager-auth',
            handler,
          },
        ],
      });

      /**
       * Navigate
       */
      await router.push('/dashboard');

      /**
       * Handler called directly (not wrapped in loader)
       */
      expect(handler).toHaveBeenCalled();

      citadel.destroy();
    });
  });

  describe('error handling', () => {
    it('should handle module load error', async () => {
      const loadError = new Error('Failed to load module');
      const loader = vi.fn().mockRejectedValue(loadError);

      const onError = vi.fn().mockReturnValue('allow');

      const citadel = createNavigationCitadel(router, {
        logger,
        onError,
        outposts: [
          {
            name: 'lazy-error',
            lazy: true,
            handler: loader,
          },
        ],
      });

      await router.push('/dashboard');

      /**
       * onError called with load error
       */
      expect(onError).toHaveBeenCalledWith(loadError, expect.any(Object));

      citadel.destroy();
    });

    it('should throw error if module has no default export', async () => {
      const loader = vi.fn().mockResolvedValue({ notDefault: () => 'allow' });
      const onError = vi.fn().mockReturnValue('allow');

      const citadel = createNavigationCitadel(router, {
        logger,
        onError,
        outposts: [
          {
            name: 'lazy-no-default',
            lazy: true,
            handler: loader,
          },
        ],
      });

      await router.push('/dashboard');

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('must export default handler'),
        }),
        expect.any(Object),
      );

      citadel.destroy();
    });

    it('should allow retry after load error', async () => {
      const handler: NavigationOutpostHandler = () => 'allow';
      let callCount = 0;
      const loader = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ default: handler });
      });

      const onError = vi.fn().mockReturnValue('allow');

      const citadel = createNavigationCitadel(router, {
        logger,
        onError,
        outposts: [
          {
            name: 'lazy-retry',
            lazy: true,
            handler: loader,
          },
        ],
      });

      /**
       * First navigation — fails
       */
      await router.push('/dashboard');
      expect(onError).toHaveBeenCalledTimes(1);

      /**
       * Second navigation — retries and succeeds
       */
      onError.mockClear();
      await router.push('/admin');
      expect(onError).not.toHaveBeenCalled();
      expect(loader).toHaveBeenCalledTimes(2);

      citadel.destroy();
    });
  });

  describe('timeout behavior', () => {
    it('should apply timeout only to handler execution, not loading', async () => {
      const handler: NavigationOutpostHandler = () =>
        new Promise((resolve) => setTimeout(() => resolve('allow'), 100));

      /**
       * Loader takes 200ms, handler takes 100ms
       */
      const loader = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ default: handler }), 200)),
        );

      const onTimeout = vi.fn().mockReturnValue('allow');

      const citadel = createNavigationCitadel(router, {
        logger,
        onTimeout,
        outposts: [
          {
            name: 'lazy-timeout',
            lazy: true,
            /**
             * More than handler (100ms) but less than load + handler (300ms)
             */
            timeout: 150,
            handler: loader,
          },
        ],
      });

      await router.push('/dashboard');

      /**
       * Should NOT timeout because:
       * - Load time (200ms) is NOT counted
       * - Handler time (100ms) < timeout (150ms)
       */
      expect(onTimeout).not.toHaveBeenCalled();

      citadel.destroy();
    });

    it('should timeout if handler execution exceeds timeout', async () => {
      const handler: NavigationOutpostHandler = () =>
        new Promise((resolve) => setTimeout(() => resolve('allow'), 200));

      const loader = vi.fn().mockResolvedValue({ default: handler });

      const onTimeout = vi.fn().mockReturnValue('allow');

      const citadel = createNavigationCitadel(router, {
        logger,
        onTimeout,
        outposts: [
          {
            name: 'lazy-timeout-exceeded',
            lazy: true,
            /**
             * Less than handler (200ms)
             */
            timeout: 50,
            handler: loader,
          },
        ],
      });

      await router.push('/dashboard');

      /**
       * Should timeout because handler (200ms) > timeout (50ms)
       */
      expect(onTimeout).toHaveBeenCalledWith('lazy-timeout-exceeded', expect.any(Object));

      citadel.destroy();
    });
  });

  describe('logging', () => {
    it('should log lazy flag when deploying', async () => {
      const citadel = createNavigationCitadel(router, {
        log: true,
        logger,
        outposts: [
          {
            name: 'lazy-logged',
            lazy: true,
            handler: () => Promise.resolve({ default: () => 'allow' }),
          },
        ],
      });

      const deployLog = logger.calls.find(
        (call) => call.level === 'info' && (call.args[0] as string).includes('lazy-logged'),
      );

      expect(deployLog).toBeDefined();
      expect(deployLog?.args[0]).toContain('(lazy)');

      citadel.destroy();
    });

    it('should not log lazy flag for eager outposts', async () => {
      const citadel = createNavigationCitadel(router, {
        log: true,
        logger,
        outposts: [
          {
            name: 'eager-logged',
            handler: () => 'allow',
          },
        ],
      });

      const deployLog = logger.calls.find(
        (call) => call.level === 'info' && (call.args[0] as string).includes('eager-logged'),
      );

      expect(deployLog).toBeDefined();
      expect(deployLog?.args[0]).not.toContain('(lazy)');

      citadel.destroy();
    });
  });

  describe('mixed eager and lazy outposts', () => {
    it('should process eager and lazy outposts in priority order', async () => {
      const order: string[] = [];

      const eagerHandler: NavigationOutpostHandler = () => {
        order.push('eager');
        return 'allow';
      };

      const lazyHandler: NavigationOutpostHandler = () => {
        order.push('lazy');
        return 'allow';
      };

      const citadel = createNavigationCitadel(router, {
        logger,
        outposts: [
          {
            name: 'lazy-first',
            lazy: true,
            priority: 10,
            handler: () => Promise.resolve({ default: lazyHandler }),
          },
          {
            name: 'eager-second',
            priority: 20,
            handler: eagerHandler,
          },
        ],
      });

      await router.push('/dashboard');

      expect(order).toEqual(['lazy', 'eager']);

      citadel.destroy();
    });
  });

  describe('getOutpostNames', () => {
    it('should return names of both eager and lazy outposts', () => {
      const citadel = createNavigationCitadel(router, {
        logger,
        outposts: [
          {
            name: 'eager-one',
            handler: () => 'allow',
          },
          {
            name: 'lazy-one',
            lazy: true,
            handler: () => Promise.resolve({ default: () => 'allow' }),
          },
        ],
      });

      const names = citadel.getOutpostNames('global');

      expect(names).toContain('eager-one');
      expect(names).toContain('lazy-one');

      citadel.destroy();
    });
  });
});
