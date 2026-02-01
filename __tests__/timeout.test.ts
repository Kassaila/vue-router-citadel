import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createNavigationCitadel } from '../src/navigationCitadel';
import { NavigationOutpostScopes, NavigationHooks } from '../src/types';
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

    // Navigate to trigger the guard
    await router.push('/dashboard').catch(() => {});

    // Navigation should be blocked due to timeout
    expect(router.currentRoute.value.name).toBe('home');
    expect(
      mockLogger.calls.some((c) => c.level === 'warn' && c.args[0].includes('timed out')),
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
      defaultTimeout: 500, // Long default
      onTimeout,
    });

    citadel.deployOutpost({
      scope: NavigationOutpostScopes.GLOBAL,
      name: 'slow',
      timeout: 50, // Short per-outpost timeout
      handler: createDelayedHandler(200),
    });

    await router.push('/dashboard');

    // Should timeout with per-outpost timeout (50ms), not default (500ms)
    expect(onTimeout).toHaveBeenCalled();

    citadel.destroy();
  });

  it('no timeout if not configured', async () => {
    const citadel = createNavigationCitadel(router, {
      log: false,
      logger: mockLogger,
      // No defaultTimeout
    });

    citadel.deployOutpost({
      scope: NavigationOutpostScopes.GLOBAL,
      name: 'slow',
      // No per-outpost timeout
      handler: createDelayedHandler(50, 'allow'),
    });

    await router.push('/dashboard');

    // Navigation should succeed
    expect(router.currentRoute.value.name).toBe('dashboard');
    expect(mockLogger.calls.some((c) => c.args[0]?.includes?.('timed out'))).toBe(false);

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
    expect(mockLogger.calls.some((c) => c.args[0]?.includes?.('timed out'))).toBe(false);

    citadel.destroy();
  });
});
