import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createNavigationCitadel } from '../src/navigationCitadel';
import { NavigationOutpostScopes, NavigationOutpostVerdicts, NavigationHooks } from '../src/types';
import { createMockRouter, createMockLogger, createDelayedHandler } from './helpers/setup';

describe('timeout', () => {
  let router: ReturnType<typeof createMockRouter>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(async () => {
    router = createMockRouter();
    mockLogger = createMockLogger();
    await router.push('/');
    await router.isReady();
  });

  it('outpost times out and returns BLOCK by default', async () => {
    const citadel = createNavigationCitadel(router, {
      log: false,
      logger: mockLogger,
      defaultTimeout: 50,
    });

    citadel.deployOutpost({
      scope: NavigationOutpostScopes.GLOBAL,
      name: 'slow',
      handler: createDelayedHandler(200),
    });

    /**
     * Navigate to trigger the guard
     */
    await router.push('/dashboard').catch(() => {});

    /**
     * Navigation should be blocked due to timeout
     */
    expect(router.currentRoute.value.name).toBe('home');
    expect(
      mockLogger.calls.some(
        (c) => c.level === 'warn' && (c.args[0] as string).includes('timed out'),
      ),
    ).toBe(true);

    citadel.destroy();
  });

  it('onTimeout handler is called on timeout', async () => {
    const onTimeout = vi.fn().mockReturnValue('allow');

    const citadel = createNavigationCitadel(router, {
      log: false,
      logger: mockLogger,
      defaultTimeout: 50,
      onTimeout,
    });

    citadel.deployOutpost({
      scope: NavigationOutpostScopes.GLOBAL,
      name: 'slow',
      handler: createDelayedHandler(200),
    });

    await router.push('/dashboard');

    expect(onTimeout).toHaveBeenCalledWith(
      'slow',
      expect.objectContaining({
        hook: NavigationHooks.BEFORE_EACH,
      }),
    );

    citadel.destroy();
  });

  it('per-outpost timeout overrides defaultTimeout', async () => {
    const onTimeout = vi.fn().mockReturnValue('allow');

    const citadel = createNavigationCitadel(router, {
      log: false,
      logger: mockLogger,
      /**
       * Long default
       */
      defaultTimeout: 500,
      onTimeout,
    });

    citadel.deployOutpost({
      scope: NavigationOutpostScopes.GLOBAL,
      name: 'slow',
      /**
       * Short per-outpost timeout
       */
      timeout: 50,
      handler: createDelayedHandler(200),
    });

    await router.push('/dashboard');

    /**
     * Should timeout with per-outpost timeout (50ms), not default (500ms)
     */
    expect(onTimeout).toHaveBeenCalled();

    citadel.destroy();
  });

  it('no timeout if not configured', async () => {
    const citadel = createNavigationCitadel(router, {
      log: false,
      logger: mockLogger,
      /**
       * No defaultTimeout
       */
    });

    citadel.deployOutpost({
      scope: NavigationOutpostScopes.GLOBAL,
      name: 'slow',
      /**
       * No per-outpost timeout
       */
      handler: createDelayedHandler(50, 'allow'),
    });

    await router.push('/dashboard');

    /**
     * Navigation should succeed
     */
    expect(router.currentRoute.value.name).toBe('dashboard');
    expect(mockLogger.calls.some((c) => (c.args[0] as string)?.includes?.('timed out'))).toBe(
      false,
    );

    citadel.destroy();
  });

  it('fast outpost completes before timeout', async () => {
    const citadel = createNavigationCitadel(router, {
      log: false,
      logger: mockLogger,
      defaultTimeout: 500,
    });

    citadel.deployOutpost({
      scope: NavigationOutpostScopes.GLOBAL,
      name: 'fast',
      handler: createDelayedHandler(10, 'allow'),
    });

    await router.push('/dashboard');

    expect(router.currentRoute.value.name).toBe('dashboard');
    expect(mockLogger.calls.some((c) => (c.args[0] as string)?.includes?.('timed out'))).toBe(
      false,
    );

    citadel.destroy();
  });

  it('timeout timer is cleaned up when handler resolves fast', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const citadel = createNavigationCitadel(router, {
      log: false,
      logger: mockLogger,
      defaultTimeout: 5000,
    });

    citadel.deployOutpost({
      scope: NavigationOutpostScopes.GLOBAL,
      name: 'fast',
      handler: createDelayedHandler(10, 'allow'),
    });

    await router.push('/dashboard');

    expect(router.currentRoute.value.name).toBe('dashboard');
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
    citadel.destroy();
  });

  describe('per-outpost onTimeout', () => {
    it('per-outpost onTimeout takes precedence over options.onTimeout', async () => {
      const optionsOnTimeout = vi.fn().mockReturnValue(NavigationOutpostVerdicts.ALLOW);
      const outpostOnTimeout = vi.fn().mockReturnValue(NavigationOutpostVerdicts.ALLOW);

      const citadel = createNavigationCitadel(router, {
        log: false,
        logger: mockLogger,
        defaultTimeout: 50,
        onTimeout: optionsOnTimeout,
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'slow',
        handler: createDelayedHandler(200),
        onTimeout: outpostOnTimeout,
      });

      await router.push('/dashboard');

      expect(outpostOnTimeout).toHaveBeenCalledOnce();
      expect(optionsOnTimeout).not.toHaveBeenCalled();

      citadel.destroy();
    });

    it('falls back to options.onTimeout when outpost has no onTimeout', async () => {
      const optionsOnTimeout = vi.fn().mockReturnValue(NavigationOutpostVerdicts.ALLOW);

      const citadel = createNavigationCitadel(router, {
        log: false,
        logger: mockLogger,
        defaultTimeout: 50,
        onTimeout: optionsOnTimeout,
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'slow',
        handler: createDelayedHandler(200),
      });

      await router.push('/dashboard');

      expect(optionsOnTimeout).toHaveBeenCalledOnce();

      citadel.destroy();
    });

    it('blocks with default behavior when neither handler is set', async () => {
      const citadel = createNavigationCitadel(router, {
        log: false,
        logger: mockLogger,
        defaultTimeout: 50,
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'slow',
        handler: createDelayedHandler(200),
      });

      await router.push('/dashboard').catch(() => {});

      expect(router.currentRoute.value.name).toBe('home');
      expect(
        mockLogger.calls.some(
          (c) => c.level === 'warn' && (c.args[0] as string).includes('timed out'),
        ),
      ).toBe(true);

      citadel.destroy();
    });

    it('falls back to BLOCK when onTimeout itself throws', async () => {
      const onTimeout = vi.fn().mockImplementation(() => {
        throw new Error('handler exploded');
      });

      const citadel = createNavigationCitadel(router, {
        log: false,
        logger: mockLogger,
        defaultTimeout: 50,
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'slow',
        handler: createDelayedHandler(200),
        onTimeout,
      });

      await router.push('/dashboard').catch(() => {});

      expect(onTimeout).toHaveBeenCalledOnce();
      expect(router.currentRoute.value.name).toBe('home');
      expect(
        mockLogger.calls.some(
          (c) => c.level === 'error' && (c.args[0] as string).includes('Recovery handler'),
        ),
      ).toBe(true);

      citadel.destroy();
    });

    it('passes hook context to per-outpost onTimeout', async () => {
      const outpostOnTimeout = vi.fn().mockReturnValue(NavigationOutpostVerdicts.ALLOW);

      const citadel = createNavigationCitadel(router, {
        log: false,
        logger: mockLogger,
        defaultTimeout: 50,
      });

      citadel.deployOutpost({
        scope: NavigationOutpostScopes.GLOBAL,
        name: 'slow',
        handler: createDelayedHandler(200),
        onTimeout: outpostOnTimeout,
      });

      await router.push('/dashboard');

      expect(outpostOnTimeout).toHaveBeenCalledWith(
        'slow',
        expect.objectContaining({ hook: NavigationHooks.BEFORE_EACH }),
      );

      citadel.destroy();
    });
  });

  it('timeout timer is cleaned up when handler times out', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const citadel = createNavigationCitadel(router, {
      log: false,
      logger: mockLogger,
      defaultTimeout: 50,
    });

    citadel.deployOutpost({
      scope: NavigationOutpostScopes.GLOBAL,
      name: 'slow',
      handler: createDelayedHandler(200),
    });

    await router.push('/dashboard').catch(() => {});

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
    citadel.destroy();
  });
});
